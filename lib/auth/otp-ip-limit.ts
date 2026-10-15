import { createHash } from 'node:crypto'
import { redis } from '@/lib/redis'

const WINDOW_SECONDS = 10 * 60
const MAX_REQUESTS_PER_WINDOW = 10
const KEY_PREFIX = 'security:otp-send:ip'

export type IpLimitResult =
  | { allowed: true }
  | { allowed: false; retryAfterSeconds: number; reason: 'rate_limited' | 'unavailable' }

interface RedisEvalStore {
  eval(script: string, keys: string[], args: Array<string | number>): Promise<unknown>
}

/** Best-effort client IP from proxy headers (Vercel sets x-forwarded-for). */
export function getClientIp(headers: Headers): string | null {
  const forwarded = headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  return forwarded || headers.get('x-real-ip')?.trim() || null
}

function ipKey(ip: string): string {
  const digest = createHash('sha256').update(ip).digest('hex')
  return `${KEY_PREFIX}:${digest}`
}

/**
 * Shared fixed-window rate limit. The Lua script makes increment + initial TTL atomic.
 * Production fails closed when Redis is missing; development/test stays usable without it.
 */
export async function checkOtpSendIpLimit(
  ip: string | null,
  store: RedisEvalStore | null = redis,
): Promise<IpLimitResult> {
  if (!ip) {
    return process.env.NODE_ENV === 'production'
      ? { allowed: false, retryAfterSeconds: 60, reason: 'unavailable' }
      : { allowed: true }
  }

  if (!store) {
    return process.env.NODE_ENV === 'production'
      ? { allowed: false, retryAfterSeconds: 60, reason: 'unavailable' }
      : { allowed: true }
  }

  const script = `
    local count = redis.call('INCR', KEYS[1])
    if count == 1 then
      redis.call('EXPIRE', KEYS[1], ARGV[1])
    end
    local ttl = redis.call('TTL', KEYS[1])
    return { count, ttl }
  `

  try {
    const result = (await store.eval(
      script,
      [ipKey(ip)],
      [WINDOW_SECONDS],
    )) as [number, number]
    const count = Number(result[0])
    const ttl = Math.max(1, Number(result[1]) || WINDOW_SECONDS)

    return count > MAX_REQUESTS_PER_WINDOW
      ? { allowed: false, retryAfterSeconds: ttl, reason: 'rate_limited' }
      : { allowed: true }
  } catch (error) {
    console.error('OTP per-IP limiter unavailable:', error)
    return process.env.NODE_ENV === 'production'
      ? { allowed: false, retryAfterSeconds: 60, reason: 'unavailable' }
      : { allowed: true }
  }
}
