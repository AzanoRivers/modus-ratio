import type { APIRoute } from 'astro'
import { ok, err } from '@/lib/apiResponse'
import { isAllowedMime, MAX_FILE_SIZE_BYTES } from '@/lib/fileValidation'
import { generatePresignedPut } from '@/lib/presign'

interface PresignRequestBody {
  contentType:   string
  contentLength: number
}

function isValidBody(body: unknown): body is PresignRequestBody {
  return (
    typeof body === 'object' &&
    body !== null &&
    typeof (body as Record<string, unknown>).contentType === 'string' &&
    typeof (body as Record<string, unknown>).contentLength === 'number'
  )
}

export const POST: APIRoute = async ({ request }) => {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return err('INVALID_JSON', 'Request body is not valid JSON', 400)
  }

  if (!isValidBody(body)) {
    return err('BAD_REQUEST', 'Missing contentType or contentLength', 400)
  }

  const { contentType, contentLength } = body

  if (!isAllowedMime(contentType)) {
    return err('INVALID_MIME_TYPE', 'File type not allowed', 415)
  }

  if (contentLength > MAX_FILE_SIZE_BYTES) {
    return err('FILE_TOO_LARGE', 'File exceeds maximum size of 10 MB', 413)
  }

  let result: { presignedUrl: string; objectKey: string }
  try {
    result = await generatePresignedPut(contentType)
  } catch {
    return err('R2_UPLOAD_FAILED', 'Could not generate upload URL', 502)
  }

  return ok(result)
}
