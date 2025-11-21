import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  try {
    const session = await auth()
    const url = new URL(request.url)
    
    return NextResponse.json({
      session: session ? {
        user: {
          id: session.user.id,
          name: session.user.name,
          phone: session.user.phone,
          role: session.user.role,
        },
      } : null,
      environment: {
        host: request.headers.get('host'),
        origin: request.headers.get('origin'),
        nextauthUrl: process.env.NEXTAUTH_URL || 'not set',
        authTrustHost: process.env.AUTH_TRUST_HOST || 'not set',
        hasNextauthSecret: !!process.env.NEXTAUTH_SECRET,
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[DEBUG] Session check error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to check session',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
