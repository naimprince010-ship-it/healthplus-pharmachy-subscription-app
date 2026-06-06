import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const settings = await prisma.cartPageSettings.findFirst()

    return NextResponse.json({ settings })
  } catch (error) {
    console.error('Failed to fetch cart settings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch cart settings' },
      { status: 500 }
    )
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()

    let settings = await prisma.cartPageSettings.findFirst()

    if (!settings) {
      settings = await prisma.cartPageSettings.create({
        data: {
          freeDeliveryThreshold: body.freeDeliveryThreshold ?? 499,
          freeDeliveryTextBn: body.freeDeliveryTextBn ?? 'আর মাত্র ৳{remaining} টাকার পণ্য কিনলে ফ্রি ডেলিভারি পাবেন!',
          freeDeliverySuccessTextBn: body.freeDeliverySuccessTextBn ?? 'অভিনন্দন! আপনি ফ্রি ডেলিভারি পেয়েছেন 🎉',
          promoLabelBn: body.promoLabelBn ?? 'প্রোমো কোড ব্যবহার করুন',
          promoApplyTextBn: body.promoApplyTextBn ?? '[Apply]',
          deliveryInfoTextBn: body.deliveryInfoTextBn ?? 'আনুমানিক ডেলিভারি: আগামীকাল',
          totalMrpLabelBn: body.totalMrpLabelBn ?? 'মোট এম.আর.পি:',
          savingsLabelBn: body.savingsLabelBn ?? 'আপনি সাশ্রয় করছেন:',
          grandTotalLabelBn: body.grandTotalLabelBn ?? 'সর্বমোট:',
          checkoutButtonTextBn: body.checkoutButtonTextBn ?? 'নিরাপদ চেকআউট',
          suggestionTitleBn: body.suggestionTitleBn ?? 'আপনার জন্য সাজেশন',
          emptyCartTextBn: body.emptyCartTextBn ?? 'আপনার কার্ট খালি',
          emptyCartSubtextBn: body.emptyCartSubtextBn ?? 'পণ্য যোগ করুন শপিং শুরু করতে',
          startShoppingTextBn: body.startShoppingTextBn ?? 'শপিং শুরু করুন',
          cartTitleBn: body.cartTitleBn ?? 'আপনার কার্ট',
        },
      })
    } else {
      settings = await prisma.cartPageSettings.update({
        where: { id: settings.id },
        data: {
          freeDeliveryThreshold: body.freeDeliveryThreshold,
          freeDeliveryTextBn: body.freeDeliveryTextBn,
          freeDeliverySuccessTextBn: body.freeDeliverySuccessTextBn,
          promoLabelBn: body.promoLabelBn,
          promoApplyTextBn: body.promoApplyTextBn,
          deliveryInfoTextBn: body.deliveryInfoTextBn,
          totalMrpLabelBn: body.totalMrpLabelBn,
          savingsLabelBn: body.savingsLabelBn,
          grandTotalLabelBn: body.grandTotalLabelBn,
          checkoutButtonTextBn: body.checkoutButtonTextBn,
          suggestionTitleBn: body.suggestionTitleBn,
          emptyCartTextBn: body.emptyCartTextBn,
          emptyCartSubtextBn: body.emptyCartSubtextBn,
          startShoppingTextBn: body.startShoppingTextBn,
          cartTitleBn: body.cartTitleBn,
        },
      })
    }

    return NextResponse.json({ settings })
  } catch (error: any) {
    console.error('Failed to update cart settings:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update cart settings' },
      { status: 500 }
    )
  }
}
