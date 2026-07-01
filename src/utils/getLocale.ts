import type { Locale } from '@/i18n'

export function getLocale(request: Request): Locale {
  const header = request.headers.get('accept-language')
  if (!header) return 'en'

  const firstTag = header.split(',')[0].split(';')[0].trim().toLowerCase()
  return firstTag.startsWith('es') ? 'es' : 'en'
}
