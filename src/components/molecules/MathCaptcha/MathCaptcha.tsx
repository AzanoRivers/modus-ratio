import { useState, useEffect, useRef, useCallback } from 'react'
import type { Translations } from '@/i18n'
import { StepNumber } from '@/components/atoms'
import './MathCaptcha.css'

const DIGIT_W       = 44
const DIGIT_H       = 56
const FONT          = 'bold 28px "Courier New", monospace'
const CANVAS_BG     = '#041528'
const CANVAS_BORDER = '#04e9cf'
const CANVAS_DIGIT  = '#0bd2ff'
const CANVAS_GLOW   = 'rgba(4, 233, 207, 0.4)'
const CANVAS_LINES  = 'rgba(11, 210, 255, 0.03)'

function randomDigit(): number {
  return Math.floor(Math.random() * 9) + 1
}

function drawDigit(canvas: HTMLCanvasElement, digit: number): void {
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  canvas.width  = DIGIT_W
  canvas.height = DIGIT_H

  ctx.fillStyle = CANVAS_BG
  ctx.fillRect(0, 0, DIGIT_W, DIGIT_H)

  ctx.strokeStyle = CANVAS_BORDER
  ctx.lineWidth   = 1.5
  ctx.strokeRect(1, 1, DIGIT_W - 2, DIGIT_H - 2)

  ctx.fillStyle = CANVAS_LINES
  for (let y = 0; y < DIGIT_H; y += 4) {
    ctx.fillRect(0, y, DIGIT_W, 2)
  }

  const jitter = (Math.random() - 0.5) * 4

  ctx.font         = FONT
  ctx.textAlign    = 'center'
  ctx.textBaseline = 'middle'

  ctx.fillStyle = CANVAS_GLOW
  ctx.fillText(String(digit), DIGIT_W / 2 + jitter + 1.5, DIGIT_H / 2 + 1.5)

  ctx.fillStyle = CANVAS_DIGIT
  ctx.fillText(String(digit), DIGIT_W / 2 + jitter, DIGIT_H / 2)
}

interface MathCaptchaProps {
  t: Translations
  step: number
  onValidChange: (valid: boolean) => void
}

export function MathCaptcha({ t, step, onValidChange }: MathCaptchaProps) {
  const [a, setA]         = useState<number>(randomDigit)
  const [b, setB]         = useState<number>(randomDigit)
  const [answer, setAnswer] = useState('')
  const canvasA           = useRef<HTMLCanvasElement>(null)
  const canvasB           = useRef<HTMLCanvasElement>(null)

  const draw = useCallback(() => {
    if (canvasA.current) drawDigit(canvasA.current, a)
    if (canvasB.current) drawDigit(canvasB.current, b)
  }, [a, b])

  useEffect(() => { draw() }, [draw])

  const numAnswer = answer !== '' ? Number(answer) : NaN
  const isValid   = answer !== '' && numAnswer === a + b
  const isError   = answer !== '' && numAnswer !== a + b

  useEffect(() => {
    onValidChange(isValid)
  }, [isValid, onValidChange])

  function refresh() {
    setA(randomDigit())
    setB(randomDigit())
    setAnswer('')
    onValidChange(false)
  }

  const inputClass = [
    'math-captcha__input',
    isError && 'math-captcha__input--error',
    isValid && 'math-captcha__input--valid',
  ].filter(Boolean).join(' ')

  return (
    <div className="math-captcha">
      <span className="math-captcha__label">
        <StepNumber n={step} />
        {t.form.captchaLabel}
      </span>
      <p className="math-captcha__hint">{t.form.captchaHint}</p>
      <div className="math-captcha__row">
        <canvas
          ref={canvasA}
          width={DIGIT_W}
          height={DIGIT_H}
          className="math-captcha__canvas"
          aria-hidden="true"
        />
        <span className="math-captcha__op" aria-hidden="true">+</span>
        <canvas
          ref={canvasB}
          width={DIGIT_W}
          height={DIGIT_H}
          className="math-captcha__canvas"
          aria-hidden="true"
        />
        <span className="math-captcha__op" aria-hidden="true">=</span>
        <input
          type="number"
          inputMode="numeric"
          min={2}
          max={18}
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="?"
          aria-label={t.form.captchaLabel}
          className={inputClass}
        />
        <button
          type="button"
          onClick={refresh}
          aria-label={t.form.captchaRefresh}
          className="math-captcha__refresh"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <polyline points="23 4 23 10 17 10" />
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
          </svg>
        </button>
      </div>
    </div>
  )
}
