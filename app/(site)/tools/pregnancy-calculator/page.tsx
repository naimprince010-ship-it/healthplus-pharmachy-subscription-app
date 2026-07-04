import { Metadata } from 'next'
import { PregnancyCalculator } from '@/components/tools/PregnancyCalculator'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Pregnancy Due Date Calculator | প্রেগন্যান্সি ক্যালকুলেটর | Halalzi',
  description: 'সম্ভাব্য প্রসবের তারিখ, বর্তমান সপ্তাহ এবং ট্রাইমেস্টার সহজে জানুন। সম্পূর্ণ ফ্রি প্রেগন্যান্সি ক্যালকুলেটর।',
}

export default function PregnancyCalculatorPage() {
  return (
    <div className="bg-gray-50 min-h-[calc(100vh-4rem)] py-10">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <div className="mb-6 flex items-center gap-2 text-sm text-gray-400">
          <Link href="/tools" className="hover:text-teal-600 transition-colors">হেলথ টুলস</Link>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-gray-600 font-medium">Pregnancy Calculator</span>
        </div>

        <PregnancyCalculator />

        {/* SEO Content */}
        <div className="mt-10 bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-3">প্রসবের তারিখ কিভাবে হিসাব করা হয়?</h3>
          <p className="text-sm text-gray-600 leading-relaxed mb-4">
            এই ক্যালকুলেটরটি Naegele's Rule অনুসরণ করে, যা বেশিরভাগ ডাক্তার ব্যবহার করেন। 
            এটি আপনার শেষ মাসিকের প্রথম দিন থেকে ২৮০ দিন (৪০ সপ্তাহ) যোগ করে সম্ভাব্য প্রসবের তারিখ নির্ধারণ করে।
          </p>
          <h4 className="text-sm font-bold text-gray-700 mb-2">প্রেগন্যান্সি ট্রাইমেস্টার</h4>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="bg-pink-50 border border-pink-100 rounded-xl p-3 text-center">
              <span className="text-lg">🌱</span>
              <p className="font-bold text-pink-700 mt-1">১ম ত্রৈমাসিক</p>
              <p className="text-pink-400">সপ্তাহ ১ – ১২</p>
            </div>
            <div className="bg-pink-50 border border-pink-100 rounded-xl p-3 text-center">
              <span className="text-lg">🌿</span>
              <p className="font-bold text-pink-700 mt-1">২য় ত্রৈমাসিক</p>
              <p className="text-pink-400">সপ্তাহ ১৩ – ২৭</p>
            </div>
            <div className="bg-pink-50 border border-pink-100 rounded-xl p-3 text-center">
              <span className="text-lg">🌳</span>
              <p className="font-bold text-pink-700 mt-1">৩য় ত্রৈমাসিক</p>
              <p className="text-pink-400">সপ্তাহ ২৮ – ৪০</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
