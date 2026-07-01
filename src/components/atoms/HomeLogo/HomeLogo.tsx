import './HomeLogo.css'

interface HomeLogoProps {
  className?: string
}

export function HomeLogo({ className }: HomeLogoProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      className={['home-logo', className].filter(Boolean).join(' ')}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="homeLogoGrad" gradientUnits="userSpaceOnUse" x1="2" y1="2" x2="22" y2="22">
          <stop offset="0%" stopColor="#0BD2FF" />
          <stop offset="50%" stopColor="#B366FF" />
          <stop offset="100%" stopColor="#FF69B4" />
        </linearGradient>
        <filter id="homeLogoGlow" x="-25%" y="-25%" width="150%" height="150%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="0.6" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <g
        filter="url(#homeLogoGlow)"
        stroke="url(#homeLogoGrad)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="6" cy="6" r="3" />
        <circle cx="6" cy="18" r="3" />
        <path d="M8.12 8.12 12 12" />
        <path d="M20 4 8.12 15.88" />
        <path d="M14.8 14.8 20 20" />
      </g>
    </svg>
  )
}
