import {
  BlogGenerationResult,
  WriterContext,
  ProductRecommendation,
  MissingProductInfo,
  SKINCARE_ROUTINE_STEPS,
  SKIN_TYPES,
  SKIN_CONCERNS,
  FAQSchema,
} from './types'
import { getOpenAIClient } from './openaiClient' // Bug #12 fix: shared client

const VALID_ROLES = new Set(['recommended', 'ingredient', 'alternative', 'combo', 'step'])

const STEP_ALIASES: Record<number, string[]> = {
  1: ['cleanser', 'face wash', 'facewash', 'foam wash', 'cleansing', 'ক্লিনজার', 'ফেসওয়াশ', 'ফেস ওয়াশ'],
  2: ['toner', 'toning', 'টোনার'],
  3: ['serum', 'essence', 'ampoule', 'vitamin c', 'niacinamide', 'সিরাম', 'এস্যেন্স', 'এমপুল'],
  4: ['moisturizer', 'moisturiser', 'cream', 'lotion', 'gel cream', 'ময়েশ্চারাইজার', 'ময়েশ্চারাইজার'],
  5: ['sunscreen', 'sun screen', 'sunblock', 'spf', 'সানস্ক্রিন', 'সান স্ক্রিন'],
}

function scoreProductForStep(
  product: WriterContext['availableProducts'][number],
  step: (typeof SKINCARE_ROUTINE_STEPS)[number]
): number {
  const aliases = STEP_ALIASES[step.step] || []
  const hay = `${product.name} ${product.category?.name ?? ''}`.toLowerCase()
  let score = 0

  if (product.aiTags.some((tag) => step.tags.includes(tag))) score += 12
  if (product.aiTags.some((tag) => aliases.includes(tag))) score += 10
  if (aliases.some((a) => hay.includes(a))) score += 8
  if (step.tags.some((t) => hay.includes(t))) score += 6
  if (product.aiTags.some((tag) => ['skincare', 'beauty', 'face', 'skin'].includes(tag))) score += 2

  return score
}

