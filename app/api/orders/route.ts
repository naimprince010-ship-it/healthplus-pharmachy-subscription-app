import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const createOrderSchema = z.object({
  addressId: z.string(),
  items: z.array(
    z.object({
      medicineId: z.string(),
      quantity: z.number().int().positive(),
      price: z.number().positive(),
    })
  ).min(1),
  paymentMethod: z.enum(['COD', 'ONLINE']),
  notes: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validationResult = createOrderSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      )
    }

    const { addressId, items, paymentMethod, notes } = validationResult.data

    const address = await prisma.address.findUnique({
      where: { id: addressId },
      include: { zone: true },
    })

    if (!address) {
      return NextResponse.json({ error: 'Invalid address' }, { status: 400 })
    }

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

    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
    const discount = membership ? subtotal * (membership.plan.discountPercent / 100) : 0
    const deliveryCharge = address.zone.deliveryCharge
    const total = subtotal - discount + deliveryCharge

    const orderNumber = `ORD-${Date.now()}`

    const order = await prisma.order.create({
      data: {
        orderNumber,
        userId: session.user.id,
        addressId,
        subtotal,
        discount,
        deliveryCharge,
        total,
        paymentMethod,
        status: 'PENDING',
        notes,
        items: {
          create: items.map((item) => ({
            medicineId: item.medicineId,
            quantity: item.quantity,
            price: item.price,
            discount: 0,
            total: item.price * item.quantity,
          })),
        },
      },
      include: {
        items: {
          include: {
            medicine: true,
          },
        },
      },
    })

    return NextResponse.json({ success: true, order }, { status: 201 })
  } catch (error) {
    console.error('Order creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const orders = await prisma.order.findMany({
      where: { userId: session.user.id },
      include: {
        items: {
          include: {
            medicine: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ orders })
  } catch (error) {
    console.error('Fetch orders error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    )
  }
}
