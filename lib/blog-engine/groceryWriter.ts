import {
  BlogGenerationResult,
  WriterContext,
  ProductRecommendation,
  MissingProductInfo,
  FAQSchema,
} from './types'
import { runAgenticChat } from './agent'
import {
  BLOG_FIELD_ACCURACY_RULES,
  normalizeFaqPair,
  parseBlogEngineJson,
  sanitizeBlogAiTextFields,
} from './blog-output-sanitize'

const VALID_ROLES = new Set(['recommended', 'ingredient', 'alternative', 'combo', 'step'])

const GROCERY_CATEGORIES = [
  'rice', 'oil', 'spice', 'dal', 'flour', 'sugar', 'salt',
  'snack', 'beverage', 'dairy', 'meat', 'fish', 'vegetable', 'fruit',
  'breakfast', 'cooking', 'baking', 'condiment', 'sauce',
]

const GROCERY_INCLUDE_KEYWORDS = [
  'rice', 'atta', 'flour', 'oil', 'ghee', 'spice', 'masala', 'dal', 'lentil', 'salt', 'sugar',
  'noodle', 'pasta', 'biscuit', 'snack', 'juice', 'tea', 'coffee', 'milk', 'dairy', 'egg',
  'meat', 'fish', 'chicken', 'beef', 'mutton', 'vegetable', 'fruit', 'sauce', 'ketchup',
  'mayonnaise', 'pickle', 'honey', 'dates', 'breakfast', 'cooking', 'baking', 'grocery',
]

const NON_GROCERY_EXCLUDE_KEYWORDS = [
  'serum', 'cleanser', 'toner', 'moisturizer', 'moisturiser', 'sunscreen', 'sunblock',
  'lipstick', 'makeup', 'cosmetic', 'skincare', 'face wash', 'facewash',
  'baby soft', 'baby cream', 'diaper', 'nappy',
]

function includesAny(text: string, words: string[]): boolean {
  return words.some((w) => text.includes(w))
}

function isGroceryProduct(p: WriterContext['availableProducts'][number]): boolean {
  const searchable = `${p.name} ${p.category?.name || ''} ${(p.aiTags || []).join(' ')}`.toLowerCase()
  const hasGroceryHint =
    p.isIngredient ||
    !!p.ingredientType ||
    p.aiTags.some((tag) => GROCERY_CATEGORIES.includes(tag.toLowerCase())) ||
    includesAny(searchable, GROCERY_INCLUDE_KEYWORDS)
  const hasNonGroceryHint = includesAny(searchable, NON_GROCERY_EXCLUDE_KEYWORDS)

  return hasGroceryHint && !hasNonGroceryHint
}

export async function generateGroceryBlog(context: WriterContext): Promise<BlogGenerationResult> {
  const { topic, availableProducts, existingBlogSlugs } = context

  try {
    const groceryProducts = availableProducts.filter(isGroceryProduct)

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

AVAILABLE PRODUCTS (Quick Reference):
${productContext}

EXISTING BLOG SLUGS (for internal linking — ONLY use slugs from this list, do NOT invent slugs):
${existingBlogSlugs.length > 0 ? existingBlogSlugs.slice(0, 10).join(', ') : 'None available — leave internalLinkSlugs as empty array []'}

${BLOG_FIELD_ACCURACY_RULES}

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
  "internalLinkSlugs": ["only-slugs-from-the-list-above"],
  "recommendedProducts": [
    {"productId": "actual-product-id", "role": "recommended", "notes": "Best budget option"},
    {"productId": "another-id", "role": "alternative", "notes": "Premium alternative"}
  ],
  "missingProducts": [
    {"name": "Product name needed", "categorySuggestion": "Grocery", "reason": "Needed for comparison"}
  ]
}

IMPORTANT:
- If you need a specific product that is not in the Quick Reference list, USE the searchProducts tool to find it in the database.
- Only use product IDs from the available products list above OR from the results of your searchProducts tool calls. NEVER invent IDs.
- role must be one of: recommended, ingredient, alternative, combo, step
- Include products from different budget levels for comparison
- If important product categories are missing, add to missingProducts
- Include at least 3 FAQs about buying/storing this grocery item
- internalLinkSlugs MUST only contain slugs from the provided list (or empty array)
- Write naturally in Bangla, not translated English
- Focus on helping Bangladeshi families make smart grocery choices`

    const content = await runAgenticChat(
      'You are a grocery shopping expert content writer for a Bangladeshi e-commerce platform. Follow FIELD ACCURACY rules in the user message exactly. Output ONLY one JSON object, no markdown.',
      prompt
    )

    if (!content) {
      return { success: false, error: 'No content generated', products: [], missingProducts: [] }
    }

    const parsed = parseBlogEngineJson(content)

    const faqsRaw = Array.isArray(parsed.faqs) ? parsed.faqs : []
    const faqJsonLd: FAQSchema = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqsRaw.map((faq: unknown) => {
        const { question, answer } = normalizeFaqPair(faq as { question?: unknown; answer?: unknown })
        return {
          '@type': 'Question' as const,
          name: question,
          acceptedAnswer: {
            '@type': 'Answer' as const,
            text: answer,
          },
        }
      }),
    }

    const textFields = sanitizeBlogAiTextFields({
      title: parsed.title,
      summary: parsed.summary,
      seoTitle: parsed.seoTitle,
      seoDescription: parsed.seoDescription,
      seoKeywords: parsed.seoKeywords,
    })

    // Bug #5 fix: role validate করা হচ্ছে
    const existingSlugSet = new Set(existingBlogSlugs)
    const products: ProductRecommendation[] = (Array.isArray(parsed.recommendedProducts) ? parsed.recommendedProducts : [])
      .filter((p: { role: string }) => VALID_ROLES.has(p.role))
      .map((p: { productId: string; role: string; stepOrder?: number; notes?: string }) => ({
        productId: p.productId,
        role: p.role as ProductRecommendation['role'],
        stepOrder: p.stepOrder,
        notes: p.notes,
      }))

    const missingProductsRaw = Array.isArray(parsed.missingProducts) ? parsed.missingProducts : []
    const missingProducts: MissingProductInfo[] = missingProductsRaw.map((m: {
      name: string
      categorySuggestion?: string
      reason: string
    }) => ({
      name: m.name,
      categorySuggestion: m.categorySuggestion,
      reason: m.reason,
    }))

    // Bug #4 fix: internal link slugs validate করা হচ্ছে
    const validatedInternalLinks = (Array.isArray(parsed.internalLinkSlugs) ? parsed.internalLinkSlugs : []).filter(
      (slug: string) => existingSlugSet.has(slug)
    )

    const contentMd = typeof parsed.contentMd === 'string' ? parsed.contentMd : ''

    return {
      success: true,
      content: {
        ...textFields,
        contentMd,
        faqJsonLd,
        internalLinkSlugs: validatedInternalLinks,
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
