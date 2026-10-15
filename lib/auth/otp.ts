import { createHmac, randomInt, timingSafeEqual } from 'crypto'
import { prisma } from '@/lib/prisma'
import { normalizeBDPhone } from '@/lib/utils'
import { sendMIMSMS } from '@/lib/sms/mim-sms'

const OTP_TTL_MS = 5 * 60 * 1000
const RESEND_WINDOW_MS = 60 * 1000
const HOURLY_WINDOW_MS = 60 * 60 * 1000
const HOURLY_LIMIT = 5
const MAX_ATTEMPTS = 5

export class OtpRateLimitError extends Error {}

export type OtpUser = { id: string; phone: string; name: string; email: string | null; role: string }

const OTP_USER_SELECT = { id: true, phone: true, name: true, email: true, role: true } as const

function getOtpSecret() {
  const secret = process.env.OTP_HASH_SECRET || process.env.NEXTAUTH_SECRET
  if (secret) return secret
  if (process.env.NODE_ENV === 'production') {
    throw new Error('OTP hashing is not configured')
  }
  return 'halalzi-otp-development-secret'
}

function hashOtp(phone: string, otp: string) {
  return createHmac('sha256', getOtpSecret()).update(`${phone}:${otp}`).digest('hex')
}

function hashesMatch(a: string, b: string) {
  const left = Buffer.from(a, 'hex')
  const right = Buffer.from(b, 'hex')
  return left.length === right.length && timingSafeEqual(left, right)
}

// Rows must outlive the hourly rate-limit window; verifyOTP rejects expired/verified rows itself.
async function cleanupExpiredSessions() {
  await prisma.otpSession.deleteMany({
    where: { createdAt: { lt: new Date(Date.now() - HOURLY_WINDOW_MS) } },
  })
}

async function enforceRateLimit(phone: string) {
  const now = Date.now()
  const recent = await prisma.otpSession.findFirst({
    where: {
      phone,
      createdAt: { gt: new Date(now - RESEND_WINDOW_MS) },
      verifiedAt: null,
    },
    orderBy: { createdAt: 'desc' },
    select: { createdAt: true },
  })
  if (recent) {
    const seconds = Math.max(1, Math.ceil((RESEND_WINDOW_MS - (now - recent.createdAt.getTime())) / 1000))
    throw new OtpRateLimitError(`Please wait ${seconds}s before requesting another OTP`)
  }

  const hourlyCount = await prisma.otpSession.count({
    where: {
      phone,
      createdAt: { gt: new Date(now - HOURLY_WINDOW_MS) },
    },
  })
  if (hourlyCount >= HOURLY_LIMIT) {
    throw new OtpRateLimitError('Too many OTP requests. Please try again later.')
  }
}

export async function sendOTP(phone: string): Promise<{ sessionId: string; message: string; phone: string }> {
  const normalizedPhone = normalizeBDPhone(phone)
  await cleanupExpiredSessions()
  await enforceRateLimit(normalizedPhone)

  const otp = randomInt(100000, 1000000).toString()
  const expiresAt = new Date(Date.now() + OTP_TTL_MS)

  const session = await prisma.otpSession.create({
    data: {
      phone: normalizedPhone,
      otpHash: hashOtp(normalizedPhone, otp),
      expiresAt,
    },
    select: { id: true },
  })

  const smsMessage = `Your Halalzi OTP is ${otp}. Valid for 5 minutes.`
  const smsResult = await sendMIMSMS(normalizedPhone, smsMessage)
  const allowFallback = process.env.OTP_ALLOW_FALLBACK === 'true' || process.env.NODE_ENV !== 'production'

  if (!smsResult.ok) {
    await prisma.otpSession.delete({ where: { id: session.id } }).catch(() => undefined)
    console.warn(`[OTP] SMS failed for ${normalizedPhone}: ${smsResult.error || 'Unknown SMS provider error'}`)

    if (!allowFallback) {
      throw new Error('OTP SMS delivery failed. Please try again in a moment.')
    }

    console.log(`[OTP FALLBACK] OTP for ${normalizedPhone}: ${otp} (expires in 5 minutes)`)
  }

  return {
    sessionId: session.id,
    phone: normalizedPhone,
    message: `OTP sent to ${normalizedPhone}`,
  }
}

