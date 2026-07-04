'use client'

import { useState } from 'react'

export function WaterCalculator() {
  const [weight, setWeight] = useState('')
  const [activity, setActivity] = useState<'low' | 'moderate' | 'high'>('low')
  const [weather, setWeather] = useState<'normal' | 'hot'>('normal')
  const [result, setResult] = useState<{ liters: number; glasses: number; ml: number } | null>(null)

  const activityOptions = [
    { value: 'low' as const, label: 'হালকা', desc: 'ডেস্ক জব / বসে কাজ', icon: '🪑' },
    { value: 'moderate' as const, label: 'মাঝারি', desc: 'হাঁটাচলা / হালকা ব্যায়াম', icon: '🚶' },
    { value: 'high' as const, label: 'পরিশ্রমী', desc: 'ব্যায়াম / কায়িক শ্রম', icon: '🏋️' },
  ]

  const calculateWater = (e: React.FormEvent) => {
    e.preventDefault()
    if (!weight) return

    const weightKg = parseFloat(weight)
    if (weightKg <= 0) return

    let ml = weightKg * 35
    if (activity === 'moderate') ml += 500
    else if (activity === 'high') ml += 1000
    if (weather === 'hot') ml += 500

    const liters = ml / 1000
    const glasses = Math.ceil(ml / 250)

    setResult({
      liters: parseFloat(liters.toFixed(1)),
      glasses,
      ml: Math.round(ml),
    })
  }

  const reset = () => {
    setWeight('')
    setActivity('low')
    setWeather('normal')
    setResult(null)
  }

  // Visual: water fill percentage (max ~5L)
  const fillPercent = result ? Math.min(100, (result.liters / 5) * 100) : 0

  return (
    <div className="max-w-lg w-full mx-auto">
      <div className="bg-gradient-to-br from-cyan-400 via-blue-500 to-indigo-500 rounded-t-2xl p-6 text-white text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-2 left-6 text-6xl">💧</div>
          <div className="absolute bottom-1 right-8 text-4xl">💧</div>
          <div className="absolute top-8 right-20 text-3xl">💧</div>
        </div>
        <div className="relative">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm mb-3">
            <span className="text-4xl">💧</span>
          </div>
          <h2 className="text-2xl font-bold">Water Intake Calculator</h2>
          <p className="text-cyan-100 text-sm mt-1">প্রতিদিন আপনার কতটুকু পানি পান করা উচিত?</p>
        </div>
      </div>

      <div className="bg-white rounded-b-2xl shadow-xl border border-gray-100 p-6">
        <form onSubmit={calculateWater} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">আপনার ওজন</label>
            <div className="relative">
              <input
                type="number" value={weight} onChange={(e) => setWeight(e.target.value)}
                placeholder="70"
                className="w-full px-4 py-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition text-xl font-bold text-gray-800 bg-gray-50 text-center"
                required min="1" step="0.1"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-semibold bg-gray-200 px-2 py-0.5 rounded-md">kg</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">দৈনন্দিন কাজের ধরন</label>
            <div className="space-y-2">
              {activityOptions.map(opt => (
                <button
                  key={opt.value} type="button"
                  onClick={() => setActivity(opt.value)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                    activity === opt.value
                      ? 'bg-cyan-50 border-cyan-300 shadow-sm'
                      : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  <span className="text-2xl">{opt.icon}</span>
                  <div>
                    <p className={`text-sm font-bold ${activity === opt.value ? 'text-cyan-700' : 'text-gray-700'}`}>{opt.label}</p>
                    <p className="text-[11px] text-gray-400">{opt.desc}</p>
                  </div>
                  {activity === opt.value && (
                    <svg className="w-5 h-5 text-cyan-500 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">আবহাওয়া</label>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => setWeather('normal')}
                className={`p-3 rounded-xl border text-center transition-all ${weather === 'normal' ? 'bg-cyan-50 border-cyan-300' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'}`}
              >
                <span className="text-xl">🌤️</span>
                <p className={`text-xs font-bold mt-1 ${weather === 'normal' ? 'text-cyan-700' : 'text-gray-600'}`}>স্বাভাবিক</p>
              </button>
              <button type="button" onClick={() => setWeather('hot')}
                className={`p-3 rounded-xl border text-center transition-all ${weather === 'hot' ? 'bg-cyan-50 border-cyan-300' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'}`}
              >
                <span className="text-xl">🔥</span>
                <p className={`text-xs font-bold mt-1 ${weather === 'hot' ? 'text-cyan-700' : 'text-gray-600'}`}>গরম আবহাওয়া</p>
              </button>
            </div>
          </div>

          <div className="flex gap-3">
            <button type="submit" className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 text-white py-3.5 rounded-xl font-semibold hover:from-cyan-600 hover:to-blue-700 transition-all active:scale-[0.98] shadow-lg shadow-cyan-200/50">
              হিসাব করুন
            </button>
            <button type="button" onClick={reset} className="px-5 py-3.5 bg-gray-100 text-gray-600 rounded-xl font-medium hover:bg-gray-200 transition active:scale-[0.98]">
              রিসেট
            </button>
          </div>
        </form>

        {result !== null && (
          <div className="mt-6 animate-in fade-in slide-in-from-bottom-3 duration-500">
            {/* Visual Water Bottle */}
            <div className="bg-gradient-to-b from-cyan-50 to-blue-50 rounded-2xl border border-cyan-100 p-6">
              <div className="flex items-center gap-6">
                {/* Mini Water Bottle Visual */}
                <div className="relative w-16 h-28 bg-gray-100 rounded-xl border-2 border-cyan-200 overflow-hidden flex-shrink-0">
                  <div
                    className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-blue-500 to-cyan-300 transition-all duration-1000 ease-out rounded-b-lg"
                    style={{ height: `${fillPercent}%` }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl">💧</span>
                  </div>
                </div>
                
                <div className="text-center flex-1">
                  <p className="text-xs font-semibold text-cyan-600 uppercase tracking-wide">আপনার দৈনিক পানির প্রয়োজন</p>
                  <p className="text-5xl font-extrabold text-blue-600 tracking-tight mt-1">{result.liters}</p>
                  <p className="text-lg font-bold text-blue-400">লিটার</p>
                  <p className="text-xs text-gray-400 mt-1">({result.ml} ml)</p>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="bg-white p-3 rounded-xl border border-cyan-100 text-center">
                  <span className="text-2xl">🥛</span>
                  <p className="text-2xl font-extrabold text-gray-800 mt-1">{result.glasses}</p>
                  <p className="text-[10px] font-semibold text-gray-400 uppercase">গ্লাস (২৫০ml)</p>
                </div>
                <div className="bg-white p-3 rounded-xl border border-cyan-100 text-center">
                  <span className="text-2xl">🍶</span>
                  <p className="text-2xl font-extrabold text-gray-800 mt-1">{Math.ceil(result.ml / 500)}</p>
                  <p className="text-[10px] font-semibold text-gray-400 uppercase">বোতল (৫০০ml)</p>
                </div>
              </div>
            </div>

            {/* Schedule suggestion */}
            <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
              <p className="text-xs font-bold text-gray-500 uppercase mb-2">💡 পানি পানের শিডিউল</p>
              <div className="grid grid-cols-4 gap-1.5 text-center text-[10px]">
                {['সকাল', 'দুপুর', 'বিকাল', 'রাত'].map((time, i) => (
                  <div key={time} className="bg-white p-2 rounded-lg border border-gray-100">
                    <p className="font-bold text-gray-700">{time}</p>
                    <p className="text-cyan-600 font-semibold">{Math.ceil(result.glasses / 4)} গ্লাস</p>
                  </div>
                ))}
              </div>
            </div>

            <p className="text-[11px] text-gray-400 mt-3 leading-relaxed text-center">
              ⚕️ গর্ভাবস্থা, অসুস্থতা বা অতিরিক্ত ঘামে পানির চাহিদা বাড়তে পারে।
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
