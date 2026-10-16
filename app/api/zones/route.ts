import { NextResponse } from 'next/server'
import { resolveDeliveryChargeForZone } from '@/lib/delivery-charge'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const { prisma } = await import('@/lib/prisma')
    const zones = await prisma.zone.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    })

    const normalizedZones = zones.map((zone) => ({
      ...zone,
      deliveryCharge: resolveDeliveryChargeForZone(zone),
      deliveryFee: resolveDeliveryChargeForZone(zone),
    }))

    return NextResponse.json({ zones: normalizedZones })
  } catch (error) {
    console.error('Fetch zones error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch zones' },
      { status: 500 }
    )
  }
}
