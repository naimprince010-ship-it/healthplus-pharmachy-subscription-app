import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { 
  downloadZipFromStorage,
  extractImageFromZip,
  processImage,
  uploadProcessedImage,
  generateImageStoragePath,
} from '@/lib/imageProcessing'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

const processImagesSchema = z.object({
  jobId: z.string().min(1, 'Job ID is required'),
  batchSize: z.number().int().min(1).max(50).default(50),
})

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 100)
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const body = await request.json()
    const validationResult = processImagesSchema.safeParse(body)

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

    await prisma.aiImportJob.update({
      where: { id: jobId },
      data: { imageStatus: 'PROCESSING' },
    })

    const matchedDrafts = await prisma.aiProductDraft.findMany({
      where: {
        importJobId: jobId,
        imageStatus: 'MATCHED',
        imageRawFilename: { not: null },
      },
      take: batchSize,
      orderBy: { rowIndex: 'asc' },
    })

    if (matchedDrafts.length === 0) {
      const remainingMatched = await prisma.aiProductDraft.count({
        where: {
          importJobId: jobId,
          imageStatus: 'MATCHED',
        },
      })

      if (remainingMatched === 0) {
        await prisma.aiImportJob.update({
          where: { id: jobId },
          data: { imageStatus: 'COMPLETED' },
        })
      }

      return NextResponse.json({
        success: true,
        message: 'All matched images have been processed',
        processed: 0,
        failed: 0,
        remaining: remainingMatched,
      })
    }

    const zipBuffer = await downloadZipFromStorage(job.zipPath)

    let processedCount = 0
    let failedCount = 0
    const errors: string[] = []

    for (const draft of matchedDrafts) {
      try {
        if (!draft.imageRawFilename) {
          failedCount++
          continue
        }

        const imageBuffer = await extractImageFromZip(zipBuffer, draft.imageRawFilename)
        
        if (!imageBuffer) {
          await prisma.aiProductDraft.update({
            where: { id: draft.id },
            data: { imageStatus: 'MISSING' },
          })
          failedCount++
          errors.push(`Image not found in ZIP: ${draft.imageRawFilename}`)
          continue
        }

        const processedBuffer = await processImage(imageBuffer)

        const rawData = draft.rawData as Record<string, unknown>
        const aiSuggestion = draft.aiSuggestion as Record<string, unknown> | null
        const productName = 
          (aiSuggestion?.brand_name as string) ||
          (rawData.name as string) ||
          (rawData.product_name as string) ||
          `product-${draft.rowIndex}`

        const slug = generateSlug(productName)
        const storagePath = generateImageStoragePath(jobId, `${slug}-${draft.rowIndex}`)

        const imageUrl = await uploadProcessedImage(processedBuffer, storagePath)

        await prisma.aiProductDraft.update({
          where: { id: draft.id },
          data: {
            imageUrl,
            imageStatus: 'PROCESSED',
          },
        })

        processedCount++
      } catch (error) {
        failedCount++
        errors.push(`Failed to process ${draft.imageRawFilename}: ${error instanceof Error ? error.message : String(error)}`)
        
        await prisma.aiProductDraft.update({
          where: { id: draft.id },
          data: { imageStatus: 'MISSING' },
        })
      }
    }

    await prisma.aiImportJob.update({
      where: { id: jobId },
      data: {
        imageProcessed: {
          increment: processedCount,
        },
      },
    })

    const remainingCount = await prisma.aiProductDraft.count({
      where: {
        importJobId: jobId,
        imageStatus: 'MATCHED',
      },
    })

    if (remainingCount === 0) {
      await prisma.aiImportJob.update({
        where: { id: jobId },
        data: { imageStatus: 'COMPLETED' },
      })
    }

    return NextResponse.json({
      success: true,
      job: {
        id: job.id,
        imageTotal: job.imageTotal,
        imageProcessed: (job.imageProcessed || 0) + processedCount,
      },
      batch: {
        attempted: matchedDrafts.length,
        processed: processedCount,
        failed: failedCount,
      },
      remaining: remainingCount,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error) {
    console.error('Process images error:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to process images',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}
