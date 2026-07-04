'use client'

import { useState } from 'react'
import { differenceInDays, isValid, parseISO, format } from 'date-fns'

const HEALTH_MILESTONES = [
  { days: 0, icon: '💓', title: '২০ মিনিট', desc: 'হার্ট রেট ও রক্তচাপ স্বাভাবিক হচ্ছে' },
  { days: 1, icon: '🫁', title: '১ দিন', desc: 'রক্তে অক্সিজেনের মাত্রা স্বাভাবিক' },
  { days: 2, icon: '👃', title: '২ দিন', desc: 'স্বাদ ও গন্ধ নেওয়ার ক্ষমতা বাড়ছে' },
  { days: 14, icon: '🩸', title: '২ সপ্তাহ', desc: 'রক্ত সঞ্চালন উন্নত হচ্ছে' },
  { days: 30, icon: '🌬️', title: '১ মাস', desc: 'ফুসফুসের কার্যক্ষমতা বাড়ছে' },
  { days: 90, icon: '💪', title: '৩ মাস', desc: 'শারীরিক সক্ষমতা অনেক বেড়ে গেছে' },
  { days: 365, icon: '❤️', title: '১ বছর', desc: 'হৃদরোগের ঝুঁকি অর্ধেক কমে গেছে' },
]

