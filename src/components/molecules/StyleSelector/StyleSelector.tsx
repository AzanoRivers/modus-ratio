import type { Translations } from '@/i18n'
import { StepNumber } from '@/components/atoms'
import './StyleSelector.css'

export type StyleOption =
  | 'urbano'
  | 'alternativo'
  | 'casual'
  | 'semiformal'
  | 'formal'
  | 'formalUrbano'
  | 'formalAlternativo'
  | 'oldmoney'
  | 'punkRock'
  | 'gotico'
  | 'geek'
  | 'miEstilo'

const STYLES: StyleOption[] = [
  'urbano',
  'alternativo',
  'casual',
  'semiformal',
  'formal',
  'formalUrbano',
  'formalAlternativo',
  'oldmoney',
  'punkRock',
  'gotico',
  'geek',
  'miEstilo',
]

interface StyleSelectorProps {
  t: Translations
  step: number
  value: StyleOption | null
  onChange: (style: StyleOption) => void
  className?: string
}

export function StyleSelector({ t, step, value, onChange, className }: StyleSelectorProps) {
  return (
    <div
      className={['style-selector', className].filter(Boolean).join(' ')}
      role="radiogroup"
      aria-label={t.form.styleLabel}
    >
      <span className="style-selector__label">
        <StepNumber n={step} />
        {t.form.styleLabel}
      </span>
      <div className="style-selector__grid">
        {STYLES.map((style) => (
          <button
            key={style}
            role="radio"
            aria-checked={value === style}
            className={[
              'style-chip',
              style === 'miEstilo' && 'style-chip--rainbow',
              value === style && 'style-chip--active',
            ]
              .filter(Boolean)
              .join(' ')}
            onClick={() => onChange(style)}
            type="button"
          >
            {t.form.styles[style]}
          </button>
        ))}
      </div>
    </div>
  )
}
