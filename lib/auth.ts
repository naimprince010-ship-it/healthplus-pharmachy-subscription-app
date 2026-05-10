import { compare } from 'bcryptjs'
import CredentialsProvider from 'next-auth/providers/credentials'
import NextAuth from 'next-auth'
import { authConfig } from './auth.config'

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        identifier: { label: 'Phone or Email', type: 'text' },
        password: { label: 'Password (Admin only)', type: 'password' },
        sessionId: { label: 'OTP Session ID', type: 'text' },
        otp: { label: 'OTP Code', type: 'text' }
      },
      async authorize(credentials) {
        console.log('[AUTH] authorize() called')

        // 1. OTP Verification Flow (Users)
        if (credentials?.sessionId && credentials?.otp) {
          console.log('[AUTH] Attempting OTP verification')
          try {
            const { verifyOTP } = await import('@/lib/auth/otp')
            const result = await verifyOTP(
              credentials.sessionId as string,
              credentials.otp as string
            )

            if (result && result.user) {
              console.log('[AUTH] OTP verified successfully for user:', result.user.id)
              return result.user
            }
          } catch (error) {
            console.error('[AUTH] OTP verification failed:', error)
            return null
          }
        }

        // 2. Password Verification Flow (Admins / Legacy)
        const input = credentials?.identifier as string | undefined

        if (!input || !credentials?.password) {
          console.log('[AUTH] Missing credentials for password login')
          return null
        }

        console.log('[AUTH] Verifying password credentials for input:', input.substring(0, 6) + '***')

        const user = await verifyCredentials(
          input,
          credentials.password as string
        )

        if (user) {
          console.log('[AUTH] User found and verified:', user.id)
        } else {
          console.log('[AUTH] User verification failed')
        }

        return user
      },
    }),
  ],
})

function normalizeBdPhone(input: string): string | null {
  const raw = input.replace(/[\s-]/g, '')
  const bdBare = /^1[3-9]\d{8}$/
  const bdLocal = /^01[3-9]\d{8}$/
  const bdNoPlus = /^8801[3-9]\d{8}$/
  const bdPlus = /^\+8801[3-9]\d{8}$/

  if (bdBare.test(raw)) return `+880${raw}`
  if (bdLocal.test(raw)) return `+88${raw}`
  if (bdNoPlus.test(raw)) return `+${raw}`
  if (bdPlus.test(raw)) return raw
  return null
}

export async function verifyCredentials(identifier: string, password: string) {
  console.log('[AUTH] verifyCredentials() called')

  const { prisma } = await import('./prisma')

  let user = null

  const maybePhone = normalizeBdPhone(identifier)
  if (maybePhone) {
    console.log('[AUTH] Attempting phone lookup')
    user = await prisma.user.findUnique({
      where: { phone: maybePhone },
    })
  }

  if (!user) {
    const email = identifier.trim().toLowerCase()
    const looksLikeEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

    if (looksLikeEmail) {
      console.log('[AUTH] Attempting email lookup')
      user = await prisma.user.findUnique({
        where: { email },
      })
    }
  }

  if (!user || !user.password) {
    console.log('[AUTH] User not found in database')
    return null
  }

  console.log('[AUTH] User found, verifying password')
  const isPasswordValid = await compare(password, user.password)

  if (!isPasswordValid) {
    console.log('[AUTH] Password verification failed')
    return null
  }

  console.log('[AUTH] Password verified successfully')
  return {
    id: user.id,
    name: user.name,
    email: user.email || null,
    phone: user.phone,
    role: user.role,
  }
}
