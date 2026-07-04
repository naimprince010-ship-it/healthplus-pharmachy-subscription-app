'use client'

import { useState } from 'react'
import { addMinutes, format, parse } from 'date-fns'

export function SleepCalculator() {
  const [mode, setMode] = useState<'wake' | 'sleep'>('wake')
  const [timeInput, setTimeInput] = useState('07:00')
  const [results, setResults] = useState<{ time: string; cycles: number; hours: number }[]>([])

  const calculateSleep = (e: React.FormEvent) => {
    e.preventDefault()
    if (!timeInput) return

    const baseTime = parse(timeInput, 'HH:mm', new Date())
    const times = []

    for (let cycles = 6; cycles >= 3; cycles--) {
      const totalMins = (cycles * 90) + 15
      const resultTime = mode === 'wake'
        ? addMinutes(baseTime, -totalMins) // bedtime from wake time
        : addMinutes(baseTime, totalMins) // wake time from bedtime

      times.push({
        time: format(resultTime, 'hh:mm a'),
        cycles,
        hours: cycles * 1.5,
      })
    }

    setResults(times)
  }

  const reset = () => { setResults([]) }

  return (
    <div className="max-w-lg w-full mx-auto">
      <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-violet-700 rounded-t-2xl p-6 text-white text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-2 right-10 text-5xl">⭐</div>
          <div className="absolute bottom-3 left-8 text-3xl">✨</div>
          <div className="absolute top-6 left-20 text-2xl">🌟</div>
        </div>
        <div className="relative">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm mb-3">
            <span className="text-4xl">🌙</span>
          </div>
          <h2 className="text-2xl font-bold">Sleep Cycle Calculator</h2>
          <p className="text-indigo-200 text-sm mt-1">ঠিক সময়ে ঘুমান, সতেজ হয়ে উঠুন</p>
        </div>
      </div>

      <div className="bg-white rounded-b-2xl shadow-xl border border-gray-100 p-6">
        <form onSubmit={calculateSleep} className="space-y-5">
          {/* Mode Toggle */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">আপনি জানতে চান</label>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => { setMode('wake'); setResults([]) }}
                className={`flex flex-col items-center p-3 rounded-xl border transition-all ${
                  mode === 'wake' ? 'bg-indigo-50 border-indigo-300 shadow-sm' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                }`}
              >
                <span className="text-2xl">⏰</span>
                <p className={`text-xs font-bold mt-1 ${mode === 'wake' ? 'text-indigo-700' : 'text-gray-600'}`}>কখন ঘুমাবো?</p>
                <p className="text-[9px] text-gray-400">উঠার সময় দিন</p>
              </button>
              <button type="button" onClick={() => { setMode('sleep'); setResults([]) }}
                className={`flex flex-col items-center p-3 rounded-xl border transition-all ${
                  mode === 'sleep' ? 'bg-indigo-50 border-indigo-300 shadow-sm' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                }`}
              >
                <span className="text-2xl">🛏️</span>
                <p className={`text-xs font-bold mt-1 ${mode === 'sleep' ? 'text-indigo-700' : 'text-gray-600'}`}>কখন উঠবো?</p>
                <p className="text-[9px] text-gray-400">ঘুমানোর সময় দিন</p>
              </button>
            </div>
          </div>

          {/* Time Input */}
          <div className="text-center">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              {mode === 'wake' ? 'আপনি কখন উঠতে চান?' : 'আপনি কখন ঘুমাতে চান?'}
            </label>
            <input
              type="time" value={timeInput} onChange={(e) => setTimeInput(e.target.value)}
              className="w-full max-w-[200px] mx-auto block px-4 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition text-3xl font-bold text-gray-800 bg-gray-50 text-center"
              required
            />
          </div>

          <div className="flex gap-3 max-w-xs mx-auto">
            <button type="submit" className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-3.5 rounded-xl font-semibold hover:from-indigo-600 hover:to-purple-700 transition-all active:scale-[0.98] shadow-lg shadow-indigo-200/50">
              হিসাব করুন
            </button>
            {results.length > 0 && (
              <button type="button" onClick={reset} className="px-4 py-3.5 bg-gray-100 text-gray-600 rounded-xl font-medium hover:bg-gray-200 transition active:scale-[0.98]">
                রিসেট
              </button>
            )}
          </div>
        </form>

        {results.length > 0 && (
          <div className="mt-8 animate-in fade-in slide-in-from-bottom-3 duration-500">
            <p className="text-sm font-medium text-gray-500 text-center mb-4">
              {mode === 'wake' ? '🛏️ এই সময়গুলোতে ঘুমাতে যান:' : '⏰ এই সময়গুলোতে অ্যালার্ম দিন:'}
            </p>
            <div className="grid grid-cols-2 gap-3">
              {results.map((r) => {
                const isOptimal = r.cycles === 5
                const isGood = r.cycles === 6
                return (
                  <div key={r.time} className={`p-4 rounded-xl border text-center transition-all ${
                    isOptimal ? 'bg-indigo-50 border-indigo-200 shadow-md ring-2 ring-indigo-100' : isGood ? 'bg-purple-50 border-purple-100' : 'bg-gray-50 border-gray-100'
                  }`}>
                    <p className={`text-2xl font-extrabold ${isOptimal ? 'text-indigo-700' : isGood ? 'text-purple-700' : 'text-gray-700'}`}>{r.time}</p>
                    <p className="text-xs text-gray-500 mt-1">{r.cycles} সাইকেল • {r.hours} ঘণ্টা</p>
                    {isOptimal && <span className="inline-block mt-2 text-[10px] bg-indigo-200 text-indigo-800 px-2.5 py-0.5 rounded-full font-bold">⭐ সবচেয়ে ভালো</span>}
                    {isGood && !isOptimal && <span className="inline-block mt-2 text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-bold">ভালো</span>}
                  </div>
                )
              })}
            </div>

            <div className="mt-5 p-4 bg-indigo-50 rounded-xl text-xs text-indigo-700">
              <p>💡 <strong>টিপস:</strong> ঘুমের ৯০ মিনিটের সাইকেলের শেষে উঠলে আপনি সতেজ অনুভব করবেন। 
              এখানে ঘুমিয়ে পড়তে <strong>১৫ মিনিট</strong> সময় ধরা হয়েছে।</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
