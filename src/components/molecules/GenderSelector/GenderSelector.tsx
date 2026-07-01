import type { Translations } from '@/i18n'
import { StepNumber } from '@/components/atoms'
import './GenderSelector.css'

export type GenderPref = 'fem' | 'masc' | 'nonbinary' | 'fluid'

const GENDER_PREFS: GenderPref[] = ['fem', 'masc', 'nonbinary', 'fluid']

interface GenderSelectorProps {
  t: Translations
  step: number
  value: GenderPref | null
  onChange: (pref: GenderPref | null) => void
  className?: string
}

export function GenderSelector({ t, step, value, onChange, className }: GenderSelectorProps) {
  return (
    <div className={['gender-selector', className].filter(Boolean).join(' ')}>
      <span className="gender-selector__label">
        <StepNumber n={step} />
        {t.form.genderPrefLabel}
        <span className="gender-selector__optional">· {t.common.optional}</span>
      </span>
      <div className="gender-selector__grid" role="radiogroup" aria-label={t.form.genderPrefLabel}>
        {GENDER_PREFS.map((pref) => (
          <button
            key={pref}
            role="radio"
            aria-checked={value === pref}
            className={['gender-chip', value === pref && 'gender-chip--active']
              .filter(Boolean)
              .join(' ')}
            onClick={() => onChange(value === pref ? null : pref)}
            type="button"
          >
            {t.form.genderPrefs[pref]}
          </button>
        ))}
      </div>
    </div>
  )
}
