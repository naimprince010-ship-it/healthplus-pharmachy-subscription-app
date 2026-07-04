import { Metadata } from 'next'
import { BloodDonationCalculator } from '@/components/tools/BloodDonationCalculator'
import Link from 'next/link'
import Script from 'next/script'

export const metadata: Metadata = {
  title: 'Blood Donation Tracker | রক্তদান ক্যালকুলেটর | Halalzi',
  description: 'আপনার পরবর্তী রক্তদানের তারিখ কবে তা সহজে হিসাব করুন। রক্তদানের নিয়ম ও তথ্য জানুন।',
  keywords: ['Blood Donation Tracker', 'রক্তদান ক্যালকুলেটর', 'রক্তদানের তারিখ', 'Blood Donor Eligibility', 'Halalzi Tools'],
  openGraph: {
    title: 'Blood Donation Tracker | রক্তদান ক্যালকুলেটর | Halalzi',
    description: 'আপনার পরবর্তী রক্তদানের তারিখ কবে তা সহজে হিসাব করুন। রক্তদানের নিয়ম ও তথ্য জানুন।',
    type: 'website',
    url: 'https://halalzi.com/tools/blood-donation-calculator',
    siteName: 'Halalzi',
  },
  alternates: {
    canonical: 'https://halalzi.com/tools/blood-donation-calculator',
  }
}

export default function BloodDonationPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Blood Donation Tracker - Halalzi',
    applicationCategory: 'HealthApplication',
    operatingSystem: 'Any',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'BDT',
    },
    description: 'আপনার পরবর্তী রক্তদানের তারিখ কবে তা সহজে হিসাব করুন। রক্তদানের নিয়ম ও তথ্য জানুন।',
  }

  return (
    <div className="bg-gray-50 min-h-[calc(100vh-4rem)] py-10">
      <Script
        id="blood-donation-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center gap-2 text-sm text-gray-400">
          <Link href="/tools" className="hover:text-teal-600 transition-colors">হেলথ টুলস</Link>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-gray-600 font-medium">Blood Donation Tracker</span>
        </div>

        <BloodDonationCalculator />

        <div className="mt-10 bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-3">রক্তদান সম্পর্কে কিছু জরুরি তথ্য</h3>
          <p className="text-sm text-gray-600 leading-relaxed mb-4">
            রক্তদান একটি মহৎ কাজ। আপনার দেওয়া রক্তে বাঁচতে পারে মুমূর্ষু রোগীর প্রাণ।
          </p>
          <ul className="space-y-2 text-sm text-gray-600 list-disc list-inside">
            <li><strong>কারা রক্ত দিতে পারবেন:</strong> ১৮ থেকে ৬০ বছর বয়সী সুস্থ মানুষ যাদের ওজন কমপক্ষে ৫০ কেজি।</li>
            <li><strong>কতদিন পর পর:</strong> সাধারণ নিয়মে পুরুষরা প্রতি ৩ মাস (৯০ দিন) এবং মহিলারা প্রতি ৪ মাস (১২০ দিন) অন্তর রক্ত দিতে পারেন।</li>
            <li>রক্তদানের আগে অবশ্যই পুষ্টিকর খাবার খাওয়া উচিত এবং পর্যাপ্ত পানি পান করা উচিত।</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
