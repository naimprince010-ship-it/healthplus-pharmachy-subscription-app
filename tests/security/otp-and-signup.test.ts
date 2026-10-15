import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { collectKeys, createFakePrisma, jsonRequest } from '../helpers'

const h = vi.hoisted(() => ({
  db: null as unknown as ReturnType<typeof import('../helpers').createFakePrisma>,
  sentOtps: [] as { phone: string; otp: string }[],
}))

vi.mock('@/lib/prisma', () => ({
  get prisma() {
    return h.db
  },
}))

vi.mock('@/lib/sms/mim-sms', () => ({
  sendMIMSMS: vi.fn(async (phone: string, message: string) => {
    h.sentOtps.push({ phone, otp: /(\d{6})/.exec(message)![1] })
    return { ok: true }
  }),
}))

const PHONE_LOCAL = '01711111111'
const PHONE = '+8801711111111'
const MINUTE = 60 * 1000
const START = new Date('2026-10-14T00:00:00Z')

const lastOtp = () => h.sentOtps[h.sentOtps.length - 1]

beforeEach(() => {
  h.db = createFakePrisma()
  h.sentOtps.length = 0
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(START)
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllEnvs()
})

describe('OTP hourly rate limit', () => {
  it('uses a validated trusted proxy IP instead of a spoofed left-most XFF value', async () => {
    const { getClientIp } = await import('@/lib/auth/otp-ip-limit')

    expect(getClientIp(new Headers({
      'x-vercel-forwarded-for': '198.51.100.7',
      'x-forwarded-for': '192.0.2.1, 203.0.113.9',
    }))).toBe('198.51.100.7')
    expect(getClientIp(new Headers({
      'x-forwarded-for': 'attacker-controlled, 203.0.113.9',
    }))).toBe('203.0.113.9')
    expect(getClientIp(new Headers({ 'x-forwarded-for': 'not-an-ip' }))).toBeNull()
  })

  it('rejects the sixth OTP request for a phone within one hour (lib)', async () => {
    const { sendOTP, OtpRateLimitError } = await import('@/lib/auth/otp')

    // Spaced > 5 minutes apart so the old cleanup (which deleted expired rows) would have reset the count.
    for (let i = 0; i < 5; i++) {
      vi.setSystemTime(new Date(START.getTime() + i * 6 * MINUTE))
      await expect(sendOTP(PHONE_LOCAL)).resolves.toMatchObject({ phone: PHONE })
    }

    vi.setSystemTime(new Date(START.getTime() + 30 * MINUTE))
    await expect(sendOTP(PHONE_LOCAL)).rejects.toBeInstanceOf(OtpRateLimitError)
    expect(h.sentOtps).toHaveLength(5)
    expect(h.db.otpSession.rows).toHaveLength(5)
  })

  it('returns HTTP 429 for the sixth request via /api/auth/otp/send', async () => {
    const { POST } = await import('@/app/api/auth/otp/send/route')
    const statuses: number[] = []
    for (let i = 0; i < 6; i++) {
      vi.setSystemTime(new Date(START.getTime() + i * 6 * MINUTE))
      statuses.push((await POST(jsonRequest('/api/auth/otp/send', 'POST', { phone: PHONE_LOCAL }))).status)
    }
    expect(statuses).toEqual([200, 200, 200, 200, 200, 429])
  })

  it('allows requests again once the oldest falls outside the hour', async () => {
    const { sendOTP } = await import('@/lib/auth/otp')
    for (let i = 0; i < 5; i++) {
      vi.setSystemTime(new Date(START.getTime() + i * 6 * MINUTE))
      await sendOTP(PHONE_LOCAL)
    }
    vi.setSystemTime(new Date(START.getTime() + 61 * MINUTE))
    await expect(sendOTP(PHONE_LOCAL)).resolves.toMatchObject({ phone: PHONE })
  })

  it('enforces the 60s resend window with 429', async () => {
    const { POST } = await import('@/app/api/auth/otp/send/route')
    expect((await POST(jsonRequest('/api/auth/otp/send', 'POST', { phone: PHONE_LOCAL }))).status).toBe(200)
    vi.setSystemTime(new Date(START.getTime() + 30 * 1000))
    expect((await POST(jsonRequest('/api/auth/otp/send', 'POST', { phone: PHONE_LOCAL }))).status).toBe(429)
  })

  it('returns 429 when the per-IP hook denies the request (hook wiring)', async () => {
    const ipLimit = await import('@/lib/auth/otp-ip-limit')
    const spy = vi.spyOn(ipLimit, 'checkOtpSendIpLimit').mockResolvedValueOnce({ allowed: false, retryAfterSeconds: 120, reason: 'rate_limited' })
    const { POST } = await import('@/app/api/auth/otp/send/route')
    const res = await POST(jsonRequest('/api/auth/otp/send', 'POST', { phone: PHONE_LOCAL }, { 'x-forwarded-for': '203.0.113.9' }))
    expect(res.status).toBe(429)
    expect(res.headers.get('retry-after')).toBe('120')
    expect(spy).toHaveBeenCalledWith('203.0.113.9')
    expect(h.sentOtps).toHaveLength(0)
  })

  it('per-IP limit rejects the eleventh send in a ten-minute window', async () => {
    const { checkOtpSendIpLimit } = await import('@/lib/auth/otp-ip-limit')
    let count = 0
    let observedKey = ''
    const store = {
      eval: vi.fn(async (_script: string, keys: string[]) => {
        observedKey = keys[0]
        return [++count, 600] as [number, number]
      }),
    }

    for (let i = 0; i < 10; i++) {
      await expect(checkOtpSendIpLimit('203.0.113.9', store)).resolves.toEqual({ allowed: true })
    }
    await expect(checkOtpSendIpLimit('203.0.113.9', store)).resolves.toEqual({
      allowed: false,
      retryAfterSeconds: 600,
      reason: 'rate_limited',
    })
    expect(observedKey).toMatch(/^security:otp-send:ip:[a-f0-9]{64}$/)
    expect(observedKey).not.toContain('203.0.113.9')
  })

  it('fails closed in production when Redis is unavailable', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    const { checkOtpSendIpLimit } = await import('@/lib/auth/otp-ip-limit')
    await expect(checkOtpSendIpLimit('203.0.113.9', null)).resolves.toEqual({
      allowed: false,
      retryAfterSeconds: 60,
      reason: 'unavailable',
    })
  })

  it('fails closed in production when no OTP hashing secret is configured', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('OTP_HASH_SECRET', '')
    vi.stubEnv('NEXTAUTH_SECRET', '')
    const { sendOTP } = await import('@/lib/auth/otp')

    await expect(sendOTP(PHONE_LOCAL)).rejects.toThrow('OTP hashing is not configured')
    expect(h.db.otpSession.rows).toHaveLength(0)
    expect(h.sentOtps).toHaveLength(0)
  })
})

