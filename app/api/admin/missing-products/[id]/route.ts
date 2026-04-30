import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

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

    const existing = await prisma.missingProduct.findUnique({
      where: { id },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Missing product not found' }, { status: 404 })
    }

    const updateData: {
      isResolved?: boolean
      resolvedProductId?: string | null
    } = {}

    if (body.isResolved !== undefined) {
      updateData.isResolved = body.isResolved
    }
    if (body.resolvedProductId !== undefined) {
      updateData.resolvedProductId = body.resolvedProductId
    }

    const stepMatch = typeof existing.reason === 'string'
      ? existing.reason.match(/\bstep\s*(\d+)\b/i)
      : null
    const inferredStepOrder = stepMatch ? Number(stepMatch[1]) : null

    const missingProduct = await prisma.$transaction(async (tx) => {
      const updated = await tx.missingProduct.update({
        where: { id },
        data: updateData,
      })

      // If admin links an existing product, also link it to the related blog.
      if (
        body.isResolved === true &&
        typeof body.resolvedProductId === 'string' &&
        body.resolvedProductId &&
        existing.blogId
      ) {
        await tx.blogProduct.upsert({
          where: {
            blogId_productId_role: {
              blogId: existing.blogId,
              productId: body.resolvedProductId,
              role: inferredStepOrder ? 'step' : 'recommended',
            },
          },
          update: {
            stepOrder: inferredStepOrder || undefined,
            notes: `Linked from Missing Products (${existing.name})`,
          },
          create: {
            blogId: existing.blogId,
            productId: body.resolvedProductId,
            role: inferredStepOrder ? 'step' : 'recommended',
            stepOrder: inferredStepOrder || undefined,
            notes: `Linked from Missing Products (${existing.name})`,
          },
        })
      }

      return updated
    })

    return NextResponse.json({ missingProduct })
  } catch (error) {
    console.error('Error updating missing product:', error)
    return NextResponse.json(
      { error: 'Failed to update missing product' },
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

    await prisma.missingProduct.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting missing product:', error)
    return NextResponse.json(
      { error: 'Failed to delete missing product' },
      { status: 500 }
    )
  }
}
