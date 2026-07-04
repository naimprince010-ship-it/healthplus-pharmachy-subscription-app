'use client'

import { useState, useMemo } from 'react'
import { addDays, format, differenceInWeeks, differenceInDays, isValid, parseISO } from 'date-fns'

export function PregnancyCalculator() {
  const [lmpDate, setLmpDate] = useState('')
  const [result, setResult] = useState<{
    edd: string;
    weeks: number;
    days: number;
    trimester: number;
    progress: number;
    daysLeft: number;
  } | null>(null)

  const calculatePregnancy = (e: React.FormEvent) => {
    e.preventDefault()
    if (!lmpDate) return

    const date = parseISO(lmpDate)
    if (!isValid(date)) return

    const estimatedDueDate = addDays(date, 280)
    const today = new Date()
    const totalDaysPregnant = differenceInDays(today, date)
    const weeksPregnant = Math.floor(totalDaysPregnant / 7)
    const remainingDays = totalDaysPregnant % 7
    const daysLeft = Math.max(0, differenceInDays(estimatedDueDate, today))
    const progress = Math.min(100, Math.max(0, (totalDaysPregnant / 280) * 100))
    
    let currentTrimester = 1
    if (weeksPregnant >= 13 && weeksPregnant <= 27) {
      currentTrimester = 2
    } else if (weeksPregnant >= 28) {
      currentTrimester = 3
    }

    setResult({
      edd: format(estimatedDueDate, 'dd MMMM, yyyy'),
      weeks: Math.max(0, weeksPregnant),
      days: Math.max(0, remainingDays),
      trimester: currentTrimester,
      progress,
      daysLeft,
    })
  }

  const reset = () => {
    setLmpDate('')
    setResult(null)
  }

  const trimesterLabels = [
    { label: '১ম ত্রৈমাসিক', range: 'সপ্তাহ ১-১২', icon: '🌱' },
    { label: '২য় ত্রৈমাসিক', range: 'সপ্তাহ ১৩-২৭', icon: '🌿' },
    { label: '৩য় ত্রৈমাসিক', range: 'সপ্তাহ ২৮-৪০', icon: '🌳' },
  ]

  return (
    <div className="max-w-lg w-full mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-br from-pink-400 to-rose-500 rounded-t-2xl p-6 text-white text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm mb-3">
          <span className="text-3xl">👶</span>
        </div>
        <h2 className="text-2xl font-bold">Pregnancy Calculator</h2>
        <p className="text-pink-100 text-sm mt-1">সম্ভাব্য প্রসবের তারিখ জানুন</p>
      </div>

      {/* Form */}
      <div className="bg-white rounded-b-2xl shadow-xl border border-gray-100 p-6">
        <form onSubmit={calculatePregnancy} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              শেষ মাসিকের প্রথম দিন (LMP)
            </label>
            <input
              type="date"
              value={lmpDate}
              onChange={(e) => setLmpDate(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition text-lg font-semibold text-gray-800 bg-gray-50"
              required
              max={format(new Date(), 'yyyy-MM-dd')}
            />
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              className="flex-1 bg-gradient-to-r from-pink-400 to-rose-500 text-white py-3 rounded-xl font-semibold hover:from-pink-500 hover:to-rose-600 transition-all active:scale-[0.98] shadow-md shadow-pink-200"
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

        {/* Result */}
        {result !== null && (
          <div className="mt-6 animate-in fade-in slide-in-from-bottom-3 duration-500 space-y-4">
            {/* Due Date Card */}
            <div className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-2xl border border-pink-100 p-5 text-center">
              <p className="text-xs font-semibold text-pink-400 uppercase tracking-wide">সম্ভাব্য প্রসবের তারিখ</p>
              <p className="text-3xl font-extrabold text-rose-600 mt-1">{result.edd}</p>
              <p className="text-sm text-gray-500 mt-1">আর {result.daysLeft} দিন বাকি</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-gray-50 rounded-xl p-3 text-center border border-gray-100">
                <p className="text-2xl font-extrabold text-gray-800">{result.weeks}</p>
                <p className="text-[10px] font-semibold text-gray-400 uppercase">সপ্তাহ</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 text-center border border-gray-100">
                <p className="text-2xl font-extrabold text-gray-800">{result.days}</p>
                <p className="text-[10px] font-semibold text-gray-400 uppercase">দিন</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 text-center border border-gray-100">
                <p className="text-2xl font-extrabold text-gray-800">{result.trimester}</p>
                <p className="text-[10px] font-semibold text-gray-400 uppercase">ত্রৈমাসিক</p>
              </div>
            </div>

            {/* Progress Bar */}
            <div>
              <div className="flex justify-between text-xs text-gray-400 mb-1.5">
                <span>শুরু</span>
                <span>{result.progress.toFixed(0)}% সম্পন্ন</span>
                <span>৪০ সপ্তাহ</span>
              </div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-pink-400 to-rose-500 transition-all duration-700"
                  style={{ width: `${result.progress}%` }}
                />
              </div>
            </div>

            {/* Trimester Timeline */}
            <div className="flex gap-2">
              {trimesterLabels.map((t, i) => (
                <div
                  key={i}
                  className={`flex-1 p-2.5 rounded-xl border text-center transition-all ${
                    result.trimester === i + 1
                      ? 'bg-pink-50 border-pink-200 shadow-sm'
                      : 'bg-gray-50 border-gray-100 opacity-50'
                  }`}
                >
                  <span className="text-lg">{t.icon}</span>
                  <p className="text-[10px] font-bold text-gray-700 mt-0.5">{t.label}</p>
                  <p className="text-[9px] text-gray-400">{t.range}</p>
                </div>
              ))}
            </div>

            {/* Disclaimer */}
            <p className="text-[11px] text-gray-400 text-center leading-relaxed px-2">
              ⚕️ এটি একটি আনুমানিক হিসাব। সঠিক তথ্যের জন্য আপনার ডাক্তারের পরামর্শ নিন।
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
