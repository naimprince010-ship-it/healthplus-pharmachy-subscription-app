// Landing Page Builder Types

export type LandingPageSectionType =
  | 'hero'
  | 'problem'
  | 'benefits'
  | 'howItWorks'
  | 'pricing'
  | 'testimonials'
  | 'faq'
  | 'finalCta'

// Base section interface
export interface BaseSection {
  id: string
  type: LandingPageSectionType
  order: number
}

// Hero Section
export interface HeroSectionConfig {
  headline: string
  subheadline: string
  ctaText: string
  ctaLink: string
  badge?: string
  trustBadges?: string[]
}

export interface HeroSection extends BaseSection {
  type: 'hero'
  config: HeroSectionConfig
}

// Problem Section
export interface ProblemSectionConfig {
  title: string
  pains: string[]
}

export interface ProblemSection extends BaseSection {
  type: 'problem'
  config: ProblemSectionConfig
}

// Benefits Section
export interface BenefitItem {
  icon: string
  title: string
  description: string
}

export interface BenefitsSectionConfig {
  title: string
  items: BenefitItem[]
}

export interface BenefitsSection extends BaseSection {
  type: 'benefits'
  config: BenefitsSectionConfig
}

// How It Works Section
export interface HowItWorksStep {
  number: string
  title: string
  description: string
}

export interface HowItWorksSectionConfig {
  title: string
  steps: HowItWorksStep[]
}

export interface HowItWorksSection extends BaseSection {
  type: 'howItWorks'
  config: HowItWorksSectionConfig
}

// Pricing Section
export interface PricingSectionConfig {
  title: string
  description: string
  price?: string
  originalPrice?: string
  ctaText: string
  ctaLink: string
}

export interface PricingSection extends BaseSection {
  type: 'pricing'
  config: PricingSectionConfig
}

// Testimonials Section
export interface TestimonialItem {
  name: string
  location: string
  quote: string
  rating: number
}

export interface TestimonialsSectionConfig {
  title: string
  items: TestimonialItem[]
}

export interface TestimonialsSection extends BaseSection {
  type: 'testimonials'
  config: TestimonialsSectionConfig
}

// FAQ Section
export interface FAQItem {
  question: string
  answer: string
}

export interface FAQSectionConfig {
  title: string
  items: FAQItem[]
}

export interface FAQSection extends BaseSection {
  type: 'faq'
  config: FAQSectionConfig
}

// Final CTA Section
export interface FinalCTASectionConfig {
  headline: string
  ctaText: string
  ctaLink: string
  trustIndicators?: string[]
}

export interface FinalCTASection extends BaseSection {
  type: 'finalCta'
  config: FinalCTASectionConfig
}

// Union type for all sections
export type LandingPageSection =
  | HeroSection
  | ProblemSection
  | BenefitsSection
  | HowItWorksSection
  | PricingSection
  | TestimonialsSection
  | FAQSection
  | FinalCTASection

// Landing Page data structure
export interface LandingPageData {
  id: string
  title: string
  slug: string
  status: 'DRAFT' | 'PUBLISHED'
  sections: LandingPageSection[]
  metaTitle?: string | null
  metaDescription?: string | null
  primaryColor?: string | null
  createdAt: Date
  updatedAt: Date
  publishedAt?: Date | null
}

// Default section configs for creating new sections
export const defaultSectionConfigs: Record<LandingPageSectionType, unknown> = {
  hero: {
    headline: '',
    subheadline: '',
    ctaText: 'Get Started',
    ctaLink: '/',
    badge: '',
    trustBadges: [],
  } as HeroSectionConfig,
  problem: {
    title: 'Common Problems',
    pains: [''],
  } as ProblemSectionConfig,
  benefits: {
    title: 'Benefits',
    items: [{ icon: 'check', title: '', description: '' }],
  } as BenefitsSectionConfig,
  howItWorks: {
    title: 'How It Works',
    steps: [{ number: '1', title: '', description: '' }],
  } as HowItWorksSectionConfig,
  pricing: {
    title: 'Pricing',
    description: '',
    ctaText: 'Order Now',
    ctaLink: '/',
  } as PricingSectionConfig,
  testimonials: {
    title: 'What Our Customers Say',
    items: [{ name: '', location: '', quote: '', rating: 5 }],
  } as TestimonialsSectionConfig,
  faq: {
    title: 'Frequently Asked Questions',
    items: [{ question: '', answer: '' }],
  } as FAQSectionConfig,
  finalCta: {
    headline: '',
    ctaText: 'Get Started Now',
    ctaLink: '/',
    trustIndicators: [],
  } as FinalCTASectionConfig,
}

// Section type labels for UI
export const sectionTypeLabels: Record<LandingPageSectionType, string> = {
  hero: 'Hero Section',
  problem: 'Problem Section',
  benefits: 'Benefits Section',
  howItWorks: 'How It Works',
  pricing: 'Pricing Section',
  testimonials: 'Testimonials',
  faq: 'FAQ Section',
  finalCta: 'Final CTA',
}

// Generate unique section ID
export function generateSectionId(): string {
  return `sec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

// Create a new section with default config
export function createSection(type: LandingPageSectionType, order: number): LandingPageSection {
  return {
    id: generateSectionId(),
    type,
    order,
    config: JSON.parse(JSON.stringify(defaultSectionConfigs[type])),
  } as LandingPageSection
}
