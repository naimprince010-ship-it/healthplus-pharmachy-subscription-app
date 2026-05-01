import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
<<<<<<< HEAD
import { TopicBlock, BlogStatus } from '@prisma/client'
import { runBlogDraftGeneration } from '@/lib/blog-engine/runGeneration'
=======
import { TopicBlock, BlogStatus, BlogType, Prisma } from '@prisma/client'
import { generateSlug, makeUniqueSlug } from '@/lib/blog-engine/slugUtils'
import { generateBeautyBlog } from '@/lib/blog-engine/beautyWriter'
import { generateGroceryBlog } from '@/lib/blog-engine/groceryWriter'
import { generateRecipeBlog } from '@/lib/blog-engine/recipeWriter'
import { generateMoneySavingBlog } from '@/lib/blog-engine/moneySavingWriter'
import { WriterContext, BlogGenerationResult } from '@/lib/blog-engine/types'
>>>>>>> c4ddf7a (feat: blog engine AI writer fixes and DALL-E 3 image generation)

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 300

const CRON_SECRET = process.env.BLOG_ENGINE_SECRET || process.env.CRON_SECRET

const BLOCKS = [
  TopicBlock.BEAUTY,
  TopicBlock.GROCERY,
  TopicBlock.RECIPE,
  TopicBlock.MONEY_SAVING,
]

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
    // A simple way to rotate between 4 blocks across days
    // Day of year
    const start = new Date(today.getFullYear(), 0, 0)
    const diff = today.getTime() - start.getTime()
    const oneDay = 1000 * 60 * 60 * 24
    const dayOfYear = Math.floor(diff / oneDay)

    const block = forceBlock || BLOCKS[dayOfYear % BLOCKS.length]

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

    const finalSlug = existingBlog ? makeUniqueSlug(slug) : slug

    const blog = await prisma.blog.create({
      data: {
        slug: finalSlug,
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

<<<<<<< HEAD
      return NextResponse.json({
        success: true,
        message: 'Blog draft generated (same pipeline as admin). Review in blog queue before publish.',
=======
      if (blog.status !== BlogStatus.TOPIC_ONLY) {
        return NextResponse.json({
          error: 'Blog already has content or is not in TOPIC_ONLY status',
          currentStatus: blog.status,
        }, { status: 400 })
      }

      const availableProducts = await prisma.product.findMany({
        where: {
          isActive: true,
          OR: [
            { aiTags: { isEmpty: false } },
            { isIngredient: true },
          ],
        },
        select: {
          id: true,
          name: true,
          slug: true,
          sellingPrice: true,
          aiTags: true,
          isIngredient: true,
          ingredientType: true,
          budgetLevel: true,
          category: { select: { name: true } },
        },
      })

      const existingBlogSlugs = await prisma.blog.findMany({
        where: { status: BlogStatus.PUBLISHED },
        select: { slug: true },
        take: 50,
      }).then(blogs => blogs.map(b => b.slug))

      const context: WriterContext = {
        topic: {
          id: blog.topic?.id || blog.id,
          title: blog.title,
          description: blog.topic?.description,
          type: blog.type,
          block: blog.block,
        },
        availableProducts,
        existingBlogSlugs,
      }

      let result: BlogGenerationResult

      switch (blog.type) {
        case BlogType.BEAUTY:
          result = await generateBeautyBlog(context)
          break
        case BlogType.GROCERY:
          result = await generateGroceryBlog(context)
          break
        case BlogType.RECIPE:
          result = await generateRecipeBlog(context)
          break
        case BlogType.MONEY_SAVING:
          result = await generateMoneySavingBlog(context)
          break
        default:
          result = await generateGroceryBlog(context)
      }

      if (!result.success || !result.content) {
        return NextResponse.json(
          { error: result.error || 'Content generation failed' },
          { status: 500 }
        )
      }

      const updatedBlog = await prisma.blog.update({
        where: { id: blogId },
        data: {
          title: result.content.title,
          summary: result.content.summary,
          contentMd: result.content.contentMd,
          seoTitle: result.content.seoTitle,
          seoDescription: result.content.seoDescription,
          seoKeywords: result.content.seoKeywords,
          faqJsonLd: result.content.faqJsonLd as unknown as Prisma.InputJsonValue,
          internalLinkSlugs: result.content.internalLinkSlugs,
          status: BlogStatus.DRAFT,
        },
      })

      if (result.products.length > 0) {
        const validProductIds = new Set(availableProducts.map(p => p.id))
        const validProducts = result.products.filter(p => validProductIds.has(p.productId))

        if (validProducts.length > 0) {
          await prisma.blogProduct.createMany({
            data: validProducts.map(p => ({
              blogId: blogId,
              productId: p.productId,
              role: p.role,
              stepOrder: p.stepOrder,
              notes: p.notes,
            })),
            skipDuplicates: true,
          })
        }
      }

      if (result.missingProducts.length > 0) {
        await prisma.missingProduct.createMany({
          data: result.missingProducts.map(m => ({
            name: m.name,
            categorySuggestion: m.categorySuggestion,
            reason: m.reason,
            blogId: blogId,
          })),
        })
      }

      return NextResponse.json({
        success: true,
        message: 'Blog generated successfully',
>>>>>>> c4ddf7a (feat: blog engine AI writer fixes and DALL-E 3 image generation)
        blog: {
          id: result.blogId,
          title: result.title,
          status: result.status,
        },
<<<<<<< HEAD
        productsLinked: result.productsLinked,
        missingProductsReported: result.missingProductsReported,
=======
        productsMatched: result.products.length,
        missingProductsReported: result.missingProducts.length,
>>>>>>> c4ddf7a (feat: blog engine AI writer fixes and DALL-E 3 image generation)
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
