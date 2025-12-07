import CTAButton from '../components/CTAButton'

interface HeroSectionProps {
  headline: string
  subheadline: string
  ctaText: string
  ctaLink: string
  trustBadges: string[]
}

export default function HeroSection({ headline, subheadline, ctaText, ctaLink, trustBadges }: HeroSectionProps) {
  return (
    <section className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-[#036666] via-[#048080] to-[#036666] overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-10 w-72 h-72 bg-white rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-white rounded-full blur-3xl"></div>
      </div>
      
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center py-20">
        {/* Headline */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-6 leading-tight animate-fade-in-up">
          {headline} <span className="inline-block animate-bounce">&#128666;</span>
        </h1>
        
        {/* Subheadline */}
        <p className="text-xl sm:text-2xl text-gray-100 mb-10 max-w-3xl mx-auto leading-relaxed animate-fade-in-up animation-delay-200">
          {subheadline}
        </p>
        
        {/* CTA Button */}
        <div className="mb-12 animate-fade-in-up animation-delay-400">
          <CTAButton 
            text={ctaText} 
            href={ctaLink} 
            variant="secondary"
            size="lg"
            className="text-xl px-10 py-5"
          />
        </div>
        
        {/* Trust Badges */}
        <div className="flex flex-wrap justify-center gap-4 sm:gap-8 animate-fade-in-up animation-delay-600">
          {trustBadges.map((badge, index) => (
            <div 
              key={index}
              className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full text-white text-sm sm:text-base"
            >
              <svg className="w-5 h-5 text-green-300" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              {badge}
            </div>
          ))}
        </div>
      </div>
      
      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <svg className="w-8 h-8 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </div>
    </section>
  )
}
