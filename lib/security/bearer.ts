import { timingSafeEqual } from 'crypto'

export type BearerCheck = 'ok' | 'missing-secret' | 'invalid'

/** Constant-time check of `Authorization: Bearer <secret>`; never reads secrets from the URL. */
export function checkBearerSecret(authorizationHeader: string | null, secret: string | undefined): BearerCheck {
  if (!secret || !secret.trim()) return 'missing-secret'
  const match = /^Bearer\s+(\S+)$/i.exec(authorizationHeader?.trim() ?? '')
  if (!match) return 'invalid'
  const provided = Buffer.from(match[1])
  const expected = Buffer.from(secret)
  return provided.length === expected.length && timingSafeEqual(provided, expected) ? 'ok' : 'invalid'
}
