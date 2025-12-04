import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { membershipPlanSchema } from '@/lib/validations/membership'
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
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status')?.toUpperCase() || 'ALL'

    const where: {
      OR?: Array<{ name: { contains: string; mode: 'insensitive' } } | { description: { contains: string; mode: 'insensitive' } }>
      isActive?: boolean
    } = {}

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (status === 'ACTIVE') {
      where.isActive = true
    } else if (status === 'INACTIVE') {
      where.isActive = false
    }

    const plans = await prisma.membershipPlan.findMany({
      where,
      include: {
        _count: {
          select: { memberships: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ plans })
  } catch (error) {
    console.error('Fetch membership plans error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch membership plans' },
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
    const validatedData = membershipPlanSchema.parse(body)

    const existingName = await prisma.membershipPlan.findUnique({
      where: { name: validatedData.name },
    })
    if (existingName) {
      return NextResponse.json(
        { error: 'A membership plan with this name already exists' },
        { status: 400 }
      )
    }

    const plan = await prisma.membershipPlan.create({
      data: {
        name: validatedData.name,
        description: validatedData.description || null,
        price: validatedData.price,
        originalPrice: validatedData.originalPrice ?? null,
        durationDays: validatedData.durationDays,
        discountPercent: validatedData.discountPercent,
        badge: validatedData.badge ?? null,
        benefitsJson: validatedData.benefitsJson ?? null,
        ctaText: validatedData.ctaText ?? null,
        isHighlighted: validatedData.isHighlighted ?? false,
        sortOrder: validatedData.sortOrder ?? null,
        isActive: validatedData.isActive ?? true,
      },
    })

    return NextResponse.json({ plan }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }
    console.error('Create membership plan error:', error)
    return NextResponse.json(
      { error: 'Failed to create membership plan' },
      { status: 500 }
    )
  }
}
