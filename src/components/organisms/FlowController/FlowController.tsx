import { useEffect, useState } from 'react'
import './FlowController.css'
import { useAppStore }       from '@/store'
import { useAnalysisFlow }   from '@/lib/useAnalysisFlow'
import { CyberTransition }   from '@/components/atoms'
// Rutas directas (no el barrel '@/components/organisms'): ese barrel también
// exporta FlowController, así que importar desde ahí crearía una dependencia
// circular (organisms/index.ts -> FlowController.tsx -> organisms/index.ts).
import { AnalysisLoader } from '@/components/organisms/AnalysisLoader'
import { ResultsPanel }   from '@/components/organisms/ResultsPanel'
import { HomeForm }       from '@/components/organisms/HomeForm'
import { UsageLimitMessage, ProcessingError } from '@/components/molecules'
import type { Translations } from '@/i18n'

interface FlowControllerProps {
  t: Translations
}

// Debe coincidir con la duración de la animación ctGlitchOut en
// CyberTransition.css: es el tiempo que el contenido saliente se queda
// glitcheando en pantalla antes de desmontarse y dar paso al siguiente.
const GLITCH_OUT_MS = 320

// El aviso de privacidad ("tu foto se analiza y se elimina...") es estático
// en index.astro, fuera de FlowController: al cambiar de fase el contenido
// de abajo cambia de tamaño (form <-> loader <-> resultados) y el scroll
// quedaba donde estuviera el mouse, a veces lejos de todo. Se lo ancla ahí
// en vez de a document.body/0,0 porque sigue siendo visible en las 3 fases.
//
// El callback (lo que efectivamente cambia de fase y dispara el glitch) se
// ejecuta DESPUÉS de que termina el scroll, no al mismo tiempo: si ambas
// animaciones corren juntas (scroll largo, ej. desde el botón al fondo del
// formulario, + el contenido glitcheando y encogiéndose a la vez) se ven
// descoordinadas, como si nada controlara la transición. Primero se asienta
// la vista arriba, recién ahí arranca el glitch.
function scrollToPrivacyNoticeThen(callback: () => void) {
  const el = document.getElementById('privacy-warning')
  if (!el) {
    callback()
    return
  }

  // Ya está arriba (ej. formulario corto en desktop, no hizo falta scrollear):
  // no tiene sentido esperar, se dispara la transición de inmediato.
  const { top } = el.getBoundingClientRect()
  if (top >= 0 && top < 24) {
    callback()
    return
  }

  let done = false
  const finish = () => {
    if (done) return
    done = true
    window.removeEventListener('scrollend', finish)
    window.clearTimeout(fallback)
    callback()
  }

  el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  window.addEventListener('scrollend', finish, { once: true })
  // Red de seguridad para navegadores sin soporte de 'scrollend'.
  const fallback = window.setTimeout(finish, 900)
}

export function FlowController({ t }: FlowControllerProps) {
  const phase                 = useAppStore((s) => s.phase)
  const canAnalyze            = useAppStore((s) => s.canAnalyze)
  const resetAt               = useAppStore((s) => s.resetAt)
  const rejectionBlockedUntil = useAppStore((s) => s.rejectionBlockedUntil)
  const analysisError         = useAppStore((s) => s.analysisError)

  const { startFlow, retryFlow } = useAnalysisFlow()

  const isRejectionBlocked = !!rejectionBlockedUntil && rejectionBlockedUntil > Date.now()

  // Clave de transición: uploading y analyzing comparten 'loading'
  // para no interrumpir el loader al pasar de una fase a la otra
  const transitionKey =
    phase === 'uploading' || phase === 'analyzing' ? 'loading' : phase

  // El contenido visible (displayKey) va un paso detrás de transitionKey: al
  // cambiar de fase primero se ve el glitch de salida sobre lo que ya estaba
  // pintado (el formulario, el loader, etc.) y solo después se monta el
  // contenido nuevo, para no perder la continuidad de golpe.
  const [displayKey, setDisplayKey] = useState(transitionKey)
  const [exiting, setExiting] = useState(false)

  useEffect(() => {
    if (transitionKey === displayKey) return
    setExiting(true)
    const timeout = window.setTimeout(() => {
      setDisplayKey(transitionKey)
      setExiting(false)
    }, GLITCH_OUT_MS)
    return () => window.clearTimeout(timeout)
  }, [transitionKey, displayKey])

  const handleSubmit = () => {
    const file = useAppStore.getState().currentFile
    if (!file || !canAnalyze()) return
    scrollToPrivacyNoticeThen(() => startFlow(file))
  }

  const handleReanalyze = () => {
    scrollToPrivacyNoticeThen(() => useAppStore.getState().resetForReanalysis())
  }

  const handleRetry = () => {
    const { currentFileKey } = useAppStore.getState()
    if (currentFileKey) {
      retryFlow()
    } else {
      useAppStore.getState().resetForReanalysis()
    }
  }

  return (
    <div className="flow-controller">
      <CyberTransition transitionKey={displayKey} effect="scanIn" exiting={exiting}>

        {displayKey === 'idle' && (
          <div className="flow-controller__idle">
            {isRejectionBlocked && (
              <UsageLimitMessage
                title={t.home.imageBlockTitle}
                body={t.home.imageBlockBody}
                resetsAtLabel={t.home.usageLimitResetsAt}
                minutesLabel={t.home.usageLimitMinutes}
                resetAt={rejectionBlockedUntil}
              />
            )}
            {!isRejectionBlocked && !canAnalyze() && (
              <UsageLimitMessage
                title={t.home.usageLimitTitle}
                body={t.home.usageLimitBody}
                resetsAtLabel={t.home.usageLimitResetsAt}
                minutesLabel={t.home.usageLimitMinutes}
                resetAt={resetAt()}
              />
            )}
            <HomeForm
              t={t}
              onSubmit={handleSubmit}
              disabled={!canAnalyze() || isRejectionBlocked}
            />
          </div>
        )}

        {displayKey === 'loading' && (
          <AnalysisLoader t={t.loader} />
        )}

        {displayKey === 'results' && (
          <ResultsPanel t={t} onReanalyze={handleReanalyze} />
        )}

        {displayKey === 'error' && (
          <ProcessingError
            errorCode={analysisError}
            t={{
              processingError:  t.analysis.processingError,
              rejectionReasons: t.analysis.rejectionReasons,
              rejectionCta:     t.analysis.rejectionCta,
            }}
            onRetry={handleRetry}
            onUploadNew={handleReanalyze}
          />
        )}

      </CyberTransition>
    </div>
  )
}
