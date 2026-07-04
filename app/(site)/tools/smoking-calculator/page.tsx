import { Metadata } from 'next'
import { SmokingCalculator } from '@/components/tools/SmokingCalculator'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Quit Smoking Calculator | ধূমপান ছাড়ার হিসাব | Halalzi',
  description: 'ধূমপান ছাড়লে কত টাকা বাঁচবে এবং স্বাস্থ্যের কতটুকু উন্নতি হবে তা হিসাব করুন।',
}

export default function SmokingCalculatorPage() {
  return (
    <div className="bg-gray-50 min-h-[calc(100vh-4rem)] py-10">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center gap-2 text-sm text-gray-400">
          <Link href="/tools" className="hover:text-teal-600 transition-colors">হেলথ টুলস</Link>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-gray-600 font-medium">Quit Smoking Calculator</span>
        </div>

        <SmokingCalculator />

        <div className="mt-10 bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-3">ধূমপান ছাড়ার ম্যাজিক!</h3>
          <p className="text-sm text-gray-600 leading-relaxed mb-4">
            ধূমপান ছাড়ার পর থেকেই শরীরে জাদুকরী পরিবর্তন আসতে শুরু করে।
          </p>
          <ul className="space-y-2 text-sm text-gray-600 list-disc list-inside">
            <li><strong>২০ মিনিট পর:</strong> হার্ট রেট ও রক্তচাপ স্বাভাবিক হতে শুরু করে।</li>
            <li><strong>১২ ঘণ্টা পর:</strong> রক্তে কার্বন মনোক্সাইডের মাত্রা কমে স্বাভাবিক অবস্থায় ফিরে আসে।</li>
            <li><strong>২-১২ সপ্তাহ পর:</strong> রক্ত সঞ্চালন ও ফুসফুসের কার্যক্ষমতা বৃদ্ধি পায়।</li>
            <li><strong>১ বছর পর:</strong> হৃদরোগের ঝুঁকি ধূমপায়ীদের তুলনায় অর্ধেক হয়ে যায়।</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