describe('OTP verify API returns a minimal DTO', () => {
  it('never returns the user record, password or password hash', async () => {
    await h.db.user.create({
      data: { phone: PHONE, name: 'Existing', email: 'existing@example.com', password: '$2a$12$fakehashfakehashfakehashfakehashfakehashfakehash' },
    })
    const { sendOTP } = await import('@/lib/auth/otp')
    const { sessionId } = await sendOTP(PHONE_LOCAL)

    const { POST } = await import('@/app/api/auth/otp/verify/route')
    const res = await POST(jsonRequest('/api/auth/otp/verify', 'POST', { sessionId, otp: lastOtp().otp }))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body).toEqual({ verified: true, isNewUser: false })
    const keys = collectKeys(body)
    for (const forbidden of ['password', 'user', 'email', 'otpHash', 'id']) expect(keys.has(forbidden)).toBe(false)
    expect(JSON.stringify(body)).not.toContain('$2a$')
  })

  it('lib verifyOTP returns only id/phone/name/email/role for NextAuth', async () => {
    await h.db.user.create({ data: { phone: PHONE, name: 'Existing', password: 'hash-value' } })
    const { sendOTP, verifyOTP } = await import('@/lib/auth/otp')
    const { sessionId } = await sendOTP(PHONE_LOCAL)
    const { user } = await verifyOTP(sessionId, lastOtp().otp)
    expect(Object.keys(user).sort()).toEqual(['email', 'id', 'name', 'phone', 'role'])
  })

  it('rejects a wrong code and a replayed code', async () => {
    const { sendOTP, verifyOTP } = await import('@/lib/auth/otp')
    const { sessionId } = await sendOTP(PHONE_LOCAL)
    const code = lastOtp().otp
    const wrong = code === '000000' ? '111111' : '000000'
    await expect(verifyOTP(sessionId, wrong)).rejects.toThrow()
    await expect(verifyOTP(sessionId, code)).resolves.toMatchObject({ isNewUser: true })
    await expect(verifyOTP(sessionId, code)).rejects.toThrow()
  })

  it('locks and removes a session on the fifth wrong attempt', async () => {
    const { sendOTP, consumeVerifiedOtp } = await import('@/lib/auth/otp')
    const { sessionId } = await sendOTP(PHONE_LOCAL)
    const code = lastOtp().otp
    const wrong = code === '000000' ? '111111' : '000000'

    for (let attempt = 1; attempt < 5; attempt++) {
      await expect(consumeVerifiedOtp(sessionId, wrong)).rejects.toThrow('Invalid OTP code')
    }
    await expect(consumeVerifiedOtp(sessionId, wrong)).rejects.toThrow('Too many wrong attempts')
    await expect(consumeVerifiedOtp(sessionId, code)).rejects.toThrow('Invalid or expired OTP session')
    expect(h.db.otpSession.rows).toHaveLength(0)
  })

  it('does not allow concurrent wrong attempts to preserve a usable session', async () => {
    const { sendOTP, consumeVerifiedOtp } = await import('@/lib/auth/otp')
    const { sessionId } = await sendOTP(PHONE_LOCAL)
    const code = lastOtp().otp
    const wrong = code === '000000' ? '111111' : '000000'

    await Promise.allSettled(Array.from({ length: 8 }, () => consumeVerifiedOtp(sessionId, wrong)))
    await expect(consumeVerifiedOtp(sessionId, code)).rejects.toThrow('Invalid or expired OTP session')
    expect(h.db.otpSession.rows).toHaveLength(0)
  })
})

