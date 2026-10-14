import { NextRequest, NextResponse } from 'next/server'
import { hash } from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { consumeVerifiedOtp } from '@/lib/auth/otp'
import { normalizeBDPhone } from '@/lib/utils'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const signupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z
    .string()
    .regex(/^(\+88)?01[3-9]\d{8}$/, 'Invalid Bangladesh phone number'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  email: z.string().email('Invalid email').min(1, 'Email is required'),
  // Proof of phone ownership: an OTP session issued by /api/auth/otp/send for this phone.
  otpSessionId: z.string().min(1, 'Phone verification is required'),
  otp: z.string().regex(/^\d{6}$/, 'OTP must be 6 digits'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const validationResult = signupSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      )
    }

    const { name, phone, password, email, otpSessionId, otp } = validationResult.data

    const normalizedPhone = normalizeBDPhone(phone)
    const normalizedEmail = email.toLowerCase().trim()

    try {
      await consumeVerifiedOtp(otpSessionId, otp, { expectedPhone: normalizedPhone })
    } catch {
      return NextResponse.json(
        { error: 'Phone verification failed. Request a new OTP and try again.' },
        { status: 400 }
      )
    }

    const existingUser = await prisma.user.findUnique({
      where: { phone: normalizedPhone },
      select: { id: true },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'An account already exists for this phone. Please sign in with OTP.' },
        { status: 409 }
      )
    }

    const existingEmail = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true },
    })

    if (existingEmail) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      )
    }

    const hashedPassword = await hash(password, 12)

    const user = await prisma.user.create({
      data: {
        name,
        phone: normalizedPhone,
        password: hashedPassword,
        email: normalizedEmail,
        role: 'USER',
      },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        role: true,
        createdAt: true,
      },
    })

    return NextResponse.json(
      {
        success: true,
        message: 'Account created successfully',
        user,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json(
      { error: 'Failed to create account. Please try again.' },
      { status: 500 }
    )
  }
}
