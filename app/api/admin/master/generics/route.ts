import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/master/generics
 * List/search generics with optional filtering
 * 
 * Query params:
 * - search: Search term (searches name and synonyms)
 * - page: Page number (default 1)
 * - limit: Items per page (default 50, max 200)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.min(200, Math.max(1, parseInt(searchParams.get('limit') || '50', 10)))
    const skip = (page - 1) * limit

    // Build where clause
    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            // Note: Searching JSON arrays requires raw SQL in Prisma
            // For now, we'll just search by name
          ],
        }
      : {}

    // Get total count
    const total = await prisma.generic.count({ where })

    // Get generics
    const generics = await prisma.generic.findMany({
      where,
      orderBy: { name: 'asc' },
      skip,
      take: limit,
      select: {
        id: true,
        name: true,
        synonyms: true,
        slug: true,
        createdAt: true,
        _count: {
          select: { drafts: true },
        },
      },
    })

    return NextResponse.json({
      generics: generics.map(g => ({
        id: g.id,
        name: g.name,
        synonyms: g.synonyms,
        slug: g.slug,
        createdAt: g.createdAt,
        draftCount: g._count.drafts,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('List generics error:', error)
    return NextResponse.json(
      { error: 'Failed to list generics' },
      { status: 500 }
    )
  }
}