describe('signup requires OTP-verified phone ownership', () => {
  const signupBody = (extra: Record<string, unknown> = {}) => ({
    name: 'New Customer',
    phone: PHONE_LOCAL,
    email: 'new.customer@example.com',
    password: 'Str0ngPassw0rd',
    ...extra,
  })

  async function postSignup(body: unknown) {
    const { POST } = await import('@/app/api/auth/signup/route')
    return POST(jsonRequest('/api/auth/signup', 'POST', body))
  }

  it('rejects signup without an OTP session and creates no user', async () => {
    const res = await postSignup(signupBody())
    expect(res.status).toBe(400)
    expect(h.db.user.rows).toHaveLength(0)
  })

  it('rejects a guessed OTP and creates no user', async () => {
    const { sendOTP } = await import('@/lib/auth/otp')
    const { sessionId } = await sendOTP(PHONE_LOCAL)
    const wrong = lastOtp().otp === '000000' ? '111111' : '000000'
    const res = await postSignup(signupBody({ otpSessionId: sessionId, otp: wrong }))
    expect(res.status).toBe(400)
    expect(h.db.user.rows).toHaveLength(0)
  })

  it('rejects an OTP verified for a different phone (cannot bind victim phone)', async () => {
    const { sendOTP } = await import('@/lib/auth/otp')
    const { sessionId } = await sendOTP('01822222222')
    const res = await postSignup(signupBody({ otpSessionId: sessionId, otp: lastOtp().otp }))
    expect(res.status).toBe(400)
    expect(h.db.user.rows).toHaveLength(0)
  })

  it('does not set a password on an existing phone account', async () => {
    await h.db.user.create({ data: { phone: PHONE, name: 'Victim', password: '' } })
    const { sendOTP } = await import('@/lib/auth/otp')
    const { sessionId } = await sendOTP(PHONE_LOCAL)
    const res = await postSignup(signupBody({ otpSessionId: sessionId, otp: lastOtp().otp }))
    expect(res.status).toBe(409)
    expect(h.db.user.rows).toHaveLength(1)
    expect(h.db.user.rows[0].password).toBe('')
  })

  it('creates the account once the phone is OTP-verified, and the OTP cannot be reused', async () => {
    const { sendOTP } = await import('@/lib/auth/otp')
    const { sessionId } = await sendOTP(PHONE_LOCAL)
    const code = lastOtp().otp

    const res = await postSignup(signupBody({ otpSessionId: sessionId, otp: code }))
    expect(res.status).toBe(201)
    expect(collectKeys(await res.json()).has('password')).toBe(false)
    expect(h.db.user.rows).toHaveLength(1)
    expect(h.db.user.rows[0].phone).toBe(PHONE)
    expect(String(h.db.user.rows[0].password)).toMatch(/^\$2[aby]\$12\$/)

    const replay = await postSignup(signupBody({ email: 'other@example.com', otpSessionId: sessionId, otp: code }))
    expect(replay.status).toBe(400)
  })
})
