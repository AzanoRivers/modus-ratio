import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
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
  const scrollRef = useRef<HTMLDivElement>(null)
  // canScrollRight arranca en true (optimista): con 6 swatches casi siempre
  // hay overflow en mobile, y así la marca aparece desde el primer render en
  // vez de esperar al primer cálculo del efecto tras hidratar.
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return

    const updateHints = () => {
      setCanScrollLeft(el.scrollLeft > 4)
      setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4)
    }

    updateHints()
    el.addEventListener('scroll', updateHints, { passive: true })
    window.addEventListener('resize', updateHints)
    return () => {
      el.removeEventListener('scroll', updateHints)
      window.removeEventListener('resize', updateHints)
    }
  }, [])

  return (
    <div className={['skin-color-selector', className].filter(Boolean).join(' ')}>
      <span className="skin-color-selector__label">
        <StepNumber n={step} />
        {t.form.skinColorLabel}
        <span className="skin-color-selector__optional">· {t.common.optional}</span>
      </span>
      <div className="skin-color-selector__scroll-wrap">
        <ChevronLeft
          className={[
            'skin-color-selector__scroll-hint',
            'skin-color-selector__scroll-hint--left',
            canScrollLeft && 'skin-color-selector__scroll-hint--visible',
          ].filter(Boolean).join(' ')}
          aria-hidden="true"
        />
        <div
          ref={scrollRef}
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
        <ChevronRight
          className={[
            'skin-color-selector__scroll-hint',
            'skin-color-selector__scroll-hint--right',
            canScrollRight && 'skin-color-selector__scroll-hint--visible',
          ].filter(Boolean).join(' ')}
          aria-hidden="true"
        />
      </div>
    </div>
  )
}
