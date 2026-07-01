import type { AnalysisResults } from '@/lib/analysisTypes'
import { AnalysisError, REJECTION_ERROR_CODES } from '@/lib/analysisTypes'
import { extractOutfitDescription } from '@/lib/extractOutfitDescription'
import { ExtractionError } from '@/lib/outfitDescription'
import { analyzeWithMinimax } from '@/lib/analyzeWithMinimax'
import type { FormParams } from '@/components/organisms/HomeForm'

export { AnalysisError }
export type { AnalysisErrorCode } from '@/lib/analysisTypes'

export interface PipelineInput {
  objectKey:  string
  formParams: FormParams
  locale:     'es' | 'en'
}

export async function runAnalysisPipeline(
  input: PipelineInput,
): Promise<AnalysisResults> {
  let description

  try {
    description = await extractOutfitDescription(input)
  } catch (e: unknown) {
    if (e instanceof ExtractionError) {
      // Los rechazos de imagen (el modelo decidió que no es analizable) viajan
      // con su código específico. Los fallos técnicos genuinos (JSON inválido,
      // respuesta vacía, error de OpenAI) colapsan a EXTRACTION_FAILED, como antes.
      const code = (REJECTION_ERROR_CODES as readonly string[]).includes(e.code)
        ? (e.code as typeof REJECTION_ERROR_CODES[number])
        : 'EXTRACTION_FAILED'
      throw new AnalysisError(code, e.message)
    }
    throw new AnalysisError('EXTRACTION_FAILED', 'Unexpected error during extraction')
  }

  return analyzeWithMinimax(description, input.formParams, input.locale)
}
