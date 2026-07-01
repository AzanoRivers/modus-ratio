import {
  DIMENSION_KEYS,
  WARNING_KEYS,
  HIGHLIGHT_KEYS,
  RECOMMENDATION_KEYS,
  calcSemaphore,
  AnalysisError,
} from '@/lib/analysisTypes'
import type { AnalysisResults, DimensionKey, DimensionResult, KeyedDetail } from '@/lib/analysisTypes'
import { minimax, MINIMAX_MODEL } from '@/lib/minimax'
import { buildMinimaxSystemPrompt, buildMinimaxUserPrompt } from '@/lib/prompts/minimaxM3'
import type { OutfitDescription } from '@/lib/outfitDescription'
import type { FormParams } from '@/components/organisms/HomeForm'

// ~25 palabras en una sola oración (pedido en el prompt) rara vez pasa de
// 220 caracteres. Sirve de red de seguridad si el modelo se extiende de más.
const MAX_DETAIL_LENGTH = 220

function clampInt(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null
  return Math.round(Math.max(0, Math.min(100, value)))
}

function readDetail(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (trimmed.length === 0) return null
  return trimmed.slice(0, MAX_DETAIL_LENGTH)
}

// glm-5.2 devuelve su razonamiento en un campo `reasoning_content` separado
// (no embebido en `content`), así que en la práctica esto ya no encuentra
// nada que cortar. Se deja como red de seguridad: si el modelo de scoring
// vuelve a cambiar a uno que sí embeba <think>...</think> o un fence de
// markdown en el content (como pasaba con minimax-m3), esto sigue
// protegiendo el parseo sin tener que acordarse de tocar este archivo.
// Se despoja la marca de apertura y la de cierre por separado (no con un
// único regex ancla-a-ancla): si la respuesta se truncó a mitad del JSON
// por max_tokens, el cierre ``` nunca llega, y un regex que exige ambos
// lados a la vez dejaría la marca de apertura pegada al JSON, rompiendo el
// parseo con un error confuso.
function extractJson(raw: string): string {
  const withoutThink = raw.replace(/<think>[\s\S]*?<\/think>/i, '').trim()
  const withoutOpenFence = withoutThink.replace(/^```(?:json)?\s*/i, '')
  return withoutOpenFence.replace(/\s*```\s*$/i, '').trim()
}

