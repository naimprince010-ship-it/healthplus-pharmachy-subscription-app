'use client'

import { useState } from 'react'
import { differenceInDays, differenceInMonths, differenceInYears, isValid, parseISO } from 'date-fns'

export function SmokingCalculator() {
  const [quitDate, setQuitDate] = useState('')
  const [cigarettesPerDay, setCigarettesPerDay] = useState('')
  const [pricePerPack, setPricePerPack] = useState('')
  const [cigarettesInPack, setCigarettesInPack] = useState('20')
  const [result, setResult] = useState<{
    daysSmokeFree: number;
    moneySaved: number;
    cigarettesAvoided: number;
  } | null>(null)

  const calculateBenefits = (e: React.FormEvent) => {
    e.preventDefault()
    if (!quitDate || !cigarettesPerDay || !pricePerPack) return

    const date = parseISO(quitDate)
    if (!isValid(date)) return

    const today = new Date()
    // if quit date is in the future, return 0
    if (date > today) {
      setResult({ daysSmokeFree: 0, moneySaved: 0, cigarettesAvoided: 0 })
      return
    }

    const daysSmokeFree = differenceInDays(today, date)
    const perDayCount = parseFloat(cigarettesPerDay)
    const packPrice = parseFloat(pricePerPack)
    const packSize = parseFloat(cigarettesInPack) || 20

    if (perDayCount <= 0 || packPrice <= 0) return

    const cigarettesAvoided = Math.floor(daysSmokeFree * perDayCount)
    const pricePerCigarette = packPrice / packSize
    const moneySaved = Math.floor(cigarettesAvoided * pricePerCigarette)

    setResult({
      daysSmokeFree,
      moneySaved,
      cigarettesAvoided,
    })
  }

  const reset = () => {
    setQuitDate('')
    setCigarettesPerDay('')
    setPricePerPack('')
    setResult(null)
  }

  return (
    <div className="max-w-lg w-full mx-auto">
      <div className="bg-gradient-to-br from-slate-600 to-gray-800 rounded-t-2xl p-6 text-white text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm mb-3">
          <span className="text-3xl">🚭</span>
        </div>
        <h2 className="text-2xl font-bold">Quit Smoking Calculator</h2>
        <p className="text-gray-300 text-sm mt-1">ধূমপান ছাড়ার সুফল ও জমানো টাকার হিসাব</p>
      </div>

      <div className="bg-white rounded-b-2xl shadow-xl border border-gray-100 p-6">
        <form onSubmit={calculateBenefits} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              কবে থেকে ধূমপান ছেড়েছেন?
            </label>
            <input
              type="date"
              value={quitDate}
              onChange={(e) => setQuitDate(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-slate-500 outline-none transition font-semibold text-gray-800 bg-gray-50"
              required
              max={format(new Date(), 'yyyy-MM-dd')}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-semibold text-gray-500 uppercase mb-1.5">প্রতিদিন কয়টি খেতেন?</label>
              <input
                type="number" value={cigarettesPerDay} onChange={(e) => setCigarettesPerDay(e.target.value)}
                placeholder="10" className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-slate-500 outline-none text-center bg-gray-50 font-semibold" required min="1"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-gray-500 uppercase mb-1.5">১ প্যাকেটের দাম (৳)</label>
              <input
                type="number" value={pricePerPack} onChange={(e) => setPricePerPack(e.target.value)}
                placeholder="300" className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-slate-500 outline-none text-center bg-gray-50 font-semibold" required min="1"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              className="flex-1 bg-gradient-to-r from-slate-600 to-gray-700 text-white py-3 rounded-xl font-semibold hover:from-slate-700 hover:to-gray-800 transition-all active:scale-[0.98] shadow-md"
            >
              হিসাব করুন
            </button>
            <button
              type="button" onClick={reset}
              className="px-5 py-3 bg-gray-100 text-gray-600 rounded-xl font-medium hover:bg-gray-200 transition active:scale-[0.98]"
            >
              রিসেট
            </button>
          </div>
        </form>

        {result !== null && (
          <div className="mt-6 animate-in fade-in slide-in-from-bottom-3 space-y-3">
            <div className="bg-emerald-50 p-5 rounded-2xl border border-emerald-100 text-center">
              <p className="text-xs font-bold text-emerald-600 uppercase mb-1">মোট জমানো টাকা</p>
              <p className="text-4xl font-extrabold text-emerald-700 tracking-tight">৳ {result.moneySaved.toLocaleString()}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center">
                <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">ধূমপান ছাড়া আছেন</p>
                <p className="text-xl font-bold text-slate-800">{result.daysSmokeFree} দিন</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center">
                <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">সিগারেট খাওয়া হয়নি</p>
                <p className="text-xl font-bold text-slate-800">{result.cigarettesAvoided.toLocaleString()} টি</p>
              </div>
            </div>

            {/* Health milestones */}
            {result.daysSmokeFree > 0 && (
              <div className="mt-4 p-4 border border-gray-100 rounded-xl">
                <p className="text-xs font-bold text-gray-500 mb-3">স্বাস্থ্যের উন্নতি:</p>
                <ul className="space-y-2 text-xs text-gray-600">
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✅</span> রক্তচাপ ও হার্ট রেট স্বাভাবিক হয়েছে
                  </li>
                  {result.daysSmokeFree >= 1 && <li className="flex items-center gap-2"><span className="text-green-500">✅</span> রক্তে অক্সিজেনের মাত্রা স্বাভাবিক হয়েছে</li>}
                  {result.daysSmokeFree >= 2 && <li className="flex items-center gap-2"><span className="text-green-500">✅</span> স্বাদ ও গন্ধ নেওয়ার ক্ষমতা বাড়তে শুরু করেছে</li>}
                  {result.daysSmokeFree >= 30 && <li className="flex items-center gap-2"><span className="text-green-500">✅</span> ফুসফুসের কার্যক্ষমতা বাড়তে শুরু করেছে</li>}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
