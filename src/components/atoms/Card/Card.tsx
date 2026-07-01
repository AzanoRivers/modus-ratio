import type { ReactNode } from 'react'
import './Card.css'

interface CardProps {
  children: ReactNode
  variant?: 'default' | 'blue' | 'pink' | 'green'
  className?: string
}

export function Card({ children, variant = 'default', className }: CardProps) {
  return (
    <div className={['card', `card--${variant}`, className].filter(Boolean).join(' ')}>
      {children}
    </div>
  )
}
