import { Metadata } from 'next'
import { SleepCalculator } from '@/components/tools/SleepCalculator'
import Link from 'next/link'
import Script from 'next/script'

export const metadata: Metadata = {
  title: 'Sleep Cycle Calculator | স্লিপ সাইকেল ক্যালকুলেটর | Halalzi',
  description: 'সকালে নির্দিষ্ট সময়ে ওঠার জন্য রাতে ঠিক কয়টায় ঘুমানো উচিত তা হিসাব করুন।',
  keywords: ['Sleep Cycle Calculator', 'স্লিপ সাইকেল ক্যালকুলেটর', 'Sleep Tracker', 'Bedtime Calculator', 'Wake Up Calculator', 'Halalzi'],
  openGraph: {
    title: 'Sleep Cycle Calculator | স্লিপ সাইকেল ক্যালকুলেটর | Halalzi',
    description: 'সকালে নির্দিষ্ট সময়ে ওঠার জন্য রাতে ঠিক কয়টায় ঘুমানো উচিত তা হিসাব করুন।',
    type: 'website',
    url: 'https://halalzi.com/tools/sleep-cycle-calculator',
    siteName: 'Halalzi',
  },
  alternates: {
    canonical: 'https://halalzi.com/tools/sleep-cycle-calculator',
  }
}

export default function SleepCalculatorPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Sleep Cycle Calculator - Halalzi',
    applicationCategory: 'HealthApplication',
    operatingSystem: 'Any',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'BDT',
    },
    description: 'সকালে নির্দিষ্ট সময়ে ওঠার জন্য রাতে ঠিক কয়টায় ঘুমানো উচিত তা হিসাব করুন।',
  }

  return (
    <div className="bg-gray-50 min-h-[calc(100vh-4rem)] py-10">
      <Script
        id="sleep-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center gap-2 text-sm text-gray-400">
          <Link href="/tools" className="hover:text-teal-600 transition-colors">হেলথ টুলস</Link>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-gray-600 font-medium">Sleep Calculator</span>
        </div>

        <SleepCalculator />

        <div className="mt-10 bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-3">স্লিপ সাইকেল কী?</h3>
          <p className="text-sm text-gray-600 leading-relaxed mb-4">
            মানুষের ঘুম সাধারণত ৯০ মিনিটের সাইকেল বা চক্রে বিভক্ত থাকে। 
            যদি একটি চক্রের ঠিক মাঝামাঝি সময়ে আপনার ঘুম ভাঙে, তবে আপনি ক্লান্ত এবং খিটখিটে অনুভব করবেন।
          </p>
          <ul className="space-y-2 text-sm text-gray-600 list-disc list-inside">
            <li>একটি পূর্ণাঙ্গ ঘুমের জন্য রাতে ৫-৬টি সাইকেল সম্পূর্ণ করা উচিত।</li>
            <li>৫টি সাইকেল = সাড়ে ৭ ঘণ্টা (বেশিরভাগ মানুষের জন্য আদর্শ)।</li>
            <li>তাই এমন সময়ে ঘুমাতে যাওয়া উচিত যাতে সকালে ওঠার সময় একটি সাইকেল শেষ হয়।</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
