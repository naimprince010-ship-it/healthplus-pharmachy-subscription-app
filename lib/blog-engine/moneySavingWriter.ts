import {
  BlogGenerationResult,
  WriterContext,
  ProductRecommendation,
  MissingProductInfo,
  FAQSchema,
} from './types'
import { getOpenAIClient } from './openaiClient' // Bug #12 fix: shared client

const VALID_ROLES = new Set(['recommended', 'ingredient', 'alternative', 'combo', 'step'])

// Bug #8 fix: Bangla keywords যোগ করা হয়েছে bulk buy detection-এ
const BULK_BUY_KEYWORDS_EN = ['kg', 'liter', 'pack', 'bundle', 'litre', 'gm', 'gram']
const BULK_BUY_KEYWORDS_BN = ['কেজি', 'লিটার', 'প্যাক', 'বান্ডেল', 'গ্রাম', 'কার্টন', 'বস্তা']

function isBulkProduct(name: string): boolean {
  const lower = name.toLowerCase()
  return (
    BULK_BUY_KEYWORDS_EN.some(kw => lower.includes(kw)) ||
    BULK_BUY_KEYWORDS_BN.some(kw => name.includes(kw))
  )
}

export async function generateMoneySavingBlog(context: WriterContext): Promise<BlogGenerationResult> {
  const { topic, availableProducts, existingBlogSlugs } = context

  try {
    const budgetProducts = availableProducts.filter(p => p.budgetLevel === 'BUDGET')
    const midProducts = availableProducts.filter(p => p.budgetLevel === 'MID')
    const premiumProducts = availableProducts.filter(p => p.budgetLevel === 'PREMIUM')

    // Bug #8 fix: Bangla ও English উভয় keyword check করা হচ্ছে
    const bulkBuyOpportunities = availableProducts.filter(p => isBulkProduct(p.name))

    const productContext = `
BUDGET-FRIENDLY PRODUCTS (সস্তা - Best Value):
${budgetProducts.slice(0, 15).map(p => `- ${p.name} (ID: ${p.id}, ৳${p.sellingPrice}, ${p.category?.name || 'General'})`).join('\n') || 'None tagged yet'}

MID-RANGE PRODUCTS (মাঝারি):
${midProducts.slice(0, 10).map(p => `- ${p.name} (ID: ${p.id}, ৳${p.sellingPrice})`).join('\n') || 'None tagged yet'}

PREMIUM PRODUCTS (দামি - For Comparison):
${premiumProducts.slice(0, 10).map(p => `- ${p.name} (ID: ${p.id}, ৳${p.sellingPrice})`).join('\n') || 'None tagged yet'}

BULK BUY OPPORTUNITIES:
${bulkBuyOpportunities.slice(0, 10).map(p => `- ${p.name} (ID: ${p.id}, ৳${p.sellingPrice})`).join('\n') || 'None available'}
`

    const prompt = `You are a money-saving expert writing for Halalzi.com, Bangladesh's trusted halal grocery platform.

TOPIC: ${topic.title}
${topic.description ? `DESCRIPTION: ${topic.description}` : ''}

AVAILABLE PRODUCTS:
${productContext}

EXISTING BLOG SLUGS (for internal linking — ONLY use slugs from this list, do NOT invent slugs):
${existingBlogSlugs.length > 0 ? existingBlogSlugs.slice(0, 10).join(', ') : 'None available — leave internalLinkSlugs as empty array []'}

Write a comprehensive money-saving guide in Bangla (Bengali) with some English terms where appropriate for SEO. The blog should:

1. Be 800-1500 words
2. Focus on helping Bangladeshi families save money on groceries
3. Include:
   - Price comparisons between budget and premium options
   - Bulk buying tips and when it makes sense
   - Seasonal buying advice
   - Storage tips to reduce waste
   - Smart shopping strategies
4. Recommend specific budget-friendly products from Halalzi
5. Calculate potential monthly savings with examples
6. Include combo recommendations for maximum value

RESPOND IN THIS EXACT JSON FORMAT:
{
  "title": "SEO-optimized money-saving title in Bangla (50-60 chars)",
  "summary": "Engaging summary about savings in Bangla (150-200 chars)",
  "contentMd": "Full markdown content with money-saving tips, product recommendations, and price comparisons",
  "seoTitle": "Meta title for search engines (50-60 chars)",
  "seoDescription": "Meta description (150-160 chars)",
  "seoKeywords": "money,saving,budget,grocery,bangla,keywords",
  "faqs": [
    {"question": "FAQ about saving money in Bangla", "answer": "Answer with practical tips"},
    {"question": "Another savings FAQ", "answer": "Another helpful answer"}
  ],
  "internalLinkSlugs": ["only-slugs-from-the-list-above"],
  "recommendedProducts": [
    {"productId": "budget-product-id", "role": "recommended", "notes": "Best value for money"},
    {"productId": "bulk-product-id", "role": "combo", "notes": "Great for bulk buying"},
    {"productId": "alternative-id", "role": "alternative", "notes": "Cheaper alternative to premium"}
  ],
  "missingProducts": [
    {"name": "Product name", "categorySuggestion": "Category", "reason": "Budget option needed"}
  ],
  "potentialMonthlySavings": 500,
  "savingsTips": ["Tip 1", "Tip 2", "Tip 3"]
}

IMPORTANT:
- Only use product IDs from the available products list above
- role must be one of: recommended, ingredient, alternative, combo, step
- Focus on BUDGET level products for recommendations
- Show price comparisons between budget and premium options
- Calculate realistic monthly savings for a typical Bangladeshi family
- If budget alternatives are missing for important categories, add to missingProducts
- Include at least 3 FAQs about saving money on groceries
- internalLinkSlugs MUST only contain slugs from the provided list (or empty array)
- Write naturally in Bangla, not translated English
- Be practical and relatable to middle-class Bangladeshi families`

    const openai = getOpenAIClient()
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'You are a money-saving expert content writer for a Bangladeshi e-commerce platform. Always respond with valid JSON.' },
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

    // Bug #5 fix: role validate করা হচ্ছে
    const existingSlugSet = new Set(existingBlogSlugs)
    const products: ProductRecommendation[] = (parsed.recommendedProducts || [])
      .filter((p: { role: string }) => VALID_ROLES.has(p.role))
      .map((p: { productId: string; role: string; stepOrder?: number; notes?: string }) => ({
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

    // Bug #4 fix: internal link slugs validate করা হচ্ছে
    const validatedInternalLinks = (parsed.internalLinkSlugs || []).filter(
      (slug: string) => existingSlugSet.has(slug)
    )

    const savingsMetadata = `
---
Potential Monthly Savings: ৳${parsed.potentialMonthlySavings || 'Varies'}
---

`

    return {
      success: true,
      content: {
        title: parsed.title,
        summary: parsed.summary,
        contentMd: savingsMetadata + parsed.contentMd,
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
    console.error('Money-saving blog generation error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      products: [],
      missingProducts: [],
    }
  }
}
