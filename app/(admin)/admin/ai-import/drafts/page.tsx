'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { 
  ArrowLeft, 
  Filter, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  XCircle,
  Edit,
  Eye,
  ChevronRight,
  Image as ImageIcon
} from 'lucide-react'

interface AiProductDraft {
  id: string
  importJobId: string
  rowIndex: number
  rawData: Record<string, unknown>
  aiSuggestion: {
    brand_name?: string
    generic_name?: string
    strength?: string
    dosage_form?: string
    pack_size?: string
    manufacturer?: string
    short_description?: string
    long_description?: string
    seo_title?: string
    seo_description?: string
    seo_keywords?: string[]
    category?: string
    subcategory?: string
    slug?: string
    overall_confidence?: number
  } | null
  aiConfidence: number | null
  status: 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED' | 'AI_ERROR' | 'MANUALLY_EDITED'
  publishedProductId: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
  importJob: {
    id: string
    status: string
    csvPath: string
  }
  // Phase 3: Image fields
  imageRawFilename: string | null
  imageMatchConfidence: number | null
  imageStatus: 'UNMATCHED' | 'MATCHED' | 'PROCESSED' | 'MISSING' | 'MANUAL'
  imageUrl: string | null
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export default function DraftsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const jobId = searchParams.get('jobId')
  
