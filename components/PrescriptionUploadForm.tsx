'use client'

import { useState } from 'react'
import { Upload } from 'lucide-react'
import { trackPrescriptionUpload } from '@/lib/trackEvent'

export default function PrescriptionUploadForm() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [fileError, setFileError] = useState('')

  function validateFile(file: File | null): boolean {
    setFileError('')
    
    if (!file) {
      return true
    }

    const maxSize = 5 * 1024 * 1024
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf']

    if (file.size > maxSize) {
      setFileError('ফাইলের সাইজ ৫MB এর কম হতে হবে')
      return false
    }

    if (!allowedTypes.includes(file.type)) {
      setFileError('শুধুমাত্র JPG, JPEG, PNG, এবং PDF ফাইল গ্রহণযোগ্য')
      return false
    }

    return true
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] || null
    if (!validateFile(file)) {
      e.target.value = ''
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    setLoading(true)
    setError('')
    setFileError('')
    setSuccess(false)

    const formData = new FormData(form)
    const file = formData.get('file') as File | null

    if (!file || !validateFile(file)) {
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/prescriptions', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'আপলোড ব্যর্থ হয়েছে')
      }

      trackPrescriptionUpload(data.prescription?.id)

      try {
        form.reset()
      } catch {
        console.warn('Form reset failed')
      }

      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'আপলোড ব্যর্থ হয়েছে')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-2xl bg-white p-8 shadow-xl">
      <div className="mb-6 flex items-center space-x-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-100">
          <Upload className="h-6 w-6 text-teal-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">প্রেসক্রিপশন আপলোড করুন</h2>
          <p className="text-sm text-gray-600">আমরা শীঘ্রই আপনাকে কল করব</p>
        </div>
      </div>

      {success && (
        <div className="mb-4 rounded-lg bg-green-50 p-4 text-green-800">
          <strong>সফল!</strong> আপনার প্রেসক্রিপশন জমা হয়েছে। আমরা শীঘ্রই আপনাকে কল করব।
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-4 text-red-800">
          <strong>ত্রুটি:</strong> {error}
        </div>
      )}

      {fileError && (
        <div className="mb-4 rounded-lg bg-red-50 p-4 text-red-800">
          <strong>ফাইল ত্রুটি:</strong> {fileError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            পুরো নাম
          </label>
          <input
            type="text"
            id="name"
            name="name"
            required
            className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
            placeholder="আপনার নাম লিখুন"
          />
        </div>
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
            ফোন নম্বর
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            required
            pattern="^(\+?88)?01[3-9]\d{8}$"
            title="01XXXXXXXXX, 8801XXXXXXXXX, অথবা +8801XXXXXXXXX ব্যবহার করুন"
            className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
            placeholder="01712345678"
          />
          <p className="mt-1 text-xs text-gray-500">
            ফরম্যাট: 01XXXXXXXXX, 8801XXXXXXXXX, অথবা +8801XXXXXXXXX
          </p>
        </div>
        <div>
          <label htmlFor="zoneId" className="block text-sm font-medium text-gray-700">
            ডেলিভারি জোন
          </label>
          <select
            id="zoneId"
            name="zoneId"
            required
            className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="">আপনার জোন নির্বাচন করুন</option>
            <option value="1">ঢাকা সেন্ট্রাল</option>
            <option value="2">ঢাকা উত্তর</option>
            <option value="3">ঢাকা দক্ষিণ</option>
          </select>
        </div>
        <div>
          <label htmlFor="file" className="block text-sm font-medium text-gray-700">
            প্রেসক্রিপশন ফাইল
          </label>
          <input
            type="file"
            id="file"
            name="file"
            required
            accept="image/jpeg,image/jpg,image/png,application/pdf"
            onChange={handleFileChange}
            className="mt-1 block w-full text-sm text-gray-600 file:mr-4 file:rounded-lg file:border-0 file:bg-teal-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-teal-600 hover:file:bg-teal-100"
          />
          <p className="mt-1 text-xs text-gray-500">
            গ্রহণযোগ্য ফরম্যাট: JPG, JPEG, PNG, PDF। সর্বোচ্চ সাইজ: ৫MB।
          </p>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-teal-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-teal-700 disabled:bg-gray-400"
        >
          {loading ? 'আপলোড হচ্ছে...' : 'প্রেসক্রিপশন জমা দিন'}
        </button>
      </form>
    </div>
  )
}
