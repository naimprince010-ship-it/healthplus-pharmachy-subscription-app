'use client'

import { useState } from 'react'
import { addMinutes, format, parse } from 'date-fns'

export function SleepCalculator() {
  const [wakeTime, setWakeTime] = useState('07:00')
  const [results, setResults] = useState<string[]>([])

  const calculateSleep = (e: React.FormEvent) => {
    e.preventDefault()
    if (!wakeTime) return

    // Convert input time string to a Date object (using today's date)
    const timeToWake = parse(wakeTime, 'HH:mm', new Date())

    // Calculate backward: 90 minute cycles + 15 mins falling asleep time
    // 6 cycles = 9 hours
    // 5 cycles = 7.5 hours
    // 4 cycles = 6 hours
    // 3 cycles = 4.5 hours
    
    const times = []
    for (let cycles = 6; cycles >= 3; cycles--) {
      // cycles * 90 mins + 15 mins to fall asleep
      const totalMinutesToSubtract = (cycles * 90) + 15
      const bedTime = addMinutes(timeToWake, -totalMinutesToSubtract)
      times.push(format(bedTime, 'hh:mm a'))
    }

    setResults(times)
  }

  const reset = () => {
    setResults([])
  }

  return (
    <div className="max-w-lg w-full mx-auto">
      <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-t-2xl p-6 text-white text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm mb-3">
          <span className="text-3xl">🌙</span>
        </div>
        <h2 className="text-2xl font-bold">Sleep Cycle Calculator</h2>
        <p className="text-indigo-100 text-sm mt-1">কখন ঘুমাতে যাওয়া উচিত?</p>
      </div>

      <div className="bg-white rounded-b-2xl shadow-xl border border-gray-100 p-6">
        <form onSubmit={calculateSleep} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 text-center">
              আপনি কখন ঘুম থেকে উঠতে চান?
            </label>
            <input
              type="time"
              value={wakeTime}
              onChange={(e) => setWakeTime(e.target.value)}
              className="w-full max-w-xs mx-auto block px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition text-2xl font-bold text-gray-800 bg-gray-50 text-center"
              required
            />
          </div>

          <div className="flex gap-3 max-w-xs mx-auto">
            <button
              type="submit"
              className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-3 rounded-xl font-semibold hover:from-indigo-600 hover:to-purple-700 transition-all active:scale-[0.98] shadow-md shadow-indigo-200"
            >
              হিসাব করুন
            </button>
            {results.length > 0 && (
              <button
                type="button"
                onClick={reset}
                className="px-4 py-3 bg-gray-100 text-gray-600 rounded-xl font-medium hover:bg-gray-200 transition active:scale-[0.98]"
              >
                রিসেট
              </button>
            )}
          </div>
        </form>

        {results.length > 0 && (
          <div className="mt-8 animate-in fade-in slide-in-from-bottom-3 text-center">
            <p className="text-sm font-medium text-gray-500 mb-4">
              ফ্রেশ হয়ে ওঠার জন্য আপনার এই সময়গুলোতে ঘুমানো উচিত:
            </p>
            <div className="grid grid-cols-2 gap-3">
              {results.map((time, idx) => {
                const cycles = 6 - idx;
                const hours = cycles * 1.5;
                const isOptimal = cycles === 5; // 7.5 hours is optimal for most
                
                return (
                  <div key={time} className={`p-4 rounded-xl border ${isOptimal ? 'bg-indigo-50 border-indigo-200 shadow-sm' : 'bg-gray-50 border-gray-100'}`}>
                    <p className={`text-xl font-bold ${isOptimal ? 'text-indigo-700' : 'text-gray-700'}`}>{time}</p>
                    <p className="text-xs text-gray-500 mt-1">{cycles} সাইকেল ({hours} ঘণ্টা)</p>
                    {isOptimal && <span className="inline-block mt-2 text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-semibold">Recommended</span>}
                  </div>
                )
              })}
            </div>
            
            <div className="mt-6 p-4 bg-purple-50 rounded-xl text-xs text-purple-700 text-left">
              <p>💡 <strong>Note:</strong></p>
              <p className="mt-1">
                মানুষ সাধারণত ৯০ মিনিটের স্লিপ সাইকেলে ঘুমায়। সাইকেলের মাঝখানে ঘুম ভাঙলে ক্লান্তি লাগে। এই হিসাবে বিছানায় যাওয়ার পর ঘুমিয়ে পড়তে <strong>১৫ মিনিট</strong> সময় ধরা হয়েছে।
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
