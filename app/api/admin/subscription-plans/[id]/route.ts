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
    const {
      name,
      slug,
      shortDescription,
      itemsSummary,
      priceMonthly,
      bannerImageUrl,
      sortOrder,
      isFeatured,
      isActive,
    } = body

    if (!name || !slug || !priceMonthly) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const existing = await prisma.subscriptionPlan.findFirst({
      where: {
        slug,
        id: { not: parseInt(id) },
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'A plan with this slug already exists' },
        { status: 400 }
      )
    }

    const plan = await prisma.subscriptionPlan.update({
      where: { id: parseInt(id) },
      data: {
        name,
        slug,
        shortDescription,
        itemsSummary,
        priceMonthly: parseInt(priceMonthly),
        bannerImageUrl,
        sortOrder: sortOrder ? parseInt(sortOrder) : null,
        isFeatured: Boolean(isFeatured),
        isActive: Boolean(isActive),
      },
    })

    return NextResponse.json(plan)
  } catch (error) {
    console.error('Error updating subscription plan:', error)
    return NextResponse.json(
      { error: 'Failed to update subscription plan' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await context.params

    await prisma.subscriptionPlan.update({
      where: { id: parseInt(id) },
      data: { isActive: false },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting subscription plan:', error)
    return NextResponse.json(
      { error: 'Failed to delete subscription plan' },
      { status: 500 }
    )
  }
}
