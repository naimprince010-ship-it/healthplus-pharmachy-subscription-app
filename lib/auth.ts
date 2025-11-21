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
        phone: { label: 'Phone', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        console.log('[AUTH] authorize() called')
        
        if (!credentials?.phone || !credentials?.password) {
          console.log('[AUTH] Missing credentials')
          return null
        }

        console.log('[AUTH] Verifying credentials for phone:', credentials.phone.substring(0, 6) + '***')
        
        const user = await verifyCredentials(
          credentials.phone as string,
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
        token.name = user.name
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.phone = token.phone as string
        session.user.name = token.name as string
      }
      return session
    },
  },
})

export async function verifyCredentials(phone: string, password: string) {
  console.log('[AUTH] verifyCredentials() called')
  
  const { prisma } = await import('./prisma')
  
  const user = await prisma.user.findUnique({
    where: { phone },
  })

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
