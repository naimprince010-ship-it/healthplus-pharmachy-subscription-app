import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

export default auth((req) => {
  const session = req.auth
  const path = req.nextUrl.pathname

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
  matcher: ['/admin/:path*', '/dashboard/:path*'],
}
