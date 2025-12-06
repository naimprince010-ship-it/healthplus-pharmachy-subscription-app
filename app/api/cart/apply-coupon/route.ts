import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { applyCouponSchema } from '@/lib/validations/discount'
import { z } from 'zod'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = applyCouponSchema.parse(body)

    const session = await auth()
    const userId = session?.user?.id || validatedData.userId

    const now = new Date()

    const coupon = await prisma.coupon.findUnique({
      where: { code: validatedData.code.toUpperCase() },
    })

    if (!coupon) {
      return NextResponse.json(
        { error: 'Invalid coupon code' },
        { status: 400 }
      )
    }

    if (!coupon.isActive) {
      return NextResponse.json(
        { error: 'This coupon is no longer active' },
        { status: 400 }
      )
    }

    if (coupon.startDate > now) {
      return NextResponse.json(
        { error: 'This coupon is not yet active' },
        { status: 400 }
      )
    }

    if (coupon.endDate < now) {
      return NextResponse.json(
        { error: 'This coupon has expired' },
        { status: 400 }
      )
    }

    if (coupon.minCartAmount && validatedData.cartTotal < coupon.minCartAmount) {
      return NextResponse.json(
        { error: `Minimum cart amount of ৳${coupon.minCartAmount} required` },
        { status: 400 }
      )
    }

    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
      return NextResponse.json(
        { error: 'This coupon has reached its usage limit' },
        { status: 400 }
      )
    }

    if (userId && coupon.perUserLimit) {
      const userUsageCount = await prisma.couponUsage.count({
        where: {
          couponId: coupon.id,
          userId,
        },
      })

      if (userUsageCount >= coupon.perUserLimit) {
        return NextResponse.json(
          { error: 'You have already used this coupon the maximum number of times' },
          { status: 400 }
        )
      }
    }

    let discountAmount: number

    if (coupon.discountType === 'PERCENTAGE') {
      discountAmount = (validatedData.cartTotal * coupon.discountAmount) / 100
      if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
        discountAmount = coupon.maxDiscount
      }
    } else {
      discountAmount = coupon.discountAmount
      if (discountAmount > validatedData.cartTotal) {
        discountAmount = validatedData.cartTotal
      }
    }

    discountAmount = Math.round(discountAmount * 100) / 100

    return NextResponse.json({
      valid: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        discountType: coupon.discountType,
        discountAmount: coupon.discountAmount,
        maxDiscount: coupon.maxDiscount,
      },
      discount: discountAmount,
      finalTotal: validatedData.cartTotal - discountAmount,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }
    console.error('Apply coupon error:', error)
    return NextResponse.json(
      { error: 'Failed to apply coupon' },
      { status: 500 }
    )
  }
}
