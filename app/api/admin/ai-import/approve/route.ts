import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const approveSchema = z.object({
  draftId: z.string().min(1, 'Draft ID is required'),
  productData: z.object({
    name: z.string().min(1, 'Product name is required'),
    slug: z.string().optional(),
    brandName: z.string().optional(),
    genericName: z.string().optional(),
    description: z.string().optional(),
    shortDescription: z.string().optional(),
    categoryId: z.string().optional(),
    mrp: z.number().positive().optional(),
    sellingPrice: z.number().positive(),
    strength: z.string().optional(),
    dosageForm: z.string().optional(),
    packSize: z.string().optional(),
    manufacturer: z.string().optional(),
    seoTitle: z.string().optional(),
    seoDescription: z.string().optional(),
    seoKeywords: z.string().optional(),
    imageUrl: z.string().optional(),
    isActive: z.boolean().default(true),
    isFeatured: z.boolean().default(false),
  }),
})

/**
 * Generate a unique slug for a product
 */
async function generateUniqueSlug(baseSlug: string): Promise<string> {
  const slug = baseSlug
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  // Check if slug exists
  let counter = 1
  let uniqueSlug = slug
  
  while (await prisma.product.findUnique({ where: { slug: uniqueSlug } })) {
    uniqueSlug = `${slug}-${counter + 1}`
    counter++
  }

  return uniqueSlug
}

/**
 * POST /api/admin/ai-import/approve
 * Approve a draft and create/update a product
 * 
 * Request body:
 * - draftId: The draft ID to approve
 * - productData: The final product data to save
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const body = await request.json()
    const validationResult = approveSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      )
    }

    const { draftId, productData } = validationResult.data

    // Get the draft
    const draft = await prisma.aiProductDraft.findUnique({
      where: { id: draftId },
      include: {
        importJob: true,
      },
    })

    if (!draft) {
      return NextResponse.json({ error: 'Draft not found' }, { status: 404 })
    }

    if (draft.status === 'APPROVED') {
      return NextResponse.json({ 
        error: 'Draft already approved',
        publishedProductId: draft.publishedProductId,
      }, { status: 400 })
    }

    // Generate unique slug
    const slug = await generateUniqueSlug(productData.slug || productData.name)

    // Find or determine category
    let categoryId = productData.categoryId
    if (!categoryId) {
      // Try to find a default category
      const defaultCategory = await prisma.category.findFirst({
        where: { isActive: true },
        orderBy: { name: 'asc' },
      })
      categoryId = defaultCategory?.id
    }

    if (!categoryId) {
      return NextResponse.json({ 
        error: 'No category specified and no default category found' 
      }, { status: 400 })
    }

    // Determine product type based on category
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      select: { isMedicineCategory: true },
    })

    const productType = category?.isMedicineCategory ? 'MEDICINE' : 'GENERAL'

    // Create the product
    const product = await prisma.product.create({
      data: {
        type: productType,
        name: productData.name,
        slug,
        brandName: productData.brandName,
        description: productData.description || productData.shortDescription,
        categoryId,
        mrp: productData.mrp,
        sellingPrice: productData.sellingPrice,
        stockQuantity: 0,
        inStock: false,
        unit: 'pcs',
        imageUrl: productData.imageUrl,
        seoTitle: productData.seoTitle,
        seoDescription: productData.seoDescription,
        seoKeywords: productData.seoKeywords,
        isFeatured: productData.isFeatured,
        isActive: productData.isActive,
      },
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

    // Update the draft status
    await prisma.aiProductDraft.update({
      where: { id: draftId },
      data: {
        status: 'APPROVED',
        publishedProductId: product.id,
      },
    })

    return NextResponse.json({
      success: true,
      product: {
        id: product.id,
        name: product.name,
        slug: product.slug,
        sellingPrice: product.sellingPrice,
        category: product.category,
      },
      draft: {
        id: draftId,
        status: 'APPROVED',
        publishedProductId: product.id,
      },
    }, { status: 201 })
  } catch (error) {
    console.error('Approve draft error:', error)
    return NextResponse.json(
      { error: 'Failed to approve draft' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/ai-import/approve
 * Reject a draft
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const draftId = searchParams.get('draftId')

    if (!draftId) {
      return NextResponse.json({ error: 'Draft ID is required' }, { status: 400 })
    }

    const draft = await prisma.aiProductDraft.findUnique({
      where: { id: draftId },
    })

    if (!draft) {
      return NextResponse.json({ error: 'Draft not found' }, { status: 404 })
    }

    if (draft.status === 'APPROVED') {
      return NextResponse.json({ 
        error: 'Cannot reject an already approved draft' 
      }, { status: 400 })
    }

    await prisma.aiProductDraft.update({
      where: { id: draftId },
      data: {
        status: 'REJECTED',
      },
    })

    return NextResponse.json({
      success: true,
      draft: {
        id: draftId,
        status: 'REJECTED',
      },
    })
  } catch (error) {
    console.error('Reject draft error:', error)
    return NextResponse.json(
      { error: 'Failed to reject draft' },
      { status: 500 }
    )
  }
}