export async function generateBeautyBlog(context: WriterContext): Promise<BlogGenerationResult> {
  const { topic, availableProducts, existingBlogSlugs } = context

  try {
    const globalBeautyKeywords = [
      'skincare',
      'beauty',
      'face',
      'skin',
      'cleanser',
      'face wash',
      'facewash',
      'toner',
      'serum',
      'moisturizer',
      'moisturiser',
      'cream',
      'lotion',
      'sunscreen',
      'sun screen',
      'spf',
    ]
    const allStepTags = SKINCARE_ROUTINE_STEPS.flatMap(s => s.tags)
    const skincareProducts = availableProducts.filter((p) => {
      const byTags = p.aiTags.some(
        (tag) =>
          allStepTags.includes(tag) ||
          SKIN_TYPES.includes(tag) ||
          SKIN_CONCERNS.includes(tag) ||
          globalBeautyKeywords.includes(tag)
      )
      if (byTags) return true
      // Fallback for products with weak/empty aiTags but clear product/category names.
      const hay = `${p.name} ${p.category?.name ?? ''}`.toLowerCase()
      return globalBeautyKeywords.some((k) => hay.includes(k))
    })

    const hasProducts = skincareProducts.length > 0
    if (!hasProducts) {
      console.warn('[BeautyWriter] No skincare products found. Blog will have no product links.')
    }

    const rankStepProducts = (
      step: (typeof SKINCARE_ROUTINE_STEPS)[number],
      pool: typeof skincareProducts
    ) => {
      return pool
        .map((p) => ({ product: p, score: scoreProductForStep(p, step) }))
        .filter((x) => x.score > 0)
        .sort((a, b) => b.score - a.score)
    }

    const rankedByStep: Record<number, Array<{ product: (typeof skincareProducts)[number]; score: number }>> = {}
    const productsByStep: Record<number, typeof skincareProducts> = {}
    SKINCARE_ROUTINE_STEPS.forEach(step => {
      rankedByStep[step.step] = rankStepProducts(step, skincareProducts)
      productsByStep[step.step] = rankedByStep[step.step].map((x) => x.product)
    })

    const productContext = SKINCARE_ROUTINE_STEPS.map(step => {
      const products = productsByStep[step.step]
      if (products.length === 0) {
        return `Step ${step.step} (${step.name}): No catalogue items matched this step (tags/name/category). Add entry to missingProducts with a concrete product suggestion name — still describe the skincare step helpfully without claiming our site has zero products in this category forever.`
      }
      return `Step ${step.step} (${step.name}): ${products
        .slice(0, 5)
        .map((p) => `${p.name} (ID: ${p.id}, ৳${p.sellingPrice})`)
        .join(', ')}`
    }).join('\n')

    const prompt = `You are a skincare expert writing for Halalzi.com, Bangladesh's trusted halal beauty and grocery platform.

TOPIC: ${topic.title}
${topic.description ? `DESCRIPTION: ${topic.description}` : ''}

AVAILABLE PRODUCTS BY SKINCARE STEP:
${productContext}

EXISTING BLOG SLUGS (for internal linking — ONLY use slugs from this list, do NOT invent slugs):
${existingBlogSlugs.length > 0 ? existingBlogSlugs.slice(0, 10).join(', ') : 'None available — leave internalLinkSlugs as empty array []'}

Write a comprehensive skincare blog post in Bangla (Bengali) with some English terms where appropriate for SEO. The blog should:

1. Be 800-1500 words
2. Include a morning and/or evening routine
3. Recommend specific products from the available list for each step
4. Explain why each product is recommended
5. Include tips for different skin types if relevant to the topic

RESPOND IN THIS EXACT JSON FORMAT:
{
  "title": "SEO-optimized title in Bangla (50-60 chars)",
  "summary": "Engaging summary in Bangla (150-200 chars)",
  "contentMd": "Full markdown content in Bangla with product recommendations",
  "seoTitle": "Meta title for search engines (50-60 chars)",
  "seoDescription": "Meta description (150-160 chars)",
  "seoKeywords": "comma,separated,keywords,in,bangla,and,english",
  "faqs": [
    {"question": "FAQ question in Bangla", "answer": "Answer in Bangla"},
    {"question": "Another FAQ", "answer": "Another answer"}
  ],
  "internalLinkSlugs": ["only-slugs-from-the-list-above"],
  "recommendedProducts": [
    {"productId": "actual-product-id", "role": "step", "stepOrder": 1, "notes": "Why this product"},
    {"productId": "another-id", "role": "recommended", "notes": "Alternative option"}
  ],
  "missingProducts": [
    {"name": "Product name needed", "categorySuggestion": "Skincare", "reason": "Needed for step X"}
  ]
}

IMPORTANT:
- Only use product IDs from the AVAILABLE PRODUCTS BY SKINCARE STEP lines above for recommendedProducts — never invent IDs
- When a step has no matched products above, include it in missingProducts for the team — but in contentMd explain that step educationally (what to choose, skin-type tips); do NOT use harsh storefront language like headings "পণ্য অনুপস্থিত" / "এখন প্ল্যাটফর্মে নেই" as if the entire category is unavailable — inventory changes and products may appear later.
- Whenever you recommend a matched product ID, weave its name (+ price if helpful) into the prose for that step, not only in JSON.
- role must be one of: recommended, ingredient, alternative, combo, step
- Include at least 3 FAQs
- internalLinkSlugs MUST only contain slugs from the provided list (or empty array)
- Write naturally in Bangla, not translated English`

    const openai = getOpenAIClient()
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'You are a skincare expert content writer for a Bangladeshi e-commerce platform. Always respond with valid JSON.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 4000,
      response_format: { type: 'json_object' },
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
      return { success: false, error: 'No content generated', products: [], missingProducts: [] }
    }

    const parsed = JSON.parse(content)

    const faqJsonLd: FAQSchema = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: (parsed.faqs || []).map((faq: { question: string; answer: string }) => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: faq.answer,
        },
      })),
    }

    const existingSlugSet = new Set(existingBlogSlugs)
    const productsFromAi: ProductRecommendation[] = (parsed.recommendedProducts || [])
      .filter((p: { role: string }) => VALID_ROLES.has(p.role))
      .map((p: {
        productId: string
        role: string
        stepOrder?: number
        notes?: string
      }) => ({
        productId: p.productId,
        role: p.role as ProductRecommendation['role'],
        stepOrder: p.stepOrder,
        notes: p.notes,
      }))

    const validProductIds = new Set(availableProducts.map((p) => p.id))
    const byId = new Map(availableProducts.map((p) => [p.id, p]))
    const aiProductsValidated = productsFromAi.filter((p) => validProductIds.has(p.productId))

    // Repair low-confidence AI step mappings (wrong step/wrong product) using deterministic ranking.
    const aiProducts = aiProductsValidated.map((p) => {
      if (p.role !== 'step' || !p.stepOrder || !rankedByStep[p.stepOrder]?.length) return p
      const aiProduct = byId.get(p.productId)
      if (!aiProduct) return p
      const aiScore = scoreProductForStep(aiProduct, SKINCARE_ROUTINE_STEPS[p.stepOrder - 1])
      if (aiScore >= 8) return p
      const replacement = rankedByStep[p.stepOrder][0]?.product
      if (!replacement) return p
      return {
        ...p,
        productId: replacement.id,
        notes: `${p.notes ? `${p.notes}; ` : ''}Auto-corrected to best match for step ${p.stepOrder}`,
      }
    })
    const existingProductIds = new Set(aiProducts.map((p) => p.productId))

    const products: ProductRecommendation[] = [...aiProducts]

    const mappedStepIds = new Set(
      products.filter((p) => p.role === 'step' && typeof p.stepOrder === 'number').map((p) => p.stepOrder as number)
    )
    const stepAliasMap: Record<number, string[]> = {
      1: ['cleanser', 'face wash', 'facewash', 'ক্লিনজার', 'ফেসওয়াশ', 'ফেস ওয়াশ'],
      2: ['toner', 'টোনার'],
      3: ['serum', 'essence', 'ampoule', 'সিরাম', 'এস্যেন্স', 'এমপুল'],
      4: ['moisturizer', 'moisturiser', 'cream', 'lotion', 'ময়েশ্চারাইজার', 'ময়েশ্চারাইজার'],
      5: ['sunscreen', 'sun screen', 'spf', 'সানস্ক্রিন', 'সান স্ক্রিন'],
    }
    const rawMissingProducts: MissingProductInfo[] = (parsed.missingProducts || []).map((m: {
      name: string
      categorySuggestion?: string
      reason: string
    }) => ({
      name: m.name,
      categorySuggestion: m.categorySuggestion,
      reason: m.reason,
    }))
    const missingProducts: MissingProductInfo[] = rawMissingProducts.filter((m) => {
      const text = `${m.name} ${m.reason} ${m.categorySuggestion ?? ''}`.toLowerCase()
      const matchedStep = Object.entries(stepAliasMap).find(([, aliases]) =>
        aliases.some((alias) => text.includes(alias))
      )
      if (!matchedStep) return true
      const stepNum = Number(matchedStep[0])
      // If we already linked a product for this step, don't keep "missing" noise.
      return !mappedStepIds.has(stepNum)
    })

    // Bug #4 fix: internal link slugs validate করা হচ্ছে
    const validatedInternalLinks = (parsed.internalLinkSlugs || []).filter(
      (slug: string) => existingSlugSet.has(slug)
    )

    return {
      success: true,
      content: {
        title: parsed.title,
        summary: parsed.summary,
        contentMd: parsed.contentMd,
        seoTitle: parsed.seoTitle,
        seoDescription: parsed.seoDescription,
        seoKeywords: parsed.seoKeywords,
        faqJsonLd,
        internalLinkSlugs: validatedInternalLinks,
      },
      products,
      missingProducts,
    }
  } catch (error) {
    console.error('Beauty blog generation error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      products: [],
      missingProducts: [],
    }
  }
}
