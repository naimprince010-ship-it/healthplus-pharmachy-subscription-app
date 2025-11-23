'use client'

import { useState } from 'react'
import { Upload } from 'lucide-react'

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
      setFileError('File size must be less than 5MB')
      return false
    }

    if (!allowedTypes.includes(file.type)) {
      setFileError('Only JPG, JPEG, PNG, and PDF files are allowed')
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
        throw new Error(data.error || 'Upload failed')
      }

      try {
        form.reset()
      } catch {
        console.warn('Form reset failed')
      }

      setSuccess(true)
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
          <strong>Success!</strong> Your prescription has been submitted. We will call you shortly.
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-4 text-red-800">
          <strong>Error:</strong> {error}
        </div>
      )}

      {fileError && (
        <div className="mb-4 rounded-lg bg-red-50 p-4 text-red-800">
          <strong>File Error:</strong> {fileError}
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
            pattern="^(\+?88)?01[3-9]\d{8}$"
            title="Use 01XXXXXXXXX, 8801XXXXXXXXX, or +8801XXXXXXXXX"
            className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
            placeholder="01712345678"
          />
          <p className="mt-1 text-xs text-gray-500">
            Format: 01XXXXXXXXX, 8801XXXXXXXXX, or +8801XXXXXXXXX
          </p>
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
            Prescription File
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
            Allowed formats: JPG, JPEG, PNG, PDF. Max size: 5MB.
          </p>
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
