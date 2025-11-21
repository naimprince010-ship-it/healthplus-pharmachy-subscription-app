import { compare } from 'bcryptjs'
import CredentialsProvider from 'next-auth/providers/credentials'
import NextAuth from 'next-auth'

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/auth/signin',
  },
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        identifier: { label: 'Phone or Email', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        console.log('[AUTH] authorize() called')
        
        if (!credentials?.identifier || !credentials?.password) {
          console.log('[AUTH] Missing credentials')
          return null
        }

        console.log('[AUTH] Verifying credentials for identifier:', credentials.identifier.substring(0, 6) + '***')
        
        const user = await verifyCredentials(
          credentials.identifier as string,
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
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        token.phone = user.phone
        token.email = user.email
        token.name = user.name
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.phone = token.phone as string
        session.user.email = token.email as string | undefined
        session.user.name = token.name as string
      }
      return session
    },
  },
})

function normalizeBdPhone(input: string): string | null {
  const raw = input.replace(/\s+/g, '')
  const bdLocal = /^01[3-9]\d{8}$/
  const bdNoPlus = /^8801[3-9]\d{8}$/
  const bdPlus = /^\+8801[3-9]\d{8}$/
  
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