export async function analyzeWithMinimax(
  description: OutfitDescription,
  formParams:  FormParams,
  locale:      'es' | 'en',
): Promise<AnalysisResults> {
  let raw: string | null | undefined
  let finishReason: string | undefined

  try {
    const response = await minimax.chat.completions.create(
      {
        model:           MINIMAX_MODEL,
        temperature:     0.3,
        // glm-5.2 (ver comentario en minimax.ts sobre por qué no es Minimax)
        // usa su propio presupuesto de razonamiento en `reasoning_content`,
        // separado de este límite. Medido con el prompt real: ~1260 tokens
        // de completion en total, muy por debajo de este techo. Se deja
        // holgado a propósito como red de seguridad contra un caso raro de
        // razonamiento largo, no como el mecanismo de control de latencia:
        // ese es el `timeout` de abajo.
        max_tokens:      4200,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system',  content: buildMinimaxSystemPrompt(locale) },
          { role: 'user',    content: buildMinimaxUserPrompt(description, formParams) },
        ],
      },
      // Timeout explícito por debajo del límite de Vercel: si Minimax se
      // cuelga, preferimos fallar rápido con un error controlado (que el
      // usuario puede reintentar) a que la función serverless completa
      // muera de golpe a los 60s sin poder devolver una respuesta limpia.
      // maxRetries: 0 es OBLIGATORIO acá: el SDK de openai reintenta
      // automáticamente 2 veces por defecto, así que sin esto un timeout de
      // 45s se convierte en 3 intentos de 45s = hasta 135s reales (visto en
      // producción: un timeout "de 45s" tardó 145s en fallar).
      { timeout: 40_000, maxRetries: 0 },
    )
    raw = response.choices[0]?.message?.content
    finishReason = response.choices[0]?.finish_reason
  } catch (e) {
    console.error('[minimax] API call failed:', e)
    throw new AnalysisError('MINIMAX_FAILED', 'Minimax API call failed')
  }

  if (!raw) {
    throw new AnalysisError('EMPTY_RESPONSE', 'Minimax returned an empty response')
  }

  if (finishReason === 'length') {
    console.error('[minimax] response was truncated by max_tokens. Raw content:', raw)
    throw new AnalysisError('INVALID_RESPONSE', 'Minimax response was truncated before completing the JSON')
  }

  let parsed: Record<string, unknown>
  try {
    parsed = JSON.parse(extractJson(raw)) as Record<string, unknown>
  } catch (e) {
    console.error('[minimax] returned invalid JSON. Raw content:', raw, e)
    throw new AnalysisError('INVALID_RESPONSE', 'Minimax returned invalid JSON')
  }

  // Validar y construir dimensions (cada una con score + detail personalizado)
  const rawDimensions = parsed.dimensions as Record<string, unknown> | undefined
  if (!rawDimensions || typeof rawDimensions !== 'object') {
    console.error('[minimax] missing dimensions. Parsed response:', parsed)
    throw new AnalysisError('INVALID_RESPONSE', 'Missing dimensions in Minimax response')
  }

  const dimensions = {} as Record<DimensionKey, DimensionResult>
  for (const key of DIMENSION_KEYS) {
    const rawDim = rawDimensions[key] as Record<string, unknown> | undefined
    const score  = rawDim ? clampInt(rawDim.score) : null
    const detail = rawDim ? readDetail(rawDim.detail) : null
    if (score === null || detail === null) {
      console.error(`[minimax] invalid or missing dimension "${key}". Parsed response:`, parsed)
      throw new AnalysisError('INVALID_RESPONSE', `Invalid or missing dimension: ${key}`)
    }
    dimensions[key] = { score, detail }
  }

  // Validar globalRatio
  const globalRatio = clampInt(parsed.globalRatio)
  if (globalRatio === null) {
    console.error('[minimax] invalid or missing globalRatio. Parsed response:', parsed)
    throw new AnalysisError('INVALID_RESPONSE', 'Invalid or missing globalRatio')
  }

  // Filtrar listas cerradas, conservando el detail de cada item válido
  const rawWarnings  = Array.isArray(parsed.warnings)       ? parsed.warnings        : []
  const rawHighlight = parsed.highlight
  const rawRecommend = Array.isArray(parsed.recommendations) ? parsed.recommendations : []

  const warnings: KeyedDetail<typeof WARNING_KEYS[number]>[] = (rawWarnings as unknown[])
    .map((item) => toKeyedDetail(item, WARNING_KEYS))
    .filter((item): item is KeyedDetail<typeof WARNING_KEYS[number]> => item !== null)
    .slice(0, 3)

  const highlightCandidate = toKeyedDetail(rawHighlight, HIGHLIGHT_KEYS)
  const highlight = highlightCandidate

  const recommendations: KeyedDetail<typeof RECOMMENDATION_KEYS[number]>[] = (rawRecommend as unknown[])
    .map((item) => toKeyedDetail(item, RECOMMENDATION_KEYS))
    .filter((item): item is KeyedDetail<typeof RECOMMENDATION_KEYS[number]> => item !== null)
    .slice(0, 5)

  return {
    dimensions,
    globalRatio,
    semaphore: calcSemaphore(globalRatio),
    warnings,
    highlight,
    recommendations,
  }
}

// Valida un item { key, detail } contra una lista cerrada de keys permitidas.
// Retorna null si el key no pertenece a la lista o si falta un detail válido:
// se filtra en silencio (una key inválida no debe tumbar todo el análisis).
function toKeyedDetail<K extends string>(
  item: unknown,
  allowedKeys: readonly K[],
): KeyedDetail<K> | null {
  if (typeof item !== 'object' || item === null) return null
  const obj = item as Record<string, unknown>
  if (!(allowedKeys as readonly string[]).includes(obj.key as string)) return null
  const detail = readDetail(obj.detail)
  if (detail === null) return null
  return { key: obj.key as K, detail }
}
