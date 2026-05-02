import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getCheckoutPricingQuote } from '@/lib/order-pricing-quote'
import {
  deductionFromCouponRule,
  validateCouponApplicability,
} from '@/lib/coupon-checkout'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const bodySchema = z.object({
  code: z.string().trim().min(1),
  items: z
    .array(
      z
        .object({
          medicineId: z.string().optional(),
          productId: z.string().optional(),
          membershipPlanId: z.string().optional(),
          quantity: z.number().int().positive(),
        })
        .refine((d) => d.medicineId || d.productId || d.membershipPlanId, {
          message: 'Line item missing id',
        })
    )
    .min(1),
})

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const parsed = bodySchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    const { code, items } = parsed.data
    const normalized = code.trim().toUpperCase()

    const quote = await getCheckoutPricingQuote({
      userId: session.user.id,
      items,
    })
    if (!quote.ok) {
      return NextResponse.json(
        { error: quote.error },
        { status: quote.status ?? 400 }
      )
    }

    const coupon = await prisma.coupon.findFirst({
      where: { code: normalized },
    })
    if (!coupon) {
      return NextResponse.json({ error: 'কুপন কোড সঠিক নয়' }, { status: 400 })
    }

    const userUsageCount = await prisma.couponUsage.count({
      where: { couponId: coupon.id, userId: session.user.id },
    })

    const check = validateCouponApplicability({
      coupon,
      eligibleSubtotal: quote.eligibleForCoupon,
      userUsageCount,
    })
    if (!check.ok) {
      return NextResponse.json({ error: check.message }, { status: 400 })
    }

    const discountAmount = deductionFromCouponRule(coupon, quote.eligibleForCoupon)

    return NextResponse.json({
      valid: true,
      code: coupon.code,
      discountAmount,
      eligibleSubtotal: quote.eligibleForCoupon,
    })
  } catch (e) {
    console.error('POST /api/coupons/validate', e)
    return NextResponse.json({ error: 'কুপন যাচাই ব্যর্থ' }, { status: 500 })
  }
}
