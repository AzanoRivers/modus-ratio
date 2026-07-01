import { DeleteObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3'
import { r2 } from './r2'
import { env } from './env'

const ORPHAN_AGE_MS = 15 * 60 * 1000

export async function deleteR2Object(objectKey: string): Promise<void> {
  try {
    await r2.send(new DeleteObjectCommand({
      Bucket: env.r2.bucketName,
      Key:    objectKey,
    }))
  } catch (e) {
    console.error('[r2] deleteR2Object failed for key:', objectKey, e)
  }
}

export async function cleanupOrphanUploads(now: number = Date.now()): Promise<number> {
  let deleted = 0
  try {
    const list = await r2.send(new ListObjectsV2Command({
      Bucket: env.r2.bucketName,
      Prefix: 'uploads/',
    }))
    const objects = list.Contents ?? []
    for (const obj of objects) {
      if (!obj.Key || !obj.LastModified) continue
      const age = now - obj.LastModified.getTime()
      if (age < ORPHAN_AGE_MS) continue
      try {
        await r2.send(new DeleteObjectCommand({
          Bucket: env.r2.bucketName,
          Key:    obj.Key,
        }))
        deleted++
      } catch (e) {
        console.error('[r2] orphan cleanup failed for', obj.Key, e)
      }
    }
  } catch (e) {
    console.error('[r2] cleanupOrphanUploads failed:', e)
  }
  return deleted
}
