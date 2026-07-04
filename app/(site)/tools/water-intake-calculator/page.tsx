import { Metadata } from 'next'
import { WaterCalculator } from '@/components/tools/WaterCalculator'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Water Intake Calculator | পানির হিসাব | Halalzi',
  description: 'আপনার ওজন এবং দৈনন্দিন কাজের ধরন অনুযায়ী প্রতিদিন কতটুকু পানি পান করা উচিত তা হিসাব করুন।',
}

export default function WaterCalculatorPage() {
  return (
    <div className="bg-gray-50 min-h-[calc(100vh-4rem)] py-10">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center gap-2 text-sm text-gray-400">
          <Link href="/tools" className="hover:text-teal-600 transition-colors">হেলথ টুলস</Link>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-gray-600 font-medium">Water Calculator</span>
        </div>

        <WaterCalculator />

        <div className="mt-10 bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-3">পর্যাপ্ত পানি পানের উপকারিতা</h3>
          <p className="text-sm text-gray-600 leading-relaxed mb-4">
            আমাদের শরীরের প্রায় ৬০% হলো পানি। শরীরকে সুস্থ ও কর্মক্ষম রাখতে পর্যাপ্ত পানি পান করা অপরিহার্য।
          </p>
          <ul className="space-y-2 text-sm text-gray-600 list-disc list-inside">
            <li>শরীরের তাপমাত্রা নিয়ন্ত্রণ করে।</li>
            <li>ত্বক উজ্জ্বল ও সতেজ রাখে।</li>
            <li>পরিপাকতন্ত্র ভালো রাখে এবং কোষ্ঠকাঠিন্য দূর করে।</li>
            <li>কিডনি ভালো রাখে এবং বর্জ্য পদার্থ বের করতে সাহায্য করে।</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
