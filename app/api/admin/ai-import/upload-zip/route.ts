import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { indexZipFile } from '@/lib/imageProcessing'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const uploadZipSchema = z.object({
  jobId: z.string().min(1, 'Job ID is required'),
  zipPath: z.string().min(1, 'ZIP path is required'),
})

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase credentials not configured')
  }
  return createClient(supabaseUrl, supabaseKey)
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const body = await request.json()
    const validationResult = uploadZipSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      )
    }

    const { jobId, zipPath } = validationResult.data

    const job = await prisma.aiImportJob.findUnique({
      where: { id: jobId },
    })

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    const supabase = getSupabaseClient()
    const { data: zipData, error: downloadError } = await supabase.storage
      .from('ai-import')
      .download(zipPath)

    if (downloadError || !zipData) {
      return NextResponse.json(
        { error: `Failed to download ZIP: ${downloadError?.message || 'Unknown error'}` },
        { status: 500 }
      )
    }

    const zipBuffer = Buffer.from(await zipData.arrayBuffer())
    const imageIndex = await indexZipFile(zipBuffer)

    const updatedJob = await prisma.aiImportJob.update({
      where: { id: jobId },
      data: {
        zipPath,
        imageTotal: imageIndex.length,
        imageStatus: 'PENDING',
      },
    })

    return NextResponse.json({
      success: true,
      job: {
        id: updatedJob.id,
        zipPath: updatedJob.zipPath,
        imageTotal: updatedJob.imageTotal,
        imageStatus: updatedJob.imageStatus,
      },
      imageIndex: imageIndex.map(img => ({
        filename: img.filename,
        size: img.size,
      })),
    })
  } catch (error) {
    console.error('Upload ZIP error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to process ZIP file',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}
