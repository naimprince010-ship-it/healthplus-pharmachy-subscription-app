import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { updateDiscountRuleSchema } from '@/lib/validations/discount'
import { z } from 'zod'

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

    const rule = await prisma.discountRule.findUnique({
      where: { id },
      include: {
        _count: {
          select: { logs: true },
        },
      },
    })

    if (!rule) {
      return NextResponse.json({ error: 'Rule not found' }, { status: 404 })
    }

    return NextResponse.json({ rule })
  } catch (error) {
    console.error('Fetch discount rule error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch discount rule' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const validatedData = updateDiscountRuleSchema.parse(body)

    const existingRule = await prisma.discountRule.findUnique({
      where: { id },
    })

    if (!existingRule) {
      return NextResponse.json({ error: 'Rule not found' }, { status: 404 })
    }

    const updateData: Record<string, unknown> = {}

    if (validatedData.name !== undefined) updateData.name = validatedData.name
    if (validatedData.ruleType !== undefined) updateData.ruleType = validatedData.ruleType
    if (validatedData.targetValue !== undefined) updateData.targetValue = validatedData.targetValue
    if (validatedData.discountType !== undefined) updateData.discountType = validatedData.discountType
    if (validatedData.discountAmount !== undefined) updateData.discountAmount = validatedData.discountAmount
    if (validatedData.minCartAmount !== undefined) updateData.minCartAmount = validatedData.minCartAmount
    if (validatedData.priority !== undefined) updateData.priority = validatedData.priority
    if (validatedData.isActive !== undefined) updateData.isActive = validatedData.isActive
    if (validatedData.description !== undefined) updateData.description = validatedData.description

    if (validatedData.startDate !== undefined) {
      updateData.startDate = new Date(validatedData.startDate)
    }
    if (validatedData.endDate !== undefined) {
      updateData.endDate = new Date(validatedData.endDate)
    }

    const startDate = updateData.startDate as Date | undefined ?? existingRule.startDate
    const endDate = updateData.endDate as Date | undefined ?? existingRule.endDate

    if (endDate <= startDate) {
      return NextResponse.json(
        { error: 'End date must be after start date' },
        { status: 400 }
      )
    }

    const discountType = (updateData.discountType as string | undefined) ?? existingRule.discountType
    const discountAmount = (updateData.discountAmount as number | undefined) ?? existingRule.discountAmount

    if (discountType === 'PERCENTAGE' && discountAmount > 100) {
      return NextResponse.json(
        { error: 'Percentage discount cannot exceed 100%' },
        { status: 400 }
      )
    }

    const rule = await prisma.discountRule.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({ rule })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }
    console.error('Update discount rule error:', error)
    return NextResponse.json(
      { error: 'Failed to update discount rule' },
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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const existingRule = await prisma.discountRule.findUnique({
      where: { id },
    })

    if (!existingRule) {
      return NextResponse.json({ error: 'Rule not found' }, { status: 404 })
    }

    await prisma.discountRule.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete discount rule error:', error)
    return NextResponse.json(
      { error: 'Failed to delete discount rule' },
      { status: 500 }
    )
  }
}
