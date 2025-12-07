import { Metadata } from 'next'
import HeroSection from './sections/HeroSection'
import ProblemSection from './sections/ProblemSection'
import SolutionSection from './sections/SolutionSection'
import BenefitsSection from './sections/BenefitsSection'
import HowItWorksSection from './sections/HowItWorksSection'
import WhatYouGetSection from './sections/WhatYouGetSection'
import PricingSection from './sections/PricingSection'
import TestimonialsSection from './sections/TestimonialsSection'
import FAQSection from './sections/FAQSection'
import FinalCTASection from './sections/FinalCTASection'
import AIAssistantWidget from './components/AIAssistantWidget'
import content from './content.json'

export const metadata: Metadata = {
  title: 'Halalzi - হালাল ওষুধ ও মুদিপণ্য ডেলিভারি | Order Now',
  description: 'Halalzi - ঘরে বসে হালাল ওষুধ আর মুদিপণ্য, এক ক্লিকে আপনার দরজায়। Registered pharmacist-এর তত্ত্বাবধানে verified ফার্মেসি + grocery এক প্ল্যাটফর্মে।',
  keywords: ['halalzi', 'halal pharmacy', 'medicine delivery', 'grocery delivery', 'dhaka', 'bangladesh', 'online pharmacy'],
  openGraph: {
    title: 'Halalzi - হালাল ওষুধ ও মুদিপণ্য ডেলিভারি',
    description: 'ঘরে বসে হালাল ওষুধ আর মুদিপণ্য, এক ক্লিকে আপনার দরজায়।',
    type: 'website',
    locale: 'bn_BD',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Halalzi - হালাল ওষুধ ও মুদিপণ্য ডেলিভারি',
    description: 'ঘরে বসে হালাল ওষুধ আর মুদিপণ্য, এক ক্লিকে আপনার দরজায়।',
  },
}

export default function HalalziOfferPage() {
  return (
    <main className="min-h-screen bg-[#F8FAF8]">
      {/* Hero Section */}
      <HeroSection 
        headline={content.hero.headline}
        subheadline={content.hero.subheadline}
        ctaText={content.hero.ctaText}
        ctaLink={content.hero.ctaLink}
        trustBadges={content.hero.trustBadges}
      />
      
      {/* Problem Section */}
      <ProblemSection 
        title={content.problem.title}
        pains={content.problem.pains}
      />
      
      {/* Solution Section */}
      <SolutionSection 
        title={content.solution.title}
        features={content.solution.features}
      />
      
      {/* Benefits Section */}
      <BenefitsSection 
        title={content.benefits.title}
        items={content.benefits.items}
      />
      
      {/* How It Works Section */}
      <HowItWorksSection 
        title={content.howItWorks.title}
        steps={content.howItWorks.steps}
      />
      
      {/* What You Get Section */}
      <WhatYouGetSection 
        title={content.whatYouGet.title}
        items={content.whatYouGet.items}
        ctaText={content.whatYouGet.ctaText}
        ctaLink={content.whatYouGet.ctaLink}
      />
      
      {/* Pricing Section */}
      <PricingSection 
        title={content.pricing.title}
        description={content.pricing.description}
        ctaText={content.pricing.ctaText}
        ctaLink={content.pricing.ctaLink}
      />
      
      {/* Testimonials Section */}
      <TestimonialsSection 
        title={content.testimonials.title}
        items={content.testimonials.items}
      />
      
      {/* FAQ Section */}
      <FAQSection 
        title={content.faq.title}
        items={content.faq.items}
      />
      
      {/* Final CTA Section */}
      <FinalCTASection 
        headline={content.finalCta.headline}
        ctaText={content.finalCta.ctaText}
        ctaLink={content.finalCta.ctaLink}
      />
      
          {/* Minimal Footer */}
          <footer className="py-6 bg-gray-900 text-center">
            <p className="text-gray-400 text-sm">{content.footer.copyright}</p>
          </footer>
      
          {/* AI Assistant Widget */}
          <AIAssistantWidget />
        </main>
  )
}
