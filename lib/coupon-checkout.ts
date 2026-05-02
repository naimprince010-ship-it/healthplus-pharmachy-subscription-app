import type { Coupon } from '@prisma/client'

/** Amount coupon can apply to (after membership % on subtotal, before delivery). */
export function deductionFromCouponRule(
  coupon: Pick<Coupon, 'discountType' | 'discountAmount' | 'maxDiscount'>,
  eligibleSubtotal: number
): number {
  const base = Math.max(0, eligibleSubtotal)
  if (base <= 0) return 0

  let raw = 0
  if (coupon.discountType === 'PERCENTAGE') {
    raw = (base * coupon.discountAmount) / 100
    if (coupon.maxDiscount != null && coupon.maxDiscount > 0) {
      raw = Math.min(raw, coupon.maxDiscount)
    }
  } else {
    raw = Math.min(coupon.discountAmount, base)
  }

  return Math.round(raw * 100) / 100
}

export function validateCouponApplicability(params: {
  coupon: Coupon
  now?: Date
  eligibleSubtotal: number
  userUsageCount: number
}): { ok: true } | { ok: false; message: string } {
  const now = params.now ?? new Date()
  const { coupon } = params

  if (!coupon.isActive) {
    return { ok: false, message: 'এই কুপন সক্রিয় নয়' }
  }
  if (now < coupon.startDate || now > coupon.endDate) {
    return { ok: false, message: 'কুপনের মেয়াদ শেষ বা এখনো শুরু হয়নি' }
  }
  if (coupon.usageLimit != null && coupon.usageCount >= coupon.usageLimit) {
    return { ok: false, message: 'কুপন ব্যবহারের সীমা পূর্ণ হয়েছে' }
  }
  if (
    coupon.minCartAmount != null &&
    params.eligibleSubtotal < coupon.minCartAmount
  ) {
    return {
      ok: false,
      message: `সর্বনিম্ন অর্ডার ৳${coupon.minCartAmount}`,
    }
  }
  if (
    coupon.perUserLimit != null &&
    params.userUsageCount >= coupon.perUserLimit
  ) {
    return { ok: false, message: 'আপনি এই কুপন ইতিমধ্যে ব্যবহার করেছেন' }
  }

  const deduction = deductionFromCouponRule(coupon, params.eligibleSubtotal)
  if (deduction <= 0) {
    return { ok: false, message: 'কোন ছাড় প্রযোজ্য নয়' }
  }

  return { ok: true }
}
