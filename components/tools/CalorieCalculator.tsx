'use client'

import { useState } from 'react'

const ACTIVITY_OPTIONS = [
  { value: '1.2', label: 'বসে কাজ', desc: 'ডেস্ক জব, ব্যায়াম নেই', icon: '🪑' },
  { value: '1.375', label: 'হালকা', desc: 'সপ্তাহে ১-৩ দিন হালকা ব্যায়াম', icon: '🚶' },
  { value: '1.55', label: 'মাঝারি', desc: 'সপ্তাহে ৩-৫ দিন ব্যায়াম', icon: '🏃' },
  { value: '1.725', label: 'পরিশ্রমী', desc: 'সপ্তাহে ৬-৭ দিন কঠোর ব্যায়াম', icon: '🏋️' },
  { value: '1.9', label: 'খুব পরিশ্রমী', desc: 'দিনে ২ বার ব্যায়াম / কায়িক শ্রম', icon: '⛏️' },
]

export function CalorieCalculator() {
  const [gender, setGender] = useState<'male' | 'female'>('male')
  const [age, setAge] = useState('')
  const [weight, setWeight] = useState('')
  const [height, setHeight] = useState('')
  const [activity, setActivity] = useState('1.2')
  const [result, setResult] = useState<{ bmr: number; maintain: number; lose: number; gain: number } | null>(null)

  const calculateCalories = (e: React.FormEvent) => {
    e.preventDefault()
    if (!age || !weight || !height) return

    const w = parseFloat(weight), h = parseFloat(height), a = parseFloat(age)
    if (w <= 0 || h <= 0 || a <= 0) return

    let bmr = 10 * w + 6.25 * h - 5 * a
    bmr += gender === 'male' ? 5 : -161

    const tdee = bmr * parseFloat(activity)

    setResult({
      bmr: Math.round(bmr),
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
      <div className="bg-gradient-to-br from-orange-400 via-red-500 to-pink-500 rounded-t-2xl p-6 text-white text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-3 left-8 text-5xl">🔥</div>
          <div className="absolute bottom-2 right-6 text-4xl">🍎</div>
        </div>
        <div className="relative">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm mb-3">
            <span className="text-4xl">🔥</span>
          </div>
          <h2 className="text-2xl font-bold">Daily Calorie Calculator</h2>
          <p className="text-orange-100 text-sm mt-1">আপনার দৈনিক কত ক্যালরি প্রয়োজন?</p>
        </div>
      </div>

      <div className="bg-white rounded-b-2xl shadow-xl border border-gray-100 p-6">
        <form onSubmit={calculateCalories} className="space-y-5">
          {/* Gender */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">লিঙ্গ</label>
            <div className="grid grid-cols-2 gap-2">
              {[{ v: 'male' as const, l: 'পুরুষ', i: '👨' }, { v: 'female' as const, l: 'মহিলা', i: '👩' }].map(g => (
                <button key={g.v} type="button" onClick={() => setGender(g.v)}
                  className={`flex items-center justify-center gap-2 py-3 rounded-xl border font-medium transition-all ${
                    gender === g.v ? 'bg-orange-50 border-orange-300 text-orange-700 shadow-sm' : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <span className="text-xl">{g.i}</span> {g.l}
                </button>
              ))}
            </div>
          </div>

          {/* Age, Weight, Height */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'বয়স', unit: 'বছর', val: age, set: setAge, ph: '25' },
              { label: 'ওজন', unit: 'kg', val: weight, set: setWeight, ph: '70' },
              { label: 'উচ্চতা', unit: 'cm', val: height, set: setHeight, ph: '170' },
            ].map(f => (
              <div key={f.label}>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">{f.label}</label>
                <div className="relative">
                  <input
                    type="number" value={f.val} onChange={(e) => f.set(e.target.value)} placeholder={f.ph}
                    className="w-full px-3 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-center bg-gray-50 font-bold text-gray-800"
                    required min="1"
                  />
                  <span className="absolute right-2 bottom-1 text-[9px] text-gray-400 font-semibold">{f.unit}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Activity Level */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">কাজের ধরন</label>
            <div className="space-y-1.5">
              {ACTIVITY_OPTIONS.map(opt => (
                <button key={opt.value} type="button" onClick={() => setActivity(opt.value)}
                  className={`w-full flex items-center gap-3 p-2.5 rounded-xl border transition-all text-left ${
                    activity === opt.value ? 'bg-orange-50 border-orange-300 shadow-sm' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  <span className="text-lg">{opt.icon}</span>
                  <div className="flex-1">
                    <p className={`text-xs font-bold ${activity === opt.value ? 'text-orange-700' : 'text-gray-700'}`}>{opt.label}</p>
                    <p className="text-[10px] text-gray-400">{opt.desc}</p>
                  </div>
                  {activity === opt.value && (
                    <svg className="w-4 h-4 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <button type="submit" className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 text-white py-3.5 rounded-xl font-semibold hover:from-orange-600 hover:to-red-600 transition-all active:scale-[0.98] shadow-lg shadow-orange-200/50">
              হিসাব করুন
            </button>
            <button type="button" onClick={reset} className="px-5 py-3.5 bg-gray-100 text-gray-600 rounded-xl font-medium hover:bg-gray-200 transition active:scale-[0.98]">
              রিসেট
            </button>
          </div>
        </form>

        {result && (
          <div className="mt-6 animate-in fade-in slide-in-from-bottom-3 duration-500 space-y-3">
            {/* Main result */}
            <div className="bg-gradient-to-br from-orange-50 to-red-50 p-5 rounded-2xl border border-orange-100 text-center">
              <p className="text-xs font-bold text-orange-500 uppercase tracking-wide">ওজন ধরে রাখতে দৈনিক প্রয়োজন</p>
              <p className="text-5xl font-extrabold text-orange-600 mt-1 tracking-tight">{result.maintain}</p>
              <p className="text-sm font-semibold text-orange-400">kcal / দিন</p>
              <p className="text-[10px] text-gray-400 mt-2">BMR (বেসাল মেটাবলিক রেট): {result.bmr} kcal</p>
            </div>

            {/* Goal cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 text-center">
                <span className="text-xl">📉</span>
                <p className="text-[10px] font-bold text-emerald-500 uppercase mt-1">ওজন কমাতে</p>
                <p className="text-2xl font-extrabold text-emerald-700">{result.lose}</p>
                <p className="text-[9px] text-gray-400">kcal/দিন</p>
              </div>
              <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 text-center">
                <span className="text-xl">📈</span>
                <p className="text-[10px] font-bold text-blue-500 uppercase mt-1">ওজন বাড়াতে</p>
                <p className="text-2xl font-extrabold text-blue-700">{result.gain}</p>
                <p className="text-[9px] text-gray-400">kcal/দিন</p>
              </div>
            </div>

            <p className="text-[11px] text-gray-400 text-center leading-relaxed">
              ⚕️ প্রতি সপ্তাহে ০.৫ কেজি ওজন কমাতে/বাড়াতে ৫০০ kcal কমানো/বাড়ানো হয়েছে।
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
