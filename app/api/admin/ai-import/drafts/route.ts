import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const draftsQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  jobId: z.string().optional(),
  status: z.enum(['PENDING_REVIEW', 'APPROVED', 'REJECTED', 'AI_ERROR', 'MANUALLY_EDITED', 'all']).default('all'),
  minConfidence: z.coerce.number().min(0).max(1).optional(),
  maxConfidence: z.coerce.number().min(0).max(1).optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'rowIndex', 'aiConfidence']).default('rowIndex'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
})

/**
 * GET /api/admin/ai-import/drafts
 * List AI product drafts with filtering and pagination
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    
    // Handle single draft fetch by ID
    const draftId = searchParams.get('id')
    if (draftId) {
      const draft = await prisma.aiProductDraft.findUnique({
        where: { id: draftId },
        include: {
          importJob: {
            select: {
              id: true,
              status: true,
              csvPath: true,
              createdAt: true,
            },
          },
        },
      })

      if (!draft) {
        return NextResponse.json({ error: 'Draft not found' }, { status: 404 })
      }

      return NextResponse.json({ draft })
    }

    const queryResult = draftsQuerySchema.safeParse({
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '20',
      jobId: searchParams.get('jobId') || undefined,
      status: searchParams.get('status') || 'all',
      minConfidence: searchParams.get('minConfidence') || undefined,
      maxConfidence: searchParams.get('maxConfidence') || undefined,
      sortBy: searchParams.get('sortBy') || 'rowIndex',
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

    const where: Record<string, unknown> = {}

    if (query.jobId) {
      where.importJobId = query.jobId
    }

    if (query.status !== 'all') {
      where.status = query.status
    }

    // Confidence range filter
    if (query.minConfidence !== undefined || query.maxConfidence !== undefined) {
      where.aiConfidence = {}
      if (query.minConfidence !== undefined) {
        (where.aiConfidence as Record<string, number>).gte = query.minConfidence
      }
      if (query.maxConfidence !== undefined) {
        (where.aiConfidence as Record<string, number>).lte = query.maxConfidence
      }
    }

    const total = await prisma.aiProductDraft.count({ where })

    const drafts = await prisma.aiProductDraft.findMany({
      where,
      include: {
        importJob: {
          select: {
            id: true,
            status: true,
            csvPath: true,
          },
        },
      },
      orderBy: { [query.sortBy]: query.sortOrder },
      skip,
      take: query.limit,
    })

    return NextResponse.json({
      drafts,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    })
  } catch (error) {
    console.error('Fetch AI product drafts error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch AI product drafts' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/admin/ai-import/drafts
 * Update a draft (for manual editing)
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const body = await request.json()
    const { id, aiSuggestion, notes, status } = body

    if (!id) {
      return NextResponse.json({ error: 'Draft ID is required' }, { status: 400 })
    }

    const draft = await prisma.aiProductDraft.findUnique({
      where: { id },
    })

    if (!draft) {
      return NextResponse.json({ error: 'Draft not found' }, { status: 404 })
    }

    const updateData: Record<string, unknown> = {}

    if (aiSuggestion !== undefined) {
      updateData.aiSuggestion = aiSuggestion
      updateData.status = 'MANUALLY_EDITED'
    }

    if (notes !== undefined) {
      updateData.notes = notes
    }

    if (status !== undefined) {
      updateData.status = status
    }

    const updatedDraft = await prisma.aiProductDraft.update({
      where: { id },
      data: updateData,
      include: {
        importJob: {
          select: {
            id: true,
            status: true,
            csvPath: true,
          },
        },
      },
    })

    return NextResponse.json({ success: true, draft: updatedDraft })
  } catch (error) {
    console.error('Update AI product draft error:', error)
    return NextResponse.json(
      { error: 'Failed to update AI product draft' },
      { status: 500 }
    )
  }
}
