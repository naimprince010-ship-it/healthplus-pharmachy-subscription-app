import { Metadata } from 'next'
import { BmiCalculator } from '@/components/tools/BmiCalculator'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'BMI Calculator | HealthPlus',
  description: 'Calculate your Body Mass Index (BMI) easily with our free tool. Know your ideal weight range.',
}

export default function BmiCalculatorPage() {
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

        <BmiCalculator />

        <div className="mt-12 bg-white p-8 rounded-xl shadow-sm border border-gray-100 prose prose-teal max-w-none">
          <h3>What is BMI?</h3>
          <p>
            Body Mass Index (BMI) is a person's weight in kilograms divided by the square of height in meters. 
            BMI is an inexpensive and easy screening method for weight category—underweight, healthy weight, overweight, and obesity.
          </p>
          <p>
            While BMI does not measure body fat directly, it correlates with more direct measures of body fat. 
            Furthermore, BMI appears to be strongly correlated with various metabolic and disease outcomes.
          </p>
        </div>
      </div>
    </div>
  )
}
