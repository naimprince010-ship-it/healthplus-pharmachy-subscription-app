import type { Medicine, MembershipPlan, Product } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { GROCERY_CATEGORY_SLUG, isGroceryShopEnabled, isMedicineShopEnabled } from '@/lib/site-features'

export type OrderLineInput = {
  medicineId?: string
  productId?: string
  membershipPlanId?: string
  quantity: number
}

type ProductWithCategory = Product & {
  category: { slug: string } | null
}

export type CheckoutPricingQuote =
  | { ok: false; error: string; status?: number }
  | {
      ok: true
      medicines: Medicine[]
      products: ProductWithCategory[]
      membershipPlans: MembershipPlan[]
      regularItems: OrderLineInput[]
      membershipItems: OrderLineInput[]
      regularSubtotal: number
      membershipTotal: number
      subtotal: number
      membershipDiscount: number
      eligibleForCoupon: number
      activeMembership: { plan: { name: string; discountPercent: number } } | null
    }

/** Server-side totals for checkout / coupon preview (matches POST /api/orders logic). */
export async function getCheckoutPricingQuote(params: {
  userId: string
  items: OrderLineInput[]
}): Promise<CheckoutPricingQuote> {
  const { userId, items } = params
  if (!items?.length) {
    return { ok: false, error: 'কার্ট খালি' }
  }

  const membershipItems = items.filter((item) => item.membershipPlanId)
  const regularItems = items.filter((item) => !item.membershipPlanId)

  const medicineIds = [...new Set(
    regularItems.filter((item) => item.medicineId).map((item) => item.medicineId!)
  )]
  const productIds = [...new Set(
    regularItems.filter((item) => item.productId).map((item) => item.productId!)
  )]
  const membershipPlanIds = membershipItems.map((item) => item.membershipPlanId!)

  const [medicines, products, membershipPlans, membership] = await Promise.all([
    medicineIds.length > 0
      ? prisma.medicine.findMany({
          where: {
            id: { in: medicineIds },
            isActive: true,
            inStock: true,
            stockQuantity: { gt: 0 },
          },
        })
      : Promise.resolve([]),
    productIds.length > 0
      ? prisma.product.findMany({
          where: {
            id: { in: productIds },
            isActive: true,
            inStock: true,
            stockQuantity: { gt: 0 },
          },
          include: { category: { select: { slug: true } } },
        })
      : Promise.resolve([]),
    membershipPlanIds.length > 0
      ? prisma.membershipPlan.findMany({
          where: { id: { in: membershipPlanIds }, isActive: true },
        })
      : Promise.resolve([]),
    prisma.userMembership.findFirst({
      where: {
        userId,
        isActive: true,
        endDate: { gte: new Date() },
      },
      include: { plan: true },
    }),
  ])

  if (medicines.length !== medicineIds.length || products.length !== productIds.length) {
    return { ok: false, error: 'কিছু পণ্য পাওয়া যায়নি' }
  }

  const insufficientStock = regularItems.some((item) => {
    if (item.medicineId) {
      const medicine = medicines.find((entry) => entry.id === item.medicineId)
      return !medicine || medicine.stockQuantity < item.quantity
    }
    if (item.productId) {
      const product = products.find((entry) => entry.id === item.productId)
      return !product || product.stockQuantity < item.quantity
    }
    return false
  })
  if (insufficientStock) {
    return { ok: false, error: 'এক বা একাধিক পণ্যের পর্যাপ্ত স্টক নেই', status: 409 }
  }
  if (!isMedicineShopEnabled()) {
    if (medicineIds.length > 0) {
      return {
        ok: false,
        error: 'Medicine orders are temporarily unavailable',
        status: 403,
      }
    }
    const blockedMedProduct = products.find((p) => p.type === 'MEDICINE')
    if (blockedMedProduct) {
      return {
        ok: false,
        error: 'Medicine products are temporarily unavailable',
        status: 403,
      }
    }
  }

  if (!isGroceryShopEnabled()) {
    const hasGrocery = products.some((p) => p.category?.slug === GROCERY_CATEGORY_SLUG)
    if (hasGrocery) {
      return { ok: false, error: 'Grocery is temporarily unavailable', status: 403 }
    }
  }

  if (membershipPlans.length !== membershipPlanIds.length) {
    return { ok: false, error: 'Invalid membership plan' }
  }

  const regularSubtotal = regularItems.reduce((sum, item) => {
    if (item.medicineId) {
      const medicine = medicines.find((m) => m.id === item.medicineId)
      if (!medicine) return sum
      const price = medicine.discountPrice || medicine.price
      return sum + price * item.quantity
    }
    if (item.productId) {
      const product = products.find((p) => p.id === item.productId)
      if (!product) return sum
      return sum + product.sellingPrice * item.quantity
    }
    return sum
  }, 0)

  const membershipTotal = membershipItems.reduce((sum, item) => {
    const plan = membershipPlans.find((p) => p.id === item.membershipPlanId)
    if (!plan) return sum
    return sum + plan.price * item.quantity
  }, 0)

  const subtotal = regularSubtotal + membershipTotal
  const membershipDiscount = membership ? subtotal * (membership.plan.discountPercent / 100) : 0
  const eligibleForCoupon = Math.max(0, Math.round((subtotal - membershipDiscount) * 100) / 100)

  return {
    ok: true,
    medicines,
    products,
    membershipPlans,
    regularItems,
    membershipItems,
    regularSubtotal,
    membershipTotal,
    subtotal,
    membershipDiscount,
    eligibleForCoupon,
    activeMembership: membership
      ? { plan: { name: membership.plan.name, discountPercent: membership.plan.discountPercent } }
      : null,
  }
}
