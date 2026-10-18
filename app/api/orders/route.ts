import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { sendSMS, sendEmail } from '@/lib/notifications'
import { processOrderOtp } from '@/lib/settings/server'
import { resolveDeliveryChargeForZone } from '@/lib/delivery-charge'
import { getCheckoutPricingQuote } from '@/lib/order-pricing-quote'
import {
  deductionFromCouponRule,
  validateCouponApplicability,
} from '@/lib/coupon-checkout'
import {
  initialPaymentStatus,
  orderReadyForFulfillment,
} from '@/lib/order-payment-status'
import { generateOrderNumber } from '@/lib/utils'
import { InventoryUnavailableError, reserveOrderInventory } from '@/lib/order-inventory'
import { lockCouponUsageForUser } from '@/lib/coupon-usage-lock'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const createOrderSchema = z.object({
  addressId: z.string().optional(),
  zoneId: z.string().optional(),
  items: z.array(
    z.object({
      medicineId: z.string().optional(),
      productId: z.string().optional(),
      membershipPlanId: z.string().optional(),
      quantity: z.number().int().positive(),
      price: z.number().positive(),
    }).refine((data) => [data.medicineId, data.productId, data.membershipPlanId].filter(Boolean).length === 1, {
      message: 'Exactly one of medicineId, productId, or membershipPlanId must be provided',
    })
  ).min(1),
  paymentMethod: z.enum(['COD', 'ONLINE']),
  notes: z.string().optional(),
  couponCode: z.string().optional(),
}).refine((data) => data.addressId || data.zoneId, {
  message: 'Either addressId or zoneId must be provided',
})

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const checkoutRequestId = request.headers.get('idempotency-key')?.trim()
    if (!checkoutRequestId || !/^[A-Za-z0-9_-]{20,100}$/.test(checkoutRequestId)) {
      return NextResponse.json(
        { error: 'A valid Idempotency-Key header is required' },
        { status: 400 }
      )
    }

    const previousOrder = await prisma.order.findFirst({
      where: { userId: session.user.id, checkoutRequestId },
      include: {
        items: { include: { medicine: true, product: true } },
        user: { select: { name: true, phone: true } },
      },
    })
    if (previousOrder) {
      return NextResponse.json(
        { success: true, order: previousOrder, idempotent: true },
        { status: 200 }
      )
    }

    const body = await request.json()
    const validationResult = createOrderSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      )
    }

    const { addressId, zoneId, items, paymentMethod, notes, couponCode } =
      validationResult.data

    // No payment gateway or settlement callback exists yet (audit P1-02); only COD is accepted.
    if (paymentMethod !== 'COD') {
      return NextResponse.json(
        { error: 'অনলাইন পেমেন্ট সাময়িকভাবে বন্ধ আছে। ক্যাশ অন ডেলিভারি বেছে নিন।' },
        { status: 400 }
      )
    }

    // Membership entitlements must wait for verified settlement (audit P0-04).
    if (items.some((item) => item.membershipPlanId)) {
      return NextResponse.json(
        { error: 'মেম্বারশিপ কেনা সাময়িকভাবে বন্ধ আছে। কার্ট থেকে মেম্বারশিপ সরিয়ে আবার চেষ্টা করুন।' },
        { status: 400 }
      )
    }

    let address
    let finalAddressId: string
    let finalZoneId: string

    if (addressId) {
      address = await prisma.address.findUnique({
        where: { id: addressId },
        include: { zone: true },
      })

      if (!address) {
        return NextResponse.json({ error: 'Invalid address' }, { status: 400 })
      }
      if (address.userId !== session.user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
      if (address.hiddenFromCheckout || !address.zone.isActive) {
        return NextResponse.json({ error: 'Delivery address is unavailable' }, { status: 409 })
      }
      finalAddressId = addressId
      finalZoneId = address.zoneId
    } else if (zoneId) {
      const zone = await prisma.zone.findUnique({
        where: { id: zoneId },
      })

      if (!zone?.isActive) {
        return NextResponse.json({ error: 'Invalid zone' }, { status: 400 })
      }
      finalZoneId = zoneId

      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { name: true, phone: true },
      })

      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 400 })
      }

      address = await prisma.address.create({
        data: {
          userId: session.user.id,
          fullName: user.name,
          phone: user.phone,
          addressLine1: 'N/A',
          city: 'N/A',
          zoneId: zoneId,
          isDefault: false,
        },
        include: { zone: true },
      })
      finalAddressId = address.id
    } else {
      return NextResponse.json({ error: 'Address or zone required' }, { status: 400 })
    }

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

    const {
      regularItems,
      medicines,
      products,
      subtotal,
      membershipDiscount,
      eligibleForCoupon,
      activeMembership,
    } = quote

    const cartSettings = await prisma.cartPageSettings.findFirst()
    const freeDeliveryThreshold = cartSettings?.freeDeliveryThreshold ?? null
    const qualifiesForFreeDelivery =
      freeDeliveryThreshold !== null && freeDeliveryThreshold > 0 && subtotal >= freeDeliveryThreshold
    const deliveryCharge = qualifiesForFreeDelivery
      ? 0
      : resolveDeliveryChargeForZone(address.zone)

    const normalizedCoupon = couponCode?.trim().toUpperCase() || ''
    let couponPreviewDiscount = 0

    if (normalizedCoupon) {
      const cPreview = await prisma.coupon.findUnique({
        where: { code: normalizedCoupon },
      })
      if (!cPreview) {
        return NextResponse.json(
          { error: 'কুপন কোড সঠিক নয়' },
          { status: 400 }
        )
      }
      const userUses = await prisma.couponUsage.count({
        where: {
          couponId: cPreview.id,
          userId: session.user.id,
        },
      })
      const chk = validateCouponApplicability({
        coupon: cPreview,
        eligibleSubtotal: eligibleForCoupon,
        userUsageCount: userUses,
      })
      if (!chk.ok) {
        return NextResponse.json({ error: chk.message }, { status: 400 })
      }
      couponPreviewDiscount = deductionFromCouponRule(
        cPreview,
        eligibleForCoupon
      )
    }

    const total =
      subtotal - membershipDiscount - couponPreviewDiscount + deliveryCharge

    const orderNumber = generateOrderNumber()
    const payStatus = initialPaymentStatus(paymentMethod)
    const membershipPlanName = activeMembership?.plan.name ?? null

    let order
    let createdNow = true

    try {
      order = await prisma.$transaction(async (tx) => {
        const currentZone = await tx.zone.findUnique({
          where: { id: finalZoneId },
          select: {
            name: true,
            deliveryFee: true,
            deliveryCharge: true,
            isActive: true,
          },
        })
        if (!currentZone?.isActive) {
          throw new Error('DELIVERY_ZONE_UNAVAILABLE')
        }
        const currentDeliveryCharge = qualifiesForFreeDelivery
          ? 0
          : resolveDeliveryChargeForZone(currentZone)
        if (Math.abs(currentDeliveryCharge - deliveryCharge) > 0.02) {
          throw new Error('DELIVERY_ZONE_CHANGED')
        }

        await reserveOrderInventory(tx, regularItems)
        let appliedCouponCode: string | null = null
        let couponDiscountAmount = 0
        let couponIdForUsage: string | null = null

        if (normalizedCoupon) {
          const c = await tx.coupon.findUnique({
            where: { code: normalizedCoupon },
          })
          if (!c || !c.isActive) {
            throw new Error('COUPON_INVALID')
          }
          if (c.perUserLimit != null) {
            await lockCouponUsageForUser(tx, c.id, session.user.id)
          }
          const userUses = await tx.couponUsage.count({
            where: { couponId: c.id, userId: session.user.id },
          })
          const chk = validateCouponApplicability({
            coupon: c,
            eligibleSubtotal: eligibleForCoupon,
            userUsageCount: userUses,
          })
          if (!chk.ok) {
            throw new Error('COUPON_INVALID')
          }
          const cd = deductionFromCouponRule(c, eligibleForCoupon)
          if (Math.abs(cd - couponPreviewDiscount) > 0.02) {
            throw new Error('COUPON_CHANGED')
          }
          if (c.usageLimit != null && c.usageCount >= c.usageLimit) {
            throw new Error('COUPON_EXHAUSTED')
          }
          const couponClaim = await tx.coupon.updateMany({
            where: {
              id: c.id,
              isActive: true,
              ...(c.usageLimit == null
                ? {}
                : { usageCount: { lt: c.usageLimit } }),
            },
            data: { usageCount: { increment: 1 } },
          })
          if (couponClaim.count !== 1) {
            throw new Error('COUPON_EXHAUSTED')
          }
          appliedCouponCode = c.code
          couponDiscountAmount = cd
          couponIdForUsage = c.id
        }

        const expectedTotal =
          subtotal - membershipDiscount - couponDiscountAmount + currentDeliveryCharge
        if (Math.abs(expectedTotal - total) > 0.02) {
          throw Object.assign(new Error('TOTAL_MISMATCH'), { code: '409' })
        }

        const created = await tx.order.create({
          data: {
            orderNumber,
            checkoutRequestId,
            userId: session.user.id,
            addressId: finalAddressId,
            zoneId: finalZoneId,
            subtotal,
            discount: membershipDiscount,
            membershipDiscountAmount:
              membershipDiscount > 0 ? membershipDiscount : null,
            membershipPlanName,
            appliedCouponCode,
            couponDiscountAmount,
            deliveryCharge: currentDeliveryCharge,
            total: expectedTotal,
            paymentMethod,
            paymentStatus: payStatus,
            status: 'PENDING',
            notes,
            items: {
              create: regularItems.map((item) => {
                if (item.medicineId) {
                  const medicine = medicines.find(
                    (m) => m.id === item.medicineId
                  )!
                  const price = medicine.discountPrice || medicine.price
                  return {
                    medicineId: item.medicineId,
                    quantity: item.quantity,
                    price,
                    discount: 0,
                    total: price * item.quantity,
                  }
                }
                const product = products.find((p) => p.id === item.productId)!
                const price = product.sellingPrice
                return {
                  productId: item.productId,
                  quantity: item.quantity,
                  price,
                  discount: 0,
                  total: price * item.quantity,
                }
              }),
            },
          },
          include: {
            items: {
              include: {
                medicine: true,
                product: true,
              },
            },
            user: {
              select: {
                name: true,
                phone: true,
              },
            },
          },
        })

        if (couponIdForUsage) {
          await tx.couponUsage.create({
            data: {
              couponId: couponIdForUsage,
              userId: session.user.id,
              orderId: created.id,
              discount: couponDiscountAmount,
            },
          })
        }

        return created
      })
    } catch (e) {
      const err = e as Error & { message: string; code?: string }
      if (err.code === 'P2002') {
        const existing = await prisma.order.findFirst({
          where: { userId: session.user.id, checkoutRequestId },
          include: {
            items: { include: { medicine: true, product: true } },
            user: { select: { name: true, phone: true } },
          },
        })
        if (!existing) throw e
        order = existing
        createdNow = false
      } else if (e instanceof InventoryUnavailableError || err.message === 'INVENTORY_UNAVAILABLE') {
        return NextResponse.json(
          { error: 'এক বা একাধিক পণ্যের পর্যাপ্ত স্টক নেই। কার্ট আপডেট করে আবার চেষ্টা করুন।' },
          { status: 409 }
        )
      }
      if (err.message === 'COUPON_INVALID' || err.message === 'COUPON_CHANGED') {
        return NextResponse.json(
          {
            error:
              'কুপন প্রযোজ্য নয়। কোড আবার লাগিয়ে চেষ্টা করুন।',
          },
          { status: 400 }
        )
      }
      if (err.message === 'COUPON_EXHAUSTED') {
        return NextResponse.json(
          { error: 'এই কুপন এর ব্যবহার শেষ।' },
          { status: 400 }
        )
      }
      if (err.message === 'TOTAL_MISMATCH') {
        return NextResponse.json(
          {
            error:
              'হিসাব মিলছে না। কার্ট রিফ্রেশ করে আবার চেষ্টা করুন।',
          },
          { status: 409 }
        )
      }
      if (err.message === 'DELIVERY_ZONE_UNAVAILABLE' || err.message === 'DELIVERY_ZONE_CHANGED') {
        return NextResponse.json(
          { error: 'ডেলিভারি জোন বা চার্জ পরিবর্তিত হয়েছে। পেজ রিফ্রেশ করে আবার চেষ্টা করুন।' },
          { status: 409 }
        )
      }
      if (!order) throw e
    }

    if (!createdNow) {
      return NextResponse.json(
        { success: true, order, idempotent: true },
        { status: 200 }
      )
    }

    const deliveryDaysHint =
      address.zone.deliveryDays || '৩–৫ দিনের মধ্যে'

    const canFulfill = orderReadyForFulfillment({
      paymentMethod,
      paymentStatus: order.paymentStatus,
    })

    if (canFulfill) {
      await Promise.all([
        sendSMS(order.user.phone, 'ORDER_CONFIRMED', {
          name: order.user.name,
          orderNumber: order.orderNumber,
          total: order.total,
          days: deliveryDaysHint,
        }),
        sendEmail(`${order.user.phone}@example.com`, 'ORDER_CONFIRMED', {
          name: order.user.name,
          orderNumber: order.orderNumber,
          total: order.total,
          days: deliveryDaysHint,
        }),
      ])
    } else {
      await Promise.all([
        sendSMS(order.user.phone, 'ORDER_AWAITING_PAYMENT', {
          name: order.user.name,
          orderNumber: order.orderNumber,
          total: order.total,
        }),
        sendEmail(`${order.user.phone}@example.com`, 'ORDER_AWAITING_PAYMENT', {
          name: order.user.name,
          orderNumber: order.orderNumber,
          total: order.total,
        }),
      ])
    }

    await processOrderOtp('order_created', {
      orderId: order.orderNumber,
      amount: order.total,
      customerName: order.user.name || 'Customer',
      shippingPhone: address.phone || order.user.phone,
      billingPhone: order.user.phone,
    })

    try {
      if (canFulfill) {
        const { forwardOrderToAzanById } =
          await import('@/lib/integrations/forward-order-to-azan')
        const r = await forwardOrderToAzanById(order.id)
        if (r.error) {
          console.error(
            `[Azan order forward] ${order.orderNumber} failed:`,
            r.error
          )
        } else if (r.skipped) {
          const detail =
            r.lineCount != null
              ? ` (${r.lineCount} Azan line(s) in cart)`
              : ''
          console.warn(
            `[Azan order forward] ${order.orderNumber} skipped: ${r.skipped}${detail}`
          )
        } else {
          const lines =
            r.lineCount != null ? `${r.lineCount} line(s) to Azan` : 'ok'
          console.log(`[Azan order forward] ${order.orderNumber} → ${lines}`)
        }
      }
    } catch (forwardErr) {
      console.error('[Azan order forward] unhandled error:', forwardErr)
    }

    return NextResponse.json({ success: true, order }, { status: 201 })
  } catch (error) {
    console.error('Order creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const orders = await prisma.order.findMany({
      where: { userId: session.user.id },
      include: {
        items: {
          include: {
            medicine: true,
            product: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ orders })
  } catch (error) {
    console.error('Fetch orders error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    )
  }
}
