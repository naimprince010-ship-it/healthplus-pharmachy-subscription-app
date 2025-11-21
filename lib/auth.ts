import { compare } from 'bcryptjs'
import { prisma } from './prisma'
import CredentialsProvider from 'next-auth/providers/credentials'
import NextAuth from 'next-auth'

export const { handlers, signIn, signOut, auth } = NextAuth({
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
        if (!credentials?.phone || !credentials?.password) {
          return null
        }

        const user = await verifyCredentials(
          credentials.phone as string,
          credentials.password as string
        )

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
  const user = await prisma.user.findUnique({
    where: { phone },
  })

  if (!user || !user.password) {
    return null
  }

  const isPasswordValid = await compare(password, user.password)

  if (!isPasswordValid) {
    return null
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email || null,
    phone: user.phone,
    role: user.role,
  }
}
