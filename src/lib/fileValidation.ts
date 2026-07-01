export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/heic',
  'image/heif',
] as const

export type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number]

export const MAX_FILE_SIZE_BYTES = 10_485_760  // 10 MB

const MIME_TO_EXT: Record<AllowedMimeType, string> = {
  'image/jpeg': 'jpg',
  'image/png':  'png',
  'image/webp': 'webp',
  'image/gif':  'gif',
  'image/heic': 'heic',
  'image/heif': 'heif',
}

export function isAllowedMime(mime: string): mime is AllowedMimeType {
  return (ALLOWED_MIME_TYPES as readonly string[]).includes(mime)
}

export function getExtension(mime: AllowedMimeType): string {
  return MIME_TO_EXT[mime]
}
