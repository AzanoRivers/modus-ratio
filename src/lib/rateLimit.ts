import { redis } from '@/lib/redis'

const USAGE_LIMIT      = 25
const USAGE_WINDOW_MS  = 60 * 60 * 1000
const USAGE_WINDOW_SEC = 60 * 60
const BAN_TTL_SEC      = 60 * 60 * 24
const BAN_MULTIPLIER   = 3

const USAGE_KEY = (ip: string) => `modusratio:usage:${ip}`
const BAN_KEY   = (ip: string) => `modusratio:ip:${ip}:banned`

// Bloqueo por abuso de imágenes rechazadas (fotos de perros, objetos, etc.
// enviadas a propósito). Independiente del límite de 25/hora y del ban de
// seguridad: 3 rechazos en 10 minutos bloquean 15 minutos.
const REJECTION_KEY       = (ip: string) => `modusratio:rejections:${ip}`
const REJECT_BLOCK_KEY    = (ip: string) => `modusratio:ip:${ip}:reject-blocked`
const REJECTION_THRESHOLD = 3
const REJECTION_WINDOW_MS = 10 * 60 * 1000
const REJECT_BLOCK_TTL_SEC = 15 * 60

export interface UsageStatus {
  allowed:   boolean
  remaining: number
  resetAt:   number | null
  shouldBan: boolean
}

const FAIL_OPEN_STATUS: UsageStatus = {
  allowed:   true,
  remaining: USAGE_LIMIT,
  resetAt:   null,
  shouldBan: false,
}

export async function checkUsage(ip: string): Promise<UsageStatus> {
  try {
    const now = Date.now()
    const windowStart = now - USAGE_WINDOW_MS
    const key = USAGE_KEY(ip)

    await redis.zremrangebyscore(key, '-inf', windowStart)

    const oldest = await redis.zrange(key, 0, 0, 'WITHSCORES')
    const count  = await redis.zcard(key)

    const resetAt = oldest.length >= 2
      ? parseInt(oldest[1]) + USAGE_WINDOW_MS
      : null

    return {
      allowed:   count < USAGE_LIMIT,
      remaining: Math.max(0, USAGE_LIMIT - count),
      resetAt,
      shouldBan: count > USAGE_LIMIT * BAN_MULTIPLIER,
    }
  } catch (e) {
    console.error('[rateLimit] checkUsage failed:', e)
    return FAIL_OPEN_STATUS
  }
}

export async function recordUsage(ip: string): Promise<void> {
  try {
    const now = Date.now()
    const key = USAGE_KEY(ip)
    await redis.zadd(key, now, String(now))
    await redis.expire(key, USAGE_WINDOW_SEC)
  } catch (e) {
    console.error('[rateLimit] recordUsage failed:', e)
  }
}

export async function banIP(ip: string): Promise<void> {
  try {
    await redis.set(BAN_KEY(ip), '1', 'EX', BAN_TTL_SEC)
  } catch (e) {
    console.error('[rateLimit] banIP failed:', e)
  }
}

export async function isBanned(ip: string): Promise<boolean> {
  try {
    const result = await redis.exists(BAN_KEY(ip))
    return result === 1
  } catch (e) {
    console.error('[rateLimit] isBanned failed:', e)
    return false
  }
}

export interface RejectionBlockStatus {
  blocked: boolean
  resetAt: number | null
}

export async function isRejectionBlocked(ip: string): Promise<RejectionBlockStatus> {
  try {
    const ttl = await redis.ttl(REJECT_BLOCK_KEY(ip))
    if (ttl > 0) {
      return { blocked: true, resetAt: Date.now() + ttl * 1000 }
    }
    return { blocked: false, resetAt: null }
  } catch (e) {
    console.error('[rateLimit] isRejectionBlocked failed:', e)
    return { blocked: false, resetAt: null }
  }
}

// Se llama cuando el pipeline determina que la imagen fue rechazada (no en
// fallos técnicos). Si se acumulan REJECTION_THRESHOLD rechazos dentro de la
// ventana, activa el bloqueo de REJECT_BLOCK_TTL_SEC.
export async function recordRejection(ip: string): Promise<void> {
  try {
    const now = Date.now()
    const key = REJECTION_KEY(ip)

    await redis.zremrangebyscore(key, '-inf', now - REJECTION_WINDOW_MS)
    await redis.zadd(key, now, String(now))
    await redis.expire(key, Math.ceil(REJECTION_WINDOW_MS / 1000))

    const count = await redis.zcard(key)
    if (count >= REJECTION_THRESHOLD) {
      await redis.set(REJECT_BLOCK_KEY(ip), '1', 'EX', REJECT_BLOCK_TTL_SEC)
    }
  } catch (e) {
    console.error('[rateLimit] recordRejection failed:', e)
  }
}
