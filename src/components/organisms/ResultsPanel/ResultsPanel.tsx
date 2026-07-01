import './ResultsPanel.css'
import { useAppStore }  from '@/store'
import { DimensionBar } from '@/components/molecules'
import { Badge, Button, NeonBreakLine, Skeleton } from '@/components/atoms'
// Import directo (no el barrel '@/lib'): ese barrel también re-exporta módulos
// server-only (env, redis, r2, openai, minimax), que leen variables de entorno
// al cargar el módulo. Como ResultsPanel se hidrata en el cliente, importar el
// barrel completo rompe la hidratación buscando secretos que no existen en el navegador.
import { DIMENSION_KEYS } from '@/lib/analysisTypes'
import type { Translations } from '@/i18n'

interface ResultsPanelProps {
  t: Pick<Translations, 'analysis' | 'recommendations' | 'results' | 'form'>
  onReanalyze: () => void
}

const SEMAPHORE_SYMBOL: Record<'green' | 'yellow' | 'red', string> = {
  green:  '✓',
  yellow: '!',
  red:    '✗',
}

export function ResultsPanel({ t, onReanalyze }: ResultsPanelProps) {
  const phase      = useAppStore((s) => s.phase)
  const results    = useAppStore((s) => s.results)
  const formParams = useAppStore((s) => s.formParams)

  if (phase === 'analyzing' || !results) {
    return <ResultsPanelSkeleton />
  }

  const { dimensions, globalRatio, semaphore, warnings, highlight, recommendations } = results
  const styleLabel = formParams.style ? t.form.styles[formParams.style] : ''

  return (
    <div className="results-panel">

      {/* Hero: semáforo + ratio global */}
      <div className="results-panel__hero">
        <div className={`results-panel__semaphore results-panel__semaphore--${semaphore}`}>
          {SEMAPHORE_SYMBOL[semaphore]}
        </div>
        <span className="results-panel__ratio-label">
          {t.results.ratioForStyleLabel}{styleLabel && ` ${styleLabel}`}
        </span>
        <span className="results-panel__ratio-value">{globalRatio}</span>
        <span className="results-panel__semaphore-text">{t.analysis.semaphore[semaphore]}</span>
      </div>

      <div className="results-panel__body">

        {/* Dimensiones */}
        <div className="results-panel__col results-panel__col--dimensions">
          <div className="results-panel__section">
            <h3 className="results-panel__section-title">{t.results.dimensionsTitle}</h3>
            {DIMENSION_KEYS.map((key, index) => (
              <DimensionBar
                key={key}
                label={t.analysis.dimensions[key]}
                description={t.analysis.dimensionDescriptions[key]}
                score={dimensions[key].score}
                detail={dimensions[key].detail}
                index={index}
              />
            ))}
          </div>
        </div>

        <NeonBreakLine orientation="vertical" opacity={0.35} className="results-panel__divider" />

        {/* Warnings + highlight + recomendaciones */}
        <div className="results-panel__col results-panel__col--insights">
          {warnings.length > 0 && (
            <div className="results-panel__section">
              <h3 className="results-panel__section-title">{t.results.warningsTitle}</h3>
              <div className="results-panel__warnings">
                {warnings.map((w) => (
                  <Badge key={w.key} variant="warning">
                    {w.detail}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {highlight && (
            <div className="results-panel__section">
              <h3 className="results-panel__section-title">{t.results.highlightTitle}</h3>
              <p className="results-panel__highlight">{highlight.detail}</p>
            </div>
          )}

          {recommendations.length > 0 && (
            <div className="results-panel__section">
              <h3 className="results-panel__section-title">{t.results.recsTitle}</h3>
              <ol className="results-panel__recs">
                {recommendations.map((r) => (
                  <li key={r.key} className="results-panel__rec">
                    <span className="results-panel__rec-text">{r.detail}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>

      </div>

      {/* Disclaimer estilo personal */}
      <p className="results-panel__disclaimer">{t.results.styleDisclaimer}</p>

      {/* Botón re-análisis */}
      <Button onClick={onReanalyze} className="btn-beam">{t.results.reanalyzeButton}</Button>

    </div>
  )
}

function ResultsPanelSkeleton() {
  return (
    <div className="results-panel">
      <div className="results-panel__hero">
        <Skeleton variant="card" className="results-panel__skel-semaphore" />
        <Skeleton variant="text" className="results-panel__skel-label" />
        <Skeleton variant="text" className="results-panel__skel-ratio" />
        <Skeleton variant="text" className="results-panel__skel-subtext" />
      </div>
      <div className="results-panel__body">
        <div className="results-panel__col results-panel__col--dimensions">
          <div className="results-panel__section">
            <Skeleton variant="text" className="results-panel__skel-title" />
            {Array.from({ length: DIMENSION_KEYS.length }).map((_, i) => (
              <Skeleton key={i} variant="bar" className="results-panel__skel-dim" />
            ))}
          </div>
        </div>
        <NeonBreakLine orientation="vertical" opacity={0.35} className="results-panel__divider" />
        <div className="results-panel__col results-panel__col--insights">
          <div className="results-panel__section">
            <Skeleton variant="text" className="results-panel__skel-title" />
            <Skeleton variant="card" className="results-panel__skel-highlight" />
          </div>
        </div>
      </div>
    </div>
  )
}
