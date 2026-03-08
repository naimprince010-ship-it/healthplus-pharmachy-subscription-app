import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ProductType, Prisma } from '@prisma/client'
import { z } from 'zod'
import { invalidateSearchIndex } from '@/lib/search-index'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const productListQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  search: z.string().optional(),
  categoryId: z.string().optional(),
  type: z.enum(['MEDICINE', 'GENERAL', 'all']).default('all'),
  isActive: z.enum(['true', 'false', 'all']).default('all'),
  isFeatured: z.enum(['true', 'false', 'all']).default('all'),
  sortBy: z.enum(['createdAt', 'name', 'sellingPrice', 'stockQuantity']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

import { slugify } from '@/lib/slugify'

const createProductSchema = z.object({
  type: z.enum(['GENERAL', 'MEDICINE']).default('GENERAL'),
  name: z.string().min(1),
  slug: z.string().optional(),
  description: z.string().optional(),
  brandName: z.string().optional(),
  categoryId: z.string().optional(), // Now optional if categoryName is provided
  categoryName: z.string().optional(), // For auto-creation
  manufacturerId: z.string().nullable().optional(),
  manufacturerName: z.string().optional(), // For auto-creation
  genericName: z.string().optional(),     // For auto-creation and Medicine record
  dosageForm: z.string().optional(),
  strength: z.string().optional(),
  mrp: z.number().nonnegative().optional(),
  sellingPrice: z.number().nonnegative(),
  stockQuantity: z.number().int().min(0).default(0),
  minStockAlert: z.number().int().min(0).optional(),
  unit: z.string().default('pcs'),
  imageUrl: z.string().url().optional().nullable(),
  imagePath: z.string().optional().nullable(),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  seoKeywords: z.string().optional(),
  canonicalUrl: z.string().optional().refine((val) => !val || val.startsWith('http://') || val.startsWith('https://') || val.startsWith('/'), {
    message: 'Canonical URL must be a valid URL or path starting with /',
  }),
  isFeatured: z.boolean().default(false),
  isActive: z.boolean().default(true),
  excludeFromMembershipDiscount: z.boolean().default(false),
  sizeLabel: z.string().optional(),
  variantLabel: z.string().optional(),
  keyFeatures: z.string().optional(),
  specSummary: z.string().optional(),
  isFlashSale: z.boolean().default(false),
  flashSalePrice: z.number().positive().optional(),
  flashSaleStart: z.string().datetime().optional(),
  flashSaleEnd: z.string().datetime().optional(),
  // Medicine-specific pricing
  unitPrice: z.number().nonnegative().optional(),
  stripPrice: z.number().nonnegative().optional(),
  tabletsPerStrip: z.number().int().positive().optional(),
})

/**
 * GET /api/admin/products
 * List products with search, filter, and pagination
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)

    // Handle fetching products by specific IDs (used by HomeSectionForm)
    const idsParam = searchParams.get('ids')
    if (idsParam) {
      const ids = idsParam.split(',').filter(id => id.trim())
      if (ids.length > 0) {
        const products = await prisma.product.findMany({
          where: {
            id: { in: ids },
            deletedAt: null,
          },
          include: {
            category: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
            medicine: true,
          },
        })
        return NextResponse.json({ products })
      }
      return NextResponse.json({ products: [] })
    }

    const queryResult = productListQuerySchema.safeParse({
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '20',
      search: searchParams.get('search') || undefined,
      categoryId: searchParams.get('categoryId') || undefined,
      type: searchParams.get('type') || 'all',
      isActive: searchParams.get('isActive') || 'all',
      isFeatured: searchParams.get('isFeatured') || 'all',
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
      deletedAt: null,
    }

    if (query.type !== 'all') {
      where.type = query.type
    }

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { brandName: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
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

    const total = await prisma.product.count({ where })

    const products = await prisma.product.findMany({
      where,
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        medicine: true,
      },
      orderBy: { [query.sortBy]: query.sortOrder },
      skip,
      take: query.limit,
    })

    return NextResponse.json({
      products,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    })
  } catch (error) {
    console.error('Fetch products error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/products
 * Create a new product
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const body = await request.json()
    const validationResult = createProductSchema.safeParse(body)

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

    let categoryId = data.categoryId
    let isMedicine = data.type === 'MEDICINE'

    // Auto-create category if ID is missing but Name is provided
    if (!categoryId && data.categoryName) {
      const catSlug = slugify(data.categoryName)
      const existingCat = await prisma.category.findFirst({
        where: {
          OR: [
            { name: { equals: data.categoryName, mode: 'insensitive' } },
            { slug: catSlug }
          ]
        }
      })

      if (existingCat) {
        categoryId = existingCat.id
        isMedicine = existingCat.isMedicineCategory || isMedicine
      } else {
        const newCat = await prisma.category.create({
          data: {
            name: data.categoryName,
            slug: catSlug,
            isMedicineCategory: true, // Default to true for medicine scraper flow
            isActive: true,
          }
        })
        categoryId = newCat.id
        isMedicine = true
      }
    }

    if (!categoryId) {
      return NextResponse.json(
        { error: 'Category ID or Category Name is required' },
        { status: 400 }
      )
    }

    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      select: { isMedicineCategory: true },
    })

    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 400 }
      )
    }

    isMedicine = category.isMedicineCategory || isMedicine
    const productType: ProductType = isMedicine ? 'MEDICINE' : 'GENERAL'

    let manufacturerId = data.manufacturerId

    // Auto-create manufacturer if name provided and ID missing
    if (!manufacturerId && data.manufacturerName) {
      const mfrSlug = slugify(data.manufacturerName)
      const existingMfr = await prisma.manufacturer.findFirst({
        where: {
          OR: [
            { name: { equals: data.manufacturerName, mode: 'insensitive' } },
            { slug: mfrSlug }
          ]
        }
      })

      if (existingMfr) {
        manufacturerId = existingMfr.id
      } else {
        const newMfr = await prisma.manufacturer.create({
          data: {
            name: data.manufacturerName,
            slug: mfrSlug,
          }
        })
        manufacturerId = newMfr.id
      }
    }

    // Auto-create Generic if name provided
    let genericMatchId: string | null = null
    if (data.genericName) {
      const genSlug = slugify(data.genericName)
      const existingGen = await prisma.generic.findFirst({
        where: {
          OR: [
            { name: { equals: data.genericName, mode: 'insensitive' } },
            { slug: genSlug }
          ]
        }
      })

      if (existingGen) {
        genericMatchId = existingGen.id
      } else {
        const newGen = await prisma.generic.create({
          data: {
            name: data.genericName,
            slug: genSlug,
          }
        })
        genericMatchId = newGen.id
      }
    }

    let slug = data.slug
    if (!slug) {
      slug = slugify(data.name)

      let counter = 1
      let uniqueSlug = slug
      while (await prisma.product.findUnique({ where: { slug: uniqueSlug } })) {
        uniqueSlug = `${slug}-${counter}`
        counter++
      }
      slug = uniqueSlug
    }

    const product = await prisma.product.create({
      data: {
        type: productType,
        name: data.name,
        slug,
        description: data.description,
        brandName: data.brandName || data.manufacturerName,
        categoryId: categoryId,
        manufacturerId: manufacturerId || null,
        mrp: data.mrp,
        sellingPrice: data.sellingPrice,
        stockQuantity: data.stockQuantity,
        minStockAlert: data.minStockAlert,
        inStock: data.stockQuantity > 0,
        unit: data.unit,
        imageUrl: data.imageUrl,
        imagePath: data.imagePath,
        seoTitle: data.seoTitle,
        seoDescription: data.seoDescription,
        seoKeywords: data.seoKeywords,
        canonicalUrl: data.canonicalUrl,
        isFeatured: data.isFeatured,
        isActive: data.isActive,
        excludeFromMembershipDiscount: data.excludeFromMembershipDiscount,
        sizeLabel: data.sizeLabel,
        variantLabel: data.variantLabel,
        keyFeatures: data.keyFeatures,
        specSummary: data.specSummary,
        isFlashSale: data.isFlashSale,
        flashSalePrice: data.flashSalePrice,
        flashSaleStart: data.flashSaleStart ? new Date(data.flashSaleStart) : null,
        flashSaleEnd: data.flashSaleEnd ? new Date(data.flashSaleEnd) : null,
        // Create medicine record if needed
        ...(isMedicine ? {
          medicine: {
            create: {
              name: data.name,
              slug: slug,
              genericName: data.genericName,
              brandName: data.brandName || data.manufacturerName,
              manufacturer: data.manufacturerName || 'Unknown',
              dosageForm: data.dosageForm,
              strength: data.strength,
              packSize: data.sizeLabel,
              mrp: data.mrp,
              sellingPrice: data.sellingPrice,
              price: data.sellingPrice,
              tabletsPerStrip: data.tabletsPerStrip,
              unitPrice: data.unitPrice,
              stripPrice: data.stripPrice,
              stockQuantity: data.stockQuantity,
              categoryId: categoryId,
              imageUrl: data.imageUrl,
              description: data.description,
            }
          }
        } : {})
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        medicine: true,
      },
    })

    // Invalidate the search cache to reflect the new product globally
    invalidateSearchIndex()

    return NextResponse.json({ success: true, product }, { status: 201 })
  } catch (error) {
    console.error('Create product error:', error)

    // Handle Prisma-specific errors with detailed messages
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        // Unique constraint violation
        const target = (error.meta?.target as string[])?.join(', ') || 'field'
        return NextResponse.json(
          { error: `A product with this ${target} already exists` },
          { status: 409 }
        )
      }
      if (error.code === 'P2003') {
        // Foreign key constraint violation
        return NextResponse.json(
          { error: 'Invalid category or manufacturer reference' },
          { status: 400 }
        )
      }
      if (error.code === 'P2025') {
        // Record not found
        return NextResponse.json(
          { error: 'Referenced record not found' },
          { status: 404 }
        )
      }
    }

    // Handle validation errors from Zod that might have slipped through
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    // Generic error with more details
    const errorMessage = error instanceof Error ? error.message : 'Failed to create product'
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
