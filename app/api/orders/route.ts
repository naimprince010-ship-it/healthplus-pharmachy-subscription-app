import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { z } from 'zod'
import { addDays, format } from 'date-fns'
import { prisma } from '@/lib/prisma'
import { sendSMS, sendEmail } from '@/lib/notifications'
import { processOrderOtp } from '@/lib/settings/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const createOrderSchema = z.object({
  addressId: z.string().optional(),
  zoneId: z.string().optional(),
  items: z.array(
    z.object({
      medicineId: z.string().optional(),
      productId: z.string().optional(),
      membershipPlanId: z.string().optional(),
      quantity: z.number().int().positive(),
      price: z.number().positive(),
    }).refine((data) => data.medicineId || data.productId || data.membershipPlanId, {
      message: 'Either medicineId, productId, or membershipPlanId must be provided',
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

    // Separate membership items from regular items
    const membershipItems = items.filter(item => item.membershipPlanId)
    const regularItems = items.filter(item => !item.membershipPlanId)

    const medicineIds = regularItems.filter(item => item.medicineId).map(item => item.medicineId!)
    const productIds = regularItems.filter(item => item.productId).map(item => item.productId!)
    const membershipPlanIds = membershipItems.map(item => item.membershipPlanId!)
    
    const [medicines, products, membershipPlans] = await Promise.all([
      medicineIds.length > 0 ? prisma.medicine.findMany({
        where: { id: { in: medicineIds } },
      }) : Promise.resolve([]),
      productIds.length > 0 ? prisma.product.findMany({
        where: { id: { in: productIds } },
      }) : Promise.resolve([]),
      membershipPlanIds.length > 0 ? prisma.membershipPlan.findMany({
        where: { id: { in: membershipPlanIds }, isActive: true },
      }) : Promise.resolve([]),
    ])

    if (medicines.length !== medicineIds.length || products.length !== productIds.length) {
      return NextResponse.json({ error: 'Some items not found' }, { status: 400 })
    }

    if (membershipPlans.length !== membershipPlanIds.length) {
      return NextResponse.json({ error: 'Invalid membership plan' }, { status: 400 })
    }

    // Check if user already has an active membership (if trying to purchase membership)
    if (membershipItems.length > 0) {
      const existingMembership = await prisma.userMembership.findFirst({
        where: {
          userId: session.user.id,
          isActive: true,
          endDate: { gte: new Date() },
        },
      })

      if (existingMembership) {
        return NextResponse.json(
          { error: 'আপনার ইতিমধ্যে একটি সক্রিয় মেম্বারশিপ আছে' },
          { status: 400 }
        )
      }
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

        // Fetch cart settings to get free delivery threshold
        const cartSettings = await prisma.cartPageSettings.findFirst()
        const freeDeliveryThreshold = cartSettings?.freeDeliveryThreshold ?? 499

        // Calculate subtotal for regular items only (membership items are handled separately)
        const regularSubtotal = regularItems.reduce((sum, item) => {
      if (item.medicineId) {
        const medicine = medicines.find(m => m.id === item.medicineId)
        if (!medicine) return sum
        const price = medicine.discountPrice || medicine.price
        return sum + price * item.quantity
      } else if (item.productId) {
        const product = products.find(p => p.id === item.productId)
        if (!product) return sum
        const price = product.sellingPrice
        return sum + price * item.quantity
      }
      return sum
    }, 0)

        // Calculate membership total
        const membershipTotal = membershipItems.reduce((sum, item) => {
          const plan = membershipPlans.find(p => p.id === item.membershipPlanId)
          if (!plan) return sum
          return sum + plan.price * item.quantity
        }, 0)

        const subtotal = regularSubtotal + membershipTotal
    
        const discount = membership ? subtotal * (membership.plan.discountPercent / 100) : 0
        // Apply free delivery if subtotal meets the threshold
        const qualifiesForFreeDelivery = subtotal >= freeDeliveryThreshold
        const deliveryCharge = qualifiesForFreeDelivery ? 0 : address.zone.deliveryCharge
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
          create: regularItems.map((item) => {
            if (item.medicineId) {
              const medicine = medicines.find(m => m.id === item.medicineId)!
              const price = medicine.discountPrice || medicine.price
              return {
                medicineId: item.medicineId,
                quantity: item.quantity,
                price,
                discount: 0,
                total: price * item.quantity,
              }
            } else {
              const product = products.find(p => p.id === item.productId)!
              const price = product.sellingPrice
              return {
                productId: item.productId,
                quantity: item.quantity,
                price,
                discount: 0,
                total: price * item.quantity,
              }
            }
          }),
        },
      },
      include: {
        items: {
          include: {
            medicine: true,
            product: true,
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

    // Create membership records for any membership items in the order
    for (const membershipItem of membershipItems) {
      const plan = membershipPlans.find(p => p.id === membershipItem.membershipPlanId)
      if (!plan) continue

      const startDate = new Date()
      const endDate = addDays(startDate, plan.durationDays)

      const newMembership = await prisma.userMembership.create({
        data: {
          userId: session.user.id,
          planId: plan.id,
          startDate,
          endDate,
          isActive: true,
        },
        include: {
          plan: true,
          user: {
            select: {
              name: true,
              phone: true,
            },
          },
        },
      })

      // Send membership purchase notification
      await Promise.all([
        sendSMS(newMembership.user.phone, 'MEMBERSHIP_PURCHASED', {
          name: newMembership.user.name,
          expiresAt: format(endDate, 'MMM dd, yyyy'),
        }),
        sendEmail(`${newMembership.user.phone}@example.com`, 'MEMBERSHIP_PURCHASED', {
          name: newMembership.user.name,
          expiresAt: format(endDate, 'MMM dd, yyyy'),
        }),
      ])
    }

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

    // Process Order OTP based on admin settings (logs action for now, SMS integration in future)
    await processOrderOtp('order_created', {
      orderId: order.orderNumber,
      amount: order.total,
      customerName: order.user.name || 'Customer',
      shippingPhone: address.phone || order.user.phone,
      billingPhone: order.user.phone,
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
            product: true,
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
