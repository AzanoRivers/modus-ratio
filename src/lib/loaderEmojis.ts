import type { StyleOption } from '@/components/molecules/StyleSelector'

// Emojis puros (sin texto): no necesitan traducción, por eso viven fuera de
// los diccionarios de i18n. Se combinan con LOADER_EMOJIS.generic en tiempo
// de uso para formar el pool de partículas del AnalysisLoader.
export const LOADER_EMOJIS: Record<StyleOption | 'generic', string[]> = {
  generic: ['✨', '💫', '😏', '❤️', '😎', '🎩', '👀'],
  urbano: ['🧢', '🕶️', '🎧', '👟', '🛹'],
  alternativo: ['🖤', '🎸', '⛓️', '🦇', '🕸️'],
  casual: ['👕', '☕', '😎', '🧴', '👖'],
  semiformal: ['👔', '🕶️', '⌚', '💼'],
  formal: ['🎩', '🍷', '👞', '🥂'],
  formalUrbano: ['🧥', '🕶️', '⛓️', '👟'],
  formalAlternativo: ['🖤', '🎩', '⛓️', '🥀'],
  oldmoney: ['🍷', '🎩', '🛥️', '🍝', '🥃'],
  punkRock: ['🤘', '⛓️', '🎸', '💀', '🧷'],
  gotico: ['🖤', '🦇', '🕯️', '⚰️', '🌙'],
  geek: ['🤓', '🎮', '👾', '📚', '🚀'],
}
