import 'next-auth'

declare module 'next-auth' {
  interface User {
    id: string
    role: string
    phone: string
  }

  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      phone: string
      role: string
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: string
    phone: string
  }
}
