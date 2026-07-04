import { Metadata } from 'next'
import { PregnancyCalculator } from '@/components/tools/PregnancyCalculator'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Pregnancy Due Date Calculator | HealthPlus',
  description: 'Calculate your estimated due date, current weeks, and trimester easily with our free pregnancy calculator.',
}

export default function PregnancyCalculatorPage() {
  return (
    <div className="bg-gray-50 min-h-[calc(100vh-4rem)] py-12">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link href="/tools" className="text-teal-600 hover:text-teal-700 font-medium inline-flex items-center text-sm">
            <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Tools
          </Link>
        </div>

        <PregnancyCalculator />

        <div className="mt-12 bg-white p-8 rounded-xl shadow-sm border border-gray-100 prose prose-pink max-w-none">
          <h3>How is the due date calculated?</h3>
          <p>
            This calculator uses Naegele's rule, which is the standard method used by most healthcare providers. 
            It assumes a standard 28-day menstrual cycle and adds 280 days (40 weeks) to the first day of your last menstrual period (LMP).
          </p>
          <h4>Pregnancy Trimesters</h4>
          <ul>
            <li><strong>First Trimester:</strong> Weeks 1 through 12</li>
            <li><strong>Second Trimester:</strong> Weeks 13 through 27</li>
            <li><strong>Third Trimester:</strong> Weeks 28 to 40 (or until delivery)</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
