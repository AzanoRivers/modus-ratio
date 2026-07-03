import {
  DIMENSION_KEYS,
  WARNING_KEYS,
  HIGHLIGHT_KEYS,
  RECOMMENDATION_KEYS,
  calcSemaphore,
  AnalysisError,
} from '@/lib/analysisTypes'
import type { AnalysisResults, DimensionKey, DimensionResult, KeyedDetail } from '@/lib/analysisTypes'
import { scoringClient, SCORING_MODEL } from '@/lib/scoringClient'
import { buildScoringSystemPrompt, buildScoringUserPrompt } from '@/lib/prompts/scoringAgent'
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
// markdown en el content (como pasaba con minimax-m3, el modelo anterior),
// esto sigue protegiendo el parseo sin tener que acordarse de tocar este
// archivo. Se despoja la marca de apertura y la de cierre por separado (no
// con un único regex ancla-a-ancla): si la respuesta se truncó a mitad del
// JSON por max_tokens, el cierre ``` nunca llega, y un regex que exige ambos
// lados a la vez dejaría la marca de apertura pegada al JSON, rompiendo el
// parseo con un error confuso.
function extractJson(raw: string): string {
  const withoutThink = raw.replace(/<think>[\s\S]*?<\/think>/i, '').trim()
  const withoutOpenFence = withoutThink.replace(/^```(?:json)?\s*/i, '')
  return withoutOpenFence.replace(/\s*```\s*$/i, '').trim()
}

export async function analyzeOutfitScore(
  description: OutfitDescription,
  formParams:  FormParams,
  locale:      'es' | 'en',
): Promise<AnalysisResults> {
  let raw: string | null | undefined
  let finishReason: string | undefined

  try {
    const response = await scoringClient.chat.completions.create(
      {
        model:           SCORING_MODEL,
        temperature:     0.3,
        // glm-5.2 (ver comentario en scoringClient.ts) usa su propio
        // presupuesto de razonamiento en `reasoning_content`, separado de
        // este límite. Medido con el prompt real: ~1260 tokens de completion
        // en total, muy por debajo de este techo. Se deja holgado a
        // propósito como red de seguridad contra un caso raro de
        // razonamiento largo, no como el mecanismo de control de latencia:
        // ese es el `timeout` de abajo.
        max_tokens:      4200,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system',  content: buildScoringSystemPrompt(locale, formParams.style) },
          { role: 'user',    content: buildScoringUserPrompt(description, formParams) },
        ],
      },
      // Timeout explícito por debajo del límite de Vercel: si el modelo de
      // scoring se cuelga, preferimos fallar rápido con un error controlado
      // (que el usuario puede reintentar) a que la función serverless
      // completa muera de golpe a los 60s sin poder devolver una respuesta
      // limpia. maxRetries: 0 es OBLIGATORIO acá: el SDK de openai reintenta
      // automáticamente 2 veces por defecto, así que sin esto un timeout de
      // 45s se convierte en 3 intentos de 45s = hasta 135s reales (visto en
      // producción: un timeout "de 45s" tardó 145s en fallar).
      { timeout: 40_000, maxRetries: 0 },
    )
    raw = response.choices[0]?.message?.content
    finishReason = response.choices[0]?.finish_reason
  } catch (e) {
    console.error('[scoring] API call failed:', e)
    throw new AnalysisError('SCORING_FAILED', 'Scoring model API call failed')
  }

  if (!raw) {
    throw new AnalysisError('EMPTY_RESPONSE', 'Scoring model returned an empty response')
  }

  if (finishReason === 'length') {
    console.error('[scoring] response was truncated by max_tokens. Raw content:', raw)
    throw new AnalysisError('INVALID_RESPONSE', 'Scoring model response was truncated before completing the JSON')
  }

  let parsed: Record<string, unknown>
  try {
    parsed = JSON.parse(extractJson(raw)) as Record<string, unknown>
  } catch (e) {
    console.error('[scoring] returned invalid JSON. Raw content:', raw, e)
    throw new AnalysisError('INVALID_RESPONSE', 'Scoring model returned invalid JSON')
  }

  // Validar y construir dimensions (cada una con score + detail personalizado)
  const rawDimensions = parsed.dimensions as Record<string, unknown> | undefined
  if (!rawDimensions || typeof rawDimensions !== 'object') {
    console.error('[scoring] missing dimensions. Parsed response:', parsed)
    throw new AnalysisError('INVALID_RESPONSE', 'Missing dimensions in scoring response')
  }

  const dimensions = {} as Record<DimensionKey, DimensionResult>
  for (const key of DIMENSION_KEYS) {
    const rawDim = rawDimensions[key] as Record<string, unknown> | undefined
    const score  = rawDim ? clampInt(rawDim.score) : null
    const detail = rawDim ? readDetail(rawDim.detail) : null
    if (score === null || detail === null) {
      console.error(`[scoring] invalid or missing dimension "${key}". Parsed response:`, parsed)
      throw new AnalysisError('INVALID_RESPONSE', `Invalid or missing dimension: ${key}`)
    }
    dimensions[key] = { score, detail }
  }

  // Validar globalRatio
  const globalRatio = clampInt(parsed.globalRatio)
  if (globalRatio === null) {
    console.error('[scoring] invalid or missing globalRatio. Parsed response:', parsed)
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

  // "detectedStyle" solo aplica al modo "Mi Estilo" (sin target declarado).
  // Se valida de forma defensiva, igual que warnings/highlight/recommendations
  // arriba: si el modelo lo omite o devuelve algo fuera de la lista cerrada,
  // se descarta en silencio en vez de tumbar todo el análisis.
  let detectedStyle: AnalysisResults['detectedStyle']
  if (formParams.style === 'miEstilo') {
    const raw = parsed.detectedStyle
    if (typeof raw === 'string' && (STYLE_KEYS as readonly string[]).includes(raw)) {
      detectedStyle = raw as AnalysisResults['detectedStyle']
    } else {
      console.error('[scoring] invalid or missing detectedStyle in miEstilo mode. Parsed response:', parsed)
    }
  }

  return {
    dimensions,
    globalRatio,
    semaphore: calcSemaphore(globalRatio),
    warnings,
    highlight,
    recommendations,
    ...(detectedStyle !== undefined && { detectedStyle }),
  }
}

// Lista cerrada para validar "detectedStyle": las 11 líneas reales más
// "none" (el propio "miEstilo" no es un valor válido de detección: sería
// circular). Duplica STYLE_LABELS de scoringAgent.ts a propósito, mismo
// criterio que ya usa ese archivo (no hay una fuente única compartida).
const STYLE_KEYS = [
  'urbano', 'alternativo', 'casual', 'semiformal', 'formal',
  'formalUrbano', 'formalAlternativo', 'oldmoney', 'punkRock', 'gotico', 'geek',
  'none',
] as const

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
