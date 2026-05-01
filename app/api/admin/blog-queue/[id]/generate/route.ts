import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { runBlogDraftGeneration } from '@/lib/blog-engine/runGeneration'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 300

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const exists = await prisma.blog.findUnique({ where: { id }, select: { id: true } })
    if (!exists) {
      return NextResponse.json({ error: 'Blog not found' }, { status: 404 })
    }

    const result = await runBlogDraftGeneration(id)

    if (!result.ok) {
      return NextResponse.json(
        { error: result.error, ...(result.details && { details: result.details }) },
        { status: result.httpStatus }
      )
    }

    return NextResponse.json({
      success: true,
      blog: {
        id: result.blogId,
        title: result.title,
        status: result.status,
      },
      productsLinked: result.productsLinked,
      missingProductsReported: result.missingProductsReported,
    })
  } catch (error) {
    console.error('Error generating blog content:', error)
    return NextResponse.json(
      {
        error: 'Failed to generate content',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
