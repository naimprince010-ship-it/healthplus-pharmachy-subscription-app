'use client'

import { useState } from 'react'
import { Upload } from 'lucide-react'

export default function PrescriptionUploadForm() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess(false)

    const formData = new FormData(e.currentTarget)

    try {
      const response = await fetch('/api/prescriptions', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed')
      }

      setSuccess(true)
      e.currentTarget.reset()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
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
          <h2 className="text-xl font-bold text-gray-900">Upload Prescription</h2>
          <p className="text-sm text-gray-600">We&apos;ll call you back shortly</p>
        </div>
      </div>

      {success && (
        <div className="mb-4 rounded-lg bg-green-50 p-4 text-green-800">
          Prescription uploaded successfully! We&apos;ll contact you soon.
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-4 text-red-800">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Full Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            required
            className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
            placeholder="Enter your name"
          />
        </div>
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
            Phone Number
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            required
            pattern="[0-9]{11}"
            className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
            placeholder="01XXX-XXXXXX"
          />
        </div>
        <div>
          <label htmlFor="zoneId" className="block text-sm font-medium text-gray-700">
            Delivery Zone
          </label>
          <select
            id="zoneId"
            name="zoneId"
            required
            className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="">Select your zone</option>
            <option value="1">Dhaka Central</option>
            <option value="2">Dhaka North</option>
            <option value="3">Dhaka South</option>
          </select>
        </div>
        <div>
          <label htmlFor="file" className="block text-sm font-medium text-gray-700">
            Prescription Image (JPG, PNG, PDF - Max 5MB)
          </label>
          <input
            type="file"
            id="file"
            name="file"
            required
            accept="image/jpeg,image/jpg,image/png,application/pdf"
            className="mt-1 block w-full text-sm text-gray-600 file:mr-4 file:rounded-lg file:border-0 file:bg-teal-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-teal-600 hover:file:bg-teal-100"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-teal-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-teal-700 disabled:bg-gray-400"
        >
          {loading ? 'Uploading...' : 'Submit Prescription'}
        </button>
      </form>
    </div>
  )
}
