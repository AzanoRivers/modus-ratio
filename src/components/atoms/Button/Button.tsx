import type { ReactNode } from 'react'
import './Button.css'

interface ButtonProps {
  variant?: 'primary' | 'secondary'
  disabled?: boolean
  loading?: boolean
  type?: 'button' | 'submit'
  onClick?: () => void
  children: ReactNode
  className?: string
}

export function Button({
  variant = 'primary',
  disabled,
  loading,
  type = 'button',
  onClick,
  children,
  className,
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={['button', `button--${variant}`, loading && 'button--loading', className]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </button>
  )
}
