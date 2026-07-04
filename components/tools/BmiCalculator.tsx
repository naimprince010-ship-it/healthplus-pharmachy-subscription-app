'use client'

import { useState } from 'react'

export function BmiCalculator() {
  const [weight, setWeight] = useState('')
  const [height, setHeight] = useState('')
  const [bmi, setBmi] = useState<number | null>(null)
  const [category, setCategory] = useState('')

  const calculateBmi = (e: React.FormEvent) => {
    e.preventDefault()
    if (!weight || !height) return

    const weightNum = parseFloat(weight)
    const heightNum = parseFloat(height) / 100 // cm to meters

    if (weightNum > 0 && heightNum > 0) {
      const calculatedBmi = weightNum / (heightNum * heightNum)
      setBmi(parseFloat(calculatedBmi.toFixed(1)))

      if (calculatedBmi < 18.5) {
        setCategory('Underweight (ওজন কম)')
      } else if (calculatedBmi >= 18.5 && calculatedBmi <= 24.9) {
        setCategory('Normal weight (স্বাভাবিক ওজন)')
      } else if (calculatedBmi >= 25 && calculatedBmi <= 29.9) {
        setCategory('Overweight (ওজন বেশি)')
      } else {
        setCategory('Obesity (স্থূলতা)')
      }
    }
  }

  const reset = () => {
    setWeight('')
    setHeight('')
    setBmi(null)
    setCategory('')
  }

  return (
    <div className="max-w-md w-full mx-auto bg-white rounded-xl shadow-md overflow-hidden p-6 border border-gray-100">
      <h2 className="text-2xl font-bold text-teal-700 mb-6 text-center">BMI Calculator</h2>
      
      <form onSubmit={calculateBmi} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Weight (kg) / ওজন (কেজি)
          </label>
          <input
            type="number"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="e.g. 70"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition"
            required
            min="1"
            step="0.1"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Height (cm) / উচ্চতা (সেমি)
          </label>
          <input
            type="number"
            value={height}
            onChange={(e) => setHeight(e.target.value)}
            placeholder="e.g. 175"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition"
            required
            min="1"
            step="0.1"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            className="flex-1 bg-teal-600 text-white py-2.5 rounded-lg font-medium hover:bg-teal-700 transition active:scale-[0.98]"
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

      {bmi !== null && (
        <div className="mt-8 p-5 bg-teal-50 rounded-xl border border-teal-100 text-center animate-in fade-in slide-in-from-bottom-2">
          <p className="text-sm text-teal-800 mb-1">Your BMI is</p>
          <p className="text-4xl font-extrabold text-teal-600 mb-2">{bmi}</p>
          <p className="font-medium text-gray-800 bg-white inline-block px-3 py-1 rounded-full text-sm shadow-sm">
            {category}
          </p>
          
          <div className="mt-4 text-xs text-gray-500 text-left">
            <p>18.5 এর নিচে: Underweight</p>
            <p>18.5 - 24.9: Normal</p>
            <p>25.0 - 29.9: Overweight</p>
            <p>30.0 বা তার বেশি: Obese</p>
          </div>
        </div>
      )}
    </div>
  )
}
