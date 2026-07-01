import { es } from './es'
import { en } from './en'

export type { Translations } from './types'

export type Locale = 'es' | 'en'

export function getDictionary(locale: Locale) {
  return locale === 'es' ? es : en
}
