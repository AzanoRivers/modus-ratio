import './StepNumber.css'

interface StepNumberProps {
  n: number
}

export function StepNumber({ n }: StepNumberProps) {
  return (
    <span className="step-number" aria-hidden="true">
      {n}
    </span>
  )
}
