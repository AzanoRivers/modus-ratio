import type { ReactNode, MouseEvent, KeyboardEvent } from 'react'
import { useState } from 'react'
import './CyberCardLink.css'

interface CyberCardLinkProps {
  href: string
  external?: boolean
  build?: boolean
  comingSoonLabel?: string
  className?: string
  children: ReactNode
}

export function CyberCardLink({
  href,
  external = false,
  build = false,
  comingSoonLabel,
  className,
  children,
}: CyberCardLinkProps) {
  const [flashing, setFlashing] = useState(false)
  const [resetting, setResetting] = useState(false)

  if (build) {
    function handleBuildClick(e: MouseEvent) {
      e.preventDefault()
      if (flashing) return
      setFlashing(true)
      setTimeout(() => {
        setFlashing(false)
        setResetting(true)
        setTimeout(() => setResetting(false), 420)
      }, 2000)
    }

    function handleKeyDown(e: KeyboardEvent<HTMLDivElement>) {
      if (e.key === 'Enter') {
        handleBuildClick(e as unknown as MouseEvent<HTMLDivElement>)
      }
    }

    return (
      <div
        role="button"
        tabIndex={0}
        onClick={handleBuildClick}
        onKeyDown={handleKeyDown}
        className={[
          'cyber-card-link',
          'cyber-card-link--build',
          flashing ? 'project-card--flash' : '',
          resetting ? 'project-card--reset' : '',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {children}
        {flashing && (
          <span className="cyber-card-link__coming-soon" aria-live="polite">
            {comingSoonLabel}
          </span>
        )}
      </div>
    )
  }

  return (
    <a
      href={href}
      target={external ? '_blank' : '_self'}
      rel="noopener noreferrer"
      className={['cyber-card-link', className].filter(Boolean).join(' ')}
    >
      {children}
    </a>
  )
}
