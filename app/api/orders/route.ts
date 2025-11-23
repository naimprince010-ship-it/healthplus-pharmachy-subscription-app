import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { sendSMS, sendEmail } from '@/lib/notifications'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const createOrderSchema = z.object({
  addressId: z.string().optional(),
  zoneId: z.string().optional(),
  items: z.array(
    z.object({
      medicineId: z.string(),
      quantity: z.number().int().positive(),
      price: z.number().positive(),
    })
  ).min(1),
  paymentMethod: z.enum(['COD', 'ONLINE']),
  notes: z.string().optional(),
}).refine((data) => data.addressId || data.zoneId, {
  message: 'Either addressId or zoneId must be provided',
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

    const { addressId, zoneId, items, paymentMethod, notes } = validationResult.data

    let address
    let finalAddressId: string
    let finalZoneId: string

    if (addressId) {
      address = await prisma.address.findUnique({
        where: { id: addressId },
        include: { zone: true },
      })

      if (!address) {
        return NextResponse.json({ error: 'Invalid address' }, { status: 400 })
      }
      finalAddressId = addressId
      finalZoneId = address.zoneId
    } else if (zoneId) {
      const zone = await prisma.zone.findUnique({
        where: { id: zoneId },
      })

      if (!zone) {
        return NextResponse.json({ error: 'Invalid zone' }, { status: 400 })
      }
      finalZoneId = zoneId

      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { name: true, phone: true },
      })

      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 400 })
      }

      address = await prisma.address.create({
        data: {
          userId: session.user.id,
          fullName: user.name,
          phone: user.phone,
          addressLine1: 'N/A',
          city: 'N/A',
          zoneId: zoneId,
          isDefault: false,
        },
        include: { zone: true },
      })
      finalAddressId = address.id
    } else {
      return NextResponse.json({ error: 'Address or zone required' }, { status: 400 })
    }

    const medicineIds = items.map(item => item.medicineId)
    const medicines = await prisma.medicine.findMany({
      where: { id: { in: medicineIds } },
    })

    if (medicines.length !== items.length) {
      return NextResponse.json({ error: 'Some medicines not found' }, { status: 400 })
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

    const subtotal = items.reduce((sum, item) => {
      const medicine = medicines.find(m => m.id === item.medicineId)
      if (!medicine) return sum
      const price = medicine.discountPrice || medicine.price
      return sum + price * item.quantity
    }, 0)
    
    const discount = membership ? subtotal * (membership.plan.discountPercent / 100) : 0
    const deliveryCharge = address.zone.deliveryCharge
    const total = subtotal - discount + deliveryCharge

    const orderNumber = `ORD-${Date.now()}`

    const order = await prisma.order.create({
      data: {
        orderNumber,
        userId: session.user.id,
        addressId: finalAddressId,
        zoneId: finalZoneId,
        subtotal,
        discount,
        membershipDiscountAmount: discount > 0 ? discount : null,
        membershipPlanName: membership ? membership.plan.name : null,
        deliveryCharge,
        total,
        paymentMethod,
        status: 'PENDING',
        notes,
        items: {
          create: items.map((item) => {
            const medicine = medicines.find(m => m.id === item.medicineId)!
            const price = medicine.discountPrice || medicine.price
            return {
              medicineId: item.medicineId,
              quantity: item.quantity,
              price,
              discount: 0,
              total: price * item.quantity,
            }
          }),
        },
      },
      include: {
        items: {
          include: {
            medicine: true,
          },
        },
        user: {
          select: {
            name: true,
            phone: true,
          },
        },
      },
    })

    await Promise.all([
      sendSMS(order.user.phone, 'ORDER_CONFIRMED', {
        name: order.user.name,
        orderNumber: order.orderNumber,
        total: order.total,
      }),
      sendEmail(`${order.user.phone}@example.com`, 'ORDER_CONFIRMED', {
        name: order.user.name,
        orderNumber: order.orderNumber,
        total: order.total,
      }),
    ])

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
