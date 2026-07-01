import { useAppStore }                 from '@/store'
import { uploadToR2 }                  from '@/lib/client/uploadToR2'
import { ensureJpeg }                  from '@/lib/ensureJpeg'
import type { FormParams, AppState }   from '@/store'

export function useAnalysisFlow() {
  const store = useAppStore()

  async function startFlow(file: File): Promise<void> {
    store.setPhase('uploading')
    store.setUploadProgress(0)

    // Convertir HEIC → JPEG antes de hacer nada (transparente para el usuario,
    // necesario para fotos tomadas directo con la cámara de iPhone)
    let fileToUpload: File
    try {
      fileToUpload = await ensureJpeg(file)
    } catch {
      // heic2any falló: se intenta con el archivo original.
      // El servidor puede rechazarlo (415), pero no bloqueamos el flujo por esto.
      fileToUpload = file
    }

    store.setCurrentFile(fileToUpload)

    // Paso 1: solicitar URL presignada
    let presignedUrl: string
    let objectKey: string

    try {
      const res = await fetch('/api/upload/presign', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          contentType:   fileToUpload.type,
          contentLength: fileToUpload.size,
        }),
      })

      if (!res.ok) {
        store.setPhase('error')
        store.setAnalysisError('UPLOAD_PRESIGN_FAILED')
        return
      }

      const json = await res.json()
      presignedUrl = json.data.presignedUrl
      objectKey    = json.data.objectKey
    } catch {
      store.setPhase('error')
      store.setAnalysisError('UPLOAD_PRESIGN_FAILED')
      return
    }

    store.setCurrentFileKey(objectKey)

    // Paso 2: subir a R2
    try {
      await uploadToR2(fileToUpload, presignedUrl, {
        onProgress: (percent) => store.setUploadProgress(percent),
      })
    } catch {
      store.setPhase('error')
      store.setAnalysisError('UPLOAD_FAILED')
      return
    }

    // Paso 3: analizar
    await runAnalyze(objectKey, store.formParams, store)
  }

  async function retryFlow(): Promise<void> {
    const { currentFileKey, formParams } = useAppStore.getState()

    if (!currentFileKey) {
      // El archivo ya no está en R2 (recarga de página u otro edge case)
      store.resetForReanalysis()
      return
    }

    store.setPhase('analyzing')
    store.setAnalysisError(null)

    await runAnalyze(currentFileKey, formParams, store)
  }

  return { startFlow, retryFlow }
}

// ── Helper interno ──────────────────────────────────────────────────────────

type StoreActions = AppState

async function runAnalyze(
  objectKey:  string,
  formParams: FormParams,
  store:      StoreActions,
): Promise<void> {
  store.setPhase('analyzing')

  let res: Response
  try {
    res = await fetch('/api/analyze', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ objectKey, formParams }),
    })
  } catch {
    store.setPhase('error')
    store.setAnalysisError('AI_ANALYSIS_FAILED')
    return
  }

  if (res.status === 429) {
    const json = await res.json().catch(() => null)
    if (json?.error?.code === 'IMAGE_REJECTION_BLOCKED') {
      store.setRejectionBlockedUntil(json.error.resetAt ?? null)
    }
    // Límite de uso o bloqueo por rechazos: volver a idle, cada mensaje inline
    // lee su propio countdown (usageTimestamps local o rejectionBlockedUntil)
    store.setPhase('idle')
    return
  }

  if (!res.ok) {
    // 422 (imagen rechazada por el modelo) o 502 (fallo técnico): en ambos
    // casos el código específico viaja en error.code, lo lee ProcessingError
    // para decidir el mensaje y si el CTA reintenta o pide subir otra imagen.
    const json = await res.json().catch(() => null)
    store.setPhase('error')
    store.setAnalysisError(json?.error?.code ?? 'AI_ANALYSIS_FAILED')
    return
  }

  const json = await res.json()
  store.setResults(json.data)
  store.recordUsage()      // espejo client-side: el servidor ya registró el uso
  store.setPhase('results')
}
