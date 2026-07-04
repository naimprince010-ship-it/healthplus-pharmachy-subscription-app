import { Metadata } from 'next'
import { BmiCalculator } from '@/components/tools/BmiCalculator'
import Link from 'next/link'
import Script from 'next/script'

export const metadata: Metadata = {
  title: 'BMI Calculator | বিএমআই ক্যালকুলেটর | Halalzi',
  description: 'আপনার Body Mass Index (BMI) সহজে হিসাব করুন। আপনার উচ্চতা অনুযায়ী আদর্শ ওজন জানুন। সম্পূর্ণ ফ্রি।',
  keywords: ['BMI Calculator', 'বিএমআই ক্যালকুলেটর', 'আদর্শ ওজন', 'Body Mass Index', 'Health Tools', 'Halalzi', 'HealthPlus'],
  openGraph: {
    title: 'BMI Calculator | বিএমআই ক্যালকুলেটর | Halalzi',
    description: 'আপনার Body Mass Index (BMI) সহজে হিসাব করুন। আপনার উচ্চতা অনুযায়ী আদর্শ ওজন জানুন। সম্পূর্ণ ফ্রি।',
    type: 'website',
    url: 'https://halalzi.com/tools/bmi-calculator',
    siteName: 'Halalzi',
  },
  alternates: {
    canonical: 'https://halalzi.com/tools/bmi-calculator',
  }
}

export default function BmiCalculatorPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'BMI Calculator - Halalzi',
    applicationCategory: 'HealthApplication',
    operatingSystem: 'Any',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'BDT',
    },
    description: 'আপনার Body Mass Index (BMI) সহজে হিসাব করুন। আপনার উচ্চতা অনুযায়ী আদর্শ ওজন জানুন। সম্পূর্ণ ফ্রি।',
  }

  return (
    <div className="bg-gray-50 min-h-[calc(100vh-4rem)] py-10">
      <Script
        id="bmi-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <div className="mb-6 flex items-center gap-2 text-sm text-gray-400">
          <Link href="/tools" className="hover:text-teal-600 transition-colors">হেলথ টুলস</Link>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-gray-600 font-medium">BMI Calculator</span>
        </div>

        <BmiCalculator />

        {/* SEO Content */}
        <div className="mt-10 bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-3">BMI কী?</h3>
          <p className="text-sm text-gray-600 leading-relaxed mb-4">
            Body Mass Index (BMI) হলো একজন মানুষের ওজন (কেজি) কে তার উচ্চতার (মিটার) বর্গ দিয়ে ভাগ করলে যে মান পাওয়া যায়। 
            এটি একটি সহজ পদ্ধতি যার মাধ্যমে বোঝা যায় আপনার ওজন স্বাভাবিক, কম, নাকি বেশি।
          </p>
          <h4 className="text-sm font-bold text-gray-700 mb-2">BMI স্কেল</h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-center">
              <p className="font-bold text-blue-700">&lt; 18.5</p>
              <p className="text-blue-500">ওজন কম</p>
            </div>
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-center">
              <p className="font-bold text-emerald-700">18.5 - 24.9</p>
              <p className="text-emerald-500">স্বাভাবিক</p>
            </div>
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-center">
              <p className="font-bold text-amber-700">25 - 29.9</p>
              <p className="text-amber-500">ওজন বেশি</p>
            </div>
            <div className="bg-red-50 border border-red-100 rounded-xl p-3 text-center">
              <p className="font-bold text-red-700">≥ 30</p>
              <p className="text-red-500">স্থূলতা</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
