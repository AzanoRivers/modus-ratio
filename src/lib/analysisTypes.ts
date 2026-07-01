import { RATIO_GREEN_MIN, RATIO_YELLOW_MIN } from '@/lib/constants'

export const DIMENSION_KEYS = [
  'colorHarmony',
  'styleCoherence',
  'fitAndSilhouette',
  'originality',
  'contextFit',
] as const
export type DimensionKey = (typeof DIMENSION_KEYS)[number]

export const WARNING_KEYS = [
  'colors_clash',
  'pattern_overload',
  'ill_fitted',
  'occasion_mismatch',
  'accessories_missing',
  'layering_issue',
  'proportion_imbalance',
] as const
export type WarningKey = (typeof WARNING_KEYS)[number]

export const HIGHLIGHT_KEYS = [
  'great_color_combo',
  'statement_piece',
  'well_fitted',
  'cohesive_look',
  'unique_style',
] as const
export type HighlightKey = (typeof HIGHLIGHT_KEYS)[number]

export const RECOMMENDATION_KEYS = [
  'color_complementary',
  'color_analogous',
  'monochromatic_depth',
  'neutral_anchor',
  'skin_tone_palette',
  'visual_balance_halves',
  'rule_of_thirds_outfit',
  'tuck_and_volume',
  'vertical_elongation',
  'pattern_scale_mix',
  'texture_variety',
  'pattern_neutral_balance',
  'tone_on_tone_texture',
  'aesthetic_code_purity',
  'intentional_contrast',
  'accessory_reinforcement',
  'three_color_rule',
  'fitted_relaxed_balance',
  'waist_definition',
  'hem_length_coordination',
] as const
export type RecommendationKey = (typeof RECOMMENDATION_KEYS)[number]

export interface DimensionResult {
  score:  number
  // Frase personalizada de Minimax explicando ESTA puntuación para ESTE
  // outfit, en el idioma del usuario. Nunca texto genérico de plantilla.
  detail: string
}

export interface KeyedDetail<K extends string> {
  key:    K
  detail: string
}

export interface AnalysisResults {
  dimensions:      Record<DimensionKey, DimensionResult>
  globalRatio:     number
  semaphore:       'green' | 'yellow' | 'red'
  warnings:        KeyedDetail<WarningKey>[]
  highlight:       KeyedDetail<HighlightKey> | null
  recommendations: KeyedDetail<RecommendationKey>[]
}

export type AnalysisErrorCode =
  | 'EXTRACTION_FAILED'
  | 'MINIMAX_FAILED'
  | 'INVALID_RESPONSE'
  | 'EMPTY_RESPONSE'
  | 'NO_PERSON_DETECTED'
  | 'IMAGE_QUALITY_TOO_LOW'
  | 'NOT_CLOTHING_PHOTO'
  | 'INAPPROPRIATE_CONTENT'

// Códigos que representan un rechazo de imagen por parte del modelo (GPT-4o-mini
// decidió que la imagen no es analizable), no un fallo técnico del pipeline.
// Se usan para: (a) devolver 422 en vez de 502 en /api/analyze, (b) contar
// hacia el bloqueo de abuso por rechazos repetidos, (c) mostrar un mensaje
// específico + botón "subir otra imagen" en vez de "reintentar".
export const REJECTION_ERROR_CODES = [
  'NO_PERSON_DETECTED',
  'IMAGE_QUALITY_TOO_LOW',
  'NOT_CLOTHING_PHOTO',
  'INAPPROPRIATE_CONTENT',
] as const

export function isRejectionErrorCode(code: string): code is (typeof REJECTION_ERROR_CODES)[number] {
  return (REJECTION_ERROR_CODES as readonly string[]).includes(code)
}

export class AnalysisError extends Error {
  constructor(public readonly code: AnalysisErrorCode, message?: string) {
    super(message ?? code)
  }
}

export function calcSemaphore(ratio: number): AnalysisResults['semaphore'] {
  if (ratio >= RATIO_GREEN_MIN)  return 'green'
  if (ratio >= RATIO_YELLOW_MIN) return 'yellow'
  return 'red'
}
