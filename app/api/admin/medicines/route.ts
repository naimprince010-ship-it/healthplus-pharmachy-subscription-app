import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const medicineSchema = z.object({
  name: z.string().min(1),
  genericName: z.string().optional(),
  manufacturer: z.string().optional(),
  price: z.number().positive(),
  stock: z.number().int().nonnegative(),
  categoryId: z.string(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
})

export async function GET() {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const medicines = await prisma.medicine.findMany({
      include: {
        category: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ medicines })
  } catch (error) {
    console.error('Fetch medicines error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch medicines' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const body = await request.json()
    const validationResult = medicineSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      )
    }

    const medicine = await prisma.medicine.create({
      data: {
        ...validationResult.data,
        isActive: validationResult.data.isActive ?? true,
      },
      include: {
        category: true,
      },
    })

    return NextResponse.json({ success: true, medicine }, { status: 201 })
  } catch (error) {
    console.error('Create medicine error:', error)
    return NextResponse.json(
      { error: 'Failed to create medicine' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const body = await request.json()
    const { id, ...data } = body

    if (!id) {
      return NextResponse.json({ error: 'Medicine ID required' }, { status: 400 })
    }

    const validationResult = medicineSchema.partial().safeParse(data)
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      )
    }

    const medicine = await prisma.medicine.update({
      where: { id },
      data: validationResult.data,
      include: {
        category: true,
      },
    })

    return NextResponse.json({ success: true, medicine })
  } catch (error) {
    console.error('Update medicine error:', error)
    return NextResponse.json(
      { error: 'Failed to update medicine' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Medicine ID required' }, { status: 400 })
    }

    await prisma.medicine.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete medicine error:', error)
    return NextResponse.json(
      { error: 'Failed to delete medicine' },
      { status: 500 }
    )
  }
}
