'use client'

import { useState } from 'react'

type TestType = 'fasting' | 'postPrandial' | 'random' | 'hba1c'

export function DiabetesChecker() {
  const [testType, setTestType] = useState<TestType>('fasting')
  const [level, setLevel] = useState('')
  const [result, setResult] = useState<{
    status: string;
    color: string;
    message: string;
  } | null>(null)

  const checkDiabetes = (e: React.FormEvent) => {
    e.preventDefault()
    if (!level) return

    const value = parseFloat(level)
    if (value <= 0) return

    let status = ''
    let color = ''
    let message = ''

    if (testType === 'fasting') {
      // Fasting Blood Sugar (mg/dL)
      if (value < 100) {
        status = 'Normal (স্বাভাবিক)'
        color = 'text-green-600 bg-green-50 border-green-200'
        message = 'আপনার ফাস্টিং সুগার লেভেল স্বাভাবিক আছে।'
      } else if (value >= 100 && value <= 125) {
        status = 'Prediabetes (প্রি-ডায়াবেটিস)'
        color = 'text-yellow-600 bg-yellow-50 border-yellow-200'
        message = 'আপনার প্রি-ডায়াবেটিস আছে। জীবনযাত্রায় পরিবর্তন আনা জরুরি।'
      } else {
        status = 'Diabetes (ডায়াবেটিস)'
        color = 'text-red-600 bg-red-50 border-red-200'
        message = 'আপনার ডায়াবেটিসের লক্ষণ রয়েছে। দ্রুত ডাক্তারের পরামর্শ নিন।'
      }
    } else if (testType === 'postPrandial' || testType === 'random') {
      // Post-Prandial or Random (mg/dL)
      if (value < 140) {
        status = 'Normal (স্বাভাবিক)'
        color = 'text-green-600 bg-green-50 border-green-200'
        message = 'আপনার সুগার লেভেল স্বাভাবিক আছে।'
      } else if (value >= 140 && value <= 199) {
        status = 'Prediabetes (প্রি-ডায়াবেটিস)'
        color = 'text-yellow-600 bg-yellow-50 border-yellow-200'
        message = 'আপনার প্রি-ডায়াবেটিস আছে। মিষ্টি জাতীয় খাবার এড়িয়ে চলুন।'
      } else {
        status = 'Diabetes (ডায়াবেটিস)'
        color = 'text-red-600 bg-red-50 border-red-200'
        message = 'আপনার ডায়াবেটিসের লক্ষণ রয়েছে। দ্রুত ডাক্তারের পরামর্শ নিন।'
      }
    } else if (testType === 'hba1c') {
      // HbA1c (%)
      if (value < 5.7) {
        status = 'Normal (স্বাভাবিক)'
        color = 'text-green-600 bg-green-50 border-green-200'
        message = 'আপনার ৩ মাসের সুগার গড় একদম ঠিক আছে।'
      } else if (value >= 5.7 && value <= 6.4) {
        status = 'Prediabetes (প্রি-ডায়াবেটিস)'
        color = 'text-yellow-600 bg-yellow-50 border-yellow-200'
        message = 'আপনি প্রি-ডায়াবেটিক স্টেজে আছেন। সাবধানতা অবলম্বন করুন।'
      } else {
        status = 'Diabetes (ডায়াবেটিস)'
        color = 'text-red-600 bg-red-50 border-red-200'
        message = 'আপনার ডায়াবেটিস আছে। ডাক্তারের পরামর্শ অনুযায়ী ঔষধ নিন।'
      }
    }

    setResult({ status, color, message })
  }

  const reset = () => {
    setLevel('')
    setResult(null)
  }

  return (
    <div className="max-w-md w-full mx-auto bg-white rounded-xl shadow-md overflow-hidden p-6 border border-blue-100">
      <h2 className="text-2xl font-bold text-blue-700 mb-6 text-center">Blood Sugar Checker</h2>
      
      <form onSubmit={checkDiabetes} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Test Type (টেস্টের ধরন)
          </label>
          <select
            value={testType}
            onChange={(e) => {
              setTestType(e.target.value as TestType)
              setResult(null)
            }}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition bg-white"
          >
            <option value="fasting">Fasting (খালি পেটে)</option>
            <option value="postPrandial">Post-Prandial (খাবারের ২ ঘণ্টা পর)</option>
            <option value="random">Random (যেকোনো সময়)</option>
            <option value="hba1c">HbA1c (৩ মাসের গড়)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Result Level {testType === 'hba1c' ? '(%)' : '(mg/dL)'}
          </label>
          <input
            type="number"
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            placeholder={testType === 'hba1c' ? 'e.g. 5.5' : 'e.g. 95'}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
            required
            min="0"
            step="0.1"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 transition active:scale-[0.98]"
          >
            Check Status
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
        <div className={`mt-8 p-5 rounded-xl border text-center animate-in fade-in slide-in-from-bottom-2 ${result.color}`}>
          <p className="text-sm font-semibold mb-1 opacity-80">Status</p>
          <p className="text-2xl font-extrabold mb-3">{result.status}</p>
          <p className="text-sm bg-white bg-opacity-50 px-3 py-2 rounded-lg font-medium">
            {result.message}
          </p>
          
          <div className="mt-4 text-xs text-left bg-white bg-opacity-70 p-3 rounded border border-white">
            <p className="font-semibold mb-1">Disclaimer:</p>
            <p>This tool is for informational purposes only and not a substitute for professional medical advice. Always consult a doctor for diagnosis.</p>
          </div>
        </div>
      )}
    </div>
  )
}
