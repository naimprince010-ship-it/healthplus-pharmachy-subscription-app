import { Metadata } from 'next'
import { DiabetesChecker } from '@/components/tools/DiabetesChecker'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Diabetes & Blood Sugar Checker | HealthPlus',
  description: 'Check if your blood sugar (glucose) levels are within the normal range. Free diabetes checker tool.',
}

export default function DiabetesCheckerPage() {
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

        <DiabetesChecker />

        <div className="mt-12 bg-white p-8 rounded-xl shadow-sm border border-gray-100 prose prose-blue max-w-none">
          <h3>Understanding Blood Sugar Levels</h3>
          <p>
            Monitoring your blood sugar is crucial for managing diabetes and preventing complications. 
            There are different types of tests used to measure blood glucose levels.
          </p>
          <h4>Target Ranges</h4>
          <ul>
            <li><strong>Fasting Blood Sugar:</strong> Taken after not eating for at least 8 hours. Normal is less than 100 mg/dL.</li>
            <li><strong>Post-Prandial:</strong> Taken 2 hours after a meal. Normal is less than 140 mg/dL.</li>
            <li><strong>HbA1c:</strong> Shows your average blood sugar levels over the past 2-3 months. Normal is below 5.7%.</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
