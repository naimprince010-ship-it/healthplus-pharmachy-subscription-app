'use client'

import { useState } from 'react'

export function CalorieCalculator() {
  const [gender, setGender] = useState<'male' | 'female'>('male')
  const [age, setAge] = useState('')
  const [weight, setWeight] = useState('')
  const [height, setHeight] = useState('')
  const [activity, setActivity] = useState('1.2') // Sedentary by default
  const [result, setResult] = useState<{ maintain: number; lose: number; gain: number } | null>(null)

  const calculateCalories = (e: React.FormEvent) => {
    e.preventDefault()
    if (!age || !weight || !height) return

    const w = parseFloat(weight)
    const h = parseFloat(height)
    const a = parseFloat(age)

    if (w <= 0 || h <= 0 || a <= 0) return

    // Mifflin-St Jeor Equation
    let bmr = 10 * w + 6.25 * h - 5 * a
    if (gender === 'male') {
      bmr += 5
    } else {
      bmr -= 161
    }

    const tdee = bmr * parseFloat(activity)

    setResult({
      maintain: Math.round(tdee),
      lose: Math.round(tdee - 500),
      gain: Math.round(tdee + 500),
    })
  }

  const reset = () => {
    setGender('male')
    setAge('')
    setWeight('')
    setHeight('')
    setActivity('1.2')
    setResult(null)
  }

  return (
    <div className="max-w-lg w-full mx-auto">
      <div className="bg-gradient-to-br from-orange-400 to-red-500 rounded-t-2xl p-6 text-white text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm mb-3">
          <span className="text-3xl">🔥</span>
        </div>
        <h2 className="text-2xl font-bold">Daily Calorie Calculator</h2>
        <p className="text-orange-100 text-sm mt-1">আপনার দৈনিক কত ক্যালরি প্রয়োজন?</p>
      </div>

      <div className="bg-white rounded-b-2xl shadow-xl border border-gray-100 p-6">
        <form onSubmit={calculateCalories} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">লিঙ্গ</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setGender('male')}
                className={`flex-1 py-2.5 rounded-xl border text-sm font-medium transition-all ${gender === 'male' ? 'bg-orange-50 border-orange-300 text-orange-700' : 'bg-gray-50 border-gray-200 text-gray-600'}`}
              >
                পুরুষ
              </button>
              <button
                type="button"
                onClick={() => setGender('female')}
                className={`flex-1 py-2.5 rounded-xl border text-sm font-medium transition-all ${gender === 'female' ? 'bg-orange-50 border-orange-300 text-orange-700' : 'bg-gray-50 border-gray-200 text-gray-600'}`}
              >
                মহিলা
              </button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">বয়স</label>
              <input
                type="number" value={age} onChange={(e) => setAge(e.target.value)}
                placeholder="25"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-center bg-gray-50 font-semibold" required min="1"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">ওজন (kg)</label>
              <input
                type="number" value={weight} onChange={(e) => setWeight(e.target.value)}
                placeholder="70"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-center bg-gray-50 font-semibold" required min="1"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">উচ্চতা (cm)</label>
              <input
                type="number" value={height} onChange={(e) => setHeight(e.target.value)}
                placeholder="170"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-center bg-gray-50 font-semibold" required min="1"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">কাজের ধরন</label>
            <select
              value={activity}
              onChange={(e) => setActivity(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none bg-gray-50 text-sm font-medium"
            >
              <option value="1.2">বসে কাজ করা (ব্যায়াম নেই)</option>
              <option value="1.375">হালকা কাজ (হালকা ব্যায়াম/খেলাধুলা)</option>
              <option value="1.55">মাঝারি কাজ (নিয়মিত ব্যায়াম)</option>
              <option value="1.725">পরিশ্রমী (কঠোর ব্যায়াম)</option>
              <option value="1.9">খুব পরিশ্রমী (খুব কঠোর ব্যায়াম বা কায়িক শ্রম)</option>
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 rounded-xl font-semibold hover:from-orange-600 hover:to-red-600 transition-all active:scale-[0.98] shadow-md shadow-orange-200"
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

        {result && (
          <div className="mt-6 animate-in fade-in slide-in-from-bottom-3 space-y-3">
            <div className="p-4 bg-orange-50 rounded-xl border border-orange-200 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-orange-600 uppercase">ওজন ধরে রাখতে</p>
                <p className="text-2xl font-extrabold text-orange-700">{result.maintain} <span className="text-sm font-medium">kcal/day</span></p>
              </div>
              <span className="text-2xl">⚖️</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 text-center">
                <p className="text-[10px] font-bold text-emerald-600 uppercase mb-1">ওজন কমাতে</p>
                <p className="text-xl font-extrabold text-emerald-700">{result.lose}</p>
              </div>
              <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 text-center">
                <p className="text-[10px] font-bold text-blue-600 uppercase mb-1">ওজন বাড়াতে</p>
                <p className="text-xl font-extrabold text-blue-700">{result.gain}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
