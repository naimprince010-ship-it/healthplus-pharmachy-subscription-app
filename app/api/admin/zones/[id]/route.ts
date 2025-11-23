import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const updateZoneSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  description: z.string().optional(),
  deliveryFee: z.number().int().positive('Delivery fee must be positive').optional(),
  deliveryDays: z.string().optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { id } = await params

    const zone = await prisma.zone.findUnique({
      where: { id },
    })

    if (!zone) {
      return NextResponse.json({ error: 'Zone not found' }, { status: 404 })
    }

    return NextResponse.json({ zone }, { status: 200 })
  } catch (error) {
    console.error('Get zone error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch zone' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()

    const validationResult = updateZoneSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      )
    }

    const existingZone = await prisma.zone.findUnique({
      where: { id },
    })

    if (!existingZone) {
      return NextResponse.json({ error: 'Zone not found' }, { status: 404 })
    }

    const updateData: {
      name?: string
      description?: string
      deliveryFee?: number
      deliveryCharge?: number
      deliveryDays?: string
      isActive?: boolean
      sortOrder?: number
    } = { ...validationResult.data }

    if (updateData.deliveryFee !== undefined) {
      updateData.deliveryCharge = updateData.deliveryFee
    }

    if (updateData.name && updateData.name !== existingZone.name) {
      const nameExists = await prisma.zone.findUnique({
        where: { name: updateData.name },
      })

      if (nameExists) {
        return NextResponse.json(
          { error: 'Zone with this name already exists' },
          { status: 400 }
        )
      }
    }

    const zone = await prisma.zone.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({ zone }, { status: 200 })
  } catch (error) {
    console.error('Update zone error:', error)
    return NextResponse.json(
      { error: 'Failed to update zone' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { id } = await params

    const existingZone = await prisma.zone.findUnique({
      where: { id },
      include: {
        addresses: true,
        orders: true,
      },
    })

    if (!existingZone) {
      return NextResponse.json({ error: 'Zone not found' }, { status: 404 })
    }

    if (existingZone.addresses.length > 0 || existingZone.orders.length > 0) {
      await prisma.zone.update({
        where: { id },
        data: { isActive: false },
      })

      return NextResponse.json(
        { 
          message: 'Zone deactivated instead of deleted (has associated addresses or orders)',
          zone: { ...existingZone, isActive: false }
        },
        { status: 200 }
      )
    }

    await prisma.zone.delete({
      where: { id },
    })

    return NextResponse.json(
      { message: 'Zone deleted successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Delete zone error:', error)
    return NextResponse.json(
      { error: 'Failed to delete zone' },
      { status: 500 }
    )
  }
}
