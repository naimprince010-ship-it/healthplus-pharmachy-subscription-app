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
  // Phase 2: QC verification flags (must all be true to approve)
  qcVerification: z.object({
    genericVerified: z.boolean(),
    manufacturerVerified: z.boolean(),
    categoryVerified: z.boolean(),
  }).optional(),
  // Phase 2: Master table match IDs
  matchIds: z.object({
    genericMatchId: z.string().nullable().optional(),
    manufacturerMatchId: z.string().nullable().optional(),
    categoryMatchId: z.string().nullable().optional(),
    subcategoryMatchId: z.string().nullable().optional(),
  }).optional(),
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

    const { draftId, productData, qcVerification, matchIds } = validationResult.data

    // Get the draft with Phase 2 relations and Phase 3 image fields
    const draft = await prisma.aiProductDraft.findUnique({
      where: { id: draftId },
      include: {
        importJob: true,
        generic: true,
        manufacturer: true,
        category: true,
        subcategory: true,
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

    // Phase 2: QC Verification Enforcement
    // Rule 5: Product approval blocked unless generic, manufacturer, category all verified
    const qcFlags = qcVerification || {
      genericVerified: draft.genericVerified,
      manufacturerVerified: draft.manufacturerVerified,
      categoryVerified: draft.categoryVerified,
    }

    // Check if all QC flags are verified
    if (!qcFlags.genericVerified || !qcFlags.manufacturerVerified || !qcFlags.categoryVerified) {
      const missingVerifications = []
      if (!qcFlags.genericVerified) missingVerifications.push('Generic')
      if (!qcFlags.manufacturerVerified) missingVerifications.push('Manufacturer')
      if (!qcFlags.categoryVerified) missingVerifications.push('Category')
      
      return NextResponse.json({
        error: 'QC verification incomplete',
        message: `The following must be verified before approval: ${missingVerifications.join(', ')}`,
        missingVerifications,
      }, { status: 400 })
    }

    // Phase 2: Validate match IDs if provided
    const finalMatchIds = matchIds || {
      genericMatchId: draft.genericMatchId,
      manufacturerMatchId: draft.manufacturerMatchId,
      categoryMatchId: draft.categoryMatchId,
      subcategoryMatchId: draft.subcategoryMatchId,
    }

    // Validate generic match ID exists if provided
    if (finalMatchIds.genericMatchId) {
      const genericExists = await prisma.generic.findUnique({
        where: { id: finalMatchIds.genericMatchId },
      })
      if (!genericExists) {
        return NextResponse.json({
          error: 'Invalid generic match ID',
          message: 'The selected generic does not exist in the master table',
        }, { status: 400 })
      }
    }

    // Validate manufacturer match ID exists if provided
    if (finalMatchIds.manufacturerMatchId) {
      const manufacturerExists = await prisma.manufacturer.findUnique({
        where: { id: finalMatchIds.manufacturerMatchId },
      })
      if (!manufacturerExists) {
        return NextResponse.json({
          error: 'Invalid manufacturer match ID',
          message: 'The selected manufacturer does not exist in the master table',
        }, { status: 400 })
      }
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

    // Phase 3: Determine final image URL
    // Priority: 1) productData.imageUrl (manual override), 2) draft.imageUrl (processed image)
    const finalImageUrl = productData.imageUrl || draft.imageUrl || null

    // Phase 3: Log warning if no image available
    if (!finalImageUrl && draft.imageStatus !== 'PROCESSED') {
      console.warn(`Approving draft ${draftId} without image. Image status: ${draft.imageStatus}`)
    }

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
        imageUrl: finalImageUrl,
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

    // Update the draft status with Phase 2 QC flags and match IDs
    await prisma.aiProductDraft.update({
      where: { id: draftId },
      data: {
        status: 'APPROVED',
        publishedProductId: product.id,
        // Phase 2: Save final QC verification state
        genericVerified: qcFlags.genericVerified,
        manufacturerVerified: qcFlags.manufacturerVerified,
        categoryVerified: qcFlags.categoryVerified,
        // Phase 2: Save final match IDs
        genericMatchId: finalMatchIds.genericMatchId,
        manufacturerMatchId: finalMatchIds.manufacturerMatchId,
        categoryMatchId: finalMatchIds.categoryMatchId,
        subcategoryMatchId: finalMatchIds.subcategoryMatchId,
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
