'use client'

import { useState } from 'react'

export function WaterCalculator() {
  const [weight, setWeight] = useState('')
  const [activity, setActivity] = useState<'low' | 'moderate' | 'high'>('low')
  const [result, setResult] = useState<{ liters: number; glasses: number } | null>(null)

  const calculateWater = (e: React.FormEvent) => {
    e.preventDefault()
    if (!weight) return

    const weightKg = parseFloat(weight)
    if (weightKg <= 0) return

    // Base: 35ml per kg of body weight
    let ml = weightKg * 35

    // Add for activity level
    if (activity === 'moderate') {
      ml += 400 // add ~400ml for moderate activity
    } else if (activity === 'high') {
      ml += 800 // add ~800ml for high activity
    }

    const liters = ml / 1000
    const glasses = Math.ceil(ml / 250) // Assuming 250ml per glass

    setResult({
      liters: parseFloat(liters.toFixed(1)),
      glasses,
    })
  }

  const reset = () => {
    setWeight('')
    setActivity('low')
    setResult(null)
  }

  return (
    <div className="max-w-lg w-full mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-br from-cyan-400 to-blue-500 rounded-t-2xl p-6 text-white text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm mb-3">
          <span className="text-3xl">💧</span>
        </div>
        <h2 className="text-2xl font-bold">Water Intake Calculator</h2>
        <p className="text-cyan-100 text-sm mt-1">প্রতিদিন আপনার কতটুকু পানি পান করা উচিত?</p>
      </div>

      {/* Form Card */}
      <div className="bg-white rounded-b-2xl shadow-xl border border-gray-100 p-6">
        <form onSubmit={calculateWater} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              আপনার ওজন (কেজি)
            </label>
            <div className="relative">
              <input
                type="number"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="70"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition text-lg font-semibold text-gray-800 bg-gray-50"
                required min="1" step="0.1"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">kg</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              দৈনন্দিন কাজের ধরন
            </label>
            <div className="grid grid-cols-3 gap-2 text-sm">
              <button
                type="button"
                onClick={() => setActivity('low')}
                className={`p-2 rounded-xl border font-medium transition-all ${
                  activity === 'low' ? 'bg-cyan-50 border-cyan-300 text-cyan-700 shadow-sm' : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                }`}
              >
                হালকা
              </button>
              <button
                type="button"
                onClick={() => setActivity('moderate')}
                className={`p-2 rounded-xl border font-medium transition-all ${
                  activity === 'moderate' ? 'bg-cyan-50 border-cyan-300 text-cyan-700 shadow-sm' : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                }`}
              >
                মাঝারি
              </button>
              <button
                type="button"
                onClick={() => setActivity('high')}
                className={`p-2 rounded-xl border font-medium transition-all ${
                  activity === 'high' ? 'bg-cyan-50 border-cyan-300 text-cyan-700 shadow-sm' : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                }`}
              >
                পরিশ্রমী
              </button>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-500 text-white py-3 rounded-xl font-semibold hover:from-cyan-600 hover:to-blue-600 transition-all active:scale-[0.98] shadow-md shadow-cyan-200"
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
          <div className="mt-6 animate-in fade-in slide-in-from-bottom-3 duration-500 text-center">
            <div className="p-5 rounded-2xl border bg-cyan-50 border-cyan-200">
              <p className="text-sm font-medium text-cyan-700 mb-2">আপনার দৈনিক পানির প্রয়োজন:</p>
              <p className="text-5xl font-extrabold text-blue-600 tracking-tight">{result.liters} <span className="text-2xl">লিটার</span></p>
              
              <div className="mt-6 p-4 bg-white rounded-xl border border-cyan-100 flex items-center justify-center gap-3">
                <span className="text-3xl">🥛</span>
                <p className="text-gray-700 font-medium">
                  বা প্রতিদিন প্রায় <strong className="text-xl text-blue-600">{result.glasses}</strong> গ্লাস পানি
                </p>
              </div>
            </div>
            
            <p className="text-[11px] text-gray-400 mt-4 leading-relaxed px-2">
              ⚕️ গর্ভাবস্থা, অসুস্থতা বা অতিরিক্ত গরমে পানির চাহিদা বাড়তে পারে।
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
