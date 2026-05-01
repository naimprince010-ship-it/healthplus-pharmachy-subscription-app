import { prisma } from '@/lib/prisma'
import { BlogStatus, BlogType, Prisma, ProductType } from '@prisma/client'
import OpenAI from 'openai'
import { supabaseAdmin } from '@/lib/supabase'
import { generateBeautyBlog } from './beautyWriter'
import { generateGroceryBlog } from './groceryWriter'
import { generateRecipeBlog } from './recipeWriter'
import { generateMoneySavingBlog } from './moneySavingWriter'
import type { WriterContext, BlogGenerationResult, AvailableProduct, MissingProductInfo } from './types'

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

function uniqById(products: AvailableProduct[]): AvailableProduct[] {
  return Array.from(new Map(products.map((p) => [p.id, p])).values())
}

function scoreProductRelevanceForBlog(
  blogType: BlogType,
  product: AvailableProduct,
  topicText: string
): number {
  const hay = `${product.name} ${product.category?.name || ''} ${(product.aiTags || []).join(' ')}`.toLowerCase()
  const topic = topicText.toLowerCase()
  let score = 0

  if (blogType === BlogType.BEAUTY) {
    const beautyKeys = [
      'beauty',
      'skincare',
      'skin',
      'cleanser',
      'toner',
      'serum',
      'moisturizer',
      'sunscreen',
      'face wash',
      'spf',
    ]
    if (beautyKeys.some((k) => hay.includes(k))) score += 8
    if (beautyKeys.some((k) => topic.includes(k) && hay.includes(k))) score += 5
  } else if (blogType === BlogType.GROCERY || blogType === BlogType.RECIPE) {
    const groceryKeys = [
      'grocery',
      'rice',
      'oil',
      'dal',
      'flour',
      'spice',
      'salt',
      'sugar',
      'vegetable',
      'fruit',
      'meat',
      'fish',
      'cooking',
      'ingredient',
    ]
    if (product.isIngredient || product.ingredientType) score += 10
    if (groceryKeys.some((k) => hay.includes(k))) score += 6
    if (groceryKeys.some((k) => topic.includes(k) && hay.includes(k))) score += 4
  } else if (blogType === BlogType.MONEY_SAVING) {
    score += 3 // broad catalog coverage helps comparison blogs
    if (product.budgetLevel === 'BUDGET') score += 3
    if (product.budgetLevel === 'MID') score += 2
  }

  if (product.budgetLevel) score += 1
  return score
}

