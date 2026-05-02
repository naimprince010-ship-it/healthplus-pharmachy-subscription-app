import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const createAddressSchema = z.object({
  fullName: z.string().trim().min(1),
  phone: z.string().trim().min(10),
  addressLine1: z.string().trim().min(1),
  addressLine2: z.string().trim().optional(),
  city: z.string().trim().min(1),
  zoneId: z.string().min(1),
  isDefault: z.boolean().optional(),
})

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const rows = await prisma.address.findMany({
      where: { userId: session.user.id, hiddenFromCheckout: false },
      include: { zone: { select: { id: true, name: true, deliveryCharge: true } } },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    })

    const addresses = rows.map((a) => ({
      id: a.id,
      fullName: a.fullName,
      phone: a.phone,
      addressLine1: a.addressLine1,
      addressLine2: a.addressLine2,
      city: a.city,
      zoneId: a.zoneId,
      zoneName: a.zone.name,
      deliveryCharge: a.zone.deliveryCharge,
      isDefault: a.isDefault,
      fullAddress: [a.addressLine1, a.addressLine2, a.city]
        .filter(Boolean)
        .join(', '),
    }))

    return NextResponse.json({ addresses })
  } catch (e) {
    console.error('GET /api/addresses', e)
    return NextResponse.json({ error: 'Failed to load addresses' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const parsed = createAddressSchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid address', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { isDefault, ...data } = parsed.data

    const zone = await prisma.zone.findUnique({ where: { id: data.zoneId } })
    if (!zone) {
      return NextResponse.json({ error: 'Invalid delivery zone' }, { status: 400 })
    }

    const addr = await prisma.$transaction(async (tx) => {
      if (isDefault) {
        await tx.address.updateMany({
          where: { userId: session.user.id },
          data: { isDefault: false },
        })
      }
      return tx.address.create({
        data: {
          userId: session.user.id,
          ...data,
          isDefault: isDefault ?? false,
        },
        include: { zone: { select: { id: true, name: true, deliveryCharge: true } } },
      })
    })

    return NextResponse.json({
      address: {
        id: addr.id,
        fullName: addr.fullName,
        phone: addr.phone,
        addressLine1: addr.addressLine1,
        addressLine2: addr.addressLine2,
        city: addr.city,
        zoneId: addr.zoneId,
        zoneName: addr.zone.name,
        deliveryCharge: addr.zone.deliveryCharge,
        isDefault: addr.isDefault,
        fullAddress: [addr.addressLine1, addr.addressLine2, addr.city]
          .filter(Boolean)
          .join(', '),
      },
    })
  } catch (e) {
    console.error('POST /api/addresses', e)
    return NextResponse.json({ error: 'Failed to save address' }, { status: 500 })
  }
}
