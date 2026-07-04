'use client'

import { useState } from 'react'
import { addDays, format, isValid, parseISO, subDays, differenceInDays } from 'date-fns'

export function PeriodTracker() {
  const [lmpDate, setLmpDate] = useState('')
  const [cycleLength, setCycleLength] = useState('28')
  const [periodDuration, setPeriodDuration] = useState('5')
  const [result, setResult] = useState<{
    nextPeriod: string; ovulationDate: string; fertileStart: string; fertileEnd: string;
    nextPeriodEnd: string; daysUntil: number; cycleDay: number
  } | null>(null)

  const calculatePeriod = (e: React.FormEvent) => {
    e.preventDefault()
    if (!lmpDate) return

    const date = parseISO(lmpDate)
    if (!isValid(date)) return

    const cycle = parseInt(cycleLength) || 28
    const duration = parseInt(periodDuration) || 5

    const nextPeriodDate = addDays(date, cycle)
    const nextPeriodEnd = addDays(nextPeriodDate, duration - 1)
    const ovulationDate = subDays(nextPeriodDate, 14)
    const fertileStart = subDays(ovulationDate, 4)
    const fertileEnd = addDays(ovulationDate, 1)

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const daysUntil = Math.max(0, differenceInDays(nextPeriodDate, today))
    const cycleDay = Math.max(1, differenceInDays(today, date) + 1)

    setResult({
      nextPeriod: format(nextPeriodDate, 'dd MMMM, yyyy'),
      nextPeriodEnd: format(nextPeriodEnd, 'dd MMMM'),
      ovulationDate: format(ovulationDate, 'dd MMMM'),
      fertileStart: format(fertileStart, 'dd MMM'),
      fertileEnd: format(fertileEnd, 'dd MMM'),
      daysUntil,
      cycleDay: Math.min(cycleDay, cycle),
    })
  }

  const reset = () => {
    setLmpDate('')
    setCycleLength('28')
    setPeriodDuration('5')
    setResult(null)
  }

  return (
    <div className="max-w-lg w-full mx-auto">
      <div className="bg-gradient-to-br from-rose-400 via-pink-500 to-fuchsia-500 rounded-t-2xl p-6 text-white text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-2 right-10 text-5xl">🌸</div>
          <div className="absolute bottom-2 left-8 text-4xl">🌷</div>
        </div>
        <div className="relative">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm mb-3">
            <span className="text-4xl">🌸</span>
          </div>
          <h2 className="text-2xl font-bold">Period & Ovulation Tracker</h2>
          <p className="text-rose-100 text-sm mt-1">আপনার সাইকেল সম্পর্কে বিস্তারিত জানুন</p>
        </div>
      </div>

      <div className="bg-white rounded-b-2xl shadow-xl border border-gray-100 p-6">
        <form onSubmit={calculatePeriod} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">শেষ পিরিয়ড শুরুর তারিখ</label>
            <input
              type="date" value={lmpDate} onChange={(e) => setLmpDate(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none transition font-semibold text-gray-800 bg-gray-50"
              required max={format(new Date(), 'yyyy-MM-dd')}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">সাইকেলের দৈর্ঘ্য</label>
              <div className="relative">
                <input
                  type="number" value={cycleLength} onChange={(e) => setCycleLength(e.target.value)}
                  className="w-full px-3 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none text-center bg-gray-50 font-bold"
                  required min="20" max="45"
                />
                <span className="absolute right-2 bottom-1 text-[9px] text-gray-400 font-semibold">দিন</span>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">পিরিয়ডের দৈর্ঘ্য</label>
              <div className="relative">
                <input
                  type="number" value={periodDuration} onChange={(e) => setPeriodDuration(e.target.value)}
                  className="w-full px-3 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none text-center bg-gray-50 font-bold"
                  required min="2" max="10"
                />
                <span className="absolute right-2 bottom-1 text-[9px] text-gray-400 font-semibold">দিন</span>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button type="submit" className="flex-1 bg-gradient-to-r from-rose-500 to-pink-500 text-white py-3.5 rounded-xl font-semibold hover:from-rose-600 hover:to-pink-600 transition-all active:scale-[0.98] shadow-lg shadow-rose-200/50">
              হিসাব করুন
            </button>
            <button type="button" onClick={reset} className="px-5 py-3.5 bg-gray-100 text-gray-600 rounded-xl font-medium hover:bg-gray-200 transition active:scale-[0.98]">
              রিসেট
            </button>
          </div>
        </form>

        {result !== null && (
          <div className="mt-6 animate-in fade-in slide-in-from-bottom-3 duration-500 space-y-3">
            {/* Cycle Day */}
            <div className="bg-rose-50 p-4 rounded-2xl border border-rose-100 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-rose-400 uppercase">আজকে আপনি সাইকেলের</p>
                <p className="text-2xl font-extrabold text-rose-600">দিন {result.cycleDay} <span className="text-sm font-medium">/ {cycleLength}</span></p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-rose-400 uppercase">পরবর্তী পিরিয়ড</p>
                <p className="text-lg font-bold text-rose-600">{result.daysUntil} দিন পর</p>
              </div>
            </div>

            {/* Next Period */}
            <div className="bg-pink-50 p-4 rounded-xl border border-pink-100 text-center">
              <p className="text-[10px] font-bold text-pink-400 uppercase tracking-wide">পরবর্তী পিরিয়ড</p>
              <p className="text-xl font-extrabold text-pink-600 mt-0.5">{result.nextPeriod}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">{result.nextPeriodEnd} পর্যন্ত চলতে পারে</p>
            </div>

            {/* Ovulation & Fertile */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 text-center">
                <span className="text-xl">🥚</span>
                <p className="text-[10px] font-bold text-indigo-400 uppercase mt-1">ওভুলেশন</p>
                <p className="text-sm font-bold text-indigo-700 mt-0.5">{result.ovulationDate}</p>
              </div>
              <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 text-center">
                <span className="text-xl">🌱</span>
                <p className="text-[10px] font-bold text-emerald-400 uppercase mt-1">ফার্টাইল উইন্ডো</p>
                <p className="text-sm font-bold text-emerald-700 mt-0.5">{result.fertileStart} – {result.fertileEnd}</p>
              </div>
            </div>

            {/* Visual Cycle Phases */}
            <div className="bg-gray-50 rounded-xl border border-gray-100 p-4">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">📅 সাইকেল ফেজ</p>
              <div className="flex rounded-lg overflow-hidden h-6 text-[8px] font-bold text-white">
                <div className="bg-rose-400 flex items-center justify-center" style={{ width: '15%' }}>পিরিয়ড</div>
                <div className="bg-amber-300 flex items-center justify-center text-amber-800" style={{ width: '25%' }}>ফলিকুলার</div>
                <div className="bg-emerald-400 flex items-center justify-center" style={{ width: '15%' }}>ফার্টাইল</div>
                <div className="bg-indigo-400 flex items-center justify-center" style={{ width: '5%' }}>🥚</div>
                <div className="bg-purple-300 flex items-center justify-center text-purple-800" style={{ width: '40%' }}>লুটিয়াল</div>
              </div>
            </div>

            <p className="text-[11px] text-gray-400 text-center leading-relaxed">
              ⚕️ এটি আনুমানিক হিসাব। অনিয়মিত পিরিয়ডের ক্ষেত্রে ডাক্তারের পরামর্শ নিন।
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
