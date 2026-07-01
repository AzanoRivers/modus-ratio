import './ProcessingError.css'
import type { Translations } from '@/i18n'

type RejectionCode = keyof Translations['analysis']['rejectionReasons']

interface ProcessingErrorProps {
  errorCode: string | null
  t: {
    processingError:  Translations['analysis']['processingError']
    rejectionReasons: Translations['analysis']['rejectionReasons']
    rejectionCta:     string
  }
  onRetry:     () => void
  onUploadNew: () => void
}

function isRejectionCode(
  code: string | null,
  reasons: Translations['analysis']['rejectionReasons'],
): code is RejectionCode {
  return code !== null && code in reasons
}

export function ProcessingError({ errorCode, t, onRetry, onUploadNew }: ProcessingErrorProps) {
  const rejection = isRejectionCode(errorCode, t.rejectionReasons)
    ? t.rejectionReasons[errorCode]
    : null

  const content = rejection ?? t.processingError
  const cta     = rejection ? t.rejectionCta : t.processingError.cta
  const onClick = rejection ? onUploadNew : onRetry

  return (
    <div className="processing-error" role="alert">
      <p className="processing-error__title">{content.title}</p>
      <p className="processing-error__message">{content.message}</p>
      <button
        type="button"
        className="processing-error__cta"
        onClick={onClick}
      >
        {cta}
      </button>
    </div>
  )
}
