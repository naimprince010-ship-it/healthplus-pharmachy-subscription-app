import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

export default auth((req) => {
  const session = req.auth
  const path = req.nextUrl.pathname

  if (path.startsWith('/api/admin')) {
    // Allow cron sync when a valid secret token is provided.
    if (path === '/api/admin/market-intel/sync') {
      const cronSecret = process.env.MARKET_INTEL_CRON_SECRET
      const token = req.nextUrl.searchParams.get('token')
      if (cronSecret && token === cronSecret) {
        return NextResponse.next()
      }
    }

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
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
  matcher: ['/admin/:path*', '/dashboard/:path*', '/api/admin/:path*'],
}
