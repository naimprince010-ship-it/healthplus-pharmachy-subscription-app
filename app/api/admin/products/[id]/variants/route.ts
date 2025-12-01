import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

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

    const variants = await prisma.productVariant.findMany({
      where: { productId: id },
      orderBy: { sortOrder: 'asc' },
    })

    return NextResponse.json({ variants })
  } catch (error) {
    console.error('Error fetching variants:', error)
    return NextResponse.json({ error: 'Failed to fetch variants' }, { status: 500 })
  }
}

export async function POST(
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

    const variant = await prisma.productVariant.create({
      data: {
        productId: id,
        variantName: body.variantName,
        unitLabel: body.unitLabel || `/${body.variantName}`,
        sizeLabel: body.sizeLabel || null,
        mrp: body.mrp ? parseFloat(body.mrp) : null,
        sellingPrice: parseFloat(body.sellingPrice),
        discountPercentage: body.discountPercentage ? parseFloat(body.discountPercentage) : null,
        stockQuantity: parseInt(body.stockQuantity) || 0,
        isDefault: body.isDefault || false,
        isActive: body.isActive !== false,
        sortOrder: body.sortOrder || 0,
      },
    })

    return NextResponse.json({ variant })
  } catch (error) {
    console.error('Error creating variant:', error)
    return NextResponse.json({ error: 'Failed to create variant' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const body = await request.json()

    if (!body.variantId) {
      return NextResponse.json({ error: 'Variant ID required' }, { status: 400 })
    }

    const variant = await prisma.productVariant.update({
      where: { id: body.variantId },
      data: {
        variantName: body.variantName,
        unitLabel: body.unitLabel || `/${body.variantName}`,
        sizeLabel: body.sizeLabel || null,
        mrp: body.mrp ? parseFloat(body.mrp) : null,
        sellingPrice: parseFloat(body.sellingPrice),
        discountPercentage: body.discountPercentage ? parseFloat(body.discountPercentage) : null,
        stockQuantity: parseInt(body.stockQuantity) || 0,
        isDefault: body.isDefault || false,
        isActive: body.isActive !== false,
        sortOrder: body.sortOrder || 0,
      },
    })

    return NextResponse.json({ variant })
  } catch (error) {
    console.error('Error updating variant:', error)
    return NextResponse.json({ error: 'Failed to update variant' }, { status: 500 })
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

    const { searchParams } = new URL(request.url)
    const variantId = searchParams.get('variantId')

    if (!variantId) {
      return NextResponse.json({ error: 'Variant ID required' }, { status: 400 })
    }

    await prisma.productVariant.delete({
      where: { id: variantId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting variant:', error)
    return NextResponse.json({ error: 'Failed to delete variant' }, { status: 500 })
  }
}
