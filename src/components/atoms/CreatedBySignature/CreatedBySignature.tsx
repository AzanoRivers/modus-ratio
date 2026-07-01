import { NeonTextGlitch } from '../NeonTextGlitch'
import './CreatedBySignature.css'

const HIGHLIGHT_TOKEN = 'AzanoRivers'

interface CreatedBySignatureProps {
  label: string
  className?: string
}

export function CreatedBySignature({ label, className }: CreatedBySignatureProps) {
  const highlightIndex = label.indexOf(HIGHLIGHT_TOKEN)
  const hasHighlight = highlightIndex !== -1
  const prefix = hasHighlight ? label.slice(0, highlightIndex) : label
  const suffix = hasHighlight ? label.slice(highlightIndex + HIGHLIGHT_TOKEN.length) : ''

  return (
    <a
      href="https://azanorivers.com/"
      target="_blank"
      rel="noopener noreferrer"
      className={['created-by-signature', className].filter(Boolean).join(' ')}
    >
      {prefix}
      {hasHighlight && (
        <NeonTextGlitch
          text={HIGHLIGHT_TOKEN}
          color="blue"
          className="created-by-signature__highlight"
        />
      )}
      {suffix}
    </a>
  )
}
