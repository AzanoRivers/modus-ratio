export interface Garment {
  type:     string
  color:    string
  pattern:  string
  fit:      string
  texture:  string
  length?:  string
}

export interface OutfitDescription {
  garments:         Garment[]
  accessories:      string[]
  dominantColors:   string[]
  colorTemperature: 'warm' | 'cool' | 'neutral' | 'mixed'
  patterns:         string[]
  layering:         boolean
  overallStyle:     string
  silhouetteNotes:  string
  colorInteraction: string
  fitObservations:  string
  confidence:       'high' | 'medium' | 'low'
}

export const REJECTION_REASON_KEYS = [
  'no_person_detected',
  'image_quality_too_low',
  'not_clothing_photo',
  'inappropriate_content',
] as const
export type RejectionReasonKey = (typeof REJECTION_REASON_KEYS)[number]

export interface RejectedDescription {
  status: 'rejected'
  reason: RejectionReasonKey
}

// Forma cruda que puede devolver GPT-4o-mini antes de validar: una descripción
// aceptada (con el discriminante 'status') o un rechazo.
export type RawExtractionResult =
  | ({ status: 'ok' } & OutfitDescription)
  | RejectedDescription

// Mapeo 1:1 entre la razón de rechazo (snake_case, viene del modelo) y el
// código de error que viaja por el resto del pipeline (UPPER_SNAKE_CASE,
// consistente con el resto de ExtractionErrorCode/AnalysisErrorCode).
export const REJECTION_TO_ERROR_CODE: Record<RejectionReasonKey, ExtractionErrorCode> = {
  no_person_detected:     'NO_PERSON_DETECTED',
  image_quality_too_low:  'IMAGE_QUALITY_TOO_LOW',
  not_clothing_photo:     'NOT_CLOTHING_PHOTO',
  inappropriate_content:  'INAPPROPRIATE_CONTENT',
}

export type ExtractionErrorCode =
  | 'INVALID_RESPONSE'
  | 'OPENAI_FAILED'
  | 'EMPTY_RESPONSE'
  | 'NO_PERSON_DETECTED'
  | 'IMAGE_QUALITY_TOO_LOW'
  | 'NOT_CLOTHING_PHOTO'
  | 'INAPPROPRIATE_CONTENT'

export class ExtractionError extends Error {
  constructor(public readonly code: ExtractionErrorCode, message?: string) {
    super(message ?? code)
    this.name = 'ExtractionError'
  }
}

export function isRejectedDescription(raw: unknown): raw is RejectedDescription {
  if (typeof raw !== 'object' || raw === null) return false
  const obj = raw as Record<string, unknown>
  return (
    obj.status === 'rejected' &&
    (REJECTION_REASON_KEYS as readonly string[]).includes(obj.reason as string)
  )
}

export function isValidOutfitDescription(raw: unknown): raw is OutfitDescription {
  if (typeof raw !== 'object' || raw === null) return false
  const obj = raw as Record<string, unknown>

  if (!Array.isArray(obj.garments) || obj.garments.length === 0) return false

  const validGarments = obj.garments.every((g: unknown) => {
    if (typeof g !== 'object' || g === null) return false
    const garment = g as Record<string, unknown>
    return (
      typeof garment.type    === 'string' && garment.type.length > 0 &&
      typeof garment.color   === 'string' && garment.color.length > 0 &&
      typeof garment.pattern === 'string' && garment.pattern.length > 0 &&
      typeof garment.fit     === 'string' && garment.fit.length > 0 &&
      typeof garment.texture === 'string' && garment.texture.length > 0
    )
  })
  if (!validGarments) return false

  if (!Array.isArray(obj.dominantColors) || obj.dominantColors.length === 0) return false

  const validTemp = ['warm', 'cool', 'neutral', 'mixed'].includes(obj.colorTemperature as string)
  if (!validTemp) return false

  const validConf = ['high', 'medium', 'low'].includes(obj.confidence as string)
  if (!validConf) return false

  return true
}
