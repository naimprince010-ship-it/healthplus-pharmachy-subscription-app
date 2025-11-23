import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

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

    const existing = await prisma.subscriptionPlan.findUnique({
      where: { slug },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'A plan with this slug already exists' },
        { status: 400 }
      )
    }

    const plan = await prisma.subscriptionPlan.create({
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

    return NextResponse.json(plan, { status: 201 })
  } catch (error) {
    console.error('Error creating subscription plan:', error)
    return NextResponse.json(
      { error: 'Failed to create subscription plan' },
      { status: 500 }
    )
  }
}
