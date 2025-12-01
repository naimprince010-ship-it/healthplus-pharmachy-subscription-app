'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Edit, Plus, Trash2, Search, ExternalLink, Upload, X, Download } from 'lucide-react'

interface Manufacturer {
  id: string
  name: string
  slug: string
  logoUrl: string | null
  websiteUrl: string | null
  description: string | null
  createdAt: string
  _count: {
    products: number
  }
}

export default function ManufacturersPage() {
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
    const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string; productCount: number } | null>(null)
    const [deleting, setDeleting] = useState(false)
    const [showBulkUpload, setShowBulkUpload] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [uploadResult, setUploadResult] = useState<{
      message: string
      result: {
        totalRows: number
        createdCount: number
        updatedCount: number
        errorCount: number
        errors: Array<{ line: number; reason: string }>
      }
    } | null>(null)

  useEffect(() => {
    fetchManufacturers()
  }, [])

  const fetchManufacturers = async () => {
    try {
      const res = await fetch('/api/admin/manufacturers')
      if (res.ok) {
        const data = await res.json()
        setManufacturers(data.manufacturers || [])
      }
    } catch (error) {
      console.error('Failed to fetch manufacturers:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string, force: boolean = false) => {
    setDeleting(true)
    try {
      const url = force ? `/api/admin/manufacturers/${id}?force=true` : `/api/admin/manufacturers/${id}`
      const res = await fetch(url, { method: 'DELETE' })
      const data = await res.json()

      if (res.ok) {
        setManufacturers(manufacturers.filter(m => m.id !== id))
        setDeleteConfirm(null)
      } else if (data.canForceDelete) {
        setDeleteConfirm({ id, name: deleteConfirm?.name || '', productCount: data.productCount })
      } else {
        alert(data.error || 'Failed to delete manufacturer')
      }
    } catch (error) {
      console.error('Failed to delete manufacturer:', error)
      alert('Failed to delete manufacturer')
    } finally {
      setDeleting(false)
    }
  }

    const handleBulkUpload = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault()
      const form = e.currentTarget
      const fileInput = form.querySelector('input[type="file"]') as HTMLInputElement
      const file = fileInput?.files?.[0]

      if (!file) {
        alert('Please select a CSV file')
        return
      }

      setUploading(true)
      setUploadResult(null)

      try {
        const formData = new FormData()
        formData.append('file', file)

        const res = await fetch('/api/admin/manufacturers/bulk-upload', {
          method: 'POST',
          body: formData,
        })

        const data = await res.json()

        if (res.ok) {
          setUploadResult(data)
          fetchManufacturers()
        } else {
          alert(data.error || 'Failed to upload CSV')
        }
      } catch (error) {
        console.error('Bulk upload error:', error)
        alert('Failed to upload CSV')
      } finally {
        setUploading(false)
      }
    }

    const downloadErrorReport = () => {
      if (!uploadResult?.result.errors.length) return

      const csvContent = 'Line,Reason\n' + uploadResult.result.errors
        .map(e => `${e.line},"${e.reason.replace(/"/g, '""')}"`)
        .join('\n')

      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'manufacturer-upload-errors.csv'
      a.click()
      URL.revokeObjectURL(url)
    }

    const filteredManufacturers = manufacturers.filter(m =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.slug.toLowerCase().includes(search.toLowerCase())
    )

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-center justify-center py-12">
            <div className="text-gray-500">Loading manufacturers...</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-7xl">
                <div className="mb-8 flex items-center justify-between">
                  <h1 className="text-3xl font-bold text-gray-900">Manufacturers</h1>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => {
                        setShowBulkUpload(true)
                        setUploadResult(null)
                      }}
                      className="inline-flex items-center gap-2 rounded-lg border border-teal-600 px-4 py-2 text-sm font-medium text-teal-600 hover:bg-teal-50"
                    >
                      <Upload className="h-4 w-4" />
                      Bulk Upload (CSV)
                    </button>
                    <Link
                      href="/admin/manufacturers/new"
                      className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700"
                    >
                      <Plus className="h-4 w-4" />
                      Add Manufacturer
                    </Link>
                  </div>
                </div>

        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search manufacturers..."
              className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
        </div>

        <div className="overflow-hidden rounded-lg bg-white shadow">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Slug
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  # Products
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Created At
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {filteredManufacturers.map((manufacturer) => (
                <tr key={manufacturer.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="flex items-center gap-3">
                      {manufacturer.logoUrl && (
                        <img
                          src={manufacturer.logoUrl}
                          alt={manufacturer.name}
                          className="h-8 w-8 rounded object-cover"
                        />
                      )}
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {manufacturer.name}
                        </div>
                        {manufacturer.websiteUrl && (
                          <a
                            href={manufacturer.websiteUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-teal-600 hover:text-teal-700"
                          >
                            Website <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {manufacturer.slug}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {manufacturer._count.products}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {formatDate(manufacturer.createdAt)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm">
                    <div className="flex items-center gap-3">
                      <Link
                        href={`/admin/manufacturers/${manufacturer.id}/edit`}
                        className="text-teal-600 hover:text-teal-700"
                      >
                        <Edit className="h-4 w-4" />
                      </Link>
                      <button
                        onClick={() => setDeleteConfirm({
                          id: manufacturer.id,
                          name: manufacturer.name,
                          productCount: manufacturer._count.products,
                        })}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredManufacturers.length === 0 && (
            <div className="py-12 text-center text-gray-500">
              {search
                ? 'No manufacturers found matching your search'
                : 'No manufacturers yet. Create your first manufacturer to get started.'}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900">Delete Manufacturer</h3>
            <p className="mt-2 text-sm text-gray-600">
              Are you sure you want to delete &quot;{deleteConfirm.name}&quot;?
            </p>
            {deleteConfirm.productCount > 0 && (
              <p className="mt-2 text-sm text-amber-600">
                Warning: {deleteConfirm.productCount} product(s) are linked to this manufacturer.
                Deleting will remove the manufacturer reference from these products.
              </p>
            )}
            <div className="mt-4 flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                disabled={deleting}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm.id, deleteConfirm.productCount > 0)}
                disabled={deleting}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Upload Modal */}
      {showBulkUpload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Bulk Upload Manufacturers</h3>
              <button
                onClick={() => setShowBulkUpload(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 rounded-lg bg-gray-50 p-4 text-sm text-gray-600">
              <p className="font-medium text-gray-900">CSV Format:</p>
              <p className="mt-1">Required column: <code className="rounded bg-gray-200 px-1">name</code></p>
              <p className="mt-1">Optional columns: <code className="rounded bg-gray-200 px-1">slug</code>, <code className="rounded bg-gray-200 px-1">phoneNumber</code>, <code className="rounded bg-gray-200 px-1">logoUrl</code>, <code className="rounded bg-gray-200 px-1">websiteUrl</code>, <code className="rounded bg-gray-200 px-1">description</code></p>
              <p className="mt-2 text-xs">If slug is empty, it will be auto-generated from name. Existing manufacturers (by slug or name) will be updated.</p>
            </div>

            <form onSubmit={handleBulkUpload} className="mt-4">
              <input
                type="file"
                accept=".csv"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm file:mr-4 file:rounded file:border-0 file:bg-teal-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-teal-700 hover:file:bg-teal-100"
              />
              <div className="mt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowBulkUpload(false)}
                  disabled={uploading}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-50"
                >
                  {uploading ? 'Uploading...' : 'Upload CSV'}
                </button>
              </div>
            </form>

            {uploadResult && (
              <div className="mt-4 rounded-lg border p-4">
                <p className={`font-medium ${uploadResult.result.errorCount > 0 ? 'text-amber-600' : 'text-green-600'}`}>
                  {uploadResult.message}
                </p>
                <div className="mt-2 grid grid-cols-3 gap-2 text-sm">
                  <div className="rounded bg-green-50 p-2 text-center">
                    <div className="text-lg font-bold text-green-600">{uploadResult.result.createdCount}</div>
                    <div className="text-xs text-gray-500">Created</div>
                  </div>
                  <div className="rounded bg-blue-50 p-2 text-center">
                    <div className="text-lg font-bold text-blue-600">{uploadResult.result.updatedCount}</div>
                    <div className="text-xs text-gray-500">Updated</div>
                  </div>
                  <div className="rounded bg-red-50 p-2 text-center">
                    <div className="text-lg font-bold text-red-600">{uploadResult.result.errorCount}</div>
                    <div className="text-xs text-gray-500">Errors</div>
                  </div>
                </div>
                {uploadResult.result.errors.length > 0 && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-700">Errors:</p>
                      <button
                        onClick={downloadErrorReport}
                        className="inline-flex items-center gap-1 text-xs text-teal-600 hover:text-teal-700"
                      >
                        <Download className="h-3 w-3" />
                        Download Report
                      </button>
                    </div>
                    <ul className="mt-1 max-h-32 overflow-y-auto text-xs text-red-600">
                      {uploadResult.result.errors.slice(0, 5).map((err, i) => (
                        <li key={i}>Line {err.line}: {err.reason}</li>
                      ))}
                      {uploadResult.result.errors.length > 5 && (
                        <li className="text-gray-500">...and {uploadResult.result.errors.length - 5} more errors</li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
