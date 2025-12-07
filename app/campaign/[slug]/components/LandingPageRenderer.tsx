'use client'

import {
  LandingPageSection,
  HeroSectionConfig,
  ProblemSectionConfig,
  BenefitsSectionConfig,
  HowItWorksSectionConfig,
  PricingSectionConfig,
  TestimonialsSectionConfig,
  FAQSectionConfig,
  FinalCTASectionConfig,
} from '@/lib/landing-page/types'

interface LandingPageRendererProps {
  sections: LandingPageSection[]
  primaryColor: string
}

export default function LandingPageRenderer({ sections, primaryColor }: LandingPageRendererProps) {
  // Sort sections by order
  const sortedSections = [...sections].sort((a, b) => a.order - b.order)

  return (
    <div className="min-h-screen bg-white">
      <style jsx global>{`
        :root {
          --landing-primary: ${primaryColor};
          --landing-primary-dark: ${adjustColor(primaryColor, -20)};
          --landing-primary-light: ${adjustColor(primaryColor, 40)};
        }
      `}</style>
      {sortedSections.map((section) => (
        <div key={section.id}>
          {renderSection(section, primaryColor)}
        </div>
      ))}
    </div>
  )
}

function renderSection(section: LandingPageSection, primaryColor: string) {
  switch (section.type) {
    case 'hero':
      return <HeroSection config={section.config as HeroSectionConfig} primaryColor={primaryColor} />
    case 'problem':
      return <ProblemSection config={section.config as ProblemSectionConfig} primaryColor={primaryColor} />
    case 'benefits':
      return <BenefitsSection config={section.config as BenefitsSectionConfig} primaryColor={primaryColor} />
    case 'howItWorks':
      return <HowItWorksSection config={section.config as HowItWorksSectionConfig} primaryColor={primaryColor} />
    case 'pricing':
      return <PricingSection config={section.config as PricingSectionConfig} primaryColor={primaryColor} />
    case 'testimonials':
      return <TestimonialsSection config={section.config as TestimonialsSectionConfig} primaryColor={primaryColor} />
    case 'faq':
      return <FAQSection config={section.config as FAQSectionConfig} primaryColor={primaryColor} />
    case 'finalCta':
      return <FinalCTASection config={section.config as FinalCTASectionConfig} primaryColor={primaryColor} />
    default:
      return null
  }
}

