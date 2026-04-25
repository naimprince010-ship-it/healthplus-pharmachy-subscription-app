import { NextResponse } from 'next/server'
import { resolveDeliveryChargeByZoneName } from '@/lib/delivery-charge'

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
      deliveryCharge: resolveDeliveryChargeByZoneName(zone.name),
      deliveryFee: resolveDeliveryChargeByZoneName(zone.name),
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
