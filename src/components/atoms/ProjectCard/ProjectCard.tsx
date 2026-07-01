import type { LucideIcon } from 'lucide-react'
import { CyberCardLink } from '../CyberCardLink'
import './ProjectCard.css'

export interface ProjectCardProps {
  href: string
  title: string
  description?: string
  icon: LucideIcon
  accent?: 'blue' | 'green' | 'pink'
  tag?: string
  ctaLabel: string
  comingSoonLabel?: string
  scanlines?: boolean
  external?: boolean
  build?: boolean
}

export function ProjectCard({
  href,
  title,
  description,
  icon: Icon,
  accent = 'blue',
  tag,
  ctaLabel,
  comingSoonLabel,
  scanlines = true,
  external = false,
  build = false,
}: ProjectCardProps) {
  const accentClass =
    accent === 'green'
      ? 'project-card--green'
      : accent === 'pink'
        ? 'project-card--pink'
        : ''

  return (
    <CyberCardLink
      href={href}
      external={external}
      build={build}
      comingSoonLabel={comingSoonLabel}
      className={[
        'project-card',
        accentClass,
        scanlines ? 'project-card--scanlines' : '',
        'relative flex flex-col cursor-pointer select-none no-underline',
        'p-2.5 gap-1.5 md:p-3 md:gap-1.75 xl:p-4 xl:gap-2',
        'transition-colors duration-300',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {tag && <span className="project-card__tag">// {tag}</span>}

      <div className="project-card__row">
        <Icon className="project-card__icon shrink-0" aria-hidden="true" />
        <div className="project-card__text">
          <span className="project-card__title">{title}</span>
          {description && <span className="project-card__desc">{description}</span>}
        </div>
      </div>

      {!build && (
        <div className="project-card__cta" aria-hidden="true">
          <span>{ctaLabel}</span>
          <span>──►</span>
        </div>
      )}
    </CyberCardLink>
  )
}
