import './AzanoLabsLogo.css'

interface AzanoLabsLogoProps {
  label: string
  alt:   string
}

export function AzanoLabsLogo({ label, alt }: AzanoLabsLogoProps) {
  return (
    <a href="https://azanolabs.com" className="az-logo__wrap" aria-label={label}>
      <img
        src="/images/og-azanolabs-comp.png"
        alt={alt}
        className="az-logo__img"
      />
    </a>
  )
}
