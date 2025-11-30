'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, 
  Check, 
  X, 
  Save,
  AlertCircle,
  CheckCircle,
  Clock,
  Edit
} from 'lucide-react'

interface AiProductDraft {
  id: string
  importJobId: string
  rowIndex: number
  rawData: Record<string, unknown>
  aiSuggestion: {
    brand_name?: string
    generic_name?: string
    generic_detected?: string
    generic_match_id?: string
    generic_confidence?: number
    strength?: string
    dosage_form?: string
    pack_size?: string
    manufacturer?: string
    manufacturer_detected?: string
    manufacturer_match_id?: string
    manufacturer_confidence?: number
    short_description?: string
    long_description?: string
    seo_title?: string
    seo_description?: string
    seo_keywords?: string[]
    category?: string
    category_detected?: string
    category_match_id?: string
    category_confidence?: number
    subcategory?: string
    subcategory_detected?: string
    subcategory_match_id?: string
    subcategory_confidence?: number
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
  // Phase 2 fields
  genericMatchId: string | null
  genericConfidence: number | null
  manufacturerMatchId: string | null
  manufacturerConfidence: number | null
  categoryMatchId: string | null
  categoryConfidence: number | null
  subcategoryMatchId: string | null
  genericVerified: boolean
  manufacturerVerified: boolean
  categoryVerified: boolean
  newGenericSuggested: string | null
  newManufacturerSuggested: string | null
  generic?: { id: string; name: string } | null
  manufacturer?: { id: string; name: string } | null
  category?: { id: string; name: string } | null
  subcategory?: { id: string; name: string } | null
}

interface Category {
  id: string
  name: string
  slug: string
}

interface FormData {
  name: string
  slug: string
  brandName: string
  genericName: string
  description: string
  shortDescription: string
  categoryId: string
  mrp: string
  sellingPrice: string
  strength: string
  dosageForm: string
  packSize: string
  manufacturer: string
  seoTitle: string
  seoDescription: string
  seoKeywords: string
  isActive: boolean
  isFeatured: boolean
}

export default function DraftReviewPage() {
  const router = useRouter()
  const params = useParams()
  const draftId = params.id as string

  const [draft, setDraft] = useState<AiProductDraft | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [approving, setApproving] = useState(false)
  // Phase 2: QC verification state
  const [qcVerification, setQcVerification] = useState({
    genericVerified: false,
    manufacturerVerified: false,
    categoryVerified: false,
  })
  const [formData, setFormData] = useState<FormData>({
    name: '',
    slug: '',
    brandName: '',
    genericName: '',
    description: '',
    shortDescription: '',
    categoryId: '',
    mrp: '',
    sellingPrice: '',
    strength: '',
    dosageForm: '',
    packSize: '',
    manufacturer: '',
    seoTitle: '',
    seoDescription: '',
    seoKeywords: '',
    isActive: true,
    isFeatured: false,
  })

  useEffect(() => {
    fetchDraft()
    fetchCategories()
  }, [draftId])

  const fetchDraft = async () => {
    try {
      const res = await fetch(`/api/admin/ai-import/drafts?id=${draftId}`)
      const data = await res.json()
      if (res.ok && data.draft) {
        setDraft(data.draft)
        initializeFormData(data.draft)
      }
    } catch (error) {
      console.error('Failed to fetch draft:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/admin/categories')
      const data = await res.json()
      if (res.ok) {
        setCategories(data.categories || [])
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error)
    }
  }

  const initializeFormData = (draft: AiProductDraft) => {
    const ai = draft.aiSuggestion || {}
    const raw = draft.rawData as Record<string, string>

    // Get price from raw data
    const rawPrice = raw.price || raw.mrp || raw.sellingPrice || ''
    const priceNum = parseFloat(rawPrice) || 0

    setFormData({
      name: ai.brand_name || raw.name || raw.brand_name || '',
      slug: ai.slug || '',
      brandName: ai.brand_name || raw.brand_name || '',
      genericName: ai.generic_name || ai.generic_detected || raw.generic_name || raw.genericName || '',
      description: ai.long_description || raw.description || '',
      shortDescription: ai.short_description || '',
      categoryId: draft.categoryMatchId || '', // Phase 2: Use matched category
      mrp: priceNum > 0 ? String(priceNum) : '',
      sellingPrice: priceNum > 0 ? String(priceNum) : '',
      strength: ai.strength || raw.strength || '',
      dosageForm: ai.dosage_form || raw.dosage_form || raw.dosageForm || '',
      packSize: ai.pack_size || raw.pack_size || raw.packSize || '',
      manufacturer: ai.manufacturer || ai.manufacturer_detected || raw.manufacturer || '',
      seoTitle: ai.seo_title || '',
      seoDescription: ai.seo_description || '',
      seoKeywords: ai.seo_keywords?.join(', ') || '',
      isActive: true,
      isFeatured: false,
    })

    // Phase 2: Initialize QC verification state from draft
    setQcVerification({
      genericVerified: draft.genericVerified || false,
      manufacturerVerified: draft.manufacturerVerified || false,
      categoryVerified: draft.categoryVerified || false,
    })
  }

  const handleInputChange = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSaveDraft = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/ai-import/drafts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: draftId,
          aiSuggestion: {
            brand_name: formData.brandName,
            generic_name: formData.genericName,
            strength: formData.strength,
            dosage_form: formData.dosageForm,
            pack_size: formData.packSize,
            manufacturer: formData.manufacturer,
            short_description: formData.shortDescription,
            long_description: formData.description,
            seo_title: formData.seoTitle,
            seo_description: formData.seoDescription,
            seo_keywords: formData.seoKeywords.split(',').map(k => k.trim()).filter(Boolean),
            slug: formData.slug,
          },
        }),
      })

      if (res.ok) {
        fetchDraft()
        alert('Draft saved successfully')
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to save draft')
      }
    } catch (error) {
      console.error('Save error:', error)
      alert('Failed to save draft')
    } finally {
      setSaving(false)
    }
  }

  const handleApprove = async () => {
    if (!formData.name) {
      alert('Product name is required')
      return
    }
    if (!formData.sellingPrice || parseFloat(formData.sellingPrice) <= 0) {
      alert('Valid selling price is required')
      return
    }
    if (!formData.categoryId) {
      alert('Please select a category')
      return
    }

    // Phase 2: Check QC verification
    if (!qcVerification.genericVerified || !qcVerification.manufacturerVerified || !qcVerification.categoryVerified) {
      const missing = []
      if (!qcVerification.genericVerified) missing.push('Generic')
      if (!qcVerification.manufacturerVerified) missing.push('Manufacturer')
      if (!qcVerification.categoryVerified) missing.push('Category')
      alert(`Please verify the following before approval: ${missing.join(', ')}`)
      return
    }

    setApproving(true)
    try {
      const res = await fetch('/api/admin/ai-import/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          draftId,
          productData: {
            name: formData.name,
            slug: formData.slug || undefined,
            brandName: formData.brandName || undefined,
            genericName: formData.genericName || undefined,
            description: formData.description || undefined,
            shortDescription: formData.shortDescription || undefined,
            categoryId: formData.categoryId,
            mrp: formData.mrp ? parseFloat(formData.mrp) : undefined,
            sellingPrice: parseFloat(formData.sellingPrice),
            strength: formData.strength || undefined,
            dosageForm: formData.dosageForm || undefined,
            packSize: formData.packSize || undefined,
            manufacturer: formData.manufacturer || undefined,
            seoTitle: formData.seoTitle || undefined,
            seoDescription: formData.seoDescription || undefined,
            seoKeywords: formData.seoKeywords || undefined,
            isActive: formData.isActive,
            isFeatured: formData.isFeatured,
          },
          // Phase 2: Include QC verification and match IDs
          qcVerification,
          matchIds: {
            genericMatchId: draft?.genericMatchId || null,
            manufacturerMatchId: draft?.manufacturerMatchId || null,
            categoryMatchId: formData.categoryId || null,
            subcategoryMatchId: draft?.subcategoryMatchId || null,
          },
        }),
      })

      const data = await res.json()
      if (res.ok) {
        alert('Product approved and published successfully!')
        router.push(`/admin/ai-import/drafts?jobId=${draft?.importJobId}`)
      } else {
        alert(data.error || data.message || 'Failed to approve draft')
      }
    } catch (error) {
      console.error('Approve error:', error)
      alert('Failed to approve draft')
    } finally {
      setApproving(false)
    }
  }

  const handleReject = async () => {
    if (!confirm('Are you sure you want to reject this draft?')) return

    try {
      const res = await fetch(`/api/admin/ai-import/approve?draftId=${draftId}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        alert('Draft rejected')
        router.push(`/admin/ai-import/drafts?jobId=${draft?.importJobId}`)
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to reject draft')
      }
    } catch (error) {
      console.error('Reject error:', error)
      alert('Failed to reject draft')
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING_REVIEW':
        return <Clock className="h-4 w-4 text-yellow-500" />
      case 'APPROVED':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'REJECTED':
        return <X className="h-4 w-4 text-red-500" />
      case 'AI_ERROR':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      case 'MANUALLY_EDITED':
        return <Edit className="h-4 w-4 text-blue-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />
    }
  }

  // Phase 2: Get confidence color based on score
  const getConfidenceColor = (confidence: number | null | undefined): string => {
    if (confidence === null || confidence === undefined) return 'text-gray-500'
    if (confidence >= 0.85) return 'text-green-600 bg-green-100'
    if (confidence >= 0.60) return 'text-yellow-600 bg-yellow-100'
    return 'text-red-600 bg-red-100'
  }

  // Phase 2: Format confidence as percentage
  const formatConfidence = (confidence: number | null | undefined): string => {
    if (confidence === null || confidence === undefined) return 'N/A'
    return `${(confidence * 100).toFixed(0)}%`
  }

  // Phase 2: Check if all QC verifications are complete
  const allQcVerified = qcVerification.genericVerified && 
                        qcVerification.manufacturerVerified && 
                        qcVerification.categoryVerified

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  if (!draft) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
        <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-4 text-lg font-medium text-gray-900">Draft not found</h3>
        <Link
          href="/admin/ai-import"
          className="mt-4 inline-flex items-center gap-2 text-teal-600 hover:text-teal-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to AI Import
        </Link>
      </div>
    )
  }

  const rawData = draft.rawData as Record<string, string>
  const aiSuggestion = draft.aiSuggestion

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href={`/admin/ai-import/drafts?jobId=${draft.importJobId}`}
            className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Drafts
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Review Draft #{draft.rowIndex}
            </h1>
            <div className="mt-1 flex items-center gap-2">
              {getStatusIcon(draft.status)}
              <span className="text-sm text-gray-600">{draft.status.replace('_', ' ')}</span>
              {draft.aiConfidence !== null && (
                <span className="text-sm text-gray-500">
                  | Confidence: {(draft.aiConfidence * 100).toFixed(0)}%
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {draft.status !== 'APPROVED' && (
            <>
              <button
                onClick={handleReject}
                className="flex items-center gap-2 rounded-lg border border-red-300 px-4 py-2 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50"
              >
                <X className="h-4 w-4" />
                Reject
              </button>
              <button
                onClick={handleSaveDraft}
                disabled={saving}
                className="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                {saving ? 'Saving...' : 'Save Draft'}
              </button>
              <button
                onClick={handleApprove}
                disabled={approving}
                className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-green-700 disabled:opacity-50"
              >
                <Check className="h-4 w-4" />
                {approving ? 'Approving...' : 'Approve & Publish'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* 3-Column Layout */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Column 1: Raw CSV Data */}
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Raw CSV Data</h2>
          <div className="space-y-3 text-sm">
            {Object.entries(rawData).map(([key, value]) => (
              <div key={key}>
                <dt className="font-medium text-gray-500">{key}</dt>
                <dd className="mt-1 text-gray-900 break-words">{value || '-'}</dd>
              </div>
            ))}
          </div>
        </div>

        {/* Column 2: AI Suggestion + Phase 2 QC Verification */}
        <div className="space-y-4">
          {/* AI Suggestion */}
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
            <h2 className="mb-4 text-lg font-semibold text-blue-900">AI Suggestion</h2>
            {aiSuggestion ? (
              <div className="space-y-3 text-sm">
                <div>
                  <dt className="font-medium text-blue-700">Brand Name</dt>
                  <dd className="mt-1 text-blue-900">{aiSuggestion.brand_name || '-'}</dd>
                </div>
                <div>
                  <dt className="font-medium text-blue-700">Generic Name</dt>
                  <dd className="mt-1 text-blue-900">{aiSuggestion.generic_name || aiSuggestion.generic_detected || '-'}</dd>
                </div>
                <div>
                  <dt className="font-medium text-blue-700">Strength</dt>
                  <dd className="mt-1 text-blue-900">{aiSuggestion.strength || '-'}</dd>
                </div>
                <div>
                  <dt className="font-medium text-blue-700">Dosage Form</dt>
                  <dd className="mt-1 text-blue-900">{aiSuggestion.dosage_form || '-'}</dd>
                </div>
                <div>
                  <dt className="font-medium text-blue-700">Pack Size</dt>
                  <dd className="mt-1 text-blue-900">{aiSuggestion.pack_size || '-'}</dd>
                </div>
                <div>
                  <dt className="font-medium text-blue-700">Manufacturer</dt>
                  <dd className="mt-1 text-blue-900">{aiSuggestion.manufacturer || aiSuggestion.manufacturer_detected || '-'}</dd>
                </div>
                <div>
                  <dt className="font-medium text-blue-700">Category</dt>
                  <dd className="mt-1 text-blue-900">{aiSuggestion.category || aiSuggestion.category_detected || '-'}</dd>
                </div>
                <div>
                  <dt className="font-medium text-blue-700">Short Description (Bangla)</dt>
                  <dd className="mt-1 text-blue-900 break-words">{aiSuggestion.short_description || '-'}</dd>
                </div>
                <div>
                  <dt className="font-medium text-blue-700">Long Description (Bangla)</dt>
                  <dd className="mt-1 text-blue-900 break-words">{aiSuggestion.long_description || '-'}</dd>
                </div>
                <div>
                  <dt className="font-medium text-blue-700">SEO Title</dt>
                  <dd className="mt-1 text-blue-900">{aiSuggestion.seo_title || '-'}</dd>
                </div>
                <div>
                  <dt className="font-medium text-blue-700">SEO Description</dt>
                  <dd className="mt-1 text-blue-900 break-words">{aiSuggestion.seo_description || '-'}</dd>
                </div>
                <div>
                  <dt className="font-medium text-blue-700">SEO Keywords</dt>
                  <dd className="mt-1 text-blue-900">{aiSuggestion.seo_keywords?.join(', ') || '-'}</dd>
                </div>
                <div>
                  <dt className="font-medium text-blue-700">Slug</dt>
                  <dd className="mt-1 text-blue-900">{aiSuggestion.slug || '-'}</dd>
                </div>
                <div>
                  <dt className="font-medium text-blue-700">Overall Confidence</dt>
                  <dd className="mt-1 text-blue-900">
                    {aiSuggestion.overall_confidence 
                      ? `${(aiSuggestion.overall_confidence * 100).toFixed(0)}%` 
                      : '-'}
                  </dd>
                </div>
              </div>
            ) : (
              <p className="text-sm text-blue-700">No AI suggestion available</p>
            )}
          </div>

          {/* Phase 2: QC Verification Section */}
          <div className="rounded-lg border border-purple-200 bg-purple-50 p-4">
            <h2 className="mb-4 text-lg font-semibold text-purple-900">QC Verification (Phase 2)</h2>
            <p className="mb-4 text-xs text-purple-700">All three must be verified before approval</p>
            
            <div className="space-y-4">
              {/* Generic Verification */}
              <div className="rounded-lg border border-purple-100 bg-white p-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <dt className="font-medium text-purple-800">Generic</dt>
                    <dd className="mt-1 text-sm text-gray-700">
                      {draft.generic?.name || formData.genericName || aiSuggestion?.generic_detected || 'Not detected'}
                    </dd>
                    {draft.newGenericSuggested && (
                      <dd className="mt-1 text-xs text-orange-600">
                        Suggested new: {draft.newGenericSuggested}
                      </dd>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`rounded px-2 py-1 text-xs font-medium ${getConfidenceColor(draft.genericConfidence)}`}>
                      {formatConfidence(draft.genericConfidence)}
                    </span>
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={qcVerification.genericVerified}
                        onChange={(e) => setQcVerification(prev => ({ ...prev, genericVerified: e.target.checked }))}
                        className="h-4 w-4 rounded border-purple-300 text-purple-600 focus:ring-purple-500"
                      />
                      <span className="text-xs text-purple-700">Verified</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Manufacturer Verification */}
              <div className="rounded-lg border border-purple-100 bg-white p-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <dt className="font-medium text-purple-800">Manufacturer</dt>
                    <dd className="mt-1 text-sm text-gray-700">
                      {draft.manufacturer?.name || formData.manufacturer || aiSuggestion?.manufacturer_detected || 'Not detected'}
                    </dd>
                    {draft.newManufacturerSuggested && (
                      <dd className="mt-1 text-xs text-orange-600">
                        Suggested new: {draft.newManufacturerSuggested}
                      </dd>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`rounded px-2 py-1 text-xs font-medium ${getConfidenceColor(draft.manufacturerConfidence)}`}>
                      {formatConfidence(draft.manufacturerConfidence)}
                    </span>
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={qcVerification.manufacturerVerified}
                        onChange={(e) => setQcVerification(prev => ({ ...prev, manufacturerVerified: e.target.checked }))}
                        className="h-4 w-4 rounded border-purple-300 text-purple-600 focus:ring-purple-500"
                      />
                      <span className="text-xs text-purple-700">Verified</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Category Verification */}
              <div className="rounded-lg border border-purple-100 bg-white p-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <dt className="font-medium text-purple-800">Category</dt>
                    <dd className="mt-1 text-sm text-gray-700">
                      {draft.category?.name || categories.find(c => c.id === formData.categoryId)?.name || aiSuggestion?.category_detected || 'Not detected'}
                    </dd>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`rounded px-2 py-1 text-xs font-medium ${getConfidenceColor(draft.categoryConfidence)}`}>
                      {formatConfidence(draft.categoryConfidence)}
                    </span>
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={qcVerification.categoryVerified}
                        onChange={(e) => setQcVerification(prev => ({ ...prev, categoryVerified: e.target.checked }))}
                        className="h-4 w-4 rounded border-purple-300 text-purple-600 focus:ring-purple-500"
                      />
                      <span className="text-xs text-purple-700">Verified</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* QC Status Summary */}
              <div className={`rounded-lg p-3 text-center ${allQcVerified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                {allQcVerified ? (
                  <span className="flex items-center justify-center gap-2 font-medium">
                    <CheckCircle className="h-4 w-4" />
                    All QC checks passed - Ready to approve
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2 font-medium">
                    <AlertCircle className="h-4 w-4" />
                    {3 - [qcVerification.genericVerified, qcVerification.manufacturerVerified, qcVerification.categoryVerified].filter(Boolean).length} verification(s) remaining
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Column 3: Editable Form */}
        <div className="rounded-lg border border-green-200 bg-green-50 p-4">
          <h2 className="mb-4 text-lg font-semibold text-green-900">Final Product Data</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-green-700">
                Product Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="mt-1 w-full rounded-lg border border-green-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-green-700">
                Slug
              </label>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) => handleInputChange('slug', e.target.value)}
                placeholder="Auto-generated if empty"
                className="mt-1 w-full rounded-lg border border-green-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-green-700">
                Category *
              </label>
              <select
                value={formData.categoryId}
                onChange={(e) => handleInputChange('categoryId', e.target.value)}
                className="mt-1 w-full rounded-lg border border-green-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">Select Category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-green-700">
                  MRP
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.mrp}
                  onChange={(e) => handleInputChange('mrp', e.target.value)}
                  className="mt-1 w-full rounded-lg border border-green-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-green-700">
                  Selling Price *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.sellingPrice}
                  onChange={(e) => handleInputChange('sellingPrice', e.target.value)}
                  className="mt-1 w-full rounded-lg border border-green-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-green-700">
                  Strength
                </label>
                <input
                  type="text"
                  value={formData.strength}
                  onChange={(e) => handleInputChange('strength', e.target.value)}
                  className="mt-1 w-full rounded-lg border border-green-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-green-700">
                  Dosage Form
                </label>
                <input
                  type="text"
                  value={formData.dosageForm}
                  onChange={(e) => handleInputChange('dosageForm', e.target.value)}
                  className="mt-1 w-full rounded-lg border border-green-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-green-700">
                Pack Size
              </label>
              <input
                type="text"
                value={formData.packSize}
                onChange={(e) => handleInputChange('packSize', e.target.value)}
                className="mt-1 w-full rounded-lg border border-green-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-green-700">
                Manufacturer
              </label>
              <input
                type="text"
                value={formData.manufacturer}
                onChange={(e) => handleInputChange('manufacturer', e.target.value)}
                className="mt-1 w-full rounded-lg border border-green-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-green-700">
                Short Description
              </label>
              <textarea
                rows={2}
                value={formData.shortDescription}
                onChange={(e) => handleInputChange('shortDescription', e.target.value)}
                className="mt-1 w-full rounded-lg border border-green-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-green-700">
                Description
              </label>
              <textarea
                rows={3}
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className="mt-1 w-full rounded-lg border border-green-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-green-700">
                SEO Title
              </label>
              <input
                type="text"
                value={formData.seoTitle}
                onChange={(e) => handleInputChange('seoTitle', e.target.value)}
                className="mt-1 w-full rounded-lg border border-green-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-green-700">
                SEO Description
              </label>
              <textarea
                rows={2}
                value={formData.seoDescription}
                onChange={(e) => handleInputChange('seoDescription', e.target.value)}
                className="mt-1 w-full rounded-lg border border-green-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-green-700">
                SEO Keywords
              </label>
              <input
                type="text"
                value={formData.seoKeywords}
                onChange={(e) => handleInputChange('seoKeywords', e.target.value)}
                placeholder="Comma-separated keywords"
                className="mt-1 w-full rounded-lg border border-green-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => handleInputChange('isActive', e.target.checked)}
                  className="h-4 w-4 rounded border-green-300 text-green-600 focus:ring-green-500"
                />
                <span className="text-sm text-green-700">Active</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.isFeatured}
                  onChange={(e) => handleInputChange('isFeatured', e.target.checked)}
                  className="h-4 w-4 rounded border-green-300 text-green-600 focus:ring-green-500"
                />
                <span className="text-sm text-green-700">Featured</span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
