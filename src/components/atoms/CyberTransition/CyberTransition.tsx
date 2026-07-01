import type { ReactNode } from 'react'
import './CyberTransition.css'

interface CyberTransitionProps {
  transitionKey: string | number
  effect?: 'scanIn' | 'slideUp' | 'glitch'
  // Cuando es true, el contenido ACTUAL (antes de que transitionKey cambie y
  // lo remonte) se desarma con un efecto glitch/aberración cromática en vez
  // de desaparecer de golpe.
  exiting?: boolean
  className?: string
  children: ReactNode
}

export function CyberTransition({
  transitionKey,
  children,
  effect = 'scanIn',
  exiting = false,
  className,
}: CyberTransitionProps) {
  return (
    <div
      key={transitionKey}
      data-effect={effect}
      className={['cyber-transition', exiting && 'cyber-transition--exiting', className].filter(Boolean).join(' ')}
    >
      {children}
    </div>
  )
}
