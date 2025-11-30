import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const jobsQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  status: z.enum(['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED', 'all']).default('all'),
  sortBy: z.enum(['createdAt', 'updatedAt', 'totalRows', 'processedRows']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

/**
 * GET /api/admin/ai-import/jobs
 * List AI import jobs with filtering and pagination
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const queryResult = jobsQuerySchema.safeParse({
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '20',
      status: searchParams.get('status') || 'all',
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

    const where: Record<string, unknown> = {}

    if (query.status !== 'all') {
      where.status = query.status
    }

    const total = await prisma.aiImportJob.count({ where })

    const jobs = await prisma.aiImportJob.findMany({
      where,
      include: {
        _count: {
          select: {
            drafts: true,
          },
        },
      },
      orderBy: { [query.sortBy]: query.sortOrder },
      skip,
      take: query.limit,
    })

    // Get draft status counts for each job
    const jobsWithStats = await Promise.all(
      jobs.map(async (job) => {
        const statusCounts = await prisma.aiProductDraft.groupBy({
          by: ['status'],
          where: { importJobId: job.id },
          _count: { status: true },
        })

        const stats = {
          pending_review: 0,
          approved: 0,
          rejected: 0,
          ai_error: 0,
          manually_edited: 0,
        }

        statusCounts.forEach((sc) => {
          const key = sc.status.toLowerCase().replace('_', '_') as keyof typeof stats
          if (key in stats) {
            stats[key] = sc._count.status
          }
        })

        return {
          id: job.id,
          createdByAdminId: job.createdByAdminId,
          csvPath: job.csvPath,
          status: job.status,
          totalRows: job.totalRows,
          processedRows: job.processedRows,
          failedRows: job.failedRows,
          errorSummary: job.errorSummary,
          config: job.config,
          createdAt: job.createdAt,
          updatedAt: job.updatedAt,
          draftCount: job._count.drafts,
          draftStats: stats,
        }
      })
    )

    return NextResponse.json({
      jobs: jobsWithStats,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    })
  } catch (error) {
    console.error('Fetch AI import jobs error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch AI import jobs' },
      { status: 500 }
    )
  }
}
