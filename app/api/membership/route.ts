import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Direct activation granted paid entitlements with no payment (audit P0-03).
// Re-enable only once activation is driven by a verified settlement event.
export async function POST() {
  return NextResponse.json(
    { error: 'Membership purchase is temporarily unavailable.' },
    { status: 503 }
  )
}

export async function GET() {
  try {
    const session = await auth()
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { prisma } = await import('@/lib/prisma')
    const membership = await prisma.userMembership.findFirst({
      where: {
        userId: session.user.id,
        isActive: true,
        endDate: { gte: new Date() },
      },
      include: {
        plan: true,
      },
    })

    return NextResponse.json({ membership })
  } catch (error) {
    console.error('Fetch membership error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch membership' },
      { status: 500 }
    )
  }
}