function retrieveProductsForBlog(
  blogType: BlogType,
  allProducts: AvailableProduct[],
  topicTitle: string,
  topicDescription?: string | null,
  limit = 120
): AvailableProduct[] {
  const topicText = `${topicTitle} ${topicDescription || ''}`
  const scored = allProducts
    .map((p) => ({ p, score: scoreProductRelevanceForBlog(blogType, p, topicText) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((x) => x.p)

  return uniqById(scored).slice(0, limit)
}

function getMinimumProductThreshold(blogType: BlogType): number {
  switch (blogType) {
    case BlogType.BEAUTY:
      return 10
    case BlogType.GROCERY:
      return 12
    case BlogType.RECIPE:
      return 8
    case BlogType.MONEY_SAVING:
      return 10
    default:
      return 8
  }
}

function suppressFalseMissingProducts(
  missingProducts: MissingProductInfo[],
  validProducts: Array<{ role: string; stepOrder?: number }>
): MissingProductInfo[] {
  const mappedSteps = new Set(
    validProducts
      .filter((p) => p.role === 'step' && typeof p.stepOrder === 'number')
      .map((p) => p.stepOrder as number)
  )
  if (mappedSteps.size === 0) return missingProducts

  const stepAliases: Record<number, string[]> = {
    1: ['step 1', 'cleanser', 'face wash', 'ক্লিনজার'],
    2: ['step 2', 'toner', 'টোনার'],
    3: ['step 3', 'serum', 'essence', 'সিরাম'],
    4: ['step 4', 'moisturizer', 'cream', 'ময়েশ্চারাইজার'],
    5: ['step 5', 'sunscreen', 'spf', 'সানস্ক্রিন'],
  }

  return missingProducts.filter((m) => {
    const text = `${m.name} ${m.reason} ${m.categorySuggestion || ''}`.toLowerCase()
    for (const [step, aliases] of Object.entries(stepAliases)) {
      if (!mappedSteps.has(Number(step))) continue
      if (aliases.some((a) => text.includes(a))) return false
    }
    return true
  })
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

    const allProducts = await prisma.product.findMany({
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
    const minThreshold = getMinimumProductThreshold(blog.type)
    const retrievedProducts = retrieveProductsForBlog(
      blog.type,
      allProducts,
      blog.title,
      blog.topic?.description,
      120
    )
    const widenedRetrievedProducts = retrieveProductsForBlog(
      blog.type,
      allProducts,
      blog.title,
      blog.topic?.description,
      260
    )
    const selectedProducts =
      widenedRetrievedProducts.length > retrievedProducts.length
        ? widenedRetrievedProducts
        : retrievedProducts

    // Hard-stop only when we truly have no product context.
    if (selectedProducts.length === 0) {
      return {
        ok: false,
        httpStatus: 422,
        error: `No relevant products found for this topic (0/${minThreshold}). Add/tag products, then retry.`,
      }
    }

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
      availableProducts: selectedProducts,
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

    // Retry once with a wider product pool if AI returns too few usable links.
    const firstPassValidIds = new Set(selectedProducts.map((p) => p.id))
    const firstPassValidCount = result.products.filter((p) => firstPassValidIds.has(p.productId)).length
    if (result.success && firstPassValidCount < 3) {
      const fallbackContext: WriterContext = {
        ...context,
        availableProducts: retrieveProductsForBlog(blog.type, allProducts, blog.title, blog.topic?.description, 320),
      }
      switch (blog.type) {
        case BlogType.BEAUTY:
          result = await generateBeautyBlog(fallbackContext)
          break
        case BlogType.GROCERY:
          result = await generateGroceryBlog(fallbackContext)
          break
        case BlogType.RECIPE:
          result = await generateRecipeBlog(fallbackContext)
          break
        case BlogType.MONEY_SAVING:
          result = await generateMoneySavingBlog(fallbackContext)
          break
        default:
          result = await generateGroceryBlog(fallbackContext)
      }
    }

    if (!result.success || !result.content) {
      return {
        ok: false,
        httpStatus: 500,
        error: result.error || 'Content generation failed',
      }
    }

    // Collect any product IDs the AI referenced that weren't in our pre-fetched selectedProducts.
    // This happens when the AI used the searchProducts tool to find products outside the Quick Reference.
    const preSelectedIds = new Set(selectedProducts.map((p) => p.id))
    const extraProductIds = result.products
      .map((p) => p.productId)
      .filter((id) => !preSelectedIds.has(id))

    let extraProducts: typeof selectedProducts = []
    if (extraProductIds.length > 0) {
      extraProducts = await prisma.product.findMany({
        where: { id: { in: extraProductIds }, isActive: true },
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
      console.log(`[BlogEngine] AI found ${extraProducts.length} extra products via tool calls`)
    }

    const allKnownProducts = [...selectedProducts, ...extraProducts]
    const validProductIds = new Set(allKnownProducts.map((p) => p.id))
    const validProducts = result.products.filter((p) => validProductIds.has(p.productId))
    const dedupedValidProducts = Array.from(new Map(validProducts.map((p) => [p.productId, p])).values())
    const productById = new Map(allKnownProducts.map((p) => [p.id, p]))
    const uniqueInlineProducts = Array.from(
      new Map(
        dedupedValidProducts
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

    if (dedupedValidProducts.length > 0) {
      await prisma.blogProduct.createMany({
        data: dedupedValidProducts.map((p) => ({
          blogId,
          productId: p.productId,
          role: p.role,
          stepOrder: p.stepOrder,
          notes: p.notes,
        })),
        skipDuplicates: true,
      })
    }

    const filteredMissingProducts = suppressFalseMissingProducts(result.missingProducts, dedupedValidProducts)
    if (filteredMissingProducts.length > 0) {
      await prisma.missingProduct.createMany({
        data: filteredMissingProducts.map((m) => ({
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
      productsLinked: dedupedValidProducts.length,
      missingProductsReported: filteredMissingProducts.length,
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
