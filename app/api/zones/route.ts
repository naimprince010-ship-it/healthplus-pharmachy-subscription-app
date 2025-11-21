import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const { prisma } = await import('@/lib/prisma')
    const zones = await prisma.zone.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json({ zones })
  } catch (error) {
    console.error('Fetch zones error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch zones' },
      { status: 500 }
    )
  }
}
