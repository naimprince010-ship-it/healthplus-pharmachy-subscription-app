'use client'

import { useState } from 'react'

interface ImageUploadProps {
  value?: string
  path?: string
  onChange: (url: string, path: string) => void
  medicineId?: string
}

export function ImageUpload({ value, path, onChange, medicineId }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 1024 * 1024) {
      setError('Image size must be less than 1MB')
      return
    }

    if (!['image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) {
      setError('Only JPG and PNG images are allowed')
      return
    }

    setError(null)
    setUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)
      if (medicineId) {
        formData.append('medicineId', medicineId)
      }

      const response = await fetch('/api/admin/uploads/medicine-image', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Upload failed')
      }

      const data = await response.json()
      onChange(data.url, data.path)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleRemove = async () => {
    if (!path) return

    try {
      await fetch(`/api/admin/uploads/medicine-image?path=${encodeURIComponent(path)}`, {
        method: 'DELETE',
      })
      onChange('', '')
    } catch (err) {
      console.error('Failed to delete image:', err)
    }
  }

  return (
    <div className="space-y-4">
      {value && (
        <div className="relative inline-block">
          <img
            src={value}
            alt="Medicine"
            className="w-48 h-48 object-cover rounded-lg border border-gray-300"
          />
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-2 hover:bg-red-700"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {value ? 'Replace Image' : 'Upload Image'}
        </label>
        <input
          type="file"
          accept="image/jpeg,image/jpg,image/png"
          onChange={handleFileChange}
          disabled={uploading}
          className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-md file:border-0
            file:text-sm file:font-semibold
            file:bg-teal-50 file:text-teal-700
            hover:file:bg-teal-100
            disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <p className="mt-1 text-xs text-gray-500">
          JPG or PNG, max 1MB
        </p>
      </div>

      {uploading && (
        <p className="text-sm text-gray-600">Uploading...</p>
      )}

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  )
}
