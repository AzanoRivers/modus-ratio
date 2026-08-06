import {
  ExtractionError,
  isValidOutfitDescription,
  isRejectedDescription,
  REJECTION_TO_ERROR_CODE,
} from '@/lib/outfitDescription'
import type { OutfitDescription } from '@/lib/outfitDescription'
import { openai } from '@/lib/openai'
import { env } from '@/lib/env'
import { GPT4O_MINI_SYSTEM_PROMPT, buildExtractionContext } from '@/lib/prompts/gpt4oMini'
import type { FormParams } from '@/components/organisms/HomeForm'

// console.error(msg, error) imprime el objeto Error completo (stack, headers,
// etc.), que es ruido cuando el error ya está manejado (ej. fallback exitoso
// a otro modelo): esto deja solo el mensaje, en una línea.
function describeError(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

export interface ExtractionInput {
  objectKey:  string
  formParams: FormParams
}

export async function extractOutfitDescription(
  input: ExtractionInput,
): Promise<OutfitDescription> {
  const imageUrl    = `${env.r2.publicUrl}/${input.objectKey}`
  const contextText = buildExtractionContext({
    height:    input.formParams.height,
    build:     {
      upper: input.formParams.build.upper,
      lower: input.formParams.build.lower,
    },
    skinColor: input.formParams.skinColor,
  })

  // Mismo par system/user para el modelo primario y el fallback: el fallback
  // no es un análisis distinto, es el mismo análisis de imagen resuelto por
  // otro modelo cuando el primario no responde.
  const messages = [
    { role: 'system' as const, content: GPT4O_MINI_SYSTEM_PROMPT },
    {
      role: 'user' as const,
      content: [
        {
          type:      'image_url' as const,
          image_url: { url: imageUrl, detail: 'low' as const },
        },
        {
          type: 'text' as const,
          text: contextText,
        },
      ],
    },
  ]

  let content: string | null | undefined
  try {
    const response = await openai.chat.completions.create(
      {
        model:           env.models.imageAnalysis,
        temperature:     0.1,
        max_tokens:      800,
        response_format: { type: 'json_object' },
        messages,
      },
      // Presupuesto de tiempo compartido con el modelo de contexto bajo el
      // maxDuration de Vercel (ver astro.config.mjs): este paso corre primero
      // y debe dejarle margen al de contexto, que es el más lento de los
      // cuatro posibles (primario + fallback de cada paso). maxRetries: 0 es
      // obligatorio: el SDK de openai reintenta 2 veces por defecto, lo que
      // multiplicaría este timeout por 3 en el peor caso (ver el mismo fix
      // en analyzeOutfitScore.ts para el detalle de por qué importa).
      { timeout: 15_000, maxRetries: 0 },
    )
    content = response.choices[0]?.message?.content
  } catch (primaryError) {
    console.error(`[extraction] primary model (${env.models.imageAnalysis}) failed (${describeError(primaryError)}), falling back to ${env.models.imageAnalysisFallback}`)

    try {
      const fallbackResponse = await openai.chat.completions.create(
        {
          model:           env.models.imageAnalysisFallback,
          temperature:     0.1,
          max_tokens:      800,
          response_format: { type: 'json_object' },
          messages,
        },
        // Mismos motivos que arriba: fallar rápido y sin reintentos duplicados.
        { timeout: 15_000, maxRetries: 0 },
      )
      content = fallbackResponse.choices[0]?.message?.content
    } catch (fallbackError) {
      console.error(`[extraction] fallback model (${env.models.imageAnalysisFallback}) also failed (${describeError(fallbackError)})`)
      throw new ExtractionError('OPENAI_FAILED', 'Image analysis API call failed (primary and fallback)')
    }
  }

  if (!content) {
    throw new ExtractionError('EMPTY_RESPONSE', 'Image analysis model returned an empty response')
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(content)
  } catch (e) {
    console.error('[extraction] returned invalid JSON:', content, e)
    throw new ExtractionError('OPENAI_FAILED', 'Image analysis model returned invalid JSON')
  }

  if (isRejectedDescription(parsed)) {
    const code = REJECTION_TO_ERROR_CODE[parsed.reason]
    throw new ExtractionError(code, `Image analysis model rejected the image: ${parsed.reason}`)
  }

  if (!isValidOutfitDescription(parsed)) {
    console.error('[extraction] response does not match OutfitDescription schema:', parsed)
    throw new ExtractionError('INVALID_RESPONSE', 'Image analysis model response does not match OutfitDescription schema')
  }

  // parsed también trae el discriminante 'status: ok' del esquema crudo;
  // se descarta para que OutfitDescription no lo arrastre al prompt de scoring.
  const { status: _status, ...description } = parsed as OutfitDescription & { status: 'ok' }
  return description
}
