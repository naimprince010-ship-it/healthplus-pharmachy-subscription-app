import { prisma } from '@/lib/prisma'
import { BlogStatus, BlogType, Prisma, ProductType } from '@prisma/client'
import OpenAI from 'openai'
import { supabaseAdmin } from '@/lib/supabase'
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

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function replaceFirstPlainMentionInLine(line: string, name: string, slug: string): string {
  const lowerLine = line.toLowerCase()
  const lowerName = name.toLowerCase()
  let fromIdx = 0

  while (true) {
    const idx = lowerLine.indexOf(lowerName, fromIdx)
    if (idx === -1) return line

    // Skip if mention is already inside markdown link syntax: [..](..)
    const linkMatches = [...line.matchAll(/\[[^\]]+\]\([^)]+\)/g)]
    const insideLink = linkMatches.some((m) => {
      const start = m.index ?? -1
      const end = start + m[0].length
      return idx >= start && idx < end
    })
    if (insideLink) {
      fromIdx = idx + lowerName.length
      continue
    }

    const raw = line.slice(idx, idx + name.length)
    const linked = `[${raw}](/products/${slug})`
    return `${line.slice(0, idx)}${linked}${line.slice(idx + name.length)}`
  }
}

function linkProductMentionsInMarkdown(
  contentMd: string,
  products: Array<{ name: string; slug: string }>
): string {
  if (!contentMd || products.length === 0) return contentMd

  // Longer names first so specific matches win.
  const sortedProducts = [...products]
    .filter((p) => !!p.name && !!p.slug)
    .sort((a, b) => b.name.length - a.name.length)

  const lines = contentMd.split('\n')
  const linkedNames = new Set<string>()
  let insideCodeFence = false

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (line.trimStart().startsWith('```')) {
      insideCodeFence = !insideCodeFence
      continue
    }
    if (insideCodeFence || !line.trim()) continue

    let nextLine = line
    for (const p of sortedProducts) {
      if (linkedNames.has(p.name)) continue

      // Fast pre-check to avoid unnecessary work
      const escaped = escapeRegExp(p.name)
      if (!new RegExp(escaped, 'i').test(nextLine)) continue

      const replaced = replaceFirstPlainMentionInLine(nextLine, p.name, p.slug)
      if (replaced !== nextLine) {
        nextLine = replaced
        linkedNames.add(p.name)
      }
    }
    lines[i] = nextLine
  }

  return lines.join('\n')
}

async function generateBlogCoverImageUrl(
  blogId: string,
  type: BlogType,
  title: string,
  summary?: string
): Promise<string | null> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return null
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return null

  try {
    const openai = new OpenAI({ apiKey })
    const styleHint =
      type === BlogType.BEAUTY
        ? 'clean skincare flat-lay, soft pastel colors, product silhouettes, no readable text'
        : type === BlogType.RECIPE
          ? 'bangladeshi cooking ingredients and plated food, warm tones, no readable text'
          : type === BlogType.MONEY_SAVING
            ? 'smart shopping cart, grocery and beauty icons, budget vibe, no readable text'
            : 'fresh grocery and wellness lifestyle composition, no readable text'

    const prompt = `Create a premium ecommerce blog cover image for Halalzi (Bangladesh).
Title context: ${title}
Summary context: ${summary || 'Helpful consumer guide.'}
Visual style: ${styleHint}
Requirements: high-quality, editorial hero, no logos, no watermark, no readable text, no faces, safe general audience.`

    const imageRes = await openai.images.generate({
      model: 'gpt-image-1',
      prompt,
      size: '1536x1024',
      quality: 'medium',
      response_format: 'b64_json',
    })

    const b64 = imageRes.data?.[0]?.b64_json
    if (!b64) return null
    const buffer = Buffer.from(b64, 'base64')

    const bucket = process.env.SUPABASE_BLOG_BUCKET || process.env.SUPABASE_MEDICINE_BUCKET || 'medicine-images'
    const filePath = `blogs/${blogId}/cover-${Date.now()}.png`

    const { data, error } = await supabaseAdmin.storage.from(bucket).upload(filePath, buffer, {
      cacheControl: '3600',
      upsert: false,
      contentType: 'image/png',
    })
    if (error || !data?.path) {
      console.error('generateBlogCoverImageUrl upload error:', error)
      return null
    }

    const { data: urlData } = supabaseAdmin.storage.from(bucket).getPublicUrl(data.path)
    return urlData.publicUrl || null
  } catch (error) {
    console.error('generateBlogCoverImageUrl error:', error)
    return null
  }
}

function getFallbackCoverImageUrl(type: BlogType): string {
  const envDefault = process.env.BLOG_DEFAULT_COVER_IMAGE_URL?.trim()
  if (envDefault) return envDefault

  switch (type) {
    case BlogType.BEAUTY:
      return '/images/blog/default-cover-beauty.svg'
    case BlogType.RECIPE:
      return '/images/blog/default-cover-recipe.svg'
    case BlogType.MONEY_SAVING:
      return '/images/blog/default-cover-money-saving.svg'
    case BlogType.GROCERY:
    default:
      return '/images/blog/default-cover-grocery.svg'
  }
}

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
        type: ProductType.GENERAL,
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

    const validProductIds = new Set(availableProducts.map((p) => p.id))
    const validProducts = result.products.filter((p) => validProductIds.has(p.productId))
    const productById = new Map(availableProducts.map((p) => [p.id, p]))
    const uniqueInlineProducts = Array.from(
      new Map(
        validProducts
          .map((p) => productById.get(p.productId))
          .filter((p): p is NonNullable<typeof p> => !!p)
          .map((p) => [p.id, { name: p.name, slug: p.slug }])
      ).values()
    )

    const linkedContentMd = linkProductMentionsInMarkdown(result.content.contentMd, uniqueInlineProducts)
    const aiCoverUrl = await generateBlogCoverImageUrl(
      blogId,
      blog.type,
      result.content.title,
      result.content.summary
    )
    const coverImageUrl = aiCoverUrl || getFallbackCoverImageUrl(blog.type)

    const updatedBlog = await prisma.blog.update({
      where: { id: blogId },
      data: {
        title: result.content.title,
        summary: result.content.summary,
        contentMd: linkedContentMd,
        imageUrl: coverImageUrl,
        seoTitle: result.content.seoTitle,
        seoDescription: result.content.seoDescription,
        seoKeywords: result.content.seoKeywords,
        faqJsonLd: result.content.faqJsonLd as unknown as Prisma.InputJsonValue,
        internalLinkSlugs: result.content.internalLinkSlugs,
        status: BlogStatus.DRAFT,
      },
    })

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
