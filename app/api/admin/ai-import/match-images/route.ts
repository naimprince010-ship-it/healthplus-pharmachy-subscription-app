import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { 
  indexZipFile, 
  matchImageToProduct,
  downloadZipFromStorage,
} from '@/lib/imageProcessing'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

const matchImagesSchema = z.object({
  jobId: z.string().min(1, 'Job ID is required'),
  batchSize: z.number().int().min(1).max(500).default(100),
})

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const body = await request.json()
    const validationResult = matchImagesSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      )
    }

    const { jobId, batchSize } = validationResult.data

    const job = await prisma.aiImportJob.findUnique({
      where: { id: jobId },
    })

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    if (!job.zipPath) {
      return NextResponse.json(
        { error: 'No ZIP file uploaded for this job' },
        { status: 400 }
      )
    }

    const zipBuffer = await downloadZipFromStorage(job.zipPath)
    const imageIndex = await indexZipFile(zipBuffer)

    if (imageIndex.length === 0) {
      return NextResponse.json(
        { error: 'No images found in ZIP file' },
        { status: 400 }
      )
    }

    const unmatchedDrafts = await prisma.aiProductDraft.findMany({
      where: {
        importJobId: jobId,
        imageStatus: 'UNMATCHED',
        imageRawFilename: null,
      },
      take: batchSize,
      orderBy: { rowIndex: 'asc' },
    })

    if (unmatchedDrafts.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'All drafts have been processed for image matching',
        matched: 0,
        unmatched: 0,
        remaining: 0,
      })
    }

    let matchedCount = 0
    let unmatchedCount = 0

    for (const draft of unmatchedDrafts) {
      const rawData = draft.rawData as Record<string, unknown>
      const aiSuggestion = draft.aiSuggestion as Record<string, unknown> | null
      
      const productName = 
        (aiSuggestion?.brand_name as string) ||
        (rawData.name as string) ||
        (rawData.product_name as string) ||
        (rawData.brand_name as string) ||
        ''

      if (!productName) {
        await prisma.aiProductDraft.update({
          where: { id: draft.id },
          data: {
            imageStatus: 'MISSING',
          },
        })
        unmatchedCount++
        continue
      }

      const matchResult = matchImageToProduct(productName, imageIndex)

      if (matchResult.matched && matchResult.filename) {
        await prisma.aiProductDraft.update({
          where: { id: draft.id },
          data: {
            imageRawFilename: matchResult.filename,
            imageMatchConfidence: matchResult.confidence,
            imageStatus: 'MATCHED',
          },
        })
        matchedCount++
      } else {
        await prisma.aiProductDraft.update({
          where: { id: draft.id },
          data: {
            imageStatus: 'UNMATCHED',
            imageMatchConfidence: 0,
          },
        })
        unmatchedCount++
      }
    }

    const remainingCount = await prisma.aiProductDraft.count({
      where: {
        importJobId: jobId,
        imageStatus: 'UNMATCHED',
        imageRawFilename: null,
      },
    })

    return NextResponse.json({
      success: true,
      job: {
        id: job.id,
        imageTotal: job.imageTotal,
      },
      batch: {
        processed: unmatchedDrafts.length,
        matched: matchedCount,
        unmatched: unmatchedCount,
      },
      remaining: remainingCount,
      imageIndex: imageIndex.length,
    })
  } catch (error) {
    console.error('Match images error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to match images',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}
