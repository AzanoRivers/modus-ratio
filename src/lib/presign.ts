import { PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { r2 } from '@/lib/r2'
import { env } from '@/lib/env'
import { getExtension, type AllowedMimeType } from '@/lib/fileValidation'

export interface PresignResult {
  presignedUrl: string
  objectKey:    string
}

export async function generatePresignedPut(
  contentType: AllowedMimeType,
): Promise<PresignResult> {
  const date      = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const uuid      = crypto.randomUUID()
  const ext       = getExtension(contentType)
  const objectKey = `uploads/${date}/${uuid}.${ext}`

  const command = new PutObjectCommand({
    Bucket:      env.r2.bucketName,
    Key:         objectKey,
    ContentType: contentType,
  })

  const presignedUrl = await getSignedUrl(r2, command, { expiresIn: 300 })

  return { presignedUrl, objectKey }
}
