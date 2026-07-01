export const USAGE_LIMIT     = 25
export const USAGE_WINDOW_MS = 60 * 60 * 1000   // 1 hora
export const STORE_VERSION   = 1
export const STORE_KEY       = 'modus-ratio-store'

// Umbrales del semáforo (espejo de los valores en constants.css)
export const RATIO_GREEN_MIN  = 70   // >= 70: verde
export const RATIO_YELLOW_MIN = 40   // >= 40 y < 70: amarillo, < 40: rojo
