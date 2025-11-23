import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function PUT(request: Request, context: RouteContext) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await context.params
    const body = await request.json()
    const { status, nextDelivery } = body

    const subscription = await prisma.subscription.update({
      where: { id: parseInt(id) },
      data: {
        status,
        nextDelivery: nextDelivery ? new Date(nextDelivery) : undefined,
      },
      include: {
        plan: true,
        zone: true,
        user: {
          select: { name: true, phone: true, email: true },
        },
      },
    })

    return NextResponse.json(subscription)
  } catch (error) {
    console.error('Error updating subscription:', error)
    return NextResponse.json(
      { error: 'Failed to update subscription' },
      { status: 500 }
    )
  }
}
