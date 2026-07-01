import './Skeleton.css'

interface SkeletonProps {
  variant?: 'text' | 'block' | 'bar' | 'card'
  className?: string
}

export function Skeleton({ variant = 'block', className }: SkeletonProps) {
  return (
    <div
      className={['skeleton', `skeleton--${variant}`, className].filter(Boolean).join(' ')}
      aria-hidden="true"
    />
  )
}
