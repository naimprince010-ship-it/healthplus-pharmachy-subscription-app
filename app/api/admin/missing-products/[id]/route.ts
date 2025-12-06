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

    const missingProduct = await prisma.missingProduct.update({
      where: { id },
      data: updateData,
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
