import CTAButton from '../components/CTAButton'

interface PricingSectionProps {
  title: string
  description: string
  ctaText: string
  ctaLink: string
}

export default function PricingSection({ title, description, ctaText, ctaLink }: PricingSectionProps) {
  return (
    <section className="py-20 bg-[#F8FAF8]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl p-8 md:p-12 shadow-xl border border-gray-100 text-center">
          {/* Price Tag Icon */}
          <div className="w-20 h-20 mx-auto mb-6 bg-[#036666]/10 rounded-full flex items-center justify-center">
            <svg className="w-10 h-10 text-[#036666]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            {title}
          </h2>
          
          <p className="text-xl text-gray-600 mb-8 max-w-xl mx-auto">
            {description}
          </p>
          
          {/* Free Badge */}
          <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-semibold mb-8">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            App ব্যবহার সম্পূর্ণ ফ্রি
          </div>
          
          <div className="block">
            <CTAButton 
              text={ctaText} 
              href={ctaLink} 
              variant="primary"
              size="lg"
            />
          </div>
        </div>
      </div>
    </section>
  )
}
