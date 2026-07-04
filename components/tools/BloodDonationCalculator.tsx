'use client'

import { useState } from 'react'
import { addDays, format, differenceInDays, isValid, parseISO } from 'date-fns'

export function BloodDonationCalculator() {
  const [lastDonation, setLastDonation] = useState('')
  const [gender, setGender] = useState<'male' | 'female'>('male')
  const [result, setResult] = useState<{
    nextDate: string;
    isEligible: boolean;
    daysLeft: number;
  } | null>(null)

  const checkEligibility = (e: React.FormEvent) => {
    e.preventDefault()
    if (!lastDonation) return

    const date = parseISO(lastDonation)
    if (!isValid(date)) return

    // Males can donate every 90 days, females every 120 days in some guidelines, 
    // but a common standard is 90 days (3 months) for males and 120 days (4 months) for females.
    // We will use 90 days for men and 120 for women for standard whole blood.
    const waitDays = gender === 'male' ? 90 : 120
    const nextEligibleDate = addDays(date, waitDays)
    
    const today = new Date()
    // Reset time for accurate day comparison
    today.setHours(0, 0, 0, 0)
    nextEligibleDate.setHours(0, 0, 0, 0)

    const daysLeft = differenceInDays(nextEligibleDate, today)

    setResult({
      nextDate: format(nextEligibleDate, 'dd MMMM, yyyy'),
      isEligible: daysLeft <= 0,
      daysLeft: Math.max(0, daysLeft),
    })
  }

  const reset = () => {
    setLastDonation('')
    setResult(null)
  }

  return (
    <div className="max-w-lg w-full mx-auto">
      <div className="bg-gradient-to-br from-red-500 to-rose-700 rounded-t-2xl p-6 text-white text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm mb-3">
          <span className="text-3xl">🩸</span>
        </div>
        <h2 className="text-2xl font-bold">Blood Donation Tracker</h2>
        <p className="text-red-100 text-sm mt-1">পরবর্তী রক্তদানের তারিখ জানুন</p>
      </div>

      <div className="bg-white rounded-b-2xl shadow-xl border border-gray-100 p-6">
        <form onSubmit={checkEligibility} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">লিঙ্গ</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setGender('male')}
                className={`flex-1 py-2.5 rounded-xl border text-sm font-medium transition-all ${gender === 'male' ? 'bg-red-50 border-red-300 text-red-700' : 'bg-gray-50 border-gray-200 text-gray-600'}`}
              >
                পুরুষ
              </button>
              <button
                type="button"
                onClick={() => setGender('female')}
                className={`flex-1 py-2.5 rounded-xl border text-sm font-medium transition-all ${gender === 'female' ? 'bg-red-50 border-red-300 text-red-700' : 'bg-gray-50 border-gray-200 text-gray-600'}`}
              >
                মহিলা
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              শেষ রক্তদানের তারিখ
            </label>
            <input
              type="date"
              value={lastDonation}
              onChange={(e) => setLastDonation(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition text-lg font-semibold text-gray-800 bg-gray-50"
              required
              max={format(new Date(), 'yyyy-MM-dd')}
            />
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              className="flex-1 bg-gradient-to-r from-red-500 to-rose-600 text-white py-3 rounded-xl font-semibold hover:from-red-600 hover:to-rose-700 transition-all active:scale-[0.98] shadow-md shadow-red-200"
            >
              চেক করুন
            </button>
            <button
              type="button"
              onClick={reset}
              className="px-5 py-3 bg-gray-100 text-gray-600 rounded-xl font-medium hover:bg-gray-200 transition active:scale-[0.98]"
            >
              রিসেট
            </button>
          </div>
        </form>

        {result !== null && (
          <div className="mt-6 animate-in fade-in slide-in-from-bottom-3">
            {result.isEligible ? (
              <div className="p-5 bg-green-50 rounded-2xl border border-green-200 text-center">
                <span className="text-4xl mb-2 block">✅</span>
                <p className="text-xl font-extrabold text-green-700">আপনি রক্তদানের জন্য উপযুক্ত!</p>
                <p className="text-sm text-green-600 mt-1">আপনার পরবর্তী তারিখ ছিল {result.nextDate}</p>
              </div>
            ) : (
              <div className="p-5 bg-amber-50 rounded-2xl border border-amber-200 text-center">
                <span className="text-4xl mb-2 block">⏳</span>
                <p className="text-lg font-bold text-amber-700 mb-1">এখনো রক্তদানের সময় হয়নি</p>
                <p className="text-sm text-amber-600">পরবর্তী সম্ভাব্য তারিখ:</p>
                <p className="text-2xl font-extrabold text-amber-600 my-2">{result.nextDate}</p>
                <p className="text-xs font-semibold bg-white inline-block px-3 py-1 rounded-full text-amber-700">
                  আর মাত্র {result.daysLeft} দিন বাকি
                </p>
              </div>
            )}
            
            <p className="text-[11px] text-gray-400 mt-4 leading-relaxed text-center px-2">
              ⚕️ নিয়ম অনুযায়ী পুরুষরা ৩ মাস (৯০ দিন) এবং মহিলারা ৪ মাস (১২০ দিন) পর পর রক্ত দিতে পারেন। রক্তদানের আগে অবশ্যই আপনার চিকিৎসকের পরামর্শ নিন।
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
