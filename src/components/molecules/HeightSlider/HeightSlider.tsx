import type { Translations } from '@/i18n'
import { StepNumber } from '@/components/atoms'
import './HeightSlider.css'

interface HeightSliderProps {
  t: Translations
  step: number
  value: number | null
  onChange: (cm: number | null) => void
  className?: string
}

export function HeightSlider({ t, step, value, onChange, className }: HeightSliderProps) {
  return (
    <div className={['height-slider', className].filter(Boolean).join(' ')}>
      <label className="height-slider__label" htmlFor="height-range">
        <StepNumber n={step} />
        {t.form.heightLabel}
        <span className="height-slider__optional">· {t.common.optional}</span>
      </label>
      <div className="height-slider__track-wrapper">
        <input
          id="height-range"
          type="range"
          min={130}
          max={210}
          step={1}
          value={value ?? 170}
          className="height-slider__input"
          onChange={(e) => onChange(Number(e.target.value))}
          aria-label={t.form.heightLabel}
          aria-valuenow={value ?? undefined}
          aria-valuemin={130}
          aria-valuemax={210}
        />
        <span className="height-slider__value">
          {value !== null ? `${(value / 100).toFixed(2).replace('.', ',')} ${t.form.heightUnit}` : '--'}
        </span>
      </div>
    </div>
  )
}
