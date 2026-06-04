import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/requireAdmin'
import { isValidReturnTransition, updateReturnStatusSchema } from '@/lib/validations/returns'
import { z } from 'zod'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAdmin()
    if (!authResult.authorized) {
      return authResult.response
    }

    const { id } = await params

    const returnRequest = await prisma.returnRequest.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, phone: true } },
        order: { select: { id: true, orderNumber: true, total: true, status: true } },
        items: {
          include: {
            orderItem: {
              select: {
                id: true,
                quantity: true,
                price: true,
                total: true,
                productName: true,
                medicine: { select: { name: true } },
                product: { select: { name: true } },
              },
            },
          },
        },
        statusHistory: {
          orderBy: { changedAt: 'asc' },
        },
      },
    })

    if (!returnRequest) {
      return NextResponse.json({ error: 'Return request not found' }, { status: 404 })
    }

    return NextResponse.json({ returnRequest })
  } catch (error) {
    console.error('Fetch return request detail error:', error)
    return NextResponse.json({ error: 'Failed to fetch return request' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAdmin()
    if (!authResult.authorized) {
      return authResult.response
    }

    const { id } = await params
    const body = await request.json()
    const input = updateReturnStatusSchema.parse(body)

    const existing = await prisma.returnRequest.findUnique({ where: { id } })

    if (!existing) {
      return NextResponse.json({ error: 'Return request not found' }, { status: 404 })
    }

    if (!isValidReturnTransition(existing.status, input.status)) {
      return NextResponse.json(
        { error: `Invalid status transition from ${existing.status} to ${input.status}` },
        { status: 400 }
      )
    }

    if ((input.status === 'REJECTED' || input.status === 'CLOSED') && !input.note) {
      return NextResponse.json(
        { error: 'A note is required when rejecting or closing a return request' },
        { status: 400 }
      )
    }

    const now = new Date()

    const updated = await prisma.$transaction(async (tx) => {
      const requestRow = await tx.returnRequest.update({
        where: { id },
        data: {
          status: input.status,
          adminNote: input.note ?? existing.adminNote,
          reviewedAt: input.status === 'APPROVED' || input.status === 'REJECTED' ? now : existing.reviewedAt,
          closedAt: input.status === 'CLOSED' ? now : existing.closedAt,
        },
      })

      await tx.returnStatusHistory.create({
        data: {
          returnRequestId: id,
          fromStatus: existing.status,
          toStatus: input.status,
          note: input.note,
          changedByUserId: authResult.session?.user.id,
          changedAt: now,
        },
      })

      return requestRow
    })

    return NextResponse.json({ returnRequest: updated })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.issues }, { status: 400 })
    }
    console.error('Update return request status error:', error)
    return NextResponse.json({ error: 'Failed to update return request' }, { status: 500 })
  }
}
