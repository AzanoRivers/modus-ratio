import './NeonBreakLine.css'

interface NeonBreakLineProps {
  color?: 'blue' | 'pink' | 'both'
  opacity?: number
  orientation?: 'horizontal' | 'vertical'
  className?: string
}

export function NeonBreakLine({
  color = 'blue',
  opacity = 0.6,
  orientation = 'horizontal',
  className,
}: NeonBreakLineProps) {
  return (
    <span
      className={[
        'neon-break-line',
        `neon-break-line--${color}`,
        `neon-break-line--${orientation}`,
        className,
      ].filter(Boolean).join(' ')}
      style={{ '--nbl-opacity': opacity } as React.CSSProperties}
      aria-hidden="true"
    />
  )
}
