import { NextRequest, NextResponse } from 'next/server'
import { verifyOTP } from '@/lib/auth/otp'
import { z } from 'zod'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const verifyOTPSchema = z.object({
  sessionId: z.string().min(1),
  otp: z.string().length(6),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validationResult = verifyOTPSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      )
    }

    const { sessionId, otp } = validationResult.data
    const result = await verifyOTP(sessionId, otp)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Verify OTP error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to verify OTP' },
      { status: 400 }
    )
  }
}
