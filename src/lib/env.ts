function required(key: string): string {
  const value = import.meta.env[key]
  if (!value) throw new Error(`[env] Missing required variable: ${key}`)
  return value as string
}

function optional(key: string, fallback = ''): string {
  return (import.meta.env[key] as string | undefined) ?? fallback
}

export const env = {
  redis: {
    url:      required('REDIS_URL'),
    password: optional('REDIS_PASSWORD'),
    username: optional('REDIS_USERNAME'),
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
  resend: {
    apiKey: required('RESEND_API_KEY'),
  },
  app: {
    url: optional('APP_URL', 'http://localhost:4321'),
  },
} as const
