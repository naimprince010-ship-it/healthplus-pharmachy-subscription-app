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
    const skincareProducts = availableProducts.filter(p => 
      p.aiTags.some(tag => 
        SKINCARE_ROUTINE_STEPS.flatMap(s => s.tags).includes(tag) ||
        SKIN_TYPES.includes(tag) ||
        SKIN_CONCERNS.includes(tag) ||
        ['skincare', 'beauty', 'face', 'skin'].includes(tag)
      )
    )

    const productsByStep: Record<number, typeof skincareProducts> = {}
    SKINCARE_ROUTINE_STEPS.forEach(step => {
      productsByStep[step.step] = skincareProducts.filter(p =>
        p.aiTags.some(tag => step.tags.includes(tag))
      )
    })

    const productContext = SKINCARE_ROUTINE_STEPS.map(step => {
      const products = productsByStep[step.step]
      if (products.length === 0) {
        return `Step ${step.step} (${step.name}): No products available - MARK AS MISSING`
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
- Only use product IDs from the available products list
- If a skincare step has no products, add to missingProducts
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

    const products: ProductRecommendation[] = (parsed.recommendedProducts || []).map((p: {
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
