import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const uploadCsvSchema = z.object({
  csvPath: z.string().min(1, 'CSV path is required'),
  csvData: z.array(z.record(z.string(), z.any())).optional(),
  totalRows: z.number().int().positive().optional(),
  config: z.object({
    modelName: z.string().default('gpt-4o-mini'),
    batchSize: z.number().int().min(1).max(100).default(100),
  }).optional(),
})

/**
 * POST /api/admin/ai-import/upload-csv
 * Create a new AI import job from uploaded CSV
 * 
 * Request body:
 * - csvPath: Supabase storage path to uploaded CSV
 * - csvData: Optional parsed CSV data (array of objects)
 * - totalRows: Optional total row count (if not provided, will be computed from csvData)
 * - config: Optional configuration (model name, batch size)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const body = await request.json()
    const validationResult = uploadCsvSchema.safeParse(body)

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
    const adminId = session.user.id

    // Calculate total rows from csvData if provided
    let totalRows = data.totalRows
    if (!totalRows && data.csvData) {
      totalRows = data.csvData.length
    }

    // Create the import job
    const job = await prisma.aiImportJob.create({
      data: {
        createdByAdminId: adminId,
        csvPath: data.csvPath,
        status: 'PENDING',
        totalRows: totalRows || null,
        processedRows: 0,
        failedRows: 0,
        config: data.config ? {
          modelName: data.config.modelName || 'gpt-4o-mini',
          batchSize: data.config.batchSize || 100,
        } : {
          modelName: 'gpt-4o-mini',
          batchSize: 100,
        },
      },
    })

    // If CSV data is provided, create draft records for each row
    if (data.csvData && data.csvData.length > 0) {
      const drafts = data.csvData.map((row, index) => ({
        importJobId: job.id,
        rowIndex: index + 1, // 1-indexed for user-friendly display
        rawData: row,
        status: 'PENDING_REVIEW' as const,
      }))

      await prisma.aiProductDraft.createMany({
        data: drafts,
      })
    }

    return NextResponse.json({
      success: true,
      job: {
        id: job.id,
        status: job.status,
        totalRows: job.totalRows,
        processedRows: job.processedRows,
        failedRows: job.failedRows,
        csvPath: job.csvPath,
        config: job.config,
        createdAt: job.createdAt,
      },
    }, { status: 201 })
  } catch (error) {
    console.error('Create AI import job error:', error)
    return NextResponse.json(
      { error: 'Failed to create AI import job' },
      { status: 500 }
    )
  }
}
