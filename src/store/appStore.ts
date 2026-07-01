import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { StyleOption } from '@/components/molecules/StyleSelector'
import type { SkinColor } from '@/components/molecules/SkinColorSelector'
import type { BuildValue } from '@/components/molecules/BuildSelector'
import type { GenderPref } from '@/components/molecules/GenderSelector'
import {
  USAGE_LIMIT,
  USAGE_WINDOW_MS,
  STORE_VERSION,
  STORE_KEY,
} from '@/lib/constants'
import type { AnalysisResults } from '@/lib/analysisTypes'

export type { AnalysisResults }

// ── Tipos exportados ─────────────────────────────────────────────────────────

export interface FormParams {
  style:      StyleOption | null
  height:     number | null
  skinColor:  SkinColor | null
  build:      BuildValue
  genderPref: GenderPref | null
}

export type AppPhase =
  | 'idle'
  | 'uploading'
  | 'analyzing'
  | 'results'
  | 'error'

export interface AppState {
  // Parámetros del formulario (PERSISTIDOS)
  formParams:    FormParams
  setFormParam:  <K extends keyof FormParams>(key: K, value: FormParams[K]) => void
  resetFormParams: () => void

  // Fase de la app (NO persistida)
  phase:    AppPhase
  setPhase: (phase: AppPhase) => void

  // Archivo actual (NO persistido: File no es serializable)
  currentFile:    File | null
  setCurrentFile: (file: File | null) => void

  // Key del archivo subido a R2 (NO persistida, se resetea al recargar)
  currentFileKey:    string | null
  setCurrentFileKey: (key: string | null) => void

  // Progreso de subida 0–100 (NO persistido)
  uploadProgress:    number
  setUploadProgress: (percent: number) => void

  // Resultados (NO persistidos)
  results:    AnalysisResults | null
  setResults: (results: AnalysisResults | null) => void

  // Error de análisis (NO persistido)
  analysisError:    string | null   // clave de i18n del error
  setAnalysisError: (key: string | null) => void

  // Bloqueo por abuso de imágenes rechazadas (NO persistido: es autoridad del
  // servidor, se re-consulta en el próximo intento si se pierde por recarga)
  rejectionBlockedUntil:    number | null
  setRejectionBlockedUntil: (ts: number | null) => void

  // Reinicio para re-análisis: vuelve a idle sin tocar formParams ni usageTimestamps
  resetForReanalysis: () => void

  // Límite de uso: ventana deslizante (PERSISTIDO)
  usageTimestamps: number[]
  recordUsage:     () => void
  canAnalyze:      () => boolean
  remaining:       () => number
  resetAt:         () => number | null
}

// ── Función pura exportada, testeable sin montar el store ───────────────────

export function pruneTimestamps(timestamps: number[], now: number): number[] {
  return timestamps.filter(ts => ts > now - USAGE_WINDOW_MS)
}

// ── Estado inicial del formulario ────────────────────────────────────────────

const initialFormParams: FormParams = {
  style:      null,
  height:     null,
  skinColor:  null,
  build:      { upper: null, lower: null },
  genderPref: null,
}

// ── Store ────────────────────────────────────────────────────────────────────

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({

      formParams:   initialFormParams,
      setFormParam: (key, value) =>
        set(state => ({ formParams: { ...state.formParams, [key]: value } })),
      resetFormParams: () => set({ formParams: initialFormParams }),

      phase:    'idle',
      setPhase: (phase) => set({ phase }),

      currentFile:    null,
      setCurrentFile: (file) => set({ currentFile: file }),

      currentFileKey:    null,
      setCurrentFileKey: (key) => set({ currentFileKey: key }),

      uploadProgress:    0,
      setUploadProgress: (percent) => set({ uploadProgress: percent }),

      results:    null,
      setResults: (results) => set({ results }),

      analysisError:    null,
      setAnalysisError: (key) => set({ analysisError: key }),

      rejectionBlockedUntil:    null,
      setRejectionBlockedUntil: (ts) => set({ rejectionBlockedUntil: ts }),

      resetForReanalysis: () =>
        set({
          phase:          'idle',
          currentFile:    null,
          currentFileKey: null,
          results:        null,
          uploadProgress: 0,
          analysisError:  null,
        }),

      usageTimestamps: [],

      recordUsage: () => {
        const now = Date.now()
        set(state => ({
          usageTimestamps: [...pruneTimestamps(state.usageTimestamps, now), now],
        }))
      },

      canAnalyze: () => {
        const pruned = pruneTimestamps(get().usageTimestamps, Date.now())
        return pruned.length < USAGE_LIMIT
      },

      remaining: () => {
        const pruned = pruneTimestamps(get().usageTimestamps, Date.now())
        return Math.max(0, USAGE_LIMIT - pruned.length)
      },

      resetAt: () => {
        const pruned = pruneTimestamps(get().usageTimestamps, Date.now())
        if (pruned.length === 0) return null
        return pruned[0] + USAGE_WINDOW_MS
      },

    }),
    {
      name:    STORE_KEY,
      version: STORE_VERSION,
      storage: createJSONStorage(() =>
        typeof window !== 'undefined'
          ? localStorage
          : { getItem: () => null, setItem: () => void 0, removeItem: () => void 0 } as unknown as Storage
      ),
      partialize: (state) => ({
        formParams:      state.formParams,
        usageTimestamps: state.usageTimestamps,
      }),
      migrate: (_persisted, _version) => {
        // versión 0 → 1: sin transformaciones aún
        return _persisted as AppState
      },
    }
  )
)
