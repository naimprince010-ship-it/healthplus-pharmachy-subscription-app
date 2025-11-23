import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const createItemSchema = z.object({
  genericName: z.string().min(1),
  strength: z.string().optional(),
  quantity: z.number().int().positive(),
  note: z.string().optional(),
  medicineId: z.string().optional(),
  medicineNameSnapshot: z.string().optional(),
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
    
    const validationResult = createItemSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      )
    }

    const { genericName, strength, quantity, note, medicineId, medicineNameSnapshot } = validationResult.data

    const prescription = await prisma.prescription.findUnique({
      where: { id: prescriptionId },
    })

    if (!prescription) {
      return NextResponse.json({ error: 'Prescription not found' }, { status: 404 })
    }

    if (medicineId) {
      const medicine = await prisma.medicine.findUnique({
        where: { id: medicineId },
      })
      if (!medicine) {
        return NextResponse.json({ error: 'Medicine not found' }, { status: 404 })
      }
    }

    const item = await prisma.prescriptionItem.create({
      data: {
        prescriptionId,
        genericName,
        strength,
        quantity,
        note,
        medicineId,
        medicineNameSnapshot,
      },
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

    return NextResponse.json({ success: true, item }, { status: 201 })
  } catch (error) {
    console.error('Create prescription item error:', error)
    return NextResponse.json(
      { error: 'Failed to create prescription item' },
      { status: 500 }
    )
  }
}
