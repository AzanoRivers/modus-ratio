import { useState, useEffect, useRef } from 'react'
import {
  X,
  FolderOpen,
  FlaskConical,
  TrendingUp,
  Shield,
  Layers,
  Gamepad,
  MapPin,
  Sprout,
  MessageSquare,
  Shirt,
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
  Shirt,
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
  ctaLabel: string
  comingSoonLabel: string
  closeLabel: string
  projects: OtherProjectItem[]
  labProjects: OtherProjectItem[]
}

export function OtherProjectsPanel({
  label,
  labLabel,
  comingSoonLabel,
  closeLabel,
  projects,
  labProjects,
}: OtherProjectsPanelProps) {
  const [open, setOpen] = useState(false)
  const [labOpen, setLabOpen] = useState(false)
  const [footerVisible, setFooterVisible] = useState(false)
  const [isLg, setIsLg] = useState(false)
  const [isXl, setIsXl] = useState(false)
  const [mounted, setMounted] = useState(false)
  const panelRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const check = () => {
      setIsLg(window.innerWidth >= 440)
      setIsXl(window.innerWidth >= 600) // debe coincidir con --breakpoint-xl de globals.css
    }
    check()
    setMounted(true)
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

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

  const footerOffset = footerVisible ? 56 : 0
  const isInternal = true
  const useMobileBottom = mounted && !isXl
  const baseOtros = isLg ? 28 : 16
  const baseLab = isLg ? 60 : 48

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
          className={`opp__btn opp__btn--pink ${useMobileBottom ? 'opp__btn--bottom' : ''}`}
          style={useMobileBottom
            ? { '--opp-offset': `${baseLab + footerOffset}px` } as React.CSSProperties
            : undefined}
        >
          <FlaskConical className="opp__btn-icon" />
          {labLabel}
        </button>
      )}

      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`opp__btn opp__btn--blue ${useMobileBottom ? 'opp__btn--bottom' : ''}`}
        style={useMobileBottom
          ? { '--opp-offset': `${baseOtros + footerOffset}px` } as React.CSSProperties
          : undefined}
      >
        <FolderOpen className="opp__btn-icon" />
        {label}
      </button>

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
