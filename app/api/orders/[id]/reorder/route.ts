import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * POST /api/orders/[id]/reorder
 * Add all items from a previous order to the cart
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { id } = await params

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            medicine: {
              select: {
                id: true,
                name: true,
                sellingPrice: true,
                stockQuantity: true,
                isActive: true,
              },
            },
            product: {
              select: {
                id: true,
                name: true,
                sellingPrice: true,
                stockQuantity: true,
                isActive: true,
              },
            },
          },
        },
      },
    })

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    if (order.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'You can only reorder your own orders' },
        { status: 403 }
      )
    }

    const addedItems: Array<{ name: string; quantity: number }> = []
    const unavailableItems: Array<{ name: string; reason: string }> = []

    for (const item of order.items) {
      const itemData = item.medicine || item.product
      if (!itemData) continue

      if (!itemData.isActive) {
        unavailableItems.push({
          name: itemData.name,
          reason: 'পণ্যটি বর্তমানে উপলব্ধ নেই',
        })
        continue
      }

      if (itemData.stockQuantity < item.quantity) {
        if (itemData.stockQuantity === 0) {
          unavailableItems.push({
            name: itemData.name,
            reason: 'স্টক শেষ',
          })
          continue
        }
        unavailableItems.push({
          name: itemData.name,
          reason: `শুধুমাত্র ${itemData.stockQuantity} টি স্টকে আছে`,
        })
      }

      const quantityToAdd = Math.min(item.quantity, itemData.stockQuantity)
      if (quantityToAdd === 0) continue

      const existingCartItem = await prisma.cartItem.findFirst({
        where: {
          userId: session.user.id,
          ...(item.medicineId ? { medicineId: item.medicineId } : {}),
          ...(item.productId ? { productId: item.productId } : {}),
        },
      })

      if (existingCartItem) {
        await prisma.cartItem.update({
          where: { id: existingCartItem.id },
          data: {
            quantity: existingCartItem.quantity + quantityToAdd,
          },
        })
      } else {
        await prisma.cartItem.create({
          data: {
            userId: session.user.id,
            medicineId: item.medicineId,
            productId: item.productId,
            quantity: quantityToAdd,
          },
        })
      }

      addedItems.push({
        name: itemData.name,
        quantity: quantityToAdd,
      })
    }

    return NextResponse.json({
      success: true,
      addedItems,
      unavailableItems,
      message: addedItems.length > 0
        ? `${addedItems.length} টি পণ্য কার্টে যোগ করা হয়েছে`
        : 'কোনো পণ্য কার্টে যোগ করা যায়নি',
    })
  } catch (error) {
    console.error('Reorder error:', error)
    return NextResponse.json(
      { error: 'Failed to reorder' },
      { status: 500 }
    )
  }
}