/**
 * Checks the code and marks the session used exactly once. Returns the verified phone.
 * When `expectedPhone` is given, a mismatch fails without consuming an attempt.
 */
export async function consumeVerifiedOtp(
  sessionId: string,
  otp: string,
  options: { expectedPhone?: string } = {}
): Promise<string> {
  const cleanOtp = otp.replace(/\D/g, '')
  if (!/^\d{6}$/.test(cleanOtp)) {
    throw new Error('Enter the 6-digit OTP code')
  }

  const session = await prisma.otpSession.findUnique({ where: { id: sessionId } })
  if (!session || session.verifiedAt) {
    throw new Error('Invalid or expired OTP session')
  }

  if (options.expectedPhone && session.phone !== options.expectedPhone) {
    throw new Error('Invalid or expired OTP session')
  }

  if (new Date() > session.expiresAt) {
    await prisma.otpSession.delete({ where: { id: session.id } }).catch(() => undefined)
    throw new Error('OTP has expired. Please request a new code.')
  }

  if (session.attempts >= MAX_ATTEMPTS) {
    await prisma.otpSession.delete({ where: { id: session.id } }).catch(() => undefined)
    throw new Error('Too many wrong attempts. Please request a new OTP.')
  }

  const expectedHash = hashOtp(session.phone, cleanOtp)
  if (!hashesMatch(session.otpHash, expectedHash)) {
    const incremented = await prisma.otpSession.updateMany({
      where: { id: session.id, verifiedAt: null, attempts: { lt: MAX_ATTEMPTS } },
      data: { attempts: { increment: 1 } },
    })
    if (incremented.count !== 1) {
      throw new Error('Too many wrong attempts. Please request a new OTP.')
    }

    const locked = await prisma.otpSession.deleteMany({
      where: { id: session.id, verifiedAt: null, attempts: { gte: MAX_ATTEMPTS } },
    })
    if (locked.count > 0) {
      throw new Error('Too many wrong attempts. Please request a new OTP.')
    }
    throw new Error('Invalid OTP code')
  }

  // Conditional update makes concurrent replays of the same code lose the race.
  const consumed = await prisma.otpSession.updateMany({
    where: { id: session.id, verifiedAt: null, attempts: { lt: MAX_ATTEMPTS } },
    data: { verifiedAt: new Date() },
  })
  if (consumed.count !== 1) {
    throw new Error('Invalid or expired OTP session')
  }

  return session.phone
}

export async function verifyOTP(
  sessionId: string,
  otp: string
): Promise<{ user: OtpUser; isNewUser: boolean }> {
  const phone = await consumeVerifiedOtp(sessionId, otp)

  let user: OtpUser | null = await prisma.user.findUnique({
    where: { phone },
    select: OTP_USER_SELECT,
  })

  let isNewUser = false

  if (!user) {
    user = await prisma.user.create({
      data: {
        phone,
        name: phone,
        password: '',
        role: 'USER',
      },
      select: OTP_USER_SELECT,
    })
    isNewUser = true
  }

  return { user, isNewUser }
}

export async function resendOTP(sessionId: string): Promise<{ sessionId: string; message: string; phone: string }> {
  const session = await prisma.otpSession.findUnique({
    where: { id: sessionId },
    select: { id: true, phone: true },
  })

  if (!session) {
    throw new Error('Invalid session')
  }

  await prisma.otpSession.delete({ where: { id: session.id } }).catch(() => undefined)
  return sendOTP(session.phone)
}
