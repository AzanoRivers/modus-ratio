function required(key: string): string {
  const value = import.meta.env[key]
  if (!value) throw new Error(`[env] Missing required variable: ${key}`)
  return value as string
}

function optional(key: string, fallback = ''): string {
  return (import.meta.env[key] as string | undefined) ?? fallback
}

function optionalNumber(key: string, fallback: number): number {
  const raw = import.meta.env[key] as string | undefined
  if (!raw) return fallback
  const parsed = Number(raw)
  return Number.isFinite(parsed) ? parsed : fallback
}

export const env = {
  redis: {
    url:      required('REDIS_URL'),
    password: optional('REDIS_PASSWORD'),
    username: optional('REDIS_USERNAME'),
  },
  rateLimit: {
    // Análisis de outfit permitidos por IP dentro de la ventana. Defaults
    // conservan el comportamiento pedido (5 cada 15 min) si no se setean.
    // Prefijo PUBLIC_ porque src/lib/constants.ts necesita este mismo valor
    // en el bundle de cliente (countdown local en appStore.ts); si no,
    // servidor y UI podrían mostrar límites distintos.
    usageLimit:         optionalNumber('PUBLIC_RATE_LIMIT_USAGE_LIMIT', 5),
    usageWindowMinutes: optionalNumber('PUBLIC_RATE_LIMIT_USAGE_WINDOW_MINUTES', 15),
  },
  r2: {
    accountId:       required('R2_ACCOUNT_ID'),
    accessKeyId:     required('R2_ACCESS_KEY_ID'),
    secretAccessKey: required('R2_SECRET_ACCESS_KEY'),
    bucketName:      required('R2_BUCKET_NAME'),
    publicUrl:       required('R2_PUBLIC_URL'),
  },
  openai: {
    apiKey: required('OPENAI_API_KEY'),
  },
  opencode: {
    apiKey: required('OPENCODE_API_KEY'),
  },
  models: {
    // Análisis de imagen (extractOutfitDescription.ts): describe el outfit
    // a partir de la foto. Primario y fallback corren ambos vía OpenAI
    // (mismo cliente, src/lib/openai.ts).
    imageAnalysis:           optional('IMAGE_ANALYSIS_MODEL', 'gpt-4o-mini'),
    imageAnalysisFallback:   optional('IMAGE_ANALYSIS_FALLBACK_MODEL', 'gpt-4o'),
    // Análisis de contexto (analyzeOutfitScore.ts): puntúa el outfit ya
    // descrito. Primario vía OpenCode Go (scoringClient.ts), fallback vía
    // OpenAI.
    contextAnalysis:         optional('CONTEXT_ANALYSIS_MODEL', 'glm-5.2'),
    contextAnalysisFallback: optional('CONTEXT_ANALYSIS_FALLBACK_MODEL', 'gpt-4o-mini'),
  },
  resend: {
    apiKey: required('RESEND_API_KEY'),
  },
  app: {
    url: optional('APP_URL', 'http://localhost:4321'),
  },
} as const
