'use client'

import { useState, useMemo } from 'react'

const BMI_RANGES = [
  { label: 'Underweight', labelBn: 'ওজন কম', min: 0, max: 18.5, color: '#3b82f6', bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700' },
  { label: 'Normal', labelBn: 'স্বাভাবিক', min: 18.5, max: 24.9, color: '#10b981', bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700' },
  { label: 'Overweight', labelBn: 'ওজন বেশি', min: 25, max: 29.9, color: '#f59e0b', bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700' },
  { label: 'Obese', labelBn: 'স্থূলতা', min: 30, max: 50, color: '#ef4444', bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700' },
]

function BmiGauge({ value }: { value: number }) {
  // Map BMI 10-45 to 0-100%
  const percent = Math.max(0, Math.min(100, ((value - 10) / 35) * 100))
  const activeRange = BMI_RANGES.find(r => value >= r.min && value < r.max + 0.1) || BMI_RANGES[3]

  return (
    <div className="relative mt-6 mb-2">
      {/* Gauge bar */}
      <div className="flex h-3 rounded-full overflow-hidden gap-0.5">
        {BMI_RANGES.map((range) => (
          <div key={range.label} className="flex-1 rounded-full" style={{ backgroundColor: range.color, opacity: 0.25 }} />
        ))}
      </div>
      {/* Needle */}
      <div
        className="absolute top-1/2 -translate-y-1/2 transition-all duration-700 ease-out"
        style={{ left: `${percent}%` }}
      >
        <div className="relative">
          <div className="w-5 h-5 rounded-full border-[3px] border-white shadow-lg -ml-2.5 -mt-1" style={{ backgroundColor: activeRange.color }} />
        </div>
      </div>
      {/* Labels under bar */}
      <div className="flex mt-2 text-[10px] text-gray-400 font-medium">
        {BMI_RANGES.map((range) => (
          <div key={range.label} className="flex-1 text-center">{range.label}</div>
        ))}
      </div>
    </div>
  )
}

export function BmiCalculator() {
  const [weight, setWeight] = useState('')
  const [height, setHeight] = useState('')
  const [bmi, setBmi] = useState<number | null>(null)
  const [category, setCategory] = useState<typeof BMI_RANGES[0] | null>(null)

  const calculateBmi = (e: React.FormEvent) => {
    e.preventDefault()
    if (!weight || !height) return

    const weightNum = parseFloat(weight)
    const heightNum = parseFloat(height) / 100

    if (weightNum > 0 && heightNum > 0) {
      const calculatedBmi = weightNum / (heightNum * heightNum)
      const bmiVal = parseFloat(calculatedBmi.toFixed(1))
      setBmi(bmiVal)
      setCategory(BMI_RANGES.find(r => bmiVal >= r.min && bmiVal < r.max + 0.1) || BMI_RANGES[3])
    }
  }

  const reset = () => {
    setWeight('')
    setHeight('')
    setBmi(null)
    setCategory(null)
  }

  const idealWeightRange = useMemo(() => {
    if (!height) return null
    const h = parseFloat(height) / 100
    if (h <= 0) return null
    return { min: (18.5 * h * h).toFixed(1), max: (24.9 * h * h).toFixed(1) }
  }, [height])

  return (
    <div className="max-w-lg w-full mx-auto">
      {/* Header with gradient */}
      <div className="bg-gradient-to-br from-teal-500 to-emerald-600 rounded-t-2xl p-6 text-white text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm mb-3">
          <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold">BMI Calculator</h2>
        <p className="text-teal-100 text-sm mt-1">আপনার বডি মাস ইনডেক্স জানুন</p>
      </div>

      {/* Form Card */}
      <div className="bg-white rounded-b-2xl shadow-xl border border-gray-100 p-6">
        <form onSubmit={calculateBmi} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                ওজন (কেজি)
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="70"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition text-lg font-semibold text-gray-800 bg-gray-50"
                  required min="1" step="0.1"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">kg</span>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                উচ্চতা (সেমি)
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  placeholder="170"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition text-lg font-semibold text-gray-800 bg-gray-50"
                  required min="1" step="0.1"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">cm</span>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              className="flex-1 bg-gradient-to-r from-teal-500 to-emerald-500 text-white py-3 rounded-xl font-semibold hover:from-teal-600 hover:to-emerald-600 transition-all active:scale-[0.98] shadow-md shadow-teal-200"
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
        {bmi !== null && category && (
          <div className="mt-6 animate-in fade-in slide-in-from-bottom-3 duration-500">
            <div className={`p-5 rounded-2xl border ${category.bg} ${category.border}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-500">আপনার BMI</span>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${category.bg} ${category.text} ${category.border} border`}>
                  {category.label} • {category.labelBn}
                </span>
              </div>
              <p className="text-5xl font-extrabold tracking-tight" style={{ color: category.color }}>{bmi}</p>
              
              <BmiGauge value={bmi} />

              {idealWeightRange && (
                <div className="mt-4 p-3 bg-white rounded-xl border border-gray-100 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">আপনার আদর্শ ওজন</p>
                    <p className="text-sm font-bold text-gray-800">{idealWeightRange.min} – {idealWeightRange.max} kg</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
