import { NextRequest, NextResponse } from 'next/server'
import { sendOTP } from '@/lib/auth/otp'
import { z } from 'zod'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const sendOTPSchema = z.object({
  phone: z.string().min(1),
})

export async function POST(request: NextRequest) {
  try {
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
    console.error('Send OTP error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to send OTP' },
      { status: 500 }
    )
  }
}
