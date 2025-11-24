import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { addDays, format } from 'date-fns'
import { sendSMS, sendEmail } from '@/lib/notifications'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const createSubscriptionSchema = z.object({
  planId: z.number(),
  fullName: z.string(),
  phone: z.string(),
  address: z.string(),
  zoneId: z.string(),
})

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validationResult = createSubscriptionSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      )
    }

    const { planId, fullName, phone, address, zoneId } = validationResult.data

    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: planId },
    })

    if (!plan || !plan.isActive) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
    }

    const existingSubscription = await prisma.subscription.findFirst({
      where: {
        userId: session.user.id,
        planId,
        status: { in: ['pending', 'active'] },
      },
    })

    if (existingSubscription) {
      return NextResponse.json(
        { error: 'You already have an active subscription to this plan' },
        { status: 400 }
      )
    }

    const startDate = new Date()
    const nextDelivery = addDays(startDate, 30)

    const subscription = await prisma.subscription.create({
      data: {
        userId: session.user.id,
        planId: plan.id,
        pricePerPeriod: plan.priceMonthly,
        status: 'pending',
        paymentStatus: 'unpaid',
        paymentMethod: body.paymentMethod || 'cod',
        startDate,
        nextDelivery,
        address,
        zoneId,
      },
      include: {
        plan: true,
        zone: true,
        user: {
          select: {
            name: true,
            phone: true,
          },
        },
      },
    })

    await Promise.all([
      sendSMS(phone, 'SUBSCRIPTION_STARTED', {
        name: fullName,
        planName: subscription.plan.name,
        nextDelivery: format(nextDelivery, 'MMM dd, yyyy'),
      }),
      sendEmail(`${phone}@example.com`, 'SUBSCRIPTION_STARTED', {
        name: fullName,
        planName: subscription.plan.name,
        nextDelivery: format(nextDelivery, 'MMM dd, yyyy'),
      }),
    ])

    return NextResponse.json({ success: true, subscription }, { status: 201 })
  } catch (error) {
    console.error('Subscription creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create subscription' },
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

    const subscriptions = await prisma.subscription.findMany({
      where: { userId: session.user.id },
      include: {
        plan: true,
        zone: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ subscriptions })
  } catch (error) {
    console.error('Fetch subscriptions error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch subscriptions' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id, status } = await request.json()

    const subscription = await prisma.subscription.update({
      where: {
        id,
        userId: session.user.id,
      },
      data: { status },
    })

    return NextResponse.json({ success: true, subscription })
  } catch (error) {
    console.error('Update subscription error:', error)
    return NextResponse.json(
      { error: 'Failed to update subscription' },
      { status: 500 }
    )
  }
}
