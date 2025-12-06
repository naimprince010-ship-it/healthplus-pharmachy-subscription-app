import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { updateCouponSchema } from '@/lib/validations/discount'
import { z } from 'zod'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const coupon = await prisma.coupon.findUnique({
      where: { id },
      include: {
        _count: {
          select: { usages: true },
        },
      },
    })

    if (!coupon) {
      return NextResponse.json({ error: 'Coupon not found' }, { status: 404 })
    }

    return NextResponse.json({ coupon })
  } catch (error) {
    console.error('Fetch coupon error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch coupon' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const validatedData = updateCouponSchema.parse(body)

    const existingCoupon = await prisma.coupon.findUnique({
      where: { id },
    })

    if (!existingCoupon) {
      return NextResponse.json({ error: 'Coupon not found' }, { status: 404 })
    }

    const updateData: Record<string, unknown> = {}

    if (validatedData.discountType !== undefined) updateData.discountType = validatedData.discountType
    if (validatedData.discountAmount !== undefined) updateData.discountAmount = validatedData.discountAmount
    if (validatedData.minCartAmount !== undefined) updateData.minCartAmount = validatedData.minCartAmount
    if (validatedData.maxDiscount !== undefined) updateData.maxDiscount = validatedData.maxDiscount
    if (validatedData.usageLimit !== undefined) updateData.usageLimit = validatedData.usageLimit
    if (validatedData.perUserLimit !== undefined) updateData.perUserLimit = validatedData.perUserLimit
    if (validatedData.isActive !== undefined) updateData.isActive = validatedData.isActive
    if (validatedData.description !== undefined) updateData.description = validatedData.description

    if (validatedData.startDate !== undefined) {
      updateData.startDate = new Date(validatedData.startDate)
    }
    if (validatedData.endDate !== undefined) {
      updateData.endDate = new Date(validatedData.endDate)
    }

    const startDate = updateData.startDate as Date | undefined ?? existingCoupon.startDate
    const endDate = updateData.endDate as Date | undefined ?? existingCoupon.endDate

    if (endDate <= startDate) {
      return NextResponse.json(
        { error: 'End date must be after start date' },
        { status: 400 }
      )
    }

    const discountType = (updateData.discountType as string | undefined) ?? existingCoupon.discountType
    const discountAmount = (updateData.discountAmount as number | undefined) ?? existingCoupon.discountAmount

    if (discountType === 'PERCENTAGE' && discountAmount > 100) {
      return NextResponse.json(
        { error: 'Percentage discount cannot exceed 100%' },
        { status: 400 }
      )
    }

    const coupon = await prisma.coupon.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({ coupon })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }
    console.error('Update coupon error:', error)
    return NextResponse.json(
      { error: 'Failed to update coupon' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const existingCoupon = await prisma.coupon.findUnique({
      where: { id },
    })

    if (!existingCoupon) {
      return NextResponse.json({ error: 'Coupon not found' }, { status: 404 })
    }

    await prisma.coupon.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete coupon error:', error)
    return NextResponse.json(
      { error: 'Failed to delete coupon' },
      { status: 500 }
    )
  }
}
