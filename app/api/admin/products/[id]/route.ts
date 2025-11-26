import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const updateProductSchema = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().optional(),
  description: z.string().optional(),
  brandName: z.string().optional(),
  categoryId: z.string().optional(),
  mrp: z.number().positive().optional(),
  sellingPrice: z.number().positive().optional(),
  stockQuantity: z.number().int().min(0).optional(),
  minStockAlert: z.number().int().min(0).optional(),
  unit: z.string().optional(),
  imageUrl: z.string().url().optional(),
  imagePath: z.string().optional(),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  seoKeywords: z.string().optional(),
  canonicalUrl: z.string().url().optional(),
  isFeatured: z.boolean().optional(),
  isActive: z.boolean().optional(),
  excludeFromMembershipDiscount: z.boolean().optional(),
  sizeLabel: z.string().optional(),
  variantLabel: z.string().optional(),
  keyFeatures: z.string().optional(),
  specSummary: z.string().optional(),
  isFlashSale: z.boolean().optional(),
  flashSalePrice: z.number().positive().optional(),
  flashSaleStart: z.string().datetime().optional(),
  flashSaleEnd: z.string().datetime().optional(),
})

/**
 * GET /api/admin/products/[id]
 * Get a single product by ID
 */
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

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    })

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    return NextResponse.json({ product })
  } catch (error) {
    console.error('Fetch product error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/admin/products/[id]
 * Update a product
 */
export async function PATCH(
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
    const validationResult = updateProductSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      )
    }

    const data = validationResult.data

    const existingProduct = await prisma.product.findUnique({
      where: { id },
    })

    if (!existingProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    if (data.slug && data.slug !== existingProduct.slug) {
      const slugExists = await prisma.product.findUnique({
        where: { slug: data.slug },
      })
      if (slugExists) {
        return NextResponse.json(
          { error: 'Slug already exists' },
          { status: 400 }
        )
      }
    }

    const updateData: any = { ...data }
    
    if (data.categoryId && data.categoryId !== existingProduct.categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: data.categoryId },
        select: { isMedicineCategory: true },
      })
      
      if (!category) {
        return NextResponse.json(
          { error: 'Category not found' },
          { status: 400 }
        )
      }
      
      updateData.type = category.isMedicineCategory ? 'MEDICINE' : 'GENERAL'
    }
    if (data.stockQuantity !== undefined) {
      updateData.inStock = data.stockQuantity > 0
    }
    if (data.flashSaleStart !== undefined) {
      updateData.flashSaleStart = data.flashSaleStart ? new Date(data.flashSaleStart) : null
    }
    if (data.flashSaleEnd !== undefined) {
      updateData.flashSaleEnd = data.flashSaleEnd ? new Date(data.flashSaleEnd) : null
    }

    const product = await prisma.product.update({
      where: { id },
      data: updateData,
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    })

    return NextResponse.json({ success: true, product })
  } catch (error) {
    console.error('Update product error:', error)
    return NextResponse.json(
      { error: 'Failed to update product' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/products/[id]
 * Soft delete a product
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { id } = await params

    const product = await prisma.product.findUnique({
      where: { id },
    })

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    await prisma.product.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        isActive: false,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete product error:', error)
    return NextResponse.json(
      { error: 'Failed to delete product' },
      { status: 500 }
    )
  }
}
