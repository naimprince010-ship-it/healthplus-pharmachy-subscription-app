import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const createOrderSchema = z.object({
  addressId: z.string().optional(),
  zoneId: z.string().min(1, 'Zone is required'), // Required: must select a delivery zone
  deliveryCharge: z.number().positive().optional(),
  notes: z.string().optional(),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { id: prescriptionId } = await params
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

    const { addressId, zoneId, deliveryCharge: customDeliveryCharge, notes } = validationResult.data

    const selectedZone = await prisma.zone.findUnique({
      where: { id: zoneId },
    })

    if (!selectedZone) {
      return NextResponse.json({ error: 'Invalid zone' }, { status: 400 })
    }

    if (!selectedZone.isActive) {
      return NextResponse.json({ error: 'Selected zone is not active' }, { status: 400 })
    }

    const prescription = await prisma.prescription.findUnique({
      where: { id: prescriptionId },
      include: {
        user: true,
        items: {
          include: {
            medicine: true,
          },
        },
        order: true,
      },
    })

    if (!prescription) {
      return NextResponse.json({ error: 'Prescription not found' }, { status: 404 })
    }

    if (prescription.order) {
      return NextResponse.json(
        { error: 'Prescription already converted to order', orderId: prescription.order.id },
        { status: 400 }
      )
    }

    const itemsWithMedicine = prescription.items.filter(item => item.medicineId)
    if (itemsWithMedicine.length === 0) {
      return NextResponse.json(
        { error: 'Prescription must have at least one item mapped to a medicine' },
        { status: 400 }
      )
    }

    let address
    let finalAddressId: string

    if (addressId) {
      address = await prisma.address.findUnique({
        where: { id: addressId },
        include: { zone: true },
      })

      if (!address) {
        return NextResponse.json({ error: 'Invalid address' }, { status: 400 })
      }

      if (address.zoneId !== zoneId) {
        return NextResponse.json({ 
          error: 'Address zone does not match selected delivery zone' 
        }, { status: 400 })
      }

      finalAddressId = addressId
    } else {
      address = await prisma.address.create({
        data: {
          userId: prescription.userId,
          fullName: prescription.name,
          phone: prescription.phone,
          addressLine1: 'From Prescription',
          city: 'N/A',
          zoneId: zoneId,
          isDefault: false,
        },
        include: { zone: true },
      })
      finalAddressId = address.id
    }

    const membership = await prisma.userMembership.findFirst({
      where: {
        userId: prescription.userId,
        isActive: true,
        endDate: { gte: new Date() },
      },
      include: {
        plan: true,
      },
    })

    const subtotal = itemsWithMedicine.reduce((sum, item) => {
      if (!item.medicine) return sum
      const price = item.medicine.sellingPrice || item.medicine.price
      return sum + price * item.quantity
    }, 0)
    
    const membershipDiscountAmount = membership 
      ? subtotal * (membership.plan.discountPercent / 100) 
      : 0
    
    const zoneFee = selectedZone.deliveryFee ?? selectedZone.deliveryCharge
    const deliveryCharge = customDeliveryCharge ?? zoneFee
    const total = subtotal - membershipDiscountAmount + deliveryCharge

    const orderNumber = `ORD-${Date.now()}`

    const order = await prisma.order.create({
      data: {
        orderNumber,
        userId: prescription.userId,
        addressId: finalAddressId,
        zoneId: zoneId, // Required: delivery zone for this order
        prescriptionId: prescription.id,
        subtotal,
        discount: membershipDiscountAmount,
        membershipDiscountAmount: membershipDiscountAmount > 0 ? membershipDiscountAmount : null,
        membershipPlanName: membership ? membership.plan.name : null,
        deliveryCharge,
        total,
        paymentMethod: 'COD',
        status: 'PENDING',
        notes: notes || `Order created from prescription ${prescription.id}`,
        items: {
          create: itemsWithMedicine.map((item) => {
            const medicine = item.medicine!
            const price = medicine.sellingPrice || medicine.price
            return {
              medicineId: item.medicineId!,
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
          },
        },
        user: {
          select: {
            name: true,
            phone: true,
          },
        },
        address: {
          include: {
            zone: true,
          },
        },
      },
    })

    await prisma.prescription.update({
      where: { id: prescriptionId },
      data: { status: 'ORDERED' },
    })

    return NextResponse.json({ success: true, order }, { status: 201 })
  } catch (error) {
    console.error('Create order from prescription error:', error)
    return NextResponse.json(
      { error: 'Failed to create order from prescription' },
      { status: 500 }
    )
  }
}
