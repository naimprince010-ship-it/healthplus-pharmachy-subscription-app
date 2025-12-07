import SectionTitle from '../components/SectionTitle'

interface Step {
  number: string
  title: string
  description: string
}

interface HowItWorksSectionProps {
  title: string
  steps: Step[]
}

export default function HowItWorksSection({ title, steps }: HowItWorksSectionProps) {
  return (
    <section className="py-20 bg-[#F8FAF8]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionTitle title={title} />
        
        <div className="relative">
          {/* Connection Line - Desktop */}
          <div className="hidden md:block absolute top-12 left-0 right-0 h-1 bg-[#036666]/20">
            <div className="absolute inset-0 bg-gradient-to-r from-[#036666] to-[#036666]/30"></div>
          </div>
          
          <div className="grid md:grid-cols-4 gap-8 relative">
            {steps.map((step, index) => (
              <div key={index} className="text-center relative">
                {/* Step Number */}
                <div className="w-24 h-24 mx-auto mb-6 bg-white rounded-full shadow-lg flex items-center justify-center relative z-10 border-4 border-[#036666]">
                  <span className="text-3xl font-bold text-[#036666]">{step.number}</span>
                </div>
                
                {/* Step Content */}
                <h3 className="text-xl font-bold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-gray-600">{step.description}</p>
                
                {/* Arrow - Mobile */}
                {index < steps.length - 1 && (
                  <div className="md:hidden flex justify-center my-4">
                    <svg className="w-6 h-6 text-[#036666]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
