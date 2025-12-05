import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface RouteParams {
  params: Promise<{ id: string }>
}

interface CartItemData {
  id: string
  medicineId?: string
  productId?: string
  name: string
  price: number
  quantity: number
  image?: string
  type: 'MEDICINE' | 'PRODUCT'
  category?: string
  genericName?: string
  slug?: string
}

/**
 * POST /api/orders/[id]/reorder
 * Get all items from a previous order formatted for adding to cart
 * The client-side code will add these items to the localStorage-based cart
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
                imageUrl: true,
                slug: true,
                genericName: true,
                category: {
                  select: {
                    name: true,
                  },
                },
              },
            },
            product: {
              select: {
                id: true,
                name: true,
                sellingPrice: true,
                stockQuantity: true,
                isActive: true,
                imageUrl: true,
                slug: true,
                category: {
                  select: {
                    name: true,
                  },
                },
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

    const cartItems: CartItemData[] = []
    const unavailableItems: Array<{ name: string; reason: string }> = []

    for (const item of order.items) {
      const medicine = item.medicine
      const product = item.product
      const itemData = medicine || product
      
      if (!itemData) continue

      if (!itemData.isActive) {
        unavailableItems.push({
          name: itemData.name,
          reason: 'পণ্যটি বর্তমানে উপলব্ধ নেই',
        })
        continue
      }

      if (itemData.stockQuantity === 0) {
        unavailableItems.push({
          name: itemData.name,
          reason: 'স্টক শেষ',
        })
        continue
      }

      const quantityToAdd = Math.min(item.quantity, itemData.stockQuantity)
      
      if (itemData.stockQuantity < item.quantity) {
        unavailableItems.push({
          name: itemData.name,
          reason: `শুধুমাত্র ${itemData.stockQuantity} টি স্টকে আছে`,
        })
      }

      const cartItem: CartItemData = {
        id: itemData.id,
        name: itemData.name,
        price: itemData.sellingPrice,
        quantity: quantityToAdd,
        image: itemData.imageUrl || undefined,
        type: medicine ? 'MEDICINE' : 'PRODUCT',
        category: itemData.category?.name,
        slug: itemData.slug || undefined,
      }

      if (medicine) {
        cartItem.medicineId = medicine.id
        cartItem.genericName = medicine.genericName || undefined
      } else if (product) {
        cartItem.productId = product.id
      }

      cartItems.push(cartItem)
    }

    return NextResponse.json({
      success: true,
      cartItems,
      unavailableItems,
      message: cartItems.length > 0
        ? `${cartItems.length} টি পণ্য কার্টে যোগ করা হবে`
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