  const [drafts, setDrafts] = useState<AiProductDraft[]>([])
  const [loading, setLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'all')
  const [minConfidence, setMinConfidence] = useState(searchParams.get('minConfidence') || '')
  const [maxConfidence, setMaxConfidence] = useState(searchParams.get('maxConfidence') || '')
  // Phase 3: Image filters
  const [imageStatusFilter, setImageStatusFilter] = useState(searchParams.get('imageStatus') || 'all')
  const [hasImageFilter, setHasImageFilter] = useState(searchParams.get('hasImage') || 'all')
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  })

  useEffect(() => {
    fetchDrafts()
  }, [searchParams])

  const fetchDrafts = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (jobId) params.set('jobId', jobId)
      if (statusFilter !== 'all') params.set('status', statusFilter)
      if (minConfidence) params.set('minConfidence', minConfidence)
      if (maxConfidence) params.set('maxConfidence', maxConfidence)
      // Phase 3: Image filters
      if (imageStatusFilter !== 'all') params.set('imageStatus', imageStatusFilter)
      if (hasImageFilter !== 'all') params.set('hasImage', hasImageFilter)
      params.set('page', searchParams.get('page') || '1')
      params.set('limit', '20')

      const res = await fetch(`/api/admin/ai-import/drafts?${params}`)
      const data = await res.json()

      if (res.ok) {
        setDrafts(data.drafts)
        setPagination(data.pagination)
      }
    } catch (error) {
      console.error('Failed to fetch drafts:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = () => {
    const params = new URLSearchParams()
    if (jobId) params.set('jobId', jobId)
    if (statusFilter !== 'all') params.set('status', statusFilter)
    if (minConfidence) params.set('minConfidence', minConfidence)
    if (maxConfidence) params.set('maxConfidence', maxConfidence)
    // Phase 3: Image filters
    if (imageStatusFilter !== 'all') params.set('imageStatus', imageStatusFilter)
    if (hasImageFilter !== 'all') params.set('hasImage', hasImageFilter)
    params.set('page', '1')
    router.push(`/admin/ai-import/drafts?${params}`)
  }

  const updatePage = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', String(newPage))
    router.push(`/admin/ai-import/drafts?${params}`)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING_REVIEW':
        return <Clock className="h-4 w-4 text-yellow-500" />
      case 'APPROVED':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'REJECTED':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'AI_ERROR':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      case 'MANUALLY_EDITED':
        return <Edit className="h-4 w-4 text-blue-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      PENDING_REVIEW: 'bg-yellow-100 text-yellow-800',
      APPROVED: 'bg-green-100 text-green-800',
      REJECTED: 'bg-red-100 text-red-800',
      AI_ERROR: 'bg-red-100 text-red-800',
      MANUALLY_EDITED: 'bg-blue-100 text-blue-800',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const getConfidenceBadge = (confidence: number | null) => {
    if (confidence === null) return 'bg-gray-100 text-gray-800'
    if (confidence >= 0.8) return 'bg-green-100 text-green-800'
    if (confidence >= 0.5) return 'bg-yellow-100 text-yellow-800'
    return 'bg-red-100 text-red-800'
  }

  // Phase 3: Image status badge
  const getImageStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      UNMATCHED: 'bg-gray-100 text-gray-600',
      MATCHED: 'bg-yellow-100 text-yellow-800',
      PROCESSED: 'bg-green-100 text-green-800',
      MISSING: 'bg-red-100 text-red-800',
      MANUAL: 'bg-blue-100 text-blue-800',
    }
    return colors[status] || 'bg-gray-100 text-gray-600'
  }

  const getProductName = (draft: AiProductDraft): string => {
    // Try to get name from AI suggestion first, then raw data
    if (draft.aiSuggestion?.brand_name) {
      return draft.aiSuggestion.brand_name
    }
    const rawData = draft.rawData as Record<string, string>
    return rawData.name || rawData.brand_name || rawData.productName || `Row ${draft.rowIndex}`
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/ai-import"
            className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Jobs
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Product Drafts</h1>
            <p className="mt-1 text-sm text-gray-600">
              {jobId ? `Drafts from job ${jobId.slice(0, 8)}...` : 'All drafts'}
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
        >
          <Filter className="h-4 w-4" />
          Filters
        </button>
      </div>

      {showFilters && (
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="all">All Status</option>
                <option value="PENDING_REVIEW">Pending Review</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
                <option value="AI_ERROR">AI Error</option>
                <option value="MANUALLY_EDITED">Manually Edited</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Min Confidence
              </label>
              <input
                type="number"
                min="0"
                max="1"
                step="0.1"
                value={minConfidence}
                onChange={(e) => setMinConfidence(e.target.value)}
                placeholder="0.0"
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Max Confidence
              </label>
              <input
                type="number"
                min="0"
                max="1"
                step="0.1"
                value={maxConfidence}
                onChange={(e) => setMaxConfidence(e.target.value)}
                placeholder="1.0"
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            {/* Phase 3: Image filters */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Image Status
              </label>
              <select
                value={imageStatusFilter}
                onChange={(e) => setImageStatusFilter(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="all">All Image Status</option>
                <option value="UNMATCHED">Unmatched</option>
                <option value="MATCHED">Matched</option>
                <option value="PROCESSED">Processed</option>
                <option value="MISSING">Missing</option>
                <option value="MANUAL">Manual</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Has Image
              </label>
              <select
                value={hasImageFilter}
                onChange={(e) => setHasImageFilter(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="all">All</option>
                <option value="yes">With Image</option>
                <option value="no">Without Image</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                type="button"
                onClick={handleFilterChange}
                className="w-full rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-teal-700"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-500">Loading...</div>
        </div>
      ) : drafts.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">No drafts found</h3>
          <p className="mt-2 text-sm text-gray-500">
            {jobId 
              ? 'This job has no drafts yet. Run batch processing to generate drafts.'
              : 'No drafts match your filters.'}
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Row
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Confidence
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Image
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Category
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {drafts.map((draft) => (
                  <tr key={draft.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      #{draft.rowIndex}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {getProductName(draft)}
                      </div>
                      {draft.aiSuggestion?.strength && (
                        <div className="text-xs text-gray-500">
                          {draft.aiSuggestion.strength} {draft.aiSuggestion.dosage_form}
                        </div>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(draft.status)}
                        <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${getStatusBadge(draft.status)}`}>
                          {draft.status.replace('_', ' ')}
                        </span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      {draft.aiConfidence !== null ? (
                        <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${getConfidenceBadge(draft.aiConfidence)}`}>
                          {(draft.aiConfidence * 100).toFixed(0)}%
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">N/A</span>
                      )}
                    </td>
                    {/* Phase 3: Image column */}
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="flex items-center gap-2">
                        {draft.imageUrl ? (
                          <div className="relative h-8 w-8 overflow-hidden rounded border border-gray-200">
                            <Image
                              src={draft.imageUrl}
                              alt="Product"
                              fill
                              className="object-cover"
                            />
                          </div>
                        ) : (
                          <ImageIcon className="h-4 w-4 text-gray-400" />
                        )}
                        <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${getImageStatusBadge(draft.imageStatus)}`}>
                          {draft.imageStatus}
                        </span>
                      </div>
                      {draft.imageMatchConfidence !== null && draft.imageMatchConfidence < 1 && (
                        <div className="mt-1 text-xs text-gray-500">
                          {(draft.imageMatchConfidence * 100).toFixed(0)}% match
                        </div>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {draft.aiSuggestion?.category || '-'}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                      <Link
                        href={`/admin/ai-import/drafts/${draft.id}`}
                        className="flex items-center justify-end gap-1 text-teal-600 hover:text-teal-900"
                      >
                        <Eye className="h-4 w-4" />
                        Review
                        <ChevronRight className="h-3 w-3" />
                      </Link>
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
                {pagination.total} drafts
              </div>
              <div className="flex gap-2">
                {pagination.page > 1 && (
                  <button
                    onClick={() => updatePage(pagination.page - 1)}
                    className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                  >
                    Previous
                  </button>
                )}
                {pagination.page < pagination.totalPages && (
                  <button
                    onClick={() => updatePage(pagination.page + 1)}
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
