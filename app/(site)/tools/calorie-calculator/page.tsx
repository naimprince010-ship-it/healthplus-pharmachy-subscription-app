import { Metadata } from 'next'
import { CalorieCalculator } from '@/components/tools/CalorieCalculator'
import Link from 'next/link'
import Script from 'next/script'

export const metadata: Metadata = {
  title: 'Daily Calorie Calculator | দৈনিক ক্যালরি ক্যালকুলেটর | Halalzi',
  description: 'ওজন কমাতে, বাড়াতে বা ধরে রাখতে আপনার প্রতিদিন কত ক্যালরি প্রয়োজন তা হিসাব করুন।',
  keywords: ['Calorie Calculator', 'দৈনিক ক্যালরি ক্যালকুলেটর', 'BMR Calculator', 'TDEE Calculator', 'Weight Loss Calculator', 'Halalzi'],
  openGraph: {
    title: 'Daily Calorie Calculator | দৈনিক ক্যালরি ক্যালকুলেটর | Halalzi',
    description: 'ওজন কমাতে, বাড়াতে বা ধরে রাখতে আপনার প্রতিদিন কত ক্যালরি প্রয়োজন তা হিসাব করুন।',
    type: 'website',
    url: 'https://halalzi.com/tools/calorie-calculator',
    siteName: 'Halalzi',
  },
  alternates: {
    canonical: 'https://halalzi.com/tools/calorie-calculator',
  }
}

export default function CalorieCalculatorPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Daily Calorie Calculator - Halalzi',
    applicationCategory: 'HealthApplication',
    operatingSystem: 'Any',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'BDT',
    },
    description: 'ওজন কমাতে, বাড়াতে বা ধরে রাখতে আপনার প্রতিদিন কত ক্যালরি প্রয়োজন তা হিসাব করুন।',
  }

  return (
    <div className="bg-gray-50 min-h-[calc(100vh-4rem)] py-10">
      <Script
        id="calorie-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center gap-2 text-sm text-gray-400">
          <Link href="/tools" className="hover:text-teal-600 transition-colors">হেলথ টুলস</Link>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-gray-600 font-medium">Calorie Calculator</span>
        </div>

        <CalorieCalculator />

        <div className="mt-10 bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-3">ক্যালরি কী এবং কেন হিসাব করা জরুরি?</h3>
          <p className="text-sm text-gray-600 leading-relaxed mb-4">
            ক্যালরি হলো শক্তির একক। আমরা খাবার থেকে যে শক্তি পাই তা ক্যালরিতে মাপা হয়। 
            সুস্থ থাকতে ও আদর্শ ওজন বজায় রাখতে সঠিক পরিমাণ ক্যালরি গ্রহণ করা অত্যন্ত গুরুত্বপূর্ণ।
          </p>
          <ul className="space-y-2 text-sm text-gray-600 list-disc list-inside">
            <li><strong>ওজন কমাতে:</strong> আপনার দৈনিক প্রয়োজনের চেয়ে কম ক্যালরি গ্রহণ করতে হবে (Calorie Deficit)।</li>
            <li><strong>ওজন বাড়াতে:</strong> প্রয়োজনের চেয়ে বেশি ক্যালরি গ্রহণ করতে হবে (Calorie Surplus)।</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
