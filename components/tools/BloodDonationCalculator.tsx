'use client'

import { useState } from 'react'
import { addDays, format, differenceInDays, isValid, parseISO } from 'date-fns'

export function BloodDonationCalculator() {
  const [lastDonation, setLastDonation] = useState('')
  const [gender, setGender] = useState<'male' | 'female'>('male')
  const [donationType, setDonationType] = useState<'whole' | 'platelet'>('whole')
  const [result, setResult] = useState<{
    nextDate: string; isEligible: boolean; daysLeft: number; totalDays: number; progress: number
  } | null>(null)

  const checkEligibility = (e: React.FormEvent) => {
    e.preventDefault()
    if (!lastDonation) return
    const date = parseISO(lastDonation)
    if (!isValid(date)) return

    let waitDays: number
    if (donationType === 'platelet') {
      waitDays = 7
    } else {
      waitDays = gender === 'male' ? 90 : 120
    }

    const nextEligibleDate = addDays(date, waitDays)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    nextEligibleDate.setHours(0, 0, 0, 0)

    const daysLeft = Math.max(0, differenceInDays(nextEligibleDate, today))
    const daysPassed = differenceInDays(today, date)
    const progress = Math.min(100, Math.max(0, (daysPassed / waitDays) * 100))

    setResult({
      nextDate: format(nextEligibleDate, 'dd MMMM, yyyy'),
      isEligible: daysLeft <= 0,
      daysLeft,
      totalDays: waitDays,
      progress,
    })
  }

  const reset = () => { setLastDonation(''); setResult(null) }

  return (
    <div className="max-w-lg w-full mx-auto">
      <div className="bg-gradient-to-br from-red-500 via-rose-500 to-pink-500 rounded-t-2xl p-6 text-white text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-2 right-8 text-5xl">❤️</div>
          <div className="absolute bottom-2 left-6 text-4xl">🩸</div>
        </div>
        <div className="relative">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm mb-3">
            <span className="text-4xl">🩸</span>
          </div>
          <h2 className="text-2xl font-bold">Blood Donation Tracker</h2>
          <p className="text-red-100 text-sm mt-1">পরবর্তী রক্তদানের তারিখ জানুন</p>
        </div>
      </div>

      <div className="bg-white rounded-b-2xl shadow-xl border border-gray-100 p-6">
        <form onSubmit={checkEligibility} className="space-y-5">
          {/* Gender */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">লিঙ্গ</label>
            <div className="grid grid-cols-2 gap-2">
              {[{ v: 'male' as const, l: 'পুরুষ', i: '👨', sub: '৯০ দিন পর পর' }, { v: 'female' as const, l: 'মহিলা', i: '👩', sub: '১২০ দিন পর পর' }].map(g => (
                <button key={g.v} type="button" onClick={() => setGender(g.v)}
                  className={`flex flex-col items-center py-3 rounded-xl border transition-all ${
                    gender === g.v ? 'bg-red-50 border-red-300 shadow-sm' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  <span className="text-xl">{g.i}</span>
                  <p className={`text-sm font-bold mt-0.5 ${gender === g.v ? 'text-red-700' : 'text-gray-600'}`}>{g.l}</p>
                  <p className="text-[9px] text-gray-400">{g.sub}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Donation Type */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">রক্তদানের ধরন</label>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => setDonationType('whole')}
                className={`p-2.5 rounded-xl border text-center transition-all ${donationType === 'whole' ? 'bg-red-50 border-red-300' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'}`}
              >
                <span className="text-xl">🩸</span>
                <p className={`text-xs font-bold mt-0.5 ${donationType === 'whole' ? 'text-red-700' : 'text-gray-600'}`}>সম্পূর্ণ রক্ত</p>
              </button>
              <button type="button" onClick={() => setDonationType('platelet')}
                className={`p-2.5 rounded-xl border text-center transition-all ${donationType === 'platelet' ? 'bg-red-50 border-red-300' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'}`}
              >
                <span className="text-xl">🔬</span>
                <p className={`text-xs font-bold mt-0.5 ${donationType === 'platelet' ? 'text-red-700' : 'text-gray-600'}`}>প্লেটলেট</p>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">শেষ রক্তদানের তারিখ</label>
            <input
              type="date" value={lastDonation} onChange={(e) => setLastDonation(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition font-semibold text-gray-800 bg-gray-50"
              required max={format(new Date(), 'yyyy-MM-dd')}
            />
          </div>

          <div className="flex gap-3">
            <button type="submit" className="flex-1 bg-gradient-to-r from-red-500 to-rose-500 text-white py-3.5 rounded-xl font-semibold hover:from-red-600 hover:to-rose-600 transition-all active:scale-[0.98] shadow-lg shadow-red-200/50">
              চেক করুন
            </button>
            <button type="button" onClick={reset} className="px-5 py-3.5 bg-gray-100 text-gray-600 rounded-xl font-medium hover:bg-gray-200 transition active:scale-[0.98]">
              রিসেট
            </button>
          </div>
        </form>

        {result !== null && (
          <div className="mt-6 animate-in fade-in slide-in-from-bottom-3 duration-500">
            {result.isEligible ? (
              <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-200 text-center">
                <span className="text-5xl block mb-2">✅</span>
                <p className="text-xl font-extrabold text-emerald-700">আপনি রক্তদানের জন্য প্রস্তুত!</p>
                <p className="text-sm text-emerald-600 mt-2">আজকেই একটি মহৎ কাজ করুন — কারও জীবন বাঁচান 💚</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-amber-50 p-5 rounded-2xl border border-amber-200 text-center">
                  <span className="text-4xl block mb-2">⏳</span>
                  <p className="text-sm font-semibold text-amber-700">পরবর্তী সম্ভাব্য রক্তদানের তারিখ:</p>
                  <p className="text-2xl font-extrabold text-amber-600 mt-1">{result.nextDate}</p>
                </div>

                {/* Progress bar */}
                <div>
                  <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                    <span>শেষ রক্তদান</span>
                    <span>আর {result.daysLeft} দিন বাকি</span>
                  </div>
                  <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-red-400 to-rose-500 transition-all duration-700" style={{ width: `${result.progress}%` }} />
                  </div>
                </div>
              </div>
            )}

            <p className="text-[11px] text-gray-400 mt-4 leading-relaxed text-center">
              ⚕️ রক্তদানের আগে পুষ্টিকর খাবার খান এবং পর্যাপ্ত পানি পান করুন। চিকিৎসকের পরামর্শ নিন।
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
