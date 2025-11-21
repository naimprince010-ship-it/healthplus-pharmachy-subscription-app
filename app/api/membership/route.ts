import { NextRequest, NextResponse } from 'next/server'
import { addDays } from 'date-fns'
import { auth } from '@/lib/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { planId } = await request.json()
    const { prisma } = await import('@/lib/prisma')

    const plan = await prisma.membershipPlan.findUnique({
      where: { id: planId },
    })

    if (!plan || !plan.isActive) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
    }

    const existingMembership = await prisma.userMembership.findFirst({
      where: {
        userId: session.user.id,
        isActive: true,
        endDate: { gte: new Date() },
      },
    })

    if (existingMembership) {
      return NextResponse.json(
        { error: 'You already have an active membership' },
        { status: 400 }
      )
    }

    const startDate = new Date()
    const endDate = addDays(startDate, plan.durationDays)

    const membership = await prisma.userMembership.create({
      data: {
        userId: session.user.id,
        planId: plan.id,
        startDate,
        endDate,
        isActive: true,
      },
      include: {
        plan: true,
      },
    })

    return NextResponse.json({ success: true, membership })
  } catch (error) {
    console.error('Membership creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create membership' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const session = await auth()
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { prisma } = await import('@/lib/prisma')
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

    return NextResponse.json({ membership })
  } catch (error) {
    console.error('Fetch membership error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch membership' },
      { status: 500 }
    )
  }
}
