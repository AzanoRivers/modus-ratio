import './UsageLimitMessage.css'
import { useEffect, useState } from 'react'

interface UsageLimitMessageProps {
  title:          string
  body:           string
  resetsAtLabel:  string
  minutesLabel:   string
  resetAt:        number | null
}

export function UsageLimitMessage({ title, body, resetsAtLabel, minutesLabel, resetAt }: UsageLimitMessageProps) {
  const [minutesLeft, setMinutesLeft] = useState<number | null>(calcMinutes(resetAt))

  useEffect(() => {
    setMinutesLeft(calcMinutes(resetAt))
    const interval = setInterval(() => {
      setMinutesLeft(calcMinutes(resetAt))
    }, 30_000)
    return () => clearInterval(interval)
  }, [resetAt])

  return (
    <div className="usage-limit-message" role="alert">
      <p className="usage-limit-message__title">{title}</p>
      <p className="usage-limit-message__body">{body}</p>
      {minutesLeft !== null && minutesLeft > 0 && (
        <p className="usage-limit-message__countdown">
          {resetsAtLabel}{' '}
          <span className="usage-limit-message__minutes">
            {minutesLeft} {minutesLabel}
          </span>
        </p>
      )}
    </div>
  )
}

function calcMinutes(resetAtMs: number | null): number | null {
  if (!resetAtMs) return null
  const diff = resetAtMs - Date.now()
  return diff <= 0 ? null : Math.ceil(diff / 60_000)
}
