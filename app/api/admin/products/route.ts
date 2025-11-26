import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ProductType } from '@prisma/client'
import { z } from 'zod'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const productListQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  search: z.string().optional(),
  categoryId: z.string().optional(),
  type: z.enum(['MEDICINE', 'GENERAL', 'all']).default('GENERAL'),
  isActive: z.enum(['true', 'false', 'all']).default('all'),
  isFeatured: z.enum(['true', 'false', 'all']).default('all'),
  sortBy: z.enum(['createdAt', 'name', 'sellingPrice', 'stockQuantity']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

const createProductSchema = z.object({
  type: z.enum(['GENERAL']).default('GENERAL'),
  name: z.string().min(1),
  slug: z.string().optional(),
  description: z.string().optional(),
  brandName: z.string().optional(),
  categoryId: z.string().min(1),
  mrp: z.number().positive().optional(),
  sellingPrice: z.number().positive(),
  stockQuantity: z.number().int().min(0).default(0),
  minStockAlert: z.number().int().min(0).optional(),
  unit: z.string().default('pcs'),
  imageUrl: z.string().url().optional(),
  imagePath: z.string().optional(),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  seoKeywords: z.string().optional(),
  canonicalUrl: z.string().url().optional(),
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
    const queryResult = productListQuerySchema.safeParse({
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '20',
      search: searchParams.get('search') || undefined,
      categoryId: searchParams.get('categoryId') || undefined,
      type: searchParams.get('type') || 'GENERAL',
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

    let slug = data.slug
    if (!slug) {
      slug = data.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
      
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
        type: 'GENERAL',
        name: data.name,
        slug,
        description: data.description,
        brandName: data.brandName,
        categoryId: data.categoryId,
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

    return NextResponse.json({ success: true, product }, { status: 201 })
  } catch (error) {
    console.error('Create product error:', error)
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    )
  }
}
