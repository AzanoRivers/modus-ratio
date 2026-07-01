import { useState, useRef, useEffect } from 'react'
import { ImagePlus, RefreshCw, X } from 'lucide-react'
import type { Translations } from '@/i18n'
import { Badge, StepNumber } from '@/components/atoms'
import { ensureJpeg } from '@/lib/ensureJpeg'
import './Dropzone.css'

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
const ACCEPTED_EXTS = ['.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif']
const MAX_MB = 10

interface DropzoneProps {
  t: Translations
  step: number
  onFileSelected: (file: File | null) => void
  disabled?: boolean
  className?: string
}

export function Dropzone({ t, step, onFileSelected, disabled, className }: DropzoneProps) {
  const [dragActive, setDragActive] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [error, setError] = useState<'format' | 'size' | 'heic' | null>(null)
  const [converting, setConverting] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview)
    }
  }, [preview])

  function validate(file: File): 'format' | 'size' | null {
    const ext = `.${file.name.split('.').pop()?.toLowerCase() ?? ''}`
    const mimeOk = ACCEPTED_TYPES.includes(file.type)
    const extOk = ACCEPTED_EXTS.includes(ext)
    if (!mimeOk && !extOk) return 'format'
    if (file.size > MAX_MB * 1024 * 1024) return 'size'
    return null
  }

  async function handleFile(file: File) {
    const err = validate(file)
    if (err) {
      setError(err)
      setPreview(null)
      return
    }
    setError(null)

    // HEIC/HEIF (formato por defecto de la cámara de iPhone) no se puede
    // decodificar en un <img> salvo en Safari. Se convierte a JPEG antes de
    // generar la miniatura, y se usa esa misma versión convertida para todo
    // lo demás (evita convertir dos veces más adelante, antes del upload).
    setConverting(true)
    let fileToUse: File
    try {
      fileToUse = await ensureJpeg(file)
    } catch (e) {
      // heic2any no pudo decodificar este archivo (pasa con algunas variantes
      // de HEIC). No hay forma de mostrar una miniatura ni de que el servidor
      // de OpenAI lo procese sin convertir, así que se rechaza el archivo en
      // vez de dejar una miniatura vacía sin explicación.
      console.error('[Dropzone] HEIC conversion failed:', e)
      setConverting(false)
      setError('heic')
      setPreview(null)
      onFileSelected(null)
      return
    }
    setConverting(false)

    if (preview) URL.revokeObjectURL(preview)
    setPreview(URL.createObjectURL(fileToUse))
    onFileSelected(fileToUse)
  }

  function handleClear(e: React.MouseEvent) {
    e.stopPropagation()
    if (preview) URL.revokeObjectURL(preview)
    setPreview(null)
    setError(null)
    if (inputRef.current) inputRef.current.value = ''
    onFileSelected(null)
  }

  function handleChange(e: React.MouseEvent) {
    e.stopPropagation()
    inputRef.current?.click()
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragActive(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  const containerClasses = [
    'dropzone',
    dragActive && 'dropzone--drag-active',
    error && 'dropzone--error',
    disabled && 'dropzone--disabled',
    preview && 'dropzone--has-preview',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={['dropzone-wrapper', className].filter(Boolean).join(' ')}>
      <div
        className={containerClasses}
        onDragOver={(e) => {
          e.preventDefault()
          if (!disabled && !converting) setDragActive(true)
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={disabled || converting ? undefined : onDrop}
        onClick={disabled || converting || preview ? undefined : () => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_TYPES.join(',')}
          className="dropzone__input"
          onChange={onInputChange}
          disabled={disabled || converting}
          aria-label={t.form.dropzoneLabel}
        />

        {converting ? (
          <div className="dropzone__placeholder">
            <ImagePlus className="dropzone__icon dropzone__icon--converting" aria-hidden="true" />
            <span className="dropzone__label">{t.form.dropzoneConverting}</span>
          </div>
        ) : preview ? (
          <div className="dropzone__preview">
            <img
              src={preview}
              alt=""
              className="dropzone__image"
              onError={(e) => {
                ;(e.target as HTMLImageElement).classList.add('dropzone__image--error')
              }}
            />
            <div className="dropzone__overlay">
              <button
                className="dropzone__overlay-btn"
                onClick={handleChange}
                type="button"
                aria-label={t.form.dropzoneChange}
              >
                <RefreshCw className="dropzone__overlay-icon" aria-hidden="true" />
                {t.form.dropzoneChange}
              </button>
              <button
                className="dropzone__overlay-btn dropzone__overlay-btn--danger"
                onClick={handleClear}
                type="button"
                aria-label={t.form.dropzoneRemove}
              >
                <X className="dropzone__overlay-icon" aria-hidden="true" />
                {t.form.dropzoneRemove}
              </button>
            </div>
          </div>
        ) : (
          <div className="dropzone__placeholder">
            <ImagePlus className="dropzone__icon" aria-hidden="true" />
            <span className="dropzone__label">
              <StepNumber n={step} />
              {dragActive ? t.form.dropzoneDrag : t.form.dropzoneLabel}
            </span>
            <span className="dropzone__hint">{t.form.dropzoneHint}</span>
          </div>
        )}
      </div>

      {error && (
        <div className="dropzone__error-badge" onClick={(e) => e.stopPropagation()}>
          <Badge variant="error" onDismiss={() => setError(null)} dismissLabel={t.common.close}>
            {error === 'format'
              ? t.errors.imageFormat
              : error === 'heic'
                ? t.errors.imageHeicFailed
                : t.errors.imageSize}
          </Badge>
        </div>
      )}
    </div>
  )
}
