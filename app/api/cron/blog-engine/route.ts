import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { TopicBlock, BlogStatus } from '@prisma/client'
import { runBlogDraftGeneration } from '@/lib/blog-engine/runGeneration'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 300

const CRON_SECRET = process.env.BLOG_ENGINE_SECRET || process.env.CRON_SECRET

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const cronSecret = authHeader?.replace('Bearer ', '')

    if (!CRON_SECRET || cronSecret !== CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const dryRun = request.nextUrl.searchParams.get('dryRun') === 'true'
    const autoGenerate = request.nextUrl.searchParams.get('autoGenerate') === 'true'
    const forceBlock = request.nextUrl.searchParams.get('block') as TopicBlock | null

    const today = new Date()
    const dayOfWeek = today.getDay()
    const block = forceBlock || (dayOfWeek % 2 === 0 ? 'BEAUTY' : 'GROCERY')

    const sixtyDaysAgo = new Date()
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60)

    const availableTopics = await prisma.blogTopic.findMany({
      where: {
        block: block as TopicBlock,
        isActive: true,
        OR: [{ lastUsedAt: null }, { lastUsedAt: { lt: sixtyDaysAgo } }],
      },
      orderBy: [{ timesUsed: 'asc' }, { lastUsedAt: 'asc' }],
      take: 10,
    })

    if (availableTopics.length === 0) {
      return NextResponse.json({
        success: false,
        message: `No available topics for ${block} block (all used within 60 days)`,
        block,
        dryRun,
      })
    }

    const selectedTopic = availableTopics[Math.floor(Math.random() * Math.min(3, availableTopics.length))]

    if (dryRun) {
      return NextResponse.json({
        success: true,
        dryRun: true,
        block,
        autoGenerate,
        selectedTopic: {
          id: selectedTopic.id,
          title: selectedTopic.title,
          type: selectedTopic.type,
          lastUsedAt: selectedTopic.lastUsedAt,
          timesUsed: selectedTopic.timesUsed,
        },
        availableTopicsCount: availableTopics.length,
        message: 'Dry run — no changes made',
      })
    }

    const slug = generateSlug(selectedTopic.title)

    const existingBlog = await prisma.blog.findUnique({
      where: { slug },
    })

    if (existingBlog) {
      return NextResponse.json({
        success: false,
        message: `Blog with slug "${slug}" already exists`,
        block,
        selectedTopic: selectedTopic.title,
      })
    }

    const blog = await prisma.blog.create({
      data: {
        slug,
        type: selectedTopic.type,
        block: selectedTopic.block,
        title: selectedTopic.title,
        status: BlogStatus.TOPIC_ONLY,
        topicId: selectedTopic.id,
        scheduledAt: new Date(),
      },
    })

    await prisma.blogTopic.update({
      where: { id: selectedTopic.id },
      data: {
        lastUsedAt: new Date(),
        timesUsed: { increment: 1 },
      },
    })

    const basePayload = {
      success: true,
      block,
      blog: {
        id: blog.id,
        slug: blog.slug,
        title: blog.title,
        type: blog.type,
        status: blog.status,
      },
      message: `Created blog entry for topic: ${selectedTopic.title}`,
      nextStep: autoGenerate ? 'Ran unified OpenAI draft generation' : 'Call POST generate or admin Generate; or rerun GET with autoGenerate=true',
    }

    if (!autoGenerate) {
      return NextResponse.json(basePayload)
    }

    const gen = await runBlogDraftGeneration(blog.id)
    if (!gen.ok) {
      return NextResponse.json({
        ...basePayload,
        generation: {
          success: false,
          error: gen.error,
          details: gen.details,
        },
      })
    }

    return NextResponse.json({
      ...basePayload,
      blog: {
        ...basePayload.blog,
        status: gen.status,
        title: gen.title,
      },
      generation: {
        success: true,
        productsLinked: gen.productsLinked,
        missingProductsReported: gen.missingProductsReported,
      },
    })
  } catch (error) {
    console.error('Blog engine cron error:', error)
    return NextResponse.json(
      {
        error: 'Blog engine cron failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const cronSecret = authHeader?.replace('Bearer ', '')

    if (!CRON_SECRET || cronSecret !== CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { blogId, action } = body as { blogId?: string; action?: string }

    if (action === 'generate' && typeof blogId === 'string') {
      const result = await runBlogDraftGeneration(blogId)

      if (!result.ok) {
        return NextResponse.json(
          { success: false, error: result.error, ...(result.details && { details: result.details }) },
          { status: result.httpStatus }
        )
      }

      return NextResponse.json({
        success: true,
        message: 'Blog draft generated (same pipeline as admin). Review in blog queue before publish.',
        blog: {
          id: result.blogId,
          title: result.title,
          status: result.status,
        },
        productsLinked: result.productsLinked,
        missingProductsReported: result.missingProductsReported,
      })
    }

    return NextResponse.json({ error: 'Invalid action. Use action: "generate" with blogId.' }, { status: 400 })
  } catch (error) {
    console.error('Blog engine POST error:', error)
    return NextResponse.json(
      { error: 'Request failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

function generateSlug(title: string): string {
  const date = new Date()
  const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

  const slug = title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
    .substring(0, 50)

  return `${slug}-${dateStr}`
}
