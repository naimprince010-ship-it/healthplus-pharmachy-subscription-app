import { BlogType, TopicBlock } from '@prisma/client'

export interface BlogContent {
  title: string
  summary: string
  contentMd: string
  seoTitle: string
  seoDescription: string
  seoKeywords: string
  faqJsonLd: FAQSchema
  internalLinkSlugs: string[]
}

export interface FAQSchema {
  '@context': 'https://schema.org'
  '@type': 'FAQPage'
  mainEntity: FAQItem[]
}

export interface FAQItem {
  '@type': 'Question'
  name: string
  acceptedAnswer: {
    '@type': 'Answer'
    text: string
  }
}

export interface ProductRecommendation {
  productId: string
  role: 'recommended' | 'ingredient' | 'alternative' | 'combo' | 'step'
  stepOrder?: number
  notes?: string
}

export interface MissingProductInfo {
  name: string
  categorySuggestion?: string
  reason: string
}

export interface BlogGenerationResult {
  success: boolean
  content?: BlogContent
  products: ProductRecommendation[]
  missingProducts: MissingProductInfo[]
  error?: string
}

export interface WriterContext {
  topic: {
    id: string
    title: string
    description?: string | null
    type: BlogType
    block: TopicBlock
  }
  availableProducts: AvailableProduct[]
  existingBlogSlugs: string[]
}

export interface AvailableProduct {
  id: string
  name: string
  slug: string
  sellingPrice: number
  aiTags: string[]
  isIngredient: boolean
  ingredientType: string | null
  budgetLevel: string | null
  category: { name: string } | null
}

export interface SkincareStep {
  step: number
  name: string
  description: string
  tags: string[]
}

export const SKINCARE_ROUTINE_STEPS: SkincareStep[] = [
  { step: 1, name: 'Cleanser', description: 'Remove dirt, oil, and makeup', tags: ['cleanser', 'face-wash', 'cleansing'] },
  { step: 2, name: 'Toner', description: 'Balance skin pH and prep for next steps', tags: ['toner', 'toning'] },
  { step: 3, name: 'Serum', description: 'Target specific skin concerns', tags: ['serum', 'essence', 'ampoule'] },
  { step: 4, name: 'Moisturizer', description: 'Hydrate and lock in moisture', tags: ['moisturizer', 'cream', 'lotion', 'gel'] },
  { step: 5, name: 'Sunscreen', description: 'Protect from UV damage (AM only)', tags: ['sunscreen', 'spf', 'sun-protection'] },
]

export const SKIN_TYPES = ['oily-skin', 'dry-skin', 'combination-skin', 'sensitive-skin', 'normal-skin', 'acne-prone']
export const SKIN_CONCERNS = ['acne', 'anti-aging', 'brightening', 'hydration', 'dark-spots', 'pores', 'wrinkles']