export function SmokingCalculator() {
  const [quitDate, setQuitDate] = useState('')
  const [cigarettesPerDay, setCigarettesPerDay] = useState('')
  const [pricePerPack, setPricePerPack] = useState('')
  const [result, setResult] = useState<{
    daysSmokeFree: number; moneySaved: number; cigarettesAvoided: number; lifeRegained: number
  } | null>(null)

  const calculateBenefits = (e: React.FormEvent) => {
    e.preventDefault()
    if (!quitDate || !cigarettesPerDay || !pricePerPack) return

    const date = parseISO(quitDate)
    if (!isValid(date)) return

    const today = new Date()
    if (date > today) return

    const daysSmokeFree = differenceInDays(today, date)
    const perDay = parseFloat(cigarettesPerDay)
    const packPrice = parseFloat(pricePerPack)
    if (perDay <= 0 || packPrice <= 0) return

    const cigarettesAvoided = Math.floor(daysSmokeFree * perDay)
    const moneySaved = Math.floor(cigarettesAvoided * (packPrice / 20))
    const lifeRegained = Math.round(cigarettesAvoided * 11) // ~11 mins per cigarette

    setResult({ daysSmokeFree, moneySaved, cigarettesAvoided, lifeRegained })
  }

  const reset = () => {
    setQuitDate('')
    setCigarettesPerDay('')
    setPricePerPack('')
    setResult(null)
  }

  const formatMins = (mins: number) => {
    if (mins < 60) return `${mins} মিনিট`
    if (mins < 1440) return `${Math.round(mins / 60)} ঘণ্টা`
    return `${Math.round(mins / 1440)} দিন`
  }

  return (
    <div className="max-w-lg w-full mx-auto">
      <div className="bg-gradient-to-br from-emerald-600 via-green-500 to-teal-500 rounded-t-2xl p-6 text-white text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-3 right-8 text-5xl">🌿</div>
          <div className="absolute bottom-2 left-6 text-4xl">💚</div>
        </div>
        <div className="relative">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm mb-3">
            <span className="text-4xl">🚭</span>
          </div>
          <h2 className="text-2xl font-bold">Quit Smoking Calculator</h2>
          <p className="text-emerald-100 text-sm mt-1">ধূমপান ছাড়ুন, সুস্থ থাকুন, টাকা বাঁচান</p>
        </div>
      </div>

      <div className="bg-white rounded-b-2xl shadow-xl border border-gray-100 p-6">
        <form onSubmit={calculateBenefits} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">কবে থেকে ধূমপান ছেড়েছেন?</label>
            <input
              type="date" value={quitDate} onChange={(e) => setQuitDate(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition font-semibold text-gray-800 bg-gray-50"
              required max={format(new Date(), 'yyyy-MM-dd')}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-semibold text-gray-500 uppercase mb-1.5">🚬 প্রতিদিন কয়টি খেতেন?</label>
              <input
                type="number" value={cigarettesPerDay} onChange={(e) => setCigarettesPerDay(e.target.value)}
                placeholder="10"
                className="w-full px-3 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-center bg-gray-50 font-bold text-lg" required min="1"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-gray-500 uppercase mb-1.5">💰 ১ প্যাকেটের দাম (৳)</label>
              <input
                type="number" value={pricePerPack} onChange={(e) => setPricePerPack(e.target.value)}
                placeholder="300"
                className="w-full px-3 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-center bg-gray-50 font-bold text-lg" required min="1"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <button type="submit" className="flex-1 bg-gradient-to-r from-emerald-500 to-green-500 text-white py-3.5 rounded-xl font-semibold hover:from-emerald-600 hover:to-green-600 transition-all active:scale-[0.98] shadow-lg shadow-emerald-200/50">
              হিসাব করুন
            </button>
            <button type="button" onClick={reset} className="px-5 py-3.5 bg-gray-100 text-gray-600 rounded-xl font-medium hover:bg-gray-200 transition active:scale-[0.98]">
              রিসেট
            </button>
          </div>
        </form>

        {result !== null && (
          <div className="mt-6 animate-in fade-in slide-in-from-bottom-3 duration-500 space-y-3">
            {/* Money Saved - Hero */}
            <div className="bg-gradient-to-br from-emerald-50 to-green-50 p-5 rounded-2xl border border-emerald-100 text-center">
              <p className="text-xs font-bold text-emerald-500 uppercase tracking-wide">মোট জমানো টাকা</p>
              <p className="text-5xl font-extrabold text-emerald-600 tracking-tight mt-1">৳ {result.moneySaved.toLocaleString()}</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 text-center">
                <p className="text-xl font-extrabold text-gray-800">{result.daysSmokeFree}</p>
                <p className="text-[9px] font-semibold text-gray-400 uppercase">দিন ছাড়া</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 text-center">
                <p className="text-xl font-extrabold text-gray-800">{result.cigarettesAvoided.toLocaleString()}</p>
                <p className="text-[9px] font-semibold text-gray-400 uppercase">সিগারেট বাদ</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 text-center">
                <p className="text-xl font-extrabold text-gray-800">{formatMins(result.lifeRegained)}</p>
                <p className="text-[9px] font-semibold text-gray-400 uppercase">জীবন ফিরেছে</p>
              </div>
            </div>

            {/* Health Milestones */}
            <div className="bg-gray-50 rounded-xl border border-gray-100 p-4">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">🏥 স্বাস্থ্যের মাইলস্টোন</p>
              <div className="space-y-2">
                {HEALTH_MILESTONES.map((m) => {
                  const achieved = result.daysSmokeFree >= m.days
                  return (
                    <div key={m.days} className={`flex items-center gap-3 p-2 rounded-lg transition-all ${achieved ? 'bg-white' : 'opacity-40'}`}>
                      <span className="text-lg">{achieved ? m.icon : '⬜'}</span>
                      <div className="flex-1">
                        <p className={`text-xs font-bold ${achieved ? 'text-gray-800' : 'text-gray-500'}`}>{m.title}</p>
                        <p className="text-[10px] text-gray-400">{m.desc}</p>
                      </div>
                      {achieved && (
                        <span className="text-emerald-500 text-xs font-bold">✓</span>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            <p className="text-[11px] text-gray-400 text-center leading-relaxed">
              💚 প্রতিটি সিগারেট জীবন থেকে প্রায় ১১ মিনিট কেড়ে নেয়। আপনি দারুণ করছেন!
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
