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

export async function generateRecipeBlog(context: WriterContext): Promise<BlogGenerationResult> {
  const { topic, availableProducts, existingBlogSlugs } = context

  try {
    const ingredientProducts = availableProducts.filter(p => p.isIngredient || p.ingredientType)

    // Bug #7 fix: empty product context guard
    if (ingredientProducts.length === 0) {
      console.warn('[RecipeWriter] No ingredient products found. Blog will have minimal product links.')
    }

    const productsByType: Record<string, typeof ingredientProducts> = {}
    ingredientProducts.forEach(p => {
      const type = p.ingredientType || 'OTHER'
      if (!productsByType[type]) productsByType[type] = []
      productsByType[type].push(p)
    })

    const productContext = ingredientProducts.length > 0
      ? Object.entries(productsByType).map(([type, products]) => {
          return `${type}:\n${products.slice(0, 8).map(p => `- ${p.name} (ID: ${p.id}, ৳${p.sellingPrice})`).join('\n')}`
        }).join('\n\n')
      : 'No ingredient products currently available in the database.'

    const prompt = `You are a Bangladeshi recipe expert writing for Halalzi.com, Bangladesh's trusted halal grocery platform.

TOPIC: ${topic.title}
${topic.description ? `DESCRIPTION: ${topic.description}` : ''}

AVAILABLE INGREDIENTS BY TYPE (Quick Reference):
${productContext}

EXISTING BLOG SLUGS (for internal linking — ONLY use slugs from this list, do NOT invent slugs):
${existingBlogSlugs.length > 0 ? existingBlogSlugs.slice(0, 10).join(', ') : 'None available — leave internalLinkSlugs as empty array []'}

${BLOG_FIELD_ACCURACY_RULES}

Write a comprehensive recipe blog in Bangla (Bengali) with some English terms where appropriate for SEO. The blog should:

1. Be 800-1500 words
2. Include a complete recipe with:
   - Ingredient list with quantities
   - Step-by-step cooking instructions
   - Cooking time and serving size
   - Tips for best results
3. Map each ingredient to available products from Halalzi (if available)
4. Include estimated total cost based on product prices
5. Suggest variations or substitutions
6. Include nutrition tips if relevant

RESPOND IN THIS EXACT JSON FORMAT:
{
  "title": "SEO-optimized recipe title in Bangla (50-60 chars)",
  "summary": "Engaging summary in Bangla (150-200 chars)",
  "contentMd": "Full markdown content with recipe, ingredients linked to products, and cooking instructions",
  "seoTitle": "Meta title for search engines (50-60 chars)",
  "seoDescription": "Meta description (150-160 chars)",
  "seoKeywords": "recipe,name,ingredients,bangla,keywords",
  "faqs": [
    {"question": "FAQ about the recipe in Bangla", "answer": "Answer in Bangla"},
    {"question": "Another cooking FAQ", "answer": "Another answer"}
  ],
  "internalLinkSlugs": ["only-slugs-from-the-list-above"],
  "recommendedProducts": [
    {"productId": "rice-product-id", "role": "ingredient", "notes": "Main ingredient - 500g needed"},
    {"productId": "oil-product-id", "role": "ingredient", "notes": "For cooking - 2 tbsp"},
    {"productId": "spice-id", "role": "ingredient", "notes": "For flavor"}
  ],
  "missingProducts": [
    {"name": "Ingredient name", "categorySuggestion": "Spices", "reason": "Required for authentic taste"}
  ],
  "estimatedCost": 350,
  "servings": 4,
  "cookingTime": "45 minutes",
  "difficulty": "Easy"
}

IMPORTANT:
- If you need a specific product that is not in the Quick Reference list, USE the searchProducts tool to find it in the database.
- Only use product IDs from the available ingredients list above OR from the results of your searchProducts tool calls. NEVER invent IDs.
- role must be one of: recommended, ingredient, alternative, combo, step
- Map EVERY ingredient in the recipe to a product if available
- If an ingredient is not available, add to missingProducts
- Include at least 3 FAQs about cooking tips, storage, or variations
- Calculate estimated cost based on actual product prices (or estimate if not available)
- internalLinkSlugs MUST only contain slugs from the provided list (or empty array)
- Write naturally in Bangla, not translated English
- Focus on traditional Bangladeshi recipes and cooking methods`

    const content = await runAgenticChat(
      'You are a Bangladeshi recipe expert content writer. Always respond with valid JSON.',
      prompt
    )

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

    const missingProducts: MissingProductInfo[] = (
      Array.isArray(parsed.missingProducts) ? parsed.missingProducts : []
    ).map((m: {
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

    const recipeMetadata = `
---
Estimated Cost: ৳${parsed.estimatedCost ?? 'N/A'}
Servings: ${parsed.servings ?? 'N/A'}
Cooking Time: ${parsed.cookingTime ?? 'N/A'}
Difficulty: ${parsed.difficulty ?? 'N/A'}
---

`

    const contentMd = typeof parsed.contentMd === 'string' ? parsed.contentMd : ''

    return {
      success: true,
      content: {
        ...textFields,
        contentMd: recipeMetadata + contentMd,
        faqJsonLd,
        internalLinkSlugs: validatedInternalLinks,
      },
      products,
      missingProducts,
    }
  } catch (error) {
    console.error('Recipe blog generation error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      products: [],
      missingProducts: [],
    }
  }
}
