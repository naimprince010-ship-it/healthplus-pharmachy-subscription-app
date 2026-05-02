import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const patchBody = z
  .object({
    fullName: z.string().min(1).max(120).optional(),
    phone: z.string().min(8).max(20).optional(),
    addressLine1: z.string().min(1).max(500).optional(),
    addressLine2: z.string().max(500).optional().nullable(),
    city: z.string().min(1).max(120).optional(),
    zoneId: z.string().min(1).optional(),
    isDefault: z.boolean().optional(),
  })
  .refine((obj) => Object.keys(obj).length > 0, { message: 'No fields to update' })

async function ensureOwnAddress(userId: string, id: string) {
  const addr = await prisma.address.findFirst({
    where: { id, userId, hiddenFromCheckout: false },
    include: { zone: { select: { id: true, name: true } } },
  })
  return addr
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await context.params
  const existing = await ensureOwnAddress(session.user.id, id)
  if (!existing) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const json = await request.json().catch(() => null)
  const parsed = patchBody.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const data = parsed.data
  if (data.zoneId) {
    const zone = await prisma.zone.findUnique({ where: { id: data.zoneId } })
    if (!zone) {
      return NextResponse.json({ error: 'Invalid zone' }, { status: 400 })
    }
  }

  if (data.isDefault === true) {
    await prisma.address.updateMany({
      where: { userId: session.user.id, NOT: { id } },
      data: { isDefault: false },
    })
  }

  const address = await prisma.address.update({
    where: { id },
    data: {
      ...(data.fullName != null ? { fullName: data.fullName } : {}),
      ...(data.phone != null ? { phone: data.phone } : {}),
      ...(data.addressLine1 != null ? { addressLine1: data.addressLine1 } : {}),
      ...(data.addressLine2 !== undefined ? { addressLine2: data.addressLine2 } : {}),
      ...(data.city != null ? { city: data.city } : {}),
      ...(data.zoneId != null ? { zoneId: data.zoneId } : {}),
      ...(data.isDefault !== undefined ? { isDefault: data.isDefault } : {}),
    },
    include: { zone: { select: { id: true, name: true } } },
  })

  return NextResponse.json({ address })
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await context.params
  const existing = await prisma.address.findFirst({
    where: { id, userId: session.user.id },
  })
  if (!existing) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  if (existing.hiddenFromCheckout) {
    return NextResponse.json({ ok: true })
  }

  const usedInOrders = await prisma.order.count({ where: { addressId: id } })
  if (usedInOrders > 0) {
    await prisma.address.update({
      where: { id },
      data: { hiddenFromCheckout: true, isDefault: false },
    })
    return NextResponse.json({
      ok: true,
      softRemoved: true,
      message:
        'ঠিকানাটি তালিকা থেকে সরানো হয়েছে। পুরনো অর্ডারের জন্য এটি সিস্টেমে সংরক্ষিত আছে।',
    })
  }

  await prisma.address.delete({ where: { id } })
  return NextResponse.json({ ok: true, softRemoved: false })
}
