'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Upload, Download, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'

interface ImportError {
  row: number
  reason: string
}

interface ImportSummary {
  total: number
  imported: number
  skipped: number
  errors: ImportError[]
}

export default function BulkUploadPage() {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [summary, setSummary] = useState<ImportSummary | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.csv')) {
        toast.error('Please select a CSV file')
        return
      }
      setFile(selectedFile)
      setSummary(null)
    }
  }

  const handleDownloadTemplate = async () => {
    try {
      const response = await fetch('/api/admin/medicines/bulk-import/template')
      if (!response.ok) throw new Error('Failed to download template')

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'medicines_template.csv'
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast.success('Template downloaded successfully')
    } catch (error) {
      toast.error('Failed to download template')
    }
  }

  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select a file')
      return
    }

    setUploading(true)
    setSummary(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/admin/medicines/bulk-import', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to import medicines')
      }

      setSummary(data.summary)
      
      if (data.summary.imported > 0) {
        toast.success(`Successfully imported ${data.summary.imported} medicines`)
      }

      if (data.summary.skipped > 0) {
        toast.error(`${data.summary.skipped} rows were skipped due to errors`)
      }

      setFile(null)
      const fileInput = document.getElementById('file-input') as HTMLInputElement
      if (fileInput) fileInput.value = ''
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to import medicines')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/admin/medicines"
          className="rounded-lg border border-gray-300 p-2 transition-colors hover:bg-gray-50"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Bulk Medicine Upload</h1>
          <p className="mt-2 text-sm text-gray-600">
            Import medicines in bulk from a CSV file
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-gray-900">How it works</h2>
        <ul className="mt-4 space-y-2 text-sm text-gray-600">
          <li className="flex items-start gap-2">
            <span className="mt-0.5 text-teal-600">•</span>
            <span>Download the CSV template below to see the required format</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5 text-teal-600">•</span>
            <span>Fill in your medicine data (required fields: medicine_name, manufacturer, category_name)</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5 text-teal-600">•</span>
            <span>All imported medicines will be created as <strong>unpublished</strong> (inactive)</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5 text-teal-600">•</span>
            <span>After import, you can add images and activate medicines one by one from the medicines list</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5 text-teal-600">•</span>
            <span>Maximum 2000 rows per upload</span>
          </li>
        </ul>

        <div className="mt-6">
          <button
            onClick={handleDownloadTemplate}
            className="flex items-center gap-2 rounded-lg border border-teal-600 px-4 py-2 text-sm font-semibold text-teal-600 transition-colors hover:bg-teal-50"
          >
            <Download className="h-4 w-4" />
            Download CSV Template
          </button>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-gray-900">Upload CSV File</h2>
        
        <div className="mt-4">
          <label
            htmlFor="file-input"
            className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-8 transition-colors hover:border-teal-500 hover:bg-teal-50"
          >
            <Upload className="h-12 w-12 text-gray-400" />
            <p className="mt-2 text-sm font-medium text-gray-900">
              {file ? file.name : 'Click to select CSV file'}
            </p>
            <p className="mt-1 text-xs text-gray-500">
              CSV files only, max 2000 rows
            </p>
            <input
              id="file-input"
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
        </div>

        {file && (
          <div className="mt-4">
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="w-full rounded-lg bg-teal-600 py-3 font-semibold text-white transition-colors hover:bg-teal-700 disabled:bg-gray-400"
            >
              {uploading ? 'Uploading...' : 'Upload & Import'}
            </button>
          </div>
        )}
      </div>

      {summary && (
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-gray-900">Import Summary</h2>
          
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <div className="rounded-lg bg-blue-50 p-4">
              <p className="text-sm text-blue-600">Total Rows</p>
              <p className="mt-1 text-2xl font-bold text-blue-900">{summary.total}</p>
            </div>
            <div className="rounded-lg bg-green-50 p-4">
              <p className="text-sm text-green-600">Imported</p>
              <p className="mt-1 text-2xl font-bold text-green-900">{summary.imported}</p>
            </div>
            <div className="rounded-lg bg-red-50 p-4">
              <p className="text-sm text-red-600">Skipped</p>
              <p className="mt-1 text-2xl font-bold text-red-900">{summary.skipped}</p>
            </div>
          </div>

          {summary.errors.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-gray-900">Errors</h3>
              <div className="mt-2 max-h-64 overflow-y-auto rounded-lg border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">
                        Row
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">
                        Reason
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {summary.errors.map((error, index) => (
                      <tr key={index}>
                        <td className="whitespace-nowrap px-4 py-2 text-sm text-gray-900">
                          {error.row}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-600">
                          {error.reason}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {summary.imported > 0 && (
            <div className="mt-6 flex items-center gap-2 rounded-lg bg-teal-50 p-4">
              <CheckCircle className="h-5 w-5 text-teal-600" />
              <p className="text-sm text-teal-900">
                {summary.imported} medicines imported successfully. They are unpublished by default.
                Go to the{' '}
                <Link href="/admin/medicines?isActive=false" className="font-semibold underline">
                  medicines list
                </Link>{' '}
                to add images and activate them.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
