import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
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
