import type { Translations } from '@/i18n'
import './GenderCheckbox.css'

interface GenderCheckboxProps {
  t: Translations
  checked: boolean
  onChange: (checked: boolean) => void
  className?: string
}

export function GenderCheckbox({ t, checked, onChange, className }: GenderCheckboxProps) {
  return (
    <div className={['gender-checkbox', className].filter(Boolean).join(' ')}>
      <label className="gender-checkbox__label">
        <input
          type="checkbox"
          className="gender-checkbox__input"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span className="gender-checkbox__text">
          {t.form.genderLabel}
          <span className="gender-checkbox__optional">({t.form.genderOptional})</span>
        </span>
      </label>
      <p className="gender-checkbox__note">{t.form.genderNote}</p>
    </div>
  )
}
