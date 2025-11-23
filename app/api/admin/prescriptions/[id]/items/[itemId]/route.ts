import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const updateItemSchema = z.object({
  genericName: z.string().min(1).optional(),
  strength: z.string().optional(),
  quantity: z.number().int().positive().optional(),
  note: z.string().optional(),
  medicineId: z.string().optional().nullable(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { itemId } = await params
    const body = await request.json()
    
    const validationResult = updateItemSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      )
    }

    const updateData = validationResult.data

    if (updateData.medicineId) {
      const medicine = await prisma.medicine.findUnique({
        where: { id: updateData.medicineId },
      })
      if (!medicine) {
        return NextResponse.json({ error: 'Medicine not found' }, { status: 404 })
      }
    }

    const item = await prisma.prescriptionItem.update({
      where: { id: itemId },
      data: updateData,
      include: {
        medicine: {
          select: {
            id: true,
            name: true,
            genericName: true,
            strength: true,
            sellingPrice: true,
          },
        },
      },
    })

    return NextResponse.json({ success: true, item })
  } catch (error) {
    console.error('Update prescription item error:', error)
    return NextResponse.json(
      { error: 'Failed to update prescription item' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { itemId } = await params

    await prisma.prescriptionItem.delete({
      where: { id: itemId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete prescription item error:', error)
    return NextResponse.json(
      { error: 'Failed to delete prescription item' },
      { status: 500 }
    )
  }
}
