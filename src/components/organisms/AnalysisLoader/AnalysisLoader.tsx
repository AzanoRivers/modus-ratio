import { useEffect, useMemo, useState } from 'react'
import './AnalysisLoader.css'
import { useAppStore } from '@/store'
import { LOADER_EMOJIS } from '@/lib/loaderEmojis'
import type { Translations } from '@/i18n'

interface AnalysisLoaderProps {
  t: Translations['loader']
}

const MESSAGE_INTERVAL_MS = 7000
const PARTICLE_COUNT = 10

interface Particle {
  id: number
  emoji: string
  angle: number
  distance: number
  duration: number
  delay: number
}

function shuffle<T>(items: T[]): T[] {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

function buildParticles(emojiPool: string[]): Particle[] {
  return Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
    id: i,
    emoji: emojiPool[Math.floor(Math.random() * emojiPool.length)],
    angle: Math.random() * 360,
    distance: 70 + Math.random() * 60,
    duration: 2.6 + Math.random() * 1.6,
    delay: Math.random() * 3.2,
  }))
}

export function AnalysisLoader({ t }: AnalysisLoaderProps) {
  const phase          = useAppStore((s) => s.phase)
  const uploadProgress = useAppStore((s) => s.uploadProgress)
  const style           = useAppStore((s) => s.formParams.style)

  const progress = uploadProgress / 100

  const statusLabel =
    phase === 'analyzing'
      ? t.analyzing
      : uploadProgress >= 90
        ? t.almostDone
        : t.uploading

  // Mensajes propios del estilo elegido + genéricos, barajados una sola vez
  // por sesión de carga (no en cada render: reordenar en cada tick del
  // progreso de subida haría que el mensaje visible saltara sin sentido).
  const messagePool = useMemo(() => {
    const styleMessages = style ? t.messages.byStyle[style] : []
    return shuffle([...t.messages.generic, ...styleMessages])
  }, [style, t.messages])

  const [msgIndex, setMsgIndex] = useState(0)

  useEffect(() => {
    const interval = window.setInterval(() => {
      setMsgIndex((i) => (i + 1) % messagePool.length)
    }, MESSAGE_INTERVAL_MS)
    return () => window.clearInterval(interval)
  }, [messagePool.length])

  const particles = useMemo(() => {
    const emojiPool = [...LOADER_EMOJIS.generic, ...(style ? LOADER_EMOJIS[style] : [])]
    return buildParticles(emojiPool)
  }, [style])

  return (
    <div className="analysis-loader">
      <div className="analysis-loader__emoji-field" aria-hidden="true">
        {particles.map((p) => (
          <span
            key={p.id}
            className="analysis-loader__emoji"
            style={{
              '--angle':    `${p.angle}deg`,
              '--distance': `${p.distance}px`,
              '--duration': `${p.duration}s`,
              '--delay':    `${p.delay}s`,
            } as React.CSSProperties}
          >
            {p.emoji}
          </span>
        ))}
      </div>

      <div className="analysis-loader__content">
        <p key={msgIndex} className="analysis-loader__message">
          {messagePool[msgIndex]}
        </p>
        <p className="analysis-loader__status">{statusLabel}</p>
        <div className="analysis-loader__progress-track">
          <div
            className={[
              'analysis-loader__progress-fill',
              phase === 'analyzing' && 'analysis-loader__progress-fill--indeterminate',
            ].filter(Boolean).join(' ')}
            style={{ '--progress': progress } as React.CSSProperties}
          />
        </div>
      </div>
    </div>
  )
}
