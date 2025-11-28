import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { PageGroup } from '@prisma/client'
import { z } from 'zod'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const pageListQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  search: z.string().optional(),
  group: z.enum(['QUICK_LINKS', 'SUPPORT', 'NONE', 'all']).default('all'),
  isPublished: z.enum(['true', 'false', 'all']).default('all'),
  sortBy: z.enum(['createdAt', 'title', 'sortOrder']).default('sortOrder'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
})

const createPageSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  slug: z.string().optional(),
  content: z.string().min(1, 'Content is required'),
  group: z.enum(['QUICK_LINKS', 'SUPPORT', 'NONE']).default('SUPPORT'),
  sortOrder: z.number().int().min(0).default(0),
  isPublished: z.boolean().default(true),
})

/**
 * GET /api/admin/pages
 * List pages with search, filter, and pagination
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    
    const queryResult = pageListQuerySchema.safeParse({
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '20',
      search: searchParams.get('search') || undefined,
      group: searchParams.get('group') || 'all',
      isPublished: searchParams.get('isPublished') || 'all',
      sortBy: searchParams.get('sortBy') || 'sortOrder',
      sortOrder: searchParams.get('sortOrder') || 'asc',
    })

    if (!queryResult.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: queryResult.error.flatten() },
        { status: 400 }
      )
    }

    const query = queryResult.data
    const skip = (query.page - 1) * query.limit

    const where: {
      group?: PageGroup
      isPublished?: boolean
      OR?: Array<{ title?: { contains: string; mode: 'insensitive' }; slug?: { contains: string; mode: 'insensitive' } }>
    } = {}

    if (query.group !== 'all') {
      where.group = query.group as PageGroup
    }

    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { slug: { contains: query.search, mode: 'insensitive' } },
      ]
    }

    if (query.isPublished !== 'all') {
      where.isPublished = query.isPublished === 'true'
    }

    const total = await prisma.page.count({ where })

    const pages = await prisma.page.findMany({
      where,
      orderBy: { [query.sortBy]: query.sortOrder },
      skip,
      take: query.limit,
    })

    return NextResponse.json({
      pages,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    })
  } catch (error) {
    console.error('Fetch pages error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch pages' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/pages
 * Create a new page
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const body = await request.json()
    const validationResult = createPageSchema.safeParse(body)

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
      slug = data.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
      
      let counter = 1
      let uniqueSlug = slug
      while (await prisma.page.findUnique({ where: { slug: uniqueSlug } })) {
        uniqueSlug = `${slug}-${counter}`
        counter++
      }
      slug = uniqueSlug
    } else {
      const existingPage = await prisma.page.findUnique({ where: { slug } })
      if (existingPage) {
        return NextResponse.json(
          { error: 'A page with this slug already exists' },
          { status: 400 }
        )
      }
    }

    const page = await prisma.page.create({
      data: {
        title: data.title,
        slug,
        content: data.content,
        group: data.group as PageGroup,
        sortOrder: data.sortOrder,
        isPublished: data.isPublished,
      },
    })

    return NextResponse.json({ success: true, page }, { status: 201 })
  } catch (error) {
    console.error('Create page error:', error)
    return NextResponse.json(
      { error: 'Failed to create page' },
      { status: 500 }
    )
  }
}
