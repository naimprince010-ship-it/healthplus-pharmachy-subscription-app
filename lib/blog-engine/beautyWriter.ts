import OpenAI from 'openai'
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

function getOpenAIClient() {
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  })
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

    const matchStepProducts = (
      step: (typeof SKINCARE_ROUTINE_STEPS)[number],
      pool: typeof skincareProducts,
    ): typeof skincareProducts => {
      const byTag = pool.filter(p => p.aiTags.some(tag => step.tags.includes(tag)))
      if (byTag.length > 0) return byTag
      /* Fallback when aiTags are empty or wrong: English name/category often matches step keywords */
      const needles = [...step.tags, step.name.toLowerCase()]
      return pool.filter(p => {
        const hay = `${p.name} ${p.category?.name ?? ''}`.toLowerCase()
        return needles.some(n => hay.includes(n))
      })
    }

    const productsByStep: Record<number, typeof skincareProducts> = {}
    SKINCARE_ROUTINE_STEPS.forEach(step => {
      productsByStep[step.step] = matchStepProducts(step, skincareProducts)
    })

    const productContext = SKINCARE_ROUTINE_STEPS.map(step => {
      const products = productsByStep[step.step]
      if (products.length === 0) {
        return `Step ${step.step} (${step.name}): No catalogue items matched this step (tags/name/category). Add entry to missingProducts with a concrete product suggestion name — still describe the skincare step helpfully without claiming our site has zero products in this category forever.`
      }
      return `Step ${step.step} (${step.name}): ${products.slice(0, 5).map(p => `${p.name} (ID: ${p.id}, ৳${p.sellingPrice})`).join(', ')}`
    }).join('\n')

    const prompt = `You are a skincare expert writing for Halalzi.com, Bangladesh's trusted halal beauty and grocery platform.

TOPIC: ${topic.title}
${topic.description ? `DESCRIPTION: ${topic.description}` : ''}

AVAILABLE PRODUCTS BY SKINCARE STEP:
${productContext}

EXISTING BLOG SLUGS (for internal linking):
${existingBlogSlugs.slice(0, 10).join(', ')}

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
  "internalLinkSlugs": ["related-blog-slug-1", "related-blog-slug-2"],
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
- Include at least 3 FAQs
- Suggest 2-3 internal links from existing blogs
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

    const productsFromAi: ProductRecommendation[] = (parsed.recommendedProducts || []).map((p: {
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
    const aiProducts = productsFromAi.filter((p) => validProductIds.has(p.productId))
    const existingProductIds = new Set(aiProducts.map((p) => p.productId))

    // Deterministic fallback: ensure each step gets at least one mapped product when available.
    const autoStepProducts: ProductRecommendation[] = SKINCARE_ROUTINE_STEPS.flatMap((step) => {
      const hasStepMapped = aiProducts.some((p) => p.role === 'step' && p.stepOrder === step.step)
      if (hasStepMapped) return []
      const candidate = productsByStep[step.step]?.[0]
      if (!candidate || existingProductIds.has(candidate.id)) return []
      existingProductIds.add(candidate.id)
      return [
        {
          productId: candidate.id,
          role: 'step',
          stepOrder: step.step,
          notes: `Auto-mapped fallback for ${step.name} step`,
        } satisfies ProductRecommendation,
      ]
    })
    const products: ProductRecommendation[] = [...aiProducts, ...autoStepProducts]

    const missingProducts: MissingProductInfo[] = (parsed.missingProducts || []).map((m: {
      name: string
      categorySuggestion?: string
      reason: string
    }) => ({
      name: m.name,
      categorySuggestion: m.categorySuggestion,
      reason: m.reason,
    }))

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
        internalLinkSlugs: parsed.internalLinkSlugs || [],
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
