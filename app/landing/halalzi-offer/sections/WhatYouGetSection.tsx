import SectionTitle from '../components/SectionTitle'
import CTAButton from '../components/CTAButton'

interface WhatYouGetSectionProps {
  title: string
  items: string[]
  ctaText: string
  ctaLink: string
}

export default function WhatYouGetSection({ title, items, ctaText, ctaLink }: WhatYouGetSectionProps) {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionTitle title={title} />
        
        <div className="bg-gradient-to-br from-[#036666] to-[#048080] rounded-3xl p-8 md:p-12 shadow-2xl">
          <div className="space-y-4 mb-10">
            {items.map((item, index) => (
              <div 
                key={index}
                className="flex items-center gap-4 bg-white/10 backdrop-blur-sm p-4 rounded-xl"
              >
                <div className="flex-shrink-0 w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-white text-lg font-medium">{item}</span>
              </div>
            ))}
          </div>
          
          <div className="text-center">
            <CTAButton 
              text={ctaText} 
              href={ctaLink} 
              variant="secondary"
              size="lg"
            />
          </div>
        </div>
      </div>
    </section>
  )
}
