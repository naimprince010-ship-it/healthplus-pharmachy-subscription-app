import { NextRequest, NextResponse } from 'next/server'
import { OtpRateLimitError, sendOTP } from '@/lib/auth/otp'
import { checkOtpSendIpLimit, getClientIp } from '@/lib/auth/otp-ip-limit'
import { z } from 'zod'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const sendOTPSchema = z.object({
  phone: z.string().min(1),
})

export async function POST(request: NextRequest) {
  try {
    const ipLimit = await checkOtpSendIpLimit(getClientIp(request.headers))
    if (!ipLimit.allowed) {
      const unavailable = ipLimit.reason === 'unavailable'
      return NextResponse.json(
        {
          error: unavailable
            ? 'OTP service is temporarily unavailable. Please try again later.'
            : 'Too many OTP requests. Please try again later.',
        },
        {
          status: unavailable ? 503 : 429,
          headers: { 'Retry-After': String(ipLimit.retryAfterSeconds) },
        }
      )
    }
    const body = await request.json()
    const validationResult = sendOTPSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      )
    }

    const { phone } = validationResult.data
    const result = await sendOTP(phone)

    return NextResponse.json(result)
  } catch (error) {
    if (error instanceof OtpRateLimitError) {
      return NextResponse.json({ error: error.message }, { status: 429 })
    }
    console.error('Send OTP error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to send OTP' },
      { status: 500 }
    )
  }
}
