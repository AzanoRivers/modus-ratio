// Mismas env vars que consume el rate limit real del servidor (src/lib/env.ts,
// aplicado en src/lib/rateLimit.ts). Este valor es solo el countdown local
// mostrado en la UI (appStore.ts); el servidor sigue siendo la autoridad real,
// pero si estos números no coinciden con los del servidor, la UI muestra un
// límite/tiempo de espera equivocado.
function publicEnvNumber(key: string, fallback: number): number {
  const raw = import.meta.env[key] as string | undefined
  const parsed = raw ? Number(raw) : NaN
  return Number.isFinite(parsed) ? parsed : fallback
}

export const USAGE_LIMIT     = publicEnvNumber('PUBLIC_RATE_LIMIT_USAGE_LIMIT', 5)
export const USAGE_WINDOW_MS = publicEnvNumber('PUBLIC_RATE_LIMIT_USAGE_WINDOW_MINUTES', 15) * 60 * 1000
export const STORE_VERSION   = 1
export const STORE_KEY       = 'modus-ratio-store'

// Umbrales del semáforo (espejo de los valores en constants.css)
export const RATIO_GREEN_MIN  = 70   // >= 70: verde
export const RATIO_YELLOW_MIN = 40   // >= 40 y < 70: amarillo, < 40: rojo
