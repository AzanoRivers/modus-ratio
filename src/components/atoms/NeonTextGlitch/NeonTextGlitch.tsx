import './NeonTextGlitch.css'

interface NeonTextGlitchProps {
  text: string
  className?: string
  color?: 'pink' | 'blue' | 'green'
}

export function NeonTextGlitch({ text, className = '', color = 'pink' }: NeonTextGlitchProps) {
  return (
    <span
      className={`neon-text-glitch neon-text-glitch--${color} ${className}`}
      data-glitch-text={text}
    >
      {text}
    </span>
  )
}
