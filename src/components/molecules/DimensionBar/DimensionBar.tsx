import { Info } from 'lucide-react'
import './DimensionBar.css'
import { Tooltip } from '@/components/atoms'

interface DimensionBarProps {
  label:       string
  description: string
  score:       number
  detail:      string
  index?:      number
}

export function DimensionBar({ label, description, score, detail, index = 0 }: DimensionBarProps) {
  const tier = score >= 70 ? 'green' : score >= 40 ? 'yellow' : 'red'

  return (
    <div className="dimension-bar">
      <div className="dimension-bar__header">
        <span className="dimension-bar__label-group">
          <span className="dimension-bar__label">{label}</span>
          <Tooltip content={description}>
            <Info className="dimension-bar__info-icon" aria-hidden="true" />
          </Tooltip>
        </span>
        <span className="dimension-bar__score">{score}</span>
      </div>
      <div className="dimension-bar__track">
        <div
          className={`dimension-bar__fill dimension-bar--${tier}`}
          style={{ '--score': score, '--i': index } as React.CSSProperties}
        />
      </div>
      <p className={`dimension-bar__detail dimension-bar__detail--${tier}`}>{detail}</p>
    </div>
  )
}
