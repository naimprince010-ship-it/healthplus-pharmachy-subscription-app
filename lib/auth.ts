import { compare } from 'bcryptjs'
import { prisma } from './prisma'

export const authOptions = {
  session: {
    strategy: 'jwt' as const,
  },
  pages: {
    signIn: '/auth/signin',
  },
  providers: [],
  callbacks: {
    async jwt({ token, user }: { token: any; user?: any }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        token.phone = user.phone
      }
      return token
    },
    async session({ session, token }: { session: any; token: any }) {
      if (session.user) {
        session.user.id = token.id
        session.user.role = token.role
        session.user.phone = token.phone
      }
      return session
    },
  },
}

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
