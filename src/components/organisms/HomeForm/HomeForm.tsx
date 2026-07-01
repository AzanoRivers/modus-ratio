import { useState, useCallback } from 'react'
import type { Translations } from '@/i18n'
import { useAppStore } from '@/store'
import type { FormParams } from '@/store'
import type { StyleOption } from '@/components/molecules/StyleSelector'
import type { SkinColor } from '@/components/molecules/SkinColorSelector'
import type { BuildValue } from '@/components/molecules/BuildSelector'
import type { GenderPref } from '@/components/molecules/GenderSelector'
import { Button, StepNumber } from '@/components/atoms'
import {
  BuildSelector,
  Dropzone,
  GenderSelector,
  HeightSlider,
  MathCaptcha,
  SkinColorSelector,
  StyleSelector,
} from '@/components/molecules'
import './HomeForm.css'

export type { FormParams, StyleOption, SkinColor, BuildValue, GenderPref }

interface HomeFormProps {
  t:        Translations
  onSubmit: () => void
  disabled: boolean
}

export function HomeForm({ t, onSubmit, disabled }: HomeFormProps) {
  const formParams    = useAppStore(state => state.formParams)
  const setFormParam  = useAppStore(state => state.setFormParam)
  const currentFile   = useAppStore(state => state.currentFile)
  const setCurrentFile = useAppStore(state => state.setCurrentFile)
  const canAnalyze    = useAppStore(state => state.canAnalyze)

  const [captchaValid, setCaptcha] = useState(false)

  const handleCaptchaChange = useCallback((valid: boolean) => {
    setCaptcha(valid)
  }, [])

  return (
    <div className="home-form__panel">
      <div className="home-form__body">
        <Dropzone t={t} step={1} onFileSelected={setCurrentFile} />
        <StyleSelector
          t={t}
          step={2}
          value={formParams.style}
          onChange={(v) => setFormParam('style', v)}
        />
        <section className="home-form__optional">
          <HeightSlider
            t={t}
            step={3}
            value={formParams.height}
            onChange={(v) => setFormParam('height', v)}
          />
          <SkinColorSelector
            t={t}
            step={4}
            value={formParams.skinColor}
            onChange={(v) => setFormParam('skinColor', v)}
          />
          <BuildSelector
            t={t}
            step={5}
            value={formParams.build}
            onChange={(v) => setFormParam('build', v)}
          />
        </section>
        <GenderSelector
          t={t}
          step={6}
          value={formParams.genderPref}
          onChange={(v) => setFormParam('genderPref', v)}
        />
        <p className="home-form__body-note">{t.form.genderNote}</p>
        <MathCaptcha t={t} step={7} onValidChange={handleCaptchaChange} />
        <Button
          variant="primary"
          type="button"
          disabled={disabled || !currentFile || !formParams.style || !captchaValid || !canAnalyze()}
          onClick={onSubmit}
          className="home-form__submit btn-beam"
        >
          <StepNumber n={8} />
          {t.home.analyzeButton}
        </Button>
      </div>
    </div>
  )
}
