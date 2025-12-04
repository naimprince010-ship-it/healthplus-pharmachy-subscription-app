import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { updateMembershipPlanSchema } from '@/lib/validations/membership'
import { z } from 'zod'
import { Prisma } from '@prisma/client'

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

    const plan = await prisma.membershipPlan.findUnique({
      where: { id },
      include: {
        _count: {
          select: { memberships: true },
        },
      },
    })

    if (!plan) {
      return NextResponse.json(
        { error: 'Membership plan not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ plan })
  } catch (error) {
    console.error('Error fetching membership plan:', error)
    return NextResponse.json(
      { error: 'Failed to fetch membership plan' },
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
    const validatedData = updateMembershipPlanSchema.parse(body)

    const existingPlan = await prisma.membershipPlan.findUnique({
      where: { id },
    })
    if (!existingPlan) {
      return NextResponse.json(
        { error: 'Membership plan not found' },
        { status: 404 }
      )
    }

    if (validatedData.name && validatedData.name !== existingPlan.name) {
      const nameExists = await prisma.membershipPlan.findUnique({
        where: { name: validatedData.name },
      })
      if (nameExists) {
        return NextResponse.json(
          { error: 'A membership plan with this name already exists' },
          { status: 400 }
        )
      }
    }

    const updateData: Prisma.MembershipPlanUpdateInput = {}

    if (validatedData.name !== undefined) updateData.name = validatedData.name
    if (validatedData.description !== undefined) updateData.description = validatedData.description || null
    if (validatedData.price !== undefined) updateData.price = validatedData.price
    if (validatedData.originalPrice !== undefined) updateData.originalPrice = validatedData.originalPrice ?? null
    if (validatedData.durationDays !== undefined) updateData.durationDays = validatedData.durationDays
    if (validatedData.discountPercent !== undefined) updateData.discountPercent = validatedData.discountPercent
    if (validatedData.badge !== undefined) updateData.badge = validatedData.badge ?? null
    if (validatedData.benefitsJson !== undefined) {
      updateData.benefitsJson = validatedData.benefitsJson ?? Prisma.JsonNull
    }
    if (validatedData.ctaText !== undefined) updateData.ctaText = validatedData.ctaText ?? null
    if (validatedData.isHighlighted !== undefined) updateData.isHighlighted = validatedData.isHighlighted
    if (validatedData.sortOrder !== undefined) updateData.sortOrder = validatedData.sortOrder ?? null
    if (validatedData.isActive !== undefined) updateData.isActive = validatedData.isActive

    const plan = await prisma.membershipPlan.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({ plan })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }
    console.error('Error updating membership plan:', error)
    return NextResponse.json(
      { error: 'Failed to update membership plan' },
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

    const plan = await prisma.membershipPlan.findUnique({
      where: { id },
      include: {
        _count: {
          select: { memberships: true },
        },
      },
    })

    if (!plan) {
      return NextResponse.json(
        { error: 'Membership plan not found' },
        { status: 404 }
      )
    }

    if (plan._count.memberships > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete membership plan because ${plan._count.memberships} user(s) have purchased it. Consider setting it to inactive instead.`,
          membershipCount: plan._count.memberships,
          suggestion: 'Set isActive to false to hide this plan from users',
        },
        { status: 400 }
      )
    }

    await prisma.membershipPlan.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Membership plan deleted successfully' })
  } catch (error) {
    console.error('Error deleting membership plan:', error)
    return NextResponse.json(
      { error: 'Failed to delete membership plan' },
      { status: 500 }
    )
  }
}