// Helper function to adjust color brightness
function adjustColor(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16)
  const amt = Math.round(2.55 * percent)
  const R = Math.min(255, Math.max(0, (num >> 16) + amt))
  const G = Math.min(255, Math.max(0, ((num >> 8) & 0x00ff) + amt))
  const B = Math.min(255, Math.max(0, (num & 0x0000ff) + amt))
  return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`
}

// Hero Section Component
function HeroSection({ config, primaryColor }: { config: HeroSectionConfig; primaryColor: string }) {
  return (
    <section 
      className="relative overflow-hidden py-16 md:py-24"
      style={{ backgroundColor: `${primaryColor}10` }}
    >
      <div className="mx-auto max-w-4xl px-4 text-center">
        {config.badge && (
          <span 
            className="mb-4 inline-block rounded-full px-4 py-1 text-sm font-semibold text-white"
            style={{ backgroundColor: primaryColor }}
          >
            {config.badge}
          </span>
        )}
        <h1 className="mb-6 text-3xl font-bold text-gray-900 md:text-5xl">
          {config.headline}
        </h1>
        {config.subheadline && (
          <p className="mb-8 text-lg text-gray-600 md:text-xl">
            {config.subheadline}
          </p>
        )}
        {config.ctaText && config.ctaLink && (
          <a
            href={config.ctaLink}
            className="inline-block rounded-lg px-8 py-4 text-lg font-semibold text-white shadow-lg transition-transform hover:scale-105"
            style={{ backgroundColor: primaryColor }}
          >
            {config.ctaText}
          </a>
        )}
        {config.trustBadges && config.trustBadges.length > 0 && (
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            {config.trustBadges.map((badge, index) => (
              <span key={index} className="text-sm text-gray-500">
                {badge}
              </span>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

// Problem Section Component
function ProblemSection({ config, primaryColor }: { config: ProblemSectionConfig; primaryColor: string }) {
  return (
    <section className="bg-gray-50 py-16">
      <div className="mx-auto max-w-4xl px-4">
        <h2 className="mb-8 text-center text-2xl font-bold text-gray-900 md:text-3xl">
          {config.title}
        </h2>
        <div className="space-y-4">
          {config.pains?.map((pain, index) => (
            <div
              key={index}
              className="flex items-start gap-3 rounded-lg bg-white p-4 shadow-sm"
            >
              <span 
                className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-white text-sm"
                style={{ backgroundColor: '#ef4444' }}
              >
                !
              </span>
              <p className="text-gray-700">{pain}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// Benefits Section Component
function BenefitsSection({ config, primaryColor }: { config: BenefitsSectionConfig; primaryColor: string }) {
  return (
    <section className="py-16">
      <div className="mx-auto max-w-6xl px-4">
        <h2 className="mb-12 text-center text-2xl font-bold text-gray-900 md:text-3xl">
          {config.title}
        </h2>
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {config.items?.map((item, index) => (
            <div key={index} className="rounded-lg bg-white p-6 shadow-md">
              <div 
                className="mb-4 flex h-12 w-12 items-center justify-center rounded-full text-white"
                style={{ backgroundColor: primaryColor }}
              >
                <CheckIcon />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900">{item.title}</h3>
              <p className="text-gray-600">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// How It Works Section Component
function HowItWorksSection({ config, primaryColor }: { config: HowItWorksSectionConfig; primaryColor: string }) {
  return (
    <section className="bg-gray-50 py-16">
      <div className="mx-auto max-w-4xl px-4">
        <h2 className="mb-12 text-center text-2xl font-bold text-gray-900 md:text-3xl">
          {config.title}
        </h2>
        <div className="space-y-8">
          {config.steps?.map((step, index) => (
            <div key={index} className="flex items-start gap-4">
              <div 
                className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-lg font-bold text-white"
                style={{ backgroundColor: primaryColor }}
              >
                {step.number}
              </div>
              <div>
                <h3 className="mb-1 text-lg font-semibold text-gray-900">{step.title}</h3>
                <p className="text-gray-600">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// Pricing Section Component
function PricingSection({ config, primaryColor }: { config: PricingSectionConfig; primaryColor: string }) {
  return (
    <section className="py-16">
      <div className="mx-auto max-w-2xl px-4 text-center">
        <h2 className="mb-4 text-2xl font-bold text-gray-900 md:text-3xl">
          {config.title}
        </h2>
        {config.description && (
          <p className="mb-8 text-gray-600">{config.description}</p>
        )}
        <div className="rounded-2xl bg-white p-8 shadow-xl">
          <div className="mb-6">
            {config.originalPrice && (
              <span className="text-lg text-gray-400 line-through">
                {config.originalPrice} Tk
              </span>
            )}
            {config.price && (
              <div className="text-4xl font-bold" style={{ color: primaryColor }}>
                {config.price} <span className="text-lg">Tk</span>
              </div>
            )}
          </div>
          {config.ctaText && config.ctaLink && (
            <a
              href={config.ctaLink}
              className="inline-block w-full rounded-lg px-8 py-4 text-lg font-semibold text-white transition-transform hover:scale-105"
              style={{ backgroundColor: primaryColor }}
            >
              {config.ctaText}
            </a>
          )}
        </div>
      </div>
    </section>
  )
}

// Testimonials Section Component
function TestimonialsSection({ config, primaryColor }: { config: TestimonialsSectionConfig; primaryColor: string }) {
  return (
    <section className="bg-gray-50 py-16">
      <div className="mx-auto max-w-6xl px-4">
        <h2 className="mb-12 text-center text-2xl font-bold text-gray-900 md:text-3xl">
          {config.title}
        </h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {config.items?.map((item, index) => (
            <div key={index} className="rounded-lg bg-white p-6 shadow-md">
              <div className="mb-4 flex">
                {[...Array(5)].map((_, i) => (
                  <StarIcon 
                    key={i} 
                    filled={i < item.rating} 
                    color={primaryColor}
                  />
                ))}
              </div>
              <p className="mb-4 text-gray-600 italic">&quot;{item.quote}&quot;</p>
              <div>
                <p className="font-semibold text-gray-900">{item.name}</p>
                <p className="text-sm text-gray-500">{item.location}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// FAQ Section Component
function FAQSection({ config, primaryColor }: { config: FAQSectionConfig; primaryColor: string }) {
  return (
    <section className="py-16">
      <div className="mx-auto max-w-3xl px-4">
        <h2 className="mb-12 text-center text-2xl font-bold text-gray-900 md:text-3xl">
          {config.title}
        </h2>
        <div className="space-y-4">
          {config.items?.map((item, index) => (
            <details
              key={index}
              className="group rounded-lg border border-gray-200 bg-white"
            >
              <summary 
                className="flex cursor-pointer items-center justify-between p-4 font-semibold text-gray-900"
                style={{ listStyle: 'none' }}
              >
                {item.question}
                <span className="ml-2 transition-transform group-open:rotate-180">
                  <ChevronDownIcon />
                </span>
              </summary>
              <div className="border-t border-gray-200 p-4 text-gray-600">
                {item.answer}
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}

// Final CTA Section Component
function FinalCTASection({ config, primaryColor }: { config: FinalCTASectionConfig; primaryColor: string }) {
  return (
    <section 
      className="py-16 text-white"
      style={{ backgroundColor: primaryColor }}
    >
      <div className="mx-auto max-w-4xl px-4 text-center">
        <h2 className="mb-8 text-2xl font-bold md:text-3xl">
          {config.headline}
        </h2>
        {config.ctaText && config.ctaLink && (
          <a
            href={config.ctaLink}
            className="inline-block rounded-lg bg-white px-8 py-4 text-lg font-semibold shadow-lg transition-transform hover:scale-105"
            style={{ color: primaryColor }}
          >
            {config.ctaText}
          </a>
        )}
        {config.trustIndicators && config.trustIndicators.length > 0 && (
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            {config.trustIndicators.map((indicator, index) => (
              <span key={index} className="text-sm opacity-80">
                {indicator}
              </span>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

// Icon Components
function CheckIcon() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  )
}

function StarIcon({ filled, color }: { filled: boolean; color: string }) {
  return (
    <svg 
      className="h-5 w-5" 
      fill={filled ? color : 'none'} 
      viewBox="0 0 24 24" 
      stroke={color}
    >
      <path 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        strokeWidth={2} 
        d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" 
      />
    </svg>
  )
}

function ChevronDownIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  )
}
