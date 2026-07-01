import type { Translations } from '@/i18n'
import { StepNumber } from '@/components/atoms'
import './BuildSelector.css'

export type BuildType = 'slim' | 'athletic' | 'uniform' | 'thick'

export interface BuildValue {
  upper: BuildType | null
  lower: BuildType | null
}

const BUILD_TYPES: BuildType[] = ['slim', 'athletic', 'uniform', 'thick']
const PARTS = ['upper', 'lower'] as const

interface BuildSelectorProps {
  t: Translations
  step: number
  value: BuildValue
  onChange: (value: BuildValue) => void
  className?: string
}

export function BuildSelector({ t, step, value, onChange, className }: BuildSelectorProps) {
  function selectPart(part: 'upper' | 'lower', type: BuildType) {
    onChange({ ...value, [part]: value[part] === type ? null : type })
  }

  return (
    <div className={['build-selector', className].filter(Boolean).join(' ')}>
      <span className="build-selector__label">
        <StepNumber n={step} />
        {t.form.buildLabel}
        <span className="build-selector__optional">· {t.common.optional}</span>
      </span>
      {PARTS.map((part) => (
        <div key={part} className="build-group" role="radiogroup" aria-label={t.form.buildParts[part]}>
          <span className="build-group__label">{t.form.buildParts[part]}</span>
          <div className="build-group__chips">
            {BUILD_TYPES.map((type) => (
              <button
                key={type}
                role="radio"
                aria-checked={value[part] === type}
                className={['build-chip', value[part] === type && 'build-chip--active']
                  .filter(Boolean)
                  .join(' ')}
                onClick={() => selectPart(part, type)}
                type="button"
              >
                {t.form.buildTypes[type]}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
