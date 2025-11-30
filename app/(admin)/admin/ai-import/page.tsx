'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { 
  Upload, 
  Play, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  XCircle,
  RefreshCw,
  FileText,
  ChevronRight
} from 'lucide-react'

interface AiImportJob {
  id: string
  createdByAdminId: string
  csvPath: string
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED'
  totalRows: number | null
  processedRows: number
  failedRows: number
  errorSummary: string | null
  config: {
    modelName: string
    batchSize: number
  } | null
  createdAt: string
  updatedAt: string
  draftCount: number
  draftStats: {
    pending_review: number
    approved: number
    rejected: number
    ai_error: number
    manually_edited: number
  }
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export default function AiImportPage() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [jobs, setJobs] = useState<AiImportJob[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [processingJobId, setProcessingJobId] = useState<string | null>(null)
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  })

  const fetchJobs = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/ai-import/jobs?page=${pagination.page}&limit=${pagination.limit}`)
      const data = await res.json()
      if (res.ok) {
        setJobs(data.jobs)
        setPagination(data.pagination)
      }
    } catch (error) {
      console.error('Failed to fetch jobs:', error)
    } finally {
      setLoading(false)
    }
  }, [pagination.page, pagination.limit])

  useEffect(() => {
    fetchJobs()
  }, [fetchJobs])

  // Poll for job updates when there's a processing job
  useEffect(() => {
    const processingJob = jobs.find(j => j.status === 'PROCESSING')
    if (processingJob) {
      const interval = setInterval(() => {
        fetchJobs()
      }, 3000)
      return () => clearInterval(interval)
    }
  }, [jobs, fetchJobs])

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.name.endsWith('.csv')) {
      alert('Please select a CSV file')
      return
    }

    setUploading(true)
    try {
      // Parse CSV file
      const text = await file.text()
      const lines = text.split('\n').filter(line => line.trim())
      
      if (lines.length < 2) {
        alert('CSV file must have at least a header row and one data row')
        return
      }

      // Parse header
      const headers = parseCSVLine(lines[0])
      
      // Parse data rows
      const csvData = lines.slice(1).map(line => {
        const values = parseCSVLine(line)
        const row: Record<string, string> = {}
        headers.forEach((header, index) => {
          row[header.trim()] = values[index]?.trim() || ''
        })
        return row
      }).filter(row => Object.values(row).some(v => v)) // Filter out empty rows

      if (csvData.length === 0) {
        alert('No valid data rows found in CSV')
        return
      }

      // Create import job
      const res = await fetch('/api/admin/ai-import/upload-csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          csvPath: `uploads/${Date.now()}_${file.name}`,
          csvData,
          totalRows: csvData.length,
        }),
      })

      const data = await res.json()
      if (res.ok) {
        fetchJobs()
        alert(`Import job created with ${csvData.length} products. Click "Run Batch" to start AI processing.`)
      } else {
        alert(data.error || 'Failed to create import job')
      }
    } catch (error) {
      console.error('Upload error:', error)
      alert('Failed to upload CSV file')
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  // Simple CSV line parser that handles quoted values
  const parseCSVLine = (line: string): string[] => {
    const result: string[] = []
    let current = ''
    let inQuotes = false
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === ',' && !inQuotes) {
        result.push(current)
        current = ''
      } else {
        current += char
      }
    }
    result.push(current)
    return result
  }

  const handleRunBatch = async (jobId: string) => {
    setProcessingJobId(jobId)
    try {
      const res = await fetch('/api/admin/ai-import/run-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId, batchSize: 100 }),
      })

      const data = await res.json()
      if (res.ok) {
        fetchJobs()
        if (data.remaining > 0) {
          // Continue processing
          setTimeout(() => handleRunBatch(jobId), 1000)
        } else {
          setProcessingJobId(null)
          alert('Batch processing completed!')
        }
      } else {
        setProcessingJobId(null)
        alert(data.error || 'Failed to run batch')
      }
    } catch (error) {
      setProcessingJobId(null)
      console.error('Run batch error:', error)
      alert('Failed to run batch')
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="h-4 w-4 text-yellow-500" />
      case 'PROCESSING':
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />
      case 'COMPLETED':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'FAILED':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'CANCELLED':
        return <XCircle className="h-4 w-4 text-gray-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      PROCESSING: 'bg-blue-100 text-blue-800',
      COMPLETED: 'bg-green-100 text-green-800',
      FAILED: 'bg-red-100 text-red-800',
      CANCELLED: 'bg-gray-100 text-gray-800',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">AI Product Import</h1>
          <p className="mt-2 text-sm text-gray-600">
            Bulk import products from CSV with AI-powered enrichment
          </p>
        </div>
        <div className="flex items-center gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileSelect}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-teal-700 disabled:opacity-50"
          >
            <Upload className="h-4 w-4" />
            {uploading ? 'Uploading...' : 'Upload CSV'}
          </button>
        </div>
      </div>

      {/* Instructions */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <h3 className="font-medium text-blue-900">How to use AI Product Import</h3>
        <ol className="mt-2 list-inside list-decimal space-y-1 text-sm text-blue-800">
          <li>Upload a CSV file with product data (name, price, etc.)</li>
          <li>Click &quot;Run Batch&quot; to start AI processing (100 products per batch)</li>
          <li>Review AI-generated suggestions in the draft list</li>
          <li>Approve or edit drafts before publishing to the product catalog</li>
        </ol>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-500">Loading...</div>
        </div>
      ) : jobs.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
          <FileText className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">No import jobs yet</h3>
          <p className="mt-2 text-sm text-gray-500">
            Upload a CSV file to start importing products with AI enrichment.
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Progress
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Drafts
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Created
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {jobs.map((job) => (
                  <tr key={job.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(job.status)}
                        <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${getStatusBadge(job.status)}`}>
                          {job.status}
                        </span>
                      </div>
                      {job.errorSummary && (
                        <p className="mt-1 text-xs text-red-600 truncate max-w-xs" title={job.errorSummary}>
                          {job.errorSummary}
                        </p>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {job.processedRows} / {job.totalRows || '?'} rows
                      </div>
                      {job.totalRows && job.totalRows > 0 && (
                        <div className="mt-1 h-2 w-32 rounded-full bg-gray-200">
                          <div
                            className="h-2 rounded-full bg-teal-500"
                            style={{ width: `${(job.processedRows / job.totalRows) * 100}%` }}
                          />
                        </div>
                      )}
                      {job.failedRows > 0 && (
                        <p className="mt-1 text-xs text-red-600">
                          {job.failedRows} failed
                        </p>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {job.draftCount} total
                      </div>
                      <div className="mt-1 flex gap-2 text-xs">
                        {job.draftStats.pending_review > 0 && (
                          <span className="text-yellow-600">{job.draftStats.pending_review} pending</span>
                        )}
                        {job.draftStats.approved > 0 && (
                          <span className="text-green-600">{job.draftStats.approved} approved</span>
                        )}
                        {job.draftStats.rejected > 0 && (
                          <span className="text-red-600">{job.draftStats.rejected} rejected</span>
                        )}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {new Date(job.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        {(job.status === 'PENDING' || job.status === 'PROCESSING') && (
                          <button
                            onClick={() => handleRunBatch(job.id)}
                            disabled={processingJobId === job.id}
                            className="flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
                          >
                            {processingJobId === job.id ? (
                              <>
                                <RefreshCw className="h-3 w-3 animate-spin" />
                                Processing...
                              </>
                            ) : (
                              <>
                                <Play className="h-3 w-3" />
                                Run Batch
                              </>
                            )}
                          </button>
                        )}
                        <Link
                          href={`/admin/ai-import/drafts?jobId=${job.id}`}
                          className="flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50"
                        >
                          View Drafts
                          <ChevronRight className="h-3 w-3" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                {pagination.total} jobs
              </div>
              <div className="flex gap-2">
                {pagination.page > 1 && (
                  <button
                    onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                    className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                  >
                    Previous
                  </button>
                )}
                {pagination.page < pagination.totalPages && (
                  <button
                    onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                    className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                  >
                    Next
                  </button>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
