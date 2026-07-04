import { Metadata } from 'next'
import { DiabetesChecker } from '@/components/tools/DiabetesChecker'
import Link from 'next/link'
import Script from 'next/script'

export const metadata: Metadata = {
  title: 'Diabetes & Blood Sugar Checker | ডায়াবেটিস চেকার | Halalzi',
  description: 'আপনার রক্তে শর্করার মাত্রা (ব্লাড সুগার) স্বাভাবিক কিনা জানুন। ফ্রি ডায়াবেটিস চেকার টুল।',
  keywords: ['Diabetes Checker', 'ডায়াবেটিস চেকার', 'ব্লাড সুগার টেস্ট', 'Blood Sugar Checker', 'HbA1c', 'Halalzi Health'],
  openGraph: {
    title: 'Diabetes & Blood Sugar Checker | ডায়াবেটিস চেকার | Halalzi',
    description: 'আপনার রক্তে শর্করার মাত্রা (ব্লাড সুগার) স্বাভাবিক কিনা জানুন। ফ্রি ডায়াবেটিস চেকার টুল।',
    type: 'website',
    url: 'https://halalzi.com/tools/diabetes-checker',
    siteName: 'Halalzi',
  },
  alternates: {
    canonical: 'https://halalzi.com/tools/diabetes-checker',
  }
}

export default function DiabetesCheckerPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Diabetes Checker - Halalzi',
    applicationCategory: 'HealthApplication',
    operatingSystem: 'Any',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'BDT',
    },
    description: 'আপনার রক্তে শর্করার মাত্রা (ব্লাড সুগার) স্বাভাবিক কিনা জানুন। ফ্রি ডায়াবেটিস চেকার টুল।',
  }

  return (
    <div className="bg-gray-50 min-h-[calc(100vh-4rem)] py-10">
      <Script
        id="diabetes-schema"
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
          <span className="text-gray-600 font-medium">Diabetes Checker</span>
        </div>

        <DiabetesChecker />

        {/* SEO Content */}
        <div className="mt-10 bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-3">রক্তে শর্করার মাত্রা বোঝা</h3>
          <p className="text-sm text-gray-600 leading-relaxed mb-4">
            ডায়াবেটিস প্রতিরোধ ও নিয়ন্ত্রণের জন্য নিয়মিত রক্তে শর্করার মাত্রা পরীক্ষা করা অত্যন্ত গুরুত্বপূর্ণ। 
            বিভিন্ন ধরনের পরীক্ষার মাধ্যমে রক্তে গ্লুকোজের পরিমাণ মাপা হয়।
          </p>
          <h4 className="text-sm font-bold text-gray-700 mb-2">স্বাভাবিক মাত্রা</h4>
          <div className="space-y-2 text-xs">
            <div className="flex items-center gap-3 bg-gray-50 border border-gray-100 rounded-xl p-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                <span className="text-blue-600 font-bold text-sm">F</span>
              </div>
              <div>
                <p className="font-bold text-gray-700">খালি পেটে (Fasting)</p>
                <p className="text-gray-400">স্বাভাবিক: ১০০ mg/dL এর কম</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-gray-50 border border-gray-100 rounded-xl p-3">
              <div className="w-10 h-10 rounded-lg bg-pink-100 flex items-center justify-center flex-shrink-0">
                <span className="text-pink-600 font-bold text-sm">PP</span>
              </div>
              <div>
                <p className="font-bold text-gray-700">খাবারের পর (Post-Prandial)</p>
                <p className="text-gray-400">স্বাভাবিক: ১৪০ mg/dL এর কম</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-gray-50 border border-gray-100 rounded-xl p-3">
              <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                <span className="text-amber-600 font-bold text-sm">A1c</span>
              </div>
              <div>
                <p className="font-bold text-gray-700">HbA1c (৩ মাসের গড়)</p>
                <p className="text-gray-400">স্বাভাবিক: ৫.৭% এর কম</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
