import { Metadata } from 'next'
import { PeriodTracker } from '@/components/tools/PeriodTracker'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Period & Ovulation Tracker | পিরিয়ড ক্যালকুলেটর | Halalzi',
  description: 'পরবর্তী পিরিয়ড এবং সন্তান ধারণের সবচেয়ে উপযুক্ত সময় (Ovulation) জানুন।',
}

export default function PeriodTrackerPage() {
  return (
    <div className="bg-gray-50 min-h-[calc(100vh-4rem)] py-10">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center gap-2 text-sm text-gray-400">
          <Link href="/tools" className="hover:text-teal-600 transition-colors">হেলথ টুলস</Link>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-gray-600 font-medium">Period Tracker</span>
        </div>

        <PeriodTracker />

        <div className="mt-10 bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-3">মাসিক বা পিরিয়ড সাইকেল</h3>
          <p className="text-sm text-gray-600 leading-relaxed mb-4">
            অধিকাংশ নারীর পিরিয়ড সাইকেল ২৮ থেকে ৩২ দিনের হয়। 
            তবে এটি ব্যক্তিভেদে ভিন্ন হতে পারে।
          </p>
          <ul className="space-y-2 text-sm text-gray-600 list-disc list-inside">
            <li><strong>ওভুলেশন (Ovulation):</strong> এটি এমন একটি সময় যখন ডিম্বাশয় থেকে ডিম্বাণু বের হয়। সাধারণত পরবর্তী পিরিয়ড শুরুর ১৪ দিন আগে ওভুলেশন হয়।</li>
            <li><strong>সন্তান ধারণের সময়কাল (Fertile Window):</strong> ওভুলেশনের দিন এবং তার আগের ৪-৫ দিন হলো সন্তান ধারণের জন্য সবচেয়ে উপযুক্ত সময়।</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
