import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/master/manufacturers
 * List/search manufacturers with optional filtering
 * 
 * Query params:
 * - search: Search term (searches name and aliases)
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
    const total = await prisma.manufacturer.count({ where })

    // Get manufacturers
    const manufacturers = await prisma.manufacturer.findMany({
      where,
      orderBy: { name: 'asc' },
      skip,
      take: limit,
      select: {
        id: true,
        name: true,
        aliasList: true,
        slug: true,
        requiresQcVerification: true,
        createdAt: true,
        _count: {
          select: { drafts: true },
        },
      },
    })

    return NextResponse.json({
      manufacturers: manufacturers.map(m => ({
        id: m.id,
        name: m.name,
        aliasList: m.aliasList,
        slug: m.slug,
        requiresQcVerification: m.requiresQcVerification,
        createdAt: m.createdAt,
        draftCount: m._count.drafts,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('List manufacturers error:', error)
    return NextResponse.json(
      { error: 'Failed to list manufacturers' },
      { status: 500 }
    )
  }
}
