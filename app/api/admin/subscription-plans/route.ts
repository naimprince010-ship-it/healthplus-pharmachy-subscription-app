import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { Prisma } from '@prisma/client'
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
      itemsJson,
      packageDetailLink,
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

    let resolvedItemsJson: Prisma.InputJsonValue | typeof Prisma.DbNull | undefined
    if (Object.prototype.hasOwnProperty.call(body, 'itemsJson')) {
      resolvedItemsJson =
        itemsJson === null ? Prisma.DbNull : (itemsJson as Prisma.InputJsonValue)
    }

    const featured = Boolean(isFeatured)
    const plan = await prisma.$transaction(async (tx) => {
      if (featured) {
        await tx.subscriptionPlan.updateMany({ data: { isFeatured: false } })
      }

      return tx.subscriptionPlan.create({
        data: {
          name,
          slug,
          shortDescription,
          itemsSummary,
          ...(resolvedItemsJson !== undefined ? { itemsJson: resolvedItemsJson } : {}),
          ...(Object.prototype.hasOwnProperty.call(body, 'packageDetailLink')
            ? {
                packageDetailLink:
                  typeof packageDetailLink === 'string' && packageDetailLink.trim()
                    ? packageDetailLink.trim().slice(0, 2000)
                    : null,
              }
            : {}),
          priceMonthly: parseInt(priceMonthly),
          bannerImageUrl,
          sortOrder: sortOrder ? parseInt(sortOrder) : null,
          isFeatured: featured,
          isActive: Boolean(isActive),
        },
      })
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
