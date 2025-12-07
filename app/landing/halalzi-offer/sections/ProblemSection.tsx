import SectionTitle from '../components/SectionTitle'

interface ProblemSectionProps {
  title: string
  pains: string[]
}

export default function ProblemSection({ title, pains }: ProblemSectionProps) {
  return (
    <section className="py-20 bg-[#F8FAF8]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionTitle title={title} />
        
        <div className="space-y-4">
          {pains.map((pain, index) => (
            <div 
              key={index}
              className="flex items-start gap-4 bg-white p-5 rounded-xl shadow-sm border border-red-100 hover:shadow-md transition-shadow duration-300"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <p className="text-gray-700 text-lg leading-relaxed">{pain}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
