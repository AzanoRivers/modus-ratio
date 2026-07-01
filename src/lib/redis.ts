import { Redis } from 'ioredis'
import { env } from '@/lib/env'

let _client: Redis | null = null

function getClient(): Redis {
  if (!_client) {
    _client = new Redis(env.redis.url, {
      password:          env.redis.password || undefined,
      username:          env.redis.username || undefined,
      lazyConnect:       true,
      maxRetriesPerRequest: 3,
      enableReadyCheck:  false,
      keyPrefix:         '',
    })

    _client.on('error', (err) => {
      console.error('[redis] connection error:', err.message)
    })
  }
  return _client
}

export const redis = getClient()
