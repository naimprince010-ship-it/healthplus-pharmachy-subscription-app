import NextAuth from 'next-auth'
import { authConfig } from '@/lib/auth.config'
import { NextResponse } from 'next/server'

const { auth } = NextAuth(authConfig)

// Machine-to-machine admin endpoints; the route handler itself must verify the bearer secret.
const BEARER_AUTHENTICATED_ADMIN_APIS = new Set(['/api/admin/market-intel/sync'])

export default auth((req) => {
  const session = req.auth
  const path = req.nextUrl.pathname

  if (path === '/api/admin' || path.startsWith('/api/admin/')) {
    const hasBearer = /^Bearer\s+\S+/i.test(req.headers.get('authorization') ?? '')
    if (hasBearer && BEARER_AUTHENTICATED_ADMIN_APIS.has(path)) {
      return NextResponse.next()
    }
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    return NextResponse.next()
  }

  if (path.startsWith('/admin')) {
    if (!session || session.user.role !== 'ADMIN') {
      const signInUrl = new URL('/auth/signin', req.url)
      signInUrl.searchParams.set('callbackUrl', req.nextUrl.pathname + req.nextUrl.search)
      return NextResponse.redirect(signInUrl)
    }
  }

  if (path.startsWith('/dashboard')) {
    if (!session) {
      const signInUrl = new URL('/auth/signin', req.url)
      signInUrl.searchParams.set('callbackUrl', req.nextUrl.pathname + req.nextUrl.search)
      return NextResponse.redirect(signInUrl)
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/admin/:path*', '/dashboard/:path*', '/api/admin', '/api/admin/:path*'],
}
