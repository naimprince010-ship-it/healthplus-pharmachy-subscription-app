import { prisma } from '@/lib/prisma'
import { BlogStatus, BlogType, Prisma } from '@prisma/client'
import { generateBeautyBlog } from './beautyWriter'
import { generateGroceryBlog } from './groceryWriter'
import { generateRecipeBlog } from './recipeWriter'
import { generateMoneySavingBlog } from './moneySavingWriter'
import type { WriterContext, BlogGenerationResult } from './types'

export type RunBlogDraftGenerationResult =
  | {
      ok: true
      blogId: string
      title: string
      status: BlogStatus
      productsLinked: number
      missingProductsReported: number
    }
  | { ok: false; httpStatus: number; error: string; details?: string }

/**
 * Turns a TOPIC_ONLY blog into DRAFT using the same typed writers as the admin
 * blog queue (OpenAI — beauty/grocery/recipe/money-saving). Links blogProduct /
 * missingProduct rows like the dashboard generate button.
 */
export async function runBlogDraftGeneration(blogId: string): Promise<RunBlogDraftGenerationResult> {
  try {
    const blog = await prisma.blog.findUnique({
      where: { id: blogId },
      include: { topic: true },
    })

    if (!blog) {
      return { ok: false, httpStatus: 404, error: 'Blog not found' }
    }

    if (blog.status !== BlogStatus.TOPIC_ONLY) {
      return {
        ok: false,
        httpStatus: 400,
        error: 'Blog already has content or is not in TOPIC_ONLY status',
      }
    }

    const availableProducts = await prisma.product.findMany({
      where: {
        isActive: true,
        OR: [{ aiTags: { isEmpty: false } }, { isIngredient: true }],
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

    const existingBlogSlugs = await prisma.blog
      .findMany({
        where: { status: BlogStatus.PUBLISHED },
        select: { slug: true },
        take: 50,
      })
      .then((blogs) => blogs.map((b) => b.slug))

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
      return {
        ok: false,
        httpStatus: 500,
        error: result.error || 'Content generation failed',
      }
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

    const validProductIds = new Set(availableProducts.map((p) => p.id))
    const validProducts = result.products.filter((p) => validProductIds.has(p.productId))

    if (validProducts.length > 0) {
      await prisma.blogProduct.createMany({
        data: validProducts.map((p) => ({
          blogId,
          productId: p.productId,
          role: p.role,
          stepOrder: p.stepOrder,
          notes: p.notes,
        })),
        skipDuplicates: true,
      })
    }

    if (result.missingProducts.length > 0) {
      await prisma.missingProduct.createMany({
        data: result.missingProducts.map((m) => ({
          name: m.name,
          categorySuggestion: m.categorySuggestion,
          reason: m.reason,
          blogId,
        })),
      })
    }

    return {
      ok: true,
      blogId,
      title: updatedBlog.title,
      status: updatedBlog.status,
      productsLinked: result.products.length,
      missingProductsReported: result.missingProducts.length,
    }
  } catch (error) {
    console.error('runBlogDraftGeneration:', error)
    return {
      ok: false,
      httpStatus: 500,
      error: 'Failed to generate content',
      details: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
