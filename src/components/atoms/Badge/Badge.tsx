import { Info, AlertTriangle, XCircle, CheckCircle, X } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import './Badge.css'

const ICONS: Record<string, LucideIcon> = {
  info:    Info,
  warning: AlertTriangle,
  error:   XCircle,
  success: CheckCircle,
}

interface BadgeProps {
  variant: 'info' | 'warning' | 'error' | 'success'
  children: React.ReactNode
  className?: string
  role?: string
  id?: string
  onDismiss?: () => void
  dismissLabel?: string
}

export function Badge({ variant, children, className, role = 'note', id, onDismiss, dismissLabel }: BadgeProps) {
  const Icon = ICONS[variant]
  return (
    <div
      id={id}
      className={['badge', `badge--${variant}`, className].filter(Boolean).join(' ')}
      role={role}
    >
      <Icon className="badge__icon" aria-hidden="true" />
      <span className="badge__content">{children}</span>
      {onDismiss && (
        <button
          type="button"
          className="badge__dismiss"
          onClick={onDismiss}
          aria-label={dismissLabel}
        >
          <X className="badge__dismiss-icon" aria-hidden="true" />
        </button>
      )}
    </div>
  )
}
