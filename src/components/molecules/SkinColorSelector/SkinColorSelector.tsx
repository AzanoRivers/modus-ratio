import type { Translations } from '@/i18n'
import { StepNumber } from '@/components/atoms'
import './SkinColorSelector.css'

export type SkinColor = 'fair' | 'light' | 'medium' | 'dark' | 'deepDark' | 'ebony'

const SKIN_COLORS: SkinColor[] = ['fair', 'light', 'medium', 'dark', 'deepDark', 'ebony']

interface SkinColorSelectorProps {
  t: Translations
  step: number
  value: SkinColor | null
  onChange: (color: SkinColor | null) => void
  className?: string
}

export function SkinColorSelector({ t, step, value, onChange, className }: SkinColorSelectorProps) {
  return (
    <div className={['skin-color-selector', className].filter(Boolean).join(' ')}>
      <span className="skin-color-selector__label">
        <StepNumber n={step} />
        {t.form.skinColorLabel}
        <span className="skin-color-selector__optional">· {t.common.optional}</span>
      </span>
      <div
        className="skin-color-selector__swatches"
        role="radiogroup"
        aria-label={t.form.skinColorLabel}
      >
        {SKIN_COLORS.map((color) => (
          <button
            key={color}
            role="radio"
            aria-checked={value === color}
            aria-label={t.form.skinColors[color]}
            className={['skin-swatch', `skin-swatch--${color}`, value === color && 'skin-swatch--active']
              .filter(Boolean)
              .join(' ')}
            onClick={() => onChange(value === color ? null : color)}
            type="button"
          />
        ))}
      </div>
    </div>
  )
}
