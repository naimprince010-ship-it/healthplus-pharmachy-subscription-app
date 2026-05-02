import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const createBody = z.object({
  fullName: z.string().min(1).max(120),
  phone: z.string().min(8).max(20),
  addressLine1: z.string().min(1).max(500),
  addressLine2: z.string().max(500).optional().nullable(),
  city: z.string().min(1).max(120),
  zoneId: z.string().min(1),
  isDefault: z.boolean().optional(),
})

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const addresses = await prisma.address.findMany({
    where: { userId: session.user.id, hiddenFromCheckout: false },
    orderBy: [{ isDefault: 'desc' }, { updatedAt: 'desc' }],
    include: { zone: { select: { id: true, name: true } } },
  })

  return NextResponse.json({ addresses })
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const json = await request.json().catch(() => null)
  const parsed = createBody.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const { fullName, phone, addressLine1, addressLine2, city, zoneId, isDefault } =
    parsed.data

  const zone = await prisma.zone.findUnique({ where: { id: zoneId } })
  if (!zone) {
    return NextResponse.json({ error: 'Invalid zone' }, { status: 400 })
  }

  if (isDefault) {
    await prisma.address.updateMany({
      where: { userId: session.user.id },
      data: { isDefault: false },
    })
  }

  const address = await prisma.address.create({
    data: {
      userId: session.user.id,
      fullName,
      phone,
      addressLine1,
      addressLine2: addressLine2 || null,
      city,
      zoneId,
      isDefault: Boolean(isDefault),
    },
    include: { zone: { select: { id: true, name: true } } },
  })

  return NextResponse.json({ address })
}
