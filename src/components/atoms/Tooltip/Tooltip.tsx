import { useId } from 'react'
import type { ReactNode } from 'react'
import './Tooltip.css'

interface TooltipProps {
  content: string
  children: ReactNode
}

export function Tooltip({ content, children }: TooltipProps) {
  const id = useId()

  return (
    <span className="tooltip">
      <span className="tooltip__trigger" tabIndex={0} aria-describedby={id}>
        {children}
      </span>
      <span className="tooltip__bubble" role="tooltip" id={id}>
        {content}
      </span>
    </span>
  )
}
