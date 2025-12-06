import OpenAI from 'openai'
import {
  BlogGenerationResult,
  WriterContext,
  ProductRecommendation,
  MissingProductInfo,
  FAQSchema,
} from './types'

function getOpenAIClient() {
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  })
}

const GROCERY_CATEGORIES = [
  'rice', 'oil', 'spice', 'dal', 'flour', 'sugar', 'salt',
  'snack', 'beverage', 'dairy', 'meat', 'fish', 'vegetable', 'fruit',
  'breakfast', 'cooking', 'baking', 'condiment', 'sauce',
]

export async function generateGroceryBlog(context: WriterContext): Promise<BlogGenerationResult> {
  const { topic, availableProducts, existingBlogSlugs } = context

  try {
    const groceryProducts = availableProducts.filter(p =>
      p.isIngredient ||
      p.ingredientType ||
      p.aiTags.some(tag => GROCERY_CATEGORIES.includes(tag))
    )

    const productsByBudget = {
      budget: groceryProducts.filter(p => p.budgetLevel === 'BUDGET'),
      mid: groceryProducts.filter(p => p.budgetLevel === 'MID'),
      premium: groceryProducts.filter(p => p.budgetLevel === 'PREMIUM'),
      unset: groceryProducts.filter(p => !p.budgetLevel),
    }

    const productContext = `
BUDGET PRODUCTS (সস্তা):
${productsByBudget.budget.slice(0, 10).map(p => `- ${p.name} (ID: ${p.id}, ৳${p.sellingPrice}, ${p.ingredientType || 'general'})`).join('\n') || 'None available'}

MID-RANGE PRODUCTS (মাঝারি):
${productsByBudget.mid.slice(0, 10).map(p => `- ${p.name} (ID: ${p.id}, ৳${p.sellingPrice}, ${p.ingredientType || 'general'})`).join('\n') || 'None available'}

PREMIUM PRODUCTS (দামি):
${productsByBudget.premium.slice(0, 10).map(p => `- ${p.name} (ID: ${p.id}, ৳${p.sellingPrice}, ${p.ingredientType || 'general'})`).join('\n') || 'None available'}

OTHER PRODUCTS:
${productsByBudget.unset.slice(0, 15).map(p => `- ${p.name} (ID: ${p.id}, ৳${p.sellingPrice}, ${p.ingredientType || 'general'})`).join('\n') || 'None available'}
`

    const prompt = `You are a grocery shopping expert writing for Halalzi.com, Bangladesh's trusted halal grocery platform.

TOPIC: ${topic.title}
${topic.description ? `DESCRIPTION: ${topic.description}` : ''}

AVAILABLE PRODUCTS:
${productContext}

EXISTING BLOG SLUGS (for internal linking):
${existingBlogSlugs.slice(0, 10).join(', ')}

Write a comprehensive grocery buying guide in Bangla (Bengali) with some English terms where appropriate for SEO. The blog should:

1. Be 800-1500 words
2. Compare products across budget levels (budget, mid-range, premium)
3. Explain quality differences and value for money
4. Include storage tips and shelf life information
5. Recommend best products for different needs/budgets
6. Include price per kg/unit comparisons where relevant

RESPOND IN THIS EXACT JSON FORMAT:
{
  "title": "SEO-optimized title in Bangla (50-60 chars)",
  "summary": "Engaging summary in Bangla (150-200 chars)",
  "contentMd": "Full markdown content in Bangla with product recommendations and comparisons",
  "seoTitle": "Meta title for search engines (50-60 chars)",
  "seoDescription": "Meta description (150-160 chars)",
  "seoKeywords": "comma,separated,keywords,in,bangla,and,english",
  "faqs": [
    {"question": "FAQ question in Bangla", "answer": "Answer in Bangla"},
    {"question": "Another FAQ", "answer": "Another answer"}
  ],
  "internalLinkSlugs": ["related-blog-slug-1", "related-blog-slug-2"],
  "recommendedProducts": [
    {"productId": "actual-product-id", "role": "recommended", "notes": "Best budget option"},
    {"productId": "another-id", "role": "alternative", "notes": "Premium alternative"}
  ],
  "missingProducts": [
    {"name": "Product name needed", "categorySuggestion": "Grocery", "reason": "Needed for comparison"}
  ]
}

IMPORTANT:
- Only use product IDs from the available products list
- Include products from different budget levels for comparison
- If important product categories are missing, add to missingProducts
- Include at least 3 FAQs about buying/storing this grocery item
- Suggest 2-3 internal links from existing blogs
- Write naturally in Bangla, not translated English
- Focus on helping Bangladeshi families make smart grocery choices`

        const openai = getOpenAIClient()
        const response = await openai.chat.completions.create({
          model: 'gpt-4o',
          messages: [
            { role: 'system', content: 'You are a grocery shopping expert content writer for a Bangladeshi e-commerce platform. Always respond with valid JSON.' },
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
    console.error('Grocery blog generation error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      products: [],
      missingProducts: [],
    }
  }
}
