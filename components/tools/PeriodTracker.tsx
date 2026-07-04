'use client'

import { useState } from 'react'
import { addDays, format, isValid, parseISO, subDays } from 'date-fns'

export function PeriodTracker() {
  const [lmpDate, setLmpDate] = useState('')
  const [cycleLength, setCycleLength] = useState('28')
  const [result, setResult] = useState<{
    nextPeriod: string;
    ovulationDate: string;
    fertileStart: string;
    fertileEnd: string;
  } | null>(null)

  const calculatePeriod = (e: React.FormEvent) => {
    e.preventDefault()
    if (!lmpDate) return

    const date = parseISO(lmpDate)
    if (!isValid(date)) return

    const cycle = parseInt(cycleLength) || 28

    const nextPeriodDate = addDays(date, cycle)
    const ovulationDate = subDays(nextPeriodDate, 14)
    
    // Fertile window is typically 5 days before ovulation + day of ovulation
    const fertileStart = subDays(ovulationDate, 4)
    const fertileEnd = addDays(ovulationDate, 1)

    setResult({
      nextPeriod: format(nextPeriodDate, 'dd MMMM, yyyy'),
      ovulationDate: format(ovulationDate, 'dd MMMM'),
      fertileStart: format(fertileStart, 'dd MMM'),
      fertileEnd: format(fertileEnd, 'dd MMM'),
    })
  }

  const reset = () => {
    setLmpDate('')
    setCycleLength('28')
    setResult(null)
  }

  return (
    <div className="max-w-lg w-full mx-auto">
      <div className="bg-gradient-to-br from-rose-400 to-pink-600 rounded-t-2xl p-6 text-white text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm mb-3">
          <span className="text-3xl">🌸</span>
        </div>
        <h2 className="text-2xl font-bold">Period & Ovulation Tracker</h2>
        <p className="text-rose-100 text-sm mt-1">আপনার পরবর্তী সাইকেল সম্পর্কে জানুন</p>
      </div>

      <div className="bg-white rounded-b-2xl shadow-xl border border-gray-100 p-6">
        <form onSubmit={calculatePeriod} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              শেষ পিরিয়ড শুরুর তারিখ
            </label>
            <input
              type="date"
              value={lmpDate}
              onChange={(e) => setLmpDate(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none transition text-lg font-semibold text-gray-800 bg-gray-50"
              required
              max={format(new Date(), 'yyyy-MM-dd')}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              গড় সাইকেলের দৈর্ঘ্য (দিন)
            </label>
            <div className="relative">
              <input
                type="number"
                value={cycleLength}
                onChange={(e) => setCycleLength(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none transition font-semibold text-gray-800 bg-gray-50"
                required min="20" max="45"
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">অধিকাংশ নারীর সাইকেল ২৮ দিনের হয়।</p>
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              className="flex-1 bg-gradient-to-r from-rose-500 to-pink-500 text-white py-3 rounded-xl font-semibold hover:from-rose-600 hover:to-pink-600 transition-all active:scale-[0.98] shadow-md shadow-rose-200"
            >
              হিসাব করুন
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
          <div className="mt-6 animate-in fade-in slide-in-from-bottom-3 space-y-3">
            <div className="bg-rose-50 p-5 rounded-2xl border border-rose-100 text-center">
              <p className="text-xs font-bold text-rose-400 uppercase tracking-wide">পরবর্তী পিরিয়ডের সম্ভাব্য তারিখ</p>
              <p className="text-2xl font-extrabold text-rose-600 mt-1">{result.nextPeriod}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 text-center">
                <p className="text-[10px] font-bold text-indigo-400 uppercase mb-1">ওভুলেশন (ডিম্বস্ফোটন)</p>
                <p className="text-lg font-bold text-indigo-700">{result.ovulationDate}</p>
              </div>
              <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 text-center">
                <p className="text-[10px] font-bold text-emerald-400 uppercase mb-1">সন্তান ধারণের সময়কাল</p>
                <p className="text-sm font-bold text-emerald-700 mt-0.5">{result.fertileStart} - {result.fertileEnd}</p>
              </div>
            </div>

            <p className="text-[11px] text-gray-400 mt-2 leading-relaxed text-center px-2">
              ⚕️ এটি একটি আনুমানিক হিসাব। যাদের পিরিয়ড অনিয়মিত, তাদের ক্ষেত্রে এই হিসাব ভিন্ন হতে পারে।
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
