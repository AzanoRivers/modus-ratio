/**
 * Singleton de Web Audio API para efectos de sonido globales.
 *
 * POLÍTICA DE AUTOPLAY (Chrome/Safari):
 * Los browsers bloquean AudioContext hasta que el usuario interactúa.
 * setupGlobalAudio() escucha pointerdown para desbloquear el contexto y
 * pointerup para reproducir el clic (solo si el puntero no se movió más
 * de 8px, para no dispararse durante scroll o drag).
 */

let audioCtx: AudioContext | null = null
let clickBuffer: AudioBuffer | null = null
let loadPromise: Promise<void> | null = null
let globalAttached = false

function ensureCtx(): AudioContext {
  if (!audioCtx) audioCtx = new AudioContext()
  return audioCtx
}

export function preloadSounds(): Promise<void> {
  if (loadPromise) return loadPromise
  const ctx = ensureCtx()
  loadPromise = fetch('/sounds/click_buttom.wav')
    .then((r) => r.arrayBuffer())
    .then((buf) => ctx.decodeAudioData(buf))
    .then((decoded) => { clickBuffer = decoded })
    .catch(() => {})
  return loadPromise
}

export function setupGlobalAudio(): void {
  if (globalAttached || typeof document === 'undefined') return
  globalAttached = true

  let startX = 0
  let startY = 0

  document.addEventListener('pointerdown', (e) => {
    startX = e.clientX
    startY = e.clientY
    if (audioCtx?.state === 'suspended') {
      audioCtx.resume().catch(() => {})
    }
  }, { passive: true })

  document.addEventListener('pointerup', (e) => {
    if (!audioCtx) return
    const dx = Math.abs(e.clientX - startX)
    const dy = Math.abs(e.clientY - startY)
    if (dx < 8 && dy < 8) playBuffer(clickBuffer)
  }, { passive: true })
}

function playBuffer(buffer: AudioBuffer | null): void {
  if (!buffer || !audioCtx) return
  const src = audioCtx.createBufferSource()
  src.buffer = buffer
  src.connect(audioCtx.destination)
  src.start(0)
}
