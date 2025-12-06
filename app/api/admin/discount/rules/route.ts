import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { discountRuleSchema } from '@/lib/validations/discount'
import { z } from 'zod'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'all'
    const ruleType = searchParams.get('ruleType')

    const now = new Date()

    type WhereClause = {
      isActive?: boolean
      startDate?: { lte: Date }
      endDate?: { gte: Date } | { lt: Date }
      ruleType?: 'CATEGORY' | 'BRAND' | 'CART_AMOUNT' | 'USER_GROUP'
      AND?: Array<{ startDate?: { gt: Date }; endDate?: { gte: Date } }>
    }

    const where: WhereClause = {}

    if (status === 'active') {
      where.isActive = true
      where.startDate = { lte: now }
      where.endDate = { gte: now }
    } else if (status === 'upcoming') {
      where.isActive = true
      where.AND = [{ startDate: { gt: now } }]
    } else if (status === 'expired') {
      where.endDate = { lt: now }
    }

    if (ruleType && ['CATEGORY', 'BRAND', 'CART_AMOUNT', 'USER_GROUP'].includes(ruleType)) {
      where.ruleType = ruleType as 'CATEGORY' | 'BRAND' | 'CART_AMOUNT' | 'USER_GROUP'
    }

    const rules = await prisma.discountRule.findMany({
      where,
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
      include: {
        _count: {
          select: { logs: true },
        },
      },
    })

    return NextResponse.json({ rules })
  } catch (error) {
    console.error('Fetch discount rules error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch discount rules' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = discountRuleSchema.parse(body)

    const startDate = new Date(validatedData.startDate)
    const endDate = new Date(validatedData.endDate)

    if (endDate <= startDate) {
      return NextResponse.json(
        { error: 'End date must be after start date' },
        { status: 400 }
      )
    }

    if (validatedData.discountType === 'PERCENTAGE' && validatedData.discountAmount > 100) {
      return NextResponse.json(
        { error: 'Percentage discount cannot exceed 100%' },
        { status: 400 }
      )
    }

    if (validatedData.ruleType === 'CATEGORY' && validatedData.targetValue) {
      const category = await prisma.category.findUnique({
        where: { id: validatedData.targetValue },
      })
      if (!category) {
        return NextResponse.json(
          { error: 'Category not found' },
          { status: 400 }
        )
      }
    }

    if (validatedData.ruleType === 'BRAND' && validatedData.targetValue) {
      const manufacturer = await prisma.manufacturer.findUnique({
        where: { id: validatedData.targetValue },
      })
      if (!manufacturer) {
        return NextResponse.json(
          { error: 'Manufacturer/Brand not found' },
          { status: 400 }
        )
      }
    }

    const rule = await prisma.discountRule.create({
      data: {
        name: validatedData.name,
        ruleType: validatedData.ruleType,
        targetValue: validatedData.targetValue || null,
        discountType: validatedData.discountType,
        discountAmount: validatedData.discountAmount,
        minCartAmount: validatedData.minCartAmount || null,
        startDate,
        endDate,
        priority: validatedData.priority,
        isActive: validatedData.isActive,
        description: validatedData.description || null,
      },
    })

    return NextResponse.json({ rule }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }
    console.error('Create discount rule error:', error)
    return NextResponse.json(
      { error: 'Failed to create discount rule' },
      { status: 500 }
    )
  }
}
