import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { z } from 'zod'
import { addDays, format } from 'date-fns'
import { prisma } from '@/lib/prisma'
import { sendSMS, sendEmail } from '@/lib/notifications'
import { processOrderOtp } from '@/lib/settings/server'
import { resolveDeliveryChargeByZoneName } from '@/lib/delivery-charge'
import { getCheckoutPricingQuote } from '@/lib/order-pricing-quote'
import {
  deductionFromCouponRule,
  validateCouponApplicability,
} from '@/lib/coupon-checkout'
import {
  initialPaymentStatus,
  orderReadyForFulfillment,
} from '@/lib/order-payment-status'

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
    }).refine((data) => data.medicineId || data.productId || data.membershipPlanId, {
      message: 'Either medicineId, productId, or membershipPlanId must be provided',
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
      finalAddressId = addressId
      finalZoneId = address.zoneId
    } else if (zoneId) {
      const zone = await prisma.zone.findUnique({
        where: { id: zoneId },
      })

      if (!zone) {
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
      membershipItems,
      regularItems,
      medicines,
      products,
      membershipPlans,
      subtotal,
      membershipDiscount,
      eligibleForCoupon,
      activeMembership,
    } = quote

    let existingActiveMembership: {
      id: string
      planId: string
      endDate: Date
    } | null = null
    if (membershipItems.length > 0) {
      existingActiveMembership = await prisma.userMembership.findFirst({
        where: {
          userId: session.user.id,
          isActive: true,
          endDate: { gte: new Date() },
        },
        select: {
          id: true,
          planId: true,
          endDate: true,
        },
      })
    }

    const cartSettings = await prisma.cartPageSettings.findFirst()
    const freeDeliveryThreshold =
      cartSettings?.freeDeliveryThreshold ?? 499
    const qualifiesForFreeDelivery = subtotal >= freeDeliveryThreshold
    const deliveryCharge = qualifiesForFreeDelivery
      ? 0
      : resolveDeliveryChargeByZoneName(address.zone.name)

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

    const orderNumber = `ORD-${Date.now()}`
    const payStatus = initialPaymentStatus(paymentMethod)
    const membershipPlanName = activeMembership?.plan.name ?? null

    let order

    try {
      order = await prisma.$transaction(async (tx) => {
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
          await tx.coupon.update({
            where: { id: c.id },
            data: { usageCount: { increment: 1 } },
          })
          appliedCouponCode = c.code
          couponDiscountAmount = cd
          couponIdForUsage = c.id
        }

        const expectedTotal =
          subtotal - membershipDiscount - couponDiscountAmount + deliveryCharge
        if (Math.abs(expectedTotal - total) > 0.02) {
          throw Object.assign(new Error('TOTAL_MISMATCH'), { code: '409' })
        }

        const created = await tx.order.create({
          data: {
            orderNumber,
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
            deliveryCharge,
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
      const err = e as Error & { message: string }
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
      throw e
    }

    // Create/update membership records for any membership items in the order
    for (const membershipItem of membershipItems) {
      const plan = membershipPlans.find(p => p.id === membershipItem.membershipPlanId)
      if (!plan) continue

      let finalEndDate: Date

      if (existingActiveMembership) {
        const isSamePlan = existingActiveMembership.planId === plan.id

        if (isSamePlan) {
          // RENEW: Extend the existing membership's endDate
          finalEndDate = addDays(existingActiveMembership.endDate, plan.durationDays)
          
          await prisma.userMembership.update({
            where: { id: existingActiveMembership.id },
            data: { endDate: finalEndDate },
          })
        } else {
          // UPGRADE/DOWNGRADE: Deactivate old membership, create new one
          await prisma.userMembership.update({
            where: { id: existingActiveMembership.id },
            data: { isActive: false },
          })

          const startDate = new Date()
          finalEndDate = addDays(startDate, plan.durationDays)

          await prisma.userMembership.create({
            data: {
              userId: session.user.id,
              planId: plan.id,
              startDate,
              endDate: finalEndDate,
              isActive: true,
            },
          })
        }
      } else {
        // NEW PURCHASE: Create new membership
        const startDate = new Date()
        finalEndDate = addDays(startDate, plan.durationDays)

        await prisma.userMembership.create({
          data: {
            userId: session.user.id,
            planId: plan.id,
            startDate,
            endDate: finalEndDate,
            isActive: true,
          },
        })
      }

      // Get user info for notification
      const userForNotification = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { name: true, phone: true },
      })

      if (userForNotification) {
        // Send membership notification (using MEMBERSHIP_PURCHASED for all cases: purchase, renew, upgrade)
        await Promise.all([
          sendSMS(userForNotification.phone, 'MEMBERSHIP_PURCHASED', {
            name: userForNotification.name,
            expiresAt: format(finalEndDate, 'MMM dd, yyyy'),
            planName: plan.name,
          }),
          sendEmail(`${userForNotification.phone}@example.com`, 'MEMBERSHIP_PURCHASED', {
            name: userForNotification.name,
            expiresAt: format(finalEndDate, 'MMM dd, yyyy'),
            planName: plan.name,
          }),
        ])
      }
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
