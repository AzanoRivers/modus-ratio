import { useState, useEffect, useRef } from 'react'
import {
  X,
  FolderOpen,
  FlaskConical,
  Heart,
  Mail,
  TrendingUp,
  Shield,
  Layers,
  Gamepad,
  MapPin,
  Sprout,
  MessageSquare,
  Scissors,
  Cpu,
  type LucideIcon,
} from 'lucide-react'
import { ProjectCard } from '@/components/atoms'
import type { ProjectCardProps } from '@/components/atoms'
import './OtherProjectsPanel.css'

const ICON_MAP: Record<string, LucideIcon> = {
  TrendingUp,
  Shield,
  Layers,
  Gamepad,
  MapPin,
  Sprout,
  MessageSquare,
  Scissors,
  Cpu,
}

export interface OtherProjectItem {
  href: string
  title: string
  description: string
  iconKey: string
  accent: 'blue' | 'green' | 'pink' | 'purple'
  tag: string
  ctaLabel: string
  build?: boolean
  comingSoonLabel?: string
  external?: boolean
}

interface OtherProjectsPanelProps {
  label: string
  labLabel: string
  payLabel: string
  contactLabel: string
  ctaLabel: string
  comingSoonLabel: string
  closeLabel: string
  projects: OtherProjectItem[]
  labProjects: OtherProjectItem[]
}

export function OtherProjectsPanel({
  label,
  labLabel,
  payLabel,
  contactLabel,
  comingSoonLabel,
  closeLabel,
  projects,
  labProjects,
}: OtherProjectsPanelProps) {
  const [open, setOpen] = useState(false)
  const [labOpen, setLabOpen] = useState(false)
  const [footerVisible, setFooterVisible] = useState(false)
  const panelRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const footer = document.getElementById('site-footer')
    if (!footer) return
    const observer = new IntersectionObserver(
      ([entry]) => setFooterVisible(entry.isIntersecting),
      { threshold: 0.01 },
    )
    observer.observe(footer)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!open && !labOpen) return
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [open, labOpen])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        setLabOpen(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const isInternal = true
  // The only genuinely runtime-only value: whether the footer is currently
  // scrolled into view. Its default (not visible, correct before any scroll)
  // is safe to apply unconditionally, see the CSS file's own comment.
  const offsetStyle = { '--opp-offset': `${footerVisible ? 56 : 0}px` } as React.CSSProperties

  const renderCard = (p: OtherProjectItem) => {
    const Icon = ICON_MAP[p.iconKey] ?? Layers
    const props: ProjectCardProps = {
      href: p.href,
      title: p.title,
      description: p.description,
      icon: Icon,
      accent: p.accent,
      tag: p.tag,
      ctaLabel: p.ctaLabel,
      build: p.build,
      comingSoonLabel: p.build ? p.comingSoonLabel ?? comingSoonLabel : undefined,
      external: p.external,
    }
    return <ProjectCard key={p.tag} {...props} />
  }

  return (
    <>
      {isInternal && (
        <button
          type="button"
          onClick={() => setLabOpen(true)}
          className="opp__btn opp__btn--pink"
          style={offsetStyle}
        >
          <FlaskConical className="opp__btn-icon" />
          {labLabel}
        </button>
      )}

      <button
        type="button"
        onClick={() => setOpen(true)}
        className="opp__btn opp__btn--blue"
        style={offsetStyle}
      >
        <FolderOpen className="opp__btn-icon" />
        {label}
      </button>

      {/* Central de Pagos: external link, opens support.azanolabs.com in a new
          tab. Always visible, this project's design is treated as an
          AzanoLabs internal page. Stays "top" at every breakpoint (unlike
          Otros proyectos/Laboratorio, which default to bottom-anchored via
          CSS on mobile/tablet, see `.opp__btn--blue`/`.opp__btn--pink` in
          the stylesheet), its own top value shifts via CSS media
          query instead (near the top on mobile, since Otros
          proyectos/Laboratorio vacate to the bottom there; stacked below
          Otros proyectos on desktop). */}
      <a
        href="https://support.azanolabs.com"
        target="_blank"
        rel="noopener noreferrer"
        className="opp__btn opp__btn--yellow"
      >
        <Heart className="opp__btn-icon" />
        {payLabel}
      </a>

      {/* Contacto: this project has no /contact page of its own, so this
          links out to azanolabs.com/contact (same external-link precedent
          as "Central de Pagos" above), stacked one slot below it at every
          breakpoint (same +2rem/32px increment the other buttons use).
          Icon-only on mobile (label hidden via the `.opp__btn-label` media
          query), icon + label on desktop, matching the same behavior as the
          AzanoLabs internal pages this project's design is treated as. */}
      <a
        href="https://azanolabs.com/contact"
        target="_blank"
        rel="noopener noreferrer"
        className="opp__btn opp__btn--purple"
      >
        <Mail className="opp__btn-icon" />
        <span className="opp__btn-label">{contactLabel}</span>
      </a>

      <div
        onClick={() => {
          setOpen(false)
          setLabOpen(false)
        }}
        aria-hidden="true"
        className={`opp__overlay ${open || labOpen ? 'opp__overlay--active' : ''}`}
      />

      <aside
        ref={panelRef}
        className={`opp__sidebar opp__sidebar--pink ${labOpen ? 'opp__sidebar--open' : ''}`}
      >
        <div className="opp__sidebar-header opp__sidebar-header--pink">
          <div className="opp__sidebar-title">
            <FlaskConical className="opp__sidebar-title-icon opp__sidebar-title-icon--pink" />
            <span className="opp__sidebar-title-text opp__sidebar-title-text--pink">
              {labLabel}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setLabOpen(false)}
            className="opp__close"
            aria-label={closeLabel}
          >
            <X className="opp__close-icon" />
          </button>
        </div>
        <div className="opp__sidebar-body">{labProjects.map(renderCard)}</div>
        <div className="opp__sidebar-divider opp__sidebar-divider--pink" />
      </aside>

      <aside
        className={`opp__sidebar opp__sidebar--blue ${open ? 'opp__sidebar--open' : ''}`}
      >
        <div className="opp__sidebar-header opp__sidebar-header--blue">
          <div className="opp__sidebar-title">
            <FolderOpen className="opp__sidebar-title-icon opp__sidebar-title-icon--blue" />
            <span className="opp__sidebar-title-text opp__sidebar-title-text--blue">
              {label}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="opp__close"
            aria-label={closeLabel}
          >
            <X className="opp__close-icon" />
          </button>
        </div>
        <div className="opp__sidebar-body">{projects.map(renderCard)}</div>
        <div className="opp__sidebar-divider opp__sidebar-divider--blue" />
      </aside>
    </>
  )
}
