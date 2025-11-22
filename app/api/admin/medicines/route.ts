import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createMedicineSchema, medicineListQuerySchema } from '@/lib/validations/medicine'
import { generateUniqueMedicineSlug } from '@/lib/slug'
import {
  parseTabletsFromPackSize,
  computeStripPrice,
  generateSeoTitle,
} from '@/lib/pricing'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/medicines
 * List medicines with search, filter, and pagination
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const queryResult = medicineListQuerySchema.safeParse({
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '20',
      search: searchParams.get('search') || undefined,
      categoryId: searchParams.get('categoryId') || undefined,
      isActive: searchParams.get('isActive') || 'all',
      isFeatured: searchParams.get('isFeatured') || 'all',
      requiresPrescription: searchParams.get('requiresPrescription') || 'all',
      sortBy: searchParams.get('sortBy') || 'createdAt',
      sortOrder: searchParams.get('sortOrder') || 'desc',
    })

    if (!queryResult.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: queryResult.error.flatten() },
        { status: 400 }
      )
    }

    const query = queryResult.data
    const skip = (query.page - 1) * query.limit

    const where: any = {
      deletedAt: null, // Only show non-deleted medicines
    }

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { genericName: { contains: query.search, mode: 'insensitive' } },
        { brandName: { contains: query.search, mode: 'insensitive' } },
      ]
    }

    if (query.categoryId) {
      where.categoryId = query.categoryId
    }

    if (query.isActive !== 'all') {
      where.isActive = query.isActive === 'true'
    }

    if (query.isFeatured !== 'all') {
      where.isFeatured = query.isFeatured === 'true'
    }

    if (query.requiresPrescription !== 'all') {
      where.requiresPrescription = query.requiresPrescription === 'true'
    }

    const total = await prisma.medicine.count({ where })

    const medicines = await prisma.medicine.findMany({
      where,
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      orderBy: { [query.sortBy]: query.sortOrder },
      skip,
      take: query.limit,
    })

    return NextResponse.json({
      medicines,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    })
  } catch (error) {
    console.error('Fetch medicines error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch medicines' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/medicines
 * Create a new medicine
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const body = await request.json()
    const validationResult = createMedicineSchema.safeParse(body)

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

    const slug = await generateUniqueMedicineSlug(data.name)

    let tabletsPerStrip = data.tabletsPerStrip
    if (!tabletsPerStrip && data.packSize) {
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

    if (!sellingPrice) {
      return NextResponse.json(
        { error: 'Selling price is required (either directly or computed from unit price)' },
        { status: 400 }
      )
    }

    let seoTitle = data.seoTitle
    if (!seoTitle) {
      seoTitle = generateSeoTitle({
        name: data.name,
        strength: data.strength,
        dosageForm: data.dosageForm,
        packSize: data.packSize,
      })
    }

    const expiryDate = data.expiryDate ? new Date(data.expiryDate) : undefined

    const medicine = await prisma.medicine.create({
      data: {
        name: data.name,
        slug,
        genericName: data.genericName,
        brandName: data.brandName,
        manufacturer: data.manufacturer,
        dosageForm: data.dosageForm,
        packSize: data.packSize,
        strength: data.strength,
        description: data.description,
        categoryId: data.categoryId,
        mrp: data.mrp,
        sellingPrice,
        price: sellingPrice,
        unitPrice: data.unitPrice,
        stripPrice,
        tabletsPerStrip,
        stockQuantity: data.stockQuantity,
        minStockAlert: data.minStockAlert,
        seoTitle,
        seoDescription: data.seoDescription,
        seoKeywords: data.seoKeywords,
        canonicalUrl: data.canonicalUrl,
        imageUrl: data.imageUrl,
        imagePath: data.imagePath,
        uses: data.uses,
        sideEffects: data.sideEffects,
        contraindications: data.contraindications,
        storageInstructions: data.storageInstructions,
        expiryDate,
        requiresPrescription: data.requiresPrescription,
        isFeatured: data.isFeatured,
        isActive: data.isActive,
        inStock: data.stockQuantity > 0,
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

    return NextResponse.json({ success: true, medicine }, { status: 201 })
  } catch (error) {
    console.error('Create medicine error:', error)
    return NextResponse.json(
      { error: 'Failed to create medicine' },
      { status: 500 }
    )
  }
}
