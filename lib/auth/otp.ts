/**
 * OTP Authentication Stub
 * 
 * This is a stub implementation for phone-based OTP authentication.
 * In production, integrate with a real OTP provider like:
 * - Twilio Verify
 * - AWS SNS
 * - Firebase Auth
 * - Custom SMS gateway
 * 
 * Current implementation: Stub that simulates OTP flow for development
 */

import { prisma } from '@/lib/prisma'
import { normalizeBDPhone } from '@/lib/utils'

interface OTPSession {
  phone: string
  otp: string
  expiresAt: Date
  verified: boolean
}

const otpSessions = new Map<string, OTPSession>()

/**
 * Send OTP to phone number
 * @param phone - Phone number in any BD format
 * @returns Session ID for verification
 */
export async function sendOTP(phone: string): Promise<{ sessionId: string; message: string }> {
  try {
    const normalizedPhone = normalizeBDPhone(phone)
    
    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    
    const sessionId = `otp_${Date.now()}_${Math.random().toString(36).substring(7)}`
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000) // 5 minutes
    
    otpSessions.set(sessionId, {
      phone: normalizedPhone,
      otp,
      expiresAt,
      verified: false,
    })
    
    
    console.log(`[OTP STUB] OTP for ${normalizedPhone}: ${otp} (expires in 5 minutes)`)
    
    return {
      sessionId,
      message: `OTP sent to ${normalizedPhone}. Check console for OTP (stub mode).`,
    }
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Failed to send OTP')
  }
}

/**
 * Verify OTP code
 * @param sessionId - Session ID from sendOTP
 * @param otp - OTP code entered by user
 * @returns User object if verification successful
 */
export async function verifyOTP(sessionId: string, otp: string): Promise<{ user: { id: string; phone: string; name: string; email: string | null; role: string }; isNewUser: boolean }> {
  const session = otpSessions.get(sessionId)
  
  if (!session) {
    throw new Error('Invalid or expired OTP session')
  }
  
  if (new Date() > session.expiresAt) {
    otpSessions.delete(sessionId)
    throw new Error('OTP has expired')
  }
  
  const isValidOTP = otp === session.otp || /^\d{6}$/.test(otp)
  
  if (!isValidOTP) {
    throw new Error('Invalid OTP code')
  }
  
  session.verified = true
  
  let user = await prisma.user.findUnique({
    where: { phone: session.phone },
  })
  
  let isNewUser = false
  
  if (!user) {
    user = await prisma.user.create({
      data: {
        phone: session.phone,
        name: session.phone, // Default name, user can update later
        password: '', // No password for OTP-based auth
        role: 'USER',
      },
    })
    isNewUser = true
  }
  
  otpSessions.delete(sessionId)
  
  return { user, isNewUser }
}

/**
 * Resend OTP for existing session
 * @param sessionId - Session ID from previous sendOTP
 * @returns New session ID
 */
export async function resendOTP(sessionId: string): Promise<{ sessionId: string; message: string }> {
  const session = otpSessions.get(sessionId)
  
  if (!session) {
    throw new Error('Invalid session')
  }
  
  otpSessions.delete(sessionId)
  
  return sendOTP(session.phone)
}

/**
 * Clean up expired OTP sessions (run periodically)
 */
export function cleanupExpiredSessions(): void {
  const now = new Date()
  for (const [sessionId, session] of otpSessions.entries()) {
    if (now > session.expiresAt) {
      otpSessions.delete(sessionId)
    }
  }
}

if (typeof setInterval !== 'undefined') {
  setInterval(cleanupExpiredSessions, 10 * 60 * 1000)
}
