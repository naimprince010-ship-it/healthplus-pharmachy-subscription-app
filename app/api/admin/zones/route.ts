import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const createZoneSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  deliveryFee: z.number().int().positive('Delivery fee must be positive'),
  deliveryDays: z.string().default('1-2 days'),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
})

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const activeOnly = searchParams.get('activeOnly') === 'true'

    const zones = await prisma.zone.findMany({
      where: activeOnly ? { isActive: true } : undefined,
      orderBy: { sortOrder: 'asc' },
    })

    return NextResponse.json({ zones }, { status: 200 })
  } catch (error) {
    console.error('Get zones error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch zones' },
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
    const validationResult = createZoneSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      )
    }

    const { name, description, deliveryFee, deliveryDays, isActive, sortOrder } = validationResult.data

    const existingZone = await prisma.zone.findUnique({
      where: { name },
    })

    if (existingZone) {
      return NextResponse.json(
        { error: 'Zone with this name already exists' },
        { status: 400 }
      )
    }

    const zone = await prisma.zone.create({
      data: {
        name,
        description,
        deliveryFee,
        deliveryCharge: deliveryFee,
        deliveryDays,
        isActive,
        sortOrder,
      },
    })

    return NextResponse.json({ zone }, { status: 201 })
  } catch (error) {
    console.error('Create zone error:', error)
    return NextResponse.json(
      { error: 'Failed to create zone' },
      { status: 500 }
    )
  }
}
