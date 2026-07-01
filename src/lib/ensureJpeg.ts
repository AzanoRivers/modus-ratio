export async function ensureJpeg(file: File): Promise<File> {
  if (!isHeic(file)) return file

  const { default: heic2any } = await import('heic2any')

  const result = await heic2any({
    blob:    file,
    toType:  'image/jpeg',
    quality: 0.92,
  })

  const blob     = Array.isArray(result) ? result[0] : result
  const baseName = file.name.replace(/\.(heic|heif)$/i, '')

  return new File([blob], `${baseName}.jpg`, { type: 'image/jpeg' })
}

function isHeic(file: File): boolean {
  if (file.type === 'image/heic' || file.type === 'image/heif') return true
  // Fallback por extensión: iOS a veces reporta type vacío en archivos HEIC
  const ext = file.name.split('.').pop()?.toLowerCase()
  return ext === 'heic' || ext === 'heif'
}
