import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

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

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        user: {
          select: { name: true, phone: true, email: true },
        },
        items: {
          include: {
            medicine: {
              select: { name: true, imageUrl: true },
            },
          },
        },
      },
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    let address = null
    if (order.addressId) {
      try {
        address = await prisma.address.findUnique({
          where: { id: order.addressId },
          include: { zone: true },
        })
      } catch (err) {
        console.error('Error fetching address:', err)
      }
    }

    if (!address) {
      address = {
        id: 'N/A',
        fullName: order.user.name,
        phone: order.user.phone,
        addressLine1: 'N/A',
        addressLine2: null,
        city: 'N/A',
        zone: {
          id: 'N/A',
          name: 'N/A',
          deliveryCharge: 0,
        },
      }
    }

    return NextResponse.json({ order: { ...order, address } })
  } catch (error) {
    console.error('Error fetching order:', error)
    return NextResponse.json(
      { error: 'Failed to fetch order' },
      { status: 500 }
    )
  }
}
