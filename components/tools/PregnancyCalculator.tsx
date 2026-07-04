'use client'

import { useState } from 'react'
import { addDays, format, differenceInWeeks, isValid, parseISO } from 'date-fns'

export function PregnancyCalculator() {
  const [lmpDate, setLmpDate] = useState('')
  const [result, setResult] = useState<{
    edd: string;
    weeks: number;
    trimester: number;
  } | null>(null)

  const calculatePregnancy = (e: React.FormEvent) => {
    e.preventDefault()
    if (!lmpDate) return

    const date = parseISO(lmpDate)
    if (!isValid(date)) return

    // Naegele's rule: Add 7 days, subtract 3 months, add 1 year (which is equivalent to adding 280 days)
    const estimatedDueDate = addDays(date, 280)
    
    // Calculate current weeks
    const today = new Date()
    const weeksPregnant = differenceInWeeks(today, date)
    
    let currentTrimester = 1
    if (weeksPregnant >= 13 && weeksPregnant <= 27) {
      currentTrimester = 2
    } else if (weeksPregnant >= 28) {
      currentTrimester = 3
    }

    setResult({
      edd: format(estimatedDueDate, 'MMMM d, yyyy'),
      weeks: Math.max(0, weeksPregnant),
      trimester: currentTrimester
    })
  }

  const reset = () => {
    setLmpDate('')
    setResult(null)
  }

  return (
    <div className="max-w-md w-full mx-auto bg-white rounded-xl shadow-md overflow-hidden p-6 border border-pink-100">
      <h2 className="text-2xl font-bold text-pink-600 mb-6 text-center">Pregnancy Due Date Calculator</h2>
      
      <form onSubmit={calculatePregnancy} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            First Day of Last Period (শেষ মাসিকের প্রথম দিন)
          </label>
          <input
            type="date"
            value={lmpDate}
            onChange={(e) => setLmpDate(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition"
            required
            max={format(new Date(), 'yyyy-MM-dd')}
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            className="flex-1 bg-pink-500 text-white py-2.5 rounded-lg font-medium hover:bg-pink-600 transition active:scale-[0.98]"
          >
            Calculate
          </button>
          <button
            type="button"
            onClick={reset}
            className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition active:scale-[0.98]"
          >
            Reset
          </button>
        </div>
      </form>

      {result !== null && (
        <div className="mt-8 p-5 bg-pink-50 rounded-xl border border-pink-100 text-center animate-in fade-in slide-in-from-bottom-2">
          <p className="text-sm text-pink-800 mb-1">Estimated Due Date (সম্ভাব্য প্রসবের তারিখ)</p>
          <p className="text-2xl font-extrabold text-pink-600 mb-4">{result.edd}</p>
          
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="bg-white p-3 rounded-lg shadow-sm">
              <p className="text-xs text-gray-500">Current Week</p>
              <p className="font-bold text-gray-800">{result.weeks} Weeks</p>
            </div>
            <div className="bg-white p-3 rounded-lg shadow-sm">
              <p className="text-xs text-gray-500">Trimester</p>
              <p className="font-bold text-gray-800">
                {result.trimester}{result.trimester === 1 ? 'st' : result.trimester === 2 ? 'nd' : 'rd'}
              </p>
            </div>
          </div>
          
          <p className="mt-4 text-xs text-gray-500 text-left bg-white p-3 rounded border border-gray-100">
            Note: This is an estimate based on a standard 28-day cycle. Only about 5% of babies are born exactly on their due date. Consult your doctor for an accurate assessment.
          </p>
        </div>
      )}
    </div>
  )
}
