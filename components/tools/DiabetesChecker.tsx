'use client'

import { useState } from 'react'

type TestType = 'fasting' | 'postPrandial' | 'random' | 'hba1c'

const TEST_OPTIONS: { value: TestType; label: string; labelBn: string; unit: string; placeholder: string }[] = [
  { value: 'fasting', label: 'Fasting', labelBn: 'খালি পেটে', unit: 'mg/dL', placeholder: '95' },
  { value: 'postPrandial', label: 'Post-Prandial', labelBn: 'খাবারের ২ ঘণ্টা পর', unit: 'mg/dL', placeholder: '130' },
  { value: 'random', label: 'Random', labelBn: 'যেকোনো সময়', unit: 'mg/dL', placeholder: '120' },
  { value: 'hba1c', label: 'HbA1c', labelBn: '৩ মাসের গড়', unit: '%', placeholder: '5.5' },
]

interface Result {
  status: string
  statusBn: string
  icon: string
  gradient: string
  bg: string
  border: string
  text: string
  message: string
  tips: string[]
}

export function DiabetesChecker() {
  const [testType, setTestType] = useState<TestType>('fasting')
  const [level, setLevel] = useState('')
  const [result, setResult] = useState<Result | null>(null)

  const activeOption = TEST_OPTIONS.find(o => o.value === testType)!

  const checkDiabetes = (e: React.FormEvent) => {
    e.preventDefault()
    if (!level) return

    const value = parseFloat(level)
    if (value <= 0) return

    let r: Result

    const normalResult: Omit<Result, 'message' | 'tips'> = {
      status: 'Normal', statusBn: 'স্বাভাবিক', icon: '✅',
      gradient: 'from-emerald-500 to-green-500', bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700',
    }
    const preResult: Omit<Result, 'message' | 'tips'> = {
      status: 'Prediabetes', statusBn: 'প্রি-ডায়াবেটিস', icon: '⚠️',
      gradient: 'from-amber-400 to-orange-500', bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700',
    }
    const diabetesResult: Omit<Result, 'message' | 'tips'> = {
      status: 'Diabetes', statusBn: 'ডায়াবেটিস', icon: '🚨',
      gradient: 'from-red-500 to-rose-600', bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700',
    }

    if (testType === 'fasting') {
      if (value < 100) {
        r = { ...normalResult, message: 'আপনার ফাস্টিং সুগার লেভেল সম্পূর্ণ স্বাভাবিক আছে।', tips: ['নিয়মিত ব্যায়াম চালিয়ে যান', 'সুষম খাদ্য গ্রহণ করুন'] }
      } else if (value <= 125) {
        r = { ...preResult, message: 'আপনি প্রি-ডায়াবেটিক স্টেজে আছেন। জীবনযাত্রায় পরিবর্তন জরুরি।', tips: ['মিষ্টি ও প্রক্রিয়াজাত খাবার কমান', 'প্রতিদিন ৩০ মিনিট হাঁটুন', '৬ মাস পর পুনরায় পরীক্ষা করুন'] }
      } else {
        r = { ...diabetesResult, message: 'আপনার ডায়াবেটিসের লক্ষণ রয়েছে। দ্রুত ডাক্তারের পরামর্শ নিন।', tips: ['অবিলম্বে ডাক্তার দেখান', 'ঔষধ নিয়মিত খান', 'খাদ্য তালিকা মেনে চলুন'] }
      }
    } else if (testType === 'postPrandial' || testType === 'random') {
      if (value < 140) {
        r = { ...normalResult, message: 'আপনার সুগার লেভেল স্বাভাবিক আছে।', tips: ['সুস্থ জীবনযাপন চালিয়ে যান', 'বছরে একবার পরীক্ষা করুন'] }
      } else if (value <= 199) {
        r = { ...preResult, message: 'আপনার প্রি-ডায়াবেটিস আছে। সচেতন হোন।', tips: ['ভাত ও রুটির পরিমাণ কমান', 'শাকসবজি বেশি খান', 'ওজন নিয়ন্ত্রণ করুন'] }
      } else {
        r = { ...diabetesResult, message: 'আপনার ডায়াবেটিসের লক্ষণ রয়েছে। দ্রুত চিকিৎসা নিন।', tips: ['এখনই ডাক্তারের কাছে যান', 'HbA1c পরীক্ষা করান', 'ঔষধ ও ডায়েট মেনে চলুন'] }
      }
    } else {
      if (value < 5.7) {
        r = { ...normalResult, message: 'আপনার ৩ মাসের সুগার গড় একদম ঠিক আছে।', tips: ['আপনি দারুণ করছেন!', 'একই রুটিন বজায় রাখুন'] }
      } else if (value <= 6.4) {
        r = { ...preResult, message: 'আপনি প্রি-ডায়াবেটিক স্টেজে আছেন।', tips: ['জীবনযাত্রায় পরিবর্তন আনুন', 'ওজন ৫-৭% কমালে ঝুঁকি কমে', '৩ মাস পর আবার পরীক্ষা করুন'] }
      } else {
        r = { ...diabetesResult, message: 'আপনার ডায়াবেটিস আছে। ডাক্তারের পরামর্শ নিন।', tips: ['ডাক্তারের সাথে কথা বলুন', 'নিয়মিত পরীক্ষা করান', 'ঔষধ ও ডায়েট অনুসরণ করুন'] }
      }
    }

    setResult(r)
  }

  const reset = () => {
    setLevel('')
    setResult(null)
  }

  return (
    <div className="max-w-lg w-full mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-t-2xl p-6 text-white text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm mb-3">
          <span className="text-3xl">🩸</span>
        </div>
        <h2 className="text-2xl font-bold">Blood Sugar Checker</h2>
        <p className="text-blue-100 text-sm mt-1">আপনার রক্তে শর্করার মাত্রা পরীক্ষা করুন</p>
      </div>

      {/* Form */}
      <div className="bg-white rounded-b-2xl shadow-xl border border-gray-100 p-6">
        <form onSubmit={checkDiabetes} className="space-y-5">
          {/* Test Type Pills */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              টেস্টের ধরন নির্বাচন করুন
            </label>
            <div className="grid grid-cols-2 gap-2">
              {TEST_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => { setTestType(opt.value); setResult(null) }}
                  className={`px-3 py-2.5 rounded-xl text-sm font-medium transition-all border ${
                    testType === opt.value
                      ? 'bg-blue-50 border-blue-300 text-blue-700 shadow-sm'
                      : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <span className="block font-bold">{opt.label}</span>
                  <span className="block text-[10px] opacity-70">{opt.labelBn}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Value Input */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              রিডিং / মান
            </label>
            <div className="relative">
              <input
                type="number"
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                placeholder={activeOption.placeholder}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-lg font-semibold text-gray-800 bg-gray-50"
                required min="0" step="0.1"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">
                {activeOption.unit}
              </span>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-500 text-white py-3 rounded-xl font-semibold hover:from-blue-600 hover:to-indigo-600 transition-all active:scale-[0.98] shadow-md shadow-blue-200"
            >
              চেক করুন
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
          <div className="mt-6 animate-in fade-in slide-in-from-bottom-3 duration-500 space-y-4">
            {/* Status Card */}
            <div className={`rounded-2xl border p-5 text-center ${result.bg} ${result.border}`}>
              <span className="text-4xl">{result.icon}</span>
              <p className={`text-2xl font-extrabold mt-2 ${result.text}`}>
                {result.status}
              </p>
              <p className={`text-sm font-medium opacity-80 ${result.text}`}>{result.statusBn}</p>
              <p className="text-sm text-gray-600 mt-3 bg-white/60 px-3 py-2 rounded-xl">
                {result.message}
              </p>
            </div>

            {/* Tips */}
            <div className="bg-gray-50 rounded-xl border border-gray-100 p-4">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">💡 পরামর্শ</p>
              <ul className="space-y-2">
                {result.tips.map((tip, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="w-5 h-5 rounded-full bg-white border border-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-400 flex-shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>

            {/* Disclaimer */}
            <p className="text-[11px] text-gray-400 text-center leading-relaxed px-2">
              ⚕️ এই টুলটি শুধুমাত্র তথ্যমূলক। সঠিক রোগ নির্ণয়ের জন্য ডাক্তারের পরামর্শ নিন।
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
