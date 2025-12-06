import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { BlogStatus, BlogType, Prisma } from '@prisma/client'
import { generateBeautyBlog } from '@/lib/blog-engine/beautyWriter'
import { generateGroceryBlog } from '@/lib/blog-engine/groceryWriter'
import { generateRecipeBlog } from '@/lib/blog-engine/recipeWriter'
import { generateMoneySavingBlog } from '@/lib/blog-engine/moneySavingWriter'
import { WriterContext, BlogGenerationResult } from '@/lib/blog-engine/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 120

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

    const blog = await prisma.blog.findUnique({
      where: { id },
      include: { topic: true },
    })

    if (!blog) {
      return NextResponse.json({ error: 'Blog not found' }, { status: 404 })
    }

    if (blog.status !== BlogStatus.TOPIC_ONLY) {
      return NextResponse.json(
        { error: 'Blog already has content or is not in TOPIC_ONLY status' },
        { status: 400 }
      )
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
          where: { id },
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
            blogId: id,
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
          blogId: id,
        })),
      })
    }

    return NextResponse.json({
      success: true,
      blog: {
        id: updatedBlog.id,
        title: updatedBlog.title,
        status: updatedBlog.status,
      },
      productsLinked: result.products.length,
      missingProductsReported: result.missingProducts.length,
    })
  } catch (error) {
    console.error('Error generating blog content:', error)
    return NextResponse.json(
      { error: 'Failed to generate content', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
