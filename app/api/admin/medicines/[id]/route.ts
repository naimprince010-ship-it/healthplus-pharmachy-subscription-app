import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { updateMedicineSchema } from '@/lib/validations/medicine'
import { generateUniqueMedicineSlug } from '@/lib/slug'
import {
  parseTabletsFromPackSize,
  computeStripPrice,
  generateSeoTitle,
} from '@/lib/pricing'
import { deleteMedicineImage } from '@/lib/supabase'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/medicines/[id]
 * Get a single medicine by ID
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
    const medicine = await prisma.medicine.findUnique({
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

    if (!medicine) {
      return NextResponse.json({ error: 'Medicine not found' }, { status: 404 })
    }

    return NextResponse.json({ medicine })
  } catch (error) {
    console.error('Fetch medicine error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch medicine' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/admin/medicines/[id]
 * Update a medicine
 */
export async function PUT(
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
    const validationResult = updateMedicineSchema.safeParse({
      ...body,
      id,
    })

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

    const existing = await prisma.medicine.findUnique({
      where: { id },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Medicine not found' }, { status: 404 })
    }

    let slug = existing.slug
    if (data.name && data.name !== existing.name) {
      slug = await generateUniqueMedicineSlug(data.name, id)
    }

    let tabletsPerStrip = data.tabletsPerStrip
    if (tabletsPerStrip === undefined && data.packSize) {
      tabletsPerStrip = parseTabletsFromPackSize(data.packSize)
    }

    let stripPrice = data.stripPrice
    if (!stripPrice && data.unitPrice && tabletsPerStrip) {
      stripPrice = computeStripPrice(data.unitPrice, tabletsPerStrip)
    }

    let sellingPrice = data.sellingPrice
    if (!sellingPrice && stripPrice) {
      sellingPrice = stripPrice
    }

    let seoTitle = data.seoTitle
    if (data.seoTitle === undefined && !existing.seoTitle && data.name) {
      seoTitle = generateSeoTitle({
        name: data.name || existing.name,
        strength: data.strength || existing.strength,
        dosageForm: data.dosageForm || existing.dosageForm,
        packSize: data.packSize || existing.packSize,
      })
    }

    if (data.imagePath && data.imagePath !== existing.imagePath && existing.imagePath) {
      try {
        await deleteMedicineImage(existing.imagePath)
      } catch (error) {
        console.error('Failed to delete old image:', error)
      }
    }

    const updateData: any = {}
    if (data.name !== undefined) updateData.name = data.name
    if (data.name !== undefined) updateData.slug = slug
    if (data.genericName !== undefined) updateData.genericName = data.genericName
    if (data.brandName !== undefined) updateData.brandName = data.brandName
    if (data.manufacturer !== undefined) updateData.manufacturer = data.manufacturer
    if (data.dosageForm !== undefined) updateData.dosageForm = data.dosageForm
    if (data.packSize !== undefined) updateData.packSize = data.packSize
    if (data.strength !== undefined) updateData.strength = data.strength
    if (data.description !== undefined) updateData.description = data.description
    if (data.categoryId !== undefined) updateData.categoryId = data.categoryId
    if (data.mrp !== undefined) updateData.mrp = data.mrp
    if (sellingPrice !== undefined) {
      updateData.sellingPrice = sellingPrice
      updateData.price = sellingPrice
    }
    if (data.unitPrice !== undefined) updateData.unitPrice = data.unitPrice
    if (stripPrice !== undefined) updateData.stripPrice = stripPrice
    if (tabletsPerStrip !== undefined) updateData.tabletsPerStrip = tabletsPerStrip
    if (data.stockQuantity !== undefined) {
      updateData.stockQuantity = data.stockQuantity
      updateData.inStock = data.stockQuantity > 0
    }
    if (data.minStockAlert !== undefined) updateData.minStockAlert = data.minStockAlert
    if (seoTitle !== undefined) updateData.seoTitle = seoTitle
    if (data.seoDescription !== undefined) updateData.seoDescription = data.seoDescription
    if (data.seoKeywords !== undefined) updateData.seoKeywords = data.seoKeywords
    if (data.canonicalUrl !== undefined) updateData.canonicalUrl = data.canonicalUrl
    if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl
    if (data.imagePath !== undefined) updateData.imagePath = data.imagePath
    if (data.uses !== undefined) updateData.uses = data.uses
    if (data.sideEffects !== undefined) updateData.sideEffects = data.sideEffects
    if (data.contraindications !== undefined) updateData.contraindications = data.contraindications
    if (data.storageInstructions !== undefined) updateData.storageInstructions = data.storageInstructions
    if (data.expiryDate !== undefined) updateData.expiryDate = data.expiryDate ? new Date(data.expiryDate) : null
    if (data.requiresPrescription !== undefined) updateData.requiresPrescription = data.requiresPrescription
    if (data.isFeatured !== undefined) updateData.isFeatured = data.isFeatured
    if (data.isActive !== undefined) updateData.isActive = data.isActive

    const medicine = await prisma.medicine.update({
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

    return NextResponse.json({ success: true, medicine })
  } catch (error) {
    console.error('Update medicine error:', error)
    return NextResponse.json(
      { error: 'Failed to update medicine' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/medicines/[id]
 * Soft delete a medicine
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

    const existing = await prisma.medicine.findUnique({
      where: { id },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Medicine not found' }, { status: 404 })
    }

    const orderItemCount = await prisma.orderItem.count({
      where: { medicineId: id },
    })

    const subscriptionItemCount = await prisma.subscriptionItem.count({
      where: { medicineId: id },
    })

    if (orderItemCount > 0 || subscriptionItemCount > 0) {
      const medicine = await prisma.medicine.update({
        where: { id },
        data: {
          isActive: false,
          deletedAt: new Date(),
        },
      })

      return NextResponse.json({
        success: true,
        message: `Medicine soft deleted (${orderItemCount} order(s), ${subscriptionItemCount} subscription(s)). Data preserved for historical records.`,
        medicine,
      })
    }

    if (existing.imagePath) {
      try {
        await deleteMedicineImage(existing.imagePath)
      } catch (error) {
        console.error('Failed to delete medicine image:', error)
      }
    }

    await prisma.medicine.delete({
      where: { id },
    })

    return NextResponse.json({
      success: true,
      message: 'Medicine permanently deleted',
    })
  } catch (error) {
    console.error('Delete medicine error:', error)
    return NextResponse.json(
      { error: 'Failed to delete medicine' },
      { status: 500 }
    )
  }
}
