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

  let content: string | null | undefined
  try {
    const response = await openai.chat.completions.create(
      {
        model:           'gpt-4o-mini',
        temperature:     0.1,
        max_tokens:      800,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: GPT4O_MINI_SYSTEM_PROMPT },
          {
            role: 'user',
            content: [
              {
                type:      'image_url',
                image_url: { url: imageUrl, detail: 'low' },
              },
              {
                type: 'text',
                text: contextText,
              },
            ],
          },
        ],
      },
      // Presupuesto de tiempo compartido con el modelo de scoring bajo el
      // límite de 60s de Vercel (ver astro.config.mjs): este paso corre
      // primero y debe dejarle margen al de scoring, que es el más lento de
      // los dos. maxRetries: 0 es obligatorio: el SDK de openai reintenta 2
      // veces por defecto, lo que multiplicaría este timeout por 3 en el
      // peor caso (ver el mismo fix en analyzeOutfitScore.ts para el detalle
      // de por qué importa).
      { timeout: 15_000, maxRetries: 0 },
    )
    content = response.choices[0]?.message?.content
  } catch (e) {
    console.error('[gpt4o-mini] API call failed:', e)
    throw new ExtractionError('OPENAI_FAILED', 'GPT-4o-mini API call failed')
  }

  if (!content) {
    throw new ExtractionError('EMPTY_RESPONSE', 'GPT-4o-mini returned an empty response')
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(content)
  } catch (e) {
    console.error('[gpt4o-mini] returned invalid JSON:', content, e)
    throw new ExtractionError('OPENAI_FAILED', 'GPT-4o-mini returned invalid JSON')
  }

  if (isRejectedDescription(parsed)) {
    const code = REJECTION_TO_ERROR_CODE[parsed.reason]
    throw new ExtractionError(code, `GPT-4o-mini rejected the image: ${parsed.reason}`)
  }

  if (!isValidOutfitDescription(parsed)) {
    console.error('[gpt4o-mini] response does not match OutfitDescription schema:', parsed)
    throw new ExtractionError('INVALID_RESPONSE', 'GPT-4o-mini response does not match OutfitDescription schema')
  }

  // parsed también trae el discriminante 'status: ok' del esquema crudo;
  // se descarta para que OutfitDescription no lo arrastre al prompt de Minimax.
  const { status: _status, ...description } = parsed as OutfitDescription & { status: 'ok' }
  return description
}
