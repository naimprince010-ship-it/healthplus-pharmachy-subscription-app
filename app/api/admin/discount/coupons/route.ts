import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { couponSchema } from '@/lib/validations/discount'
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
    const search = searchParams.get('search') || ''

    const now = new Date()

    type WhereClause = {
      isActive?: boolean
      startDate?: { lte: Date }
      endDate?: { gte: Date } | { lt: Date }
      code?: { contains: string; mode: 'insensitive' }
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

    if (search) {
      where.code = { contains: search, mode: 'insensitive' }
    }

    const coupons = await prisma.coupon.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { usages: true },
        },
      },
    })

    return NextResponse.json({ coupons })
  } catch (error) {
    console.error('Fetch coupons error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch coupons' },
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
    const validatedData = couponSchema.parse(body)

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

    const existingCoupon = await prisma.coupon.findUnique({
      where: { code: validatedData.code },
    })

    if (existingCoupon) {
      return NextResponse.json(
        { error: 'A coupon with this code already exists' },
        { status: 400 }
      )
    }

    const coupon = await prisma.coupon.create({
      data: {
        code: validatedData.code,
        discountType: validatedData.discountType,
        discountAmount: validatedData.discountAmount,
        minCartAmount: validatedData.minCartAmount || null,
        maxDiscount: validatedData.maxDiscount || null,
        usageLimit: validatedData.usageLimit || null,
        perUserLimit: validatedData.perUserLimit || null,
        startDate,
        endDate,
        isActive: validatedData.isActive,
        description: validatedData.description || null,
      },
    })

    return NextResponse.json({ coupon }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }
    console.error('Create coupon error:', error)
    return NextResponse.json(
      { error: 'Failed to create coupon' },
      { status: 500 }
    )
  }
}
