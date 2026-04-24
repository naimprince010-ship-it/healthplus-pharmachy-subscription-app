'use client'

import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Loader2, RefreshCw, Store } from 'lucide-react'

interface AzanSummary {
  categoryName: string
  total: number
  published: number
  draft: number
  missingPrice: number
}

interface AzanCoverage {
  apiTotal: number | null
  apiLastPage: number | null
  apiPerPage: number | null
  dbTotalInCategory: number
  gapToApiTotal: number | null
  maxProductsPerSyncRun: number
  syncMaxPagesEnv: number
  fullCatalogCoveredInOneRun: boolean | null
  endpoint: string
  firstPageUrl: string
  note: string | null
  error?: string
}

interface MappingItem {
  id: string
  sourceCategoryKey: string
  sourceCategoryLabel: string | null
  isActive: boolean
  localCategory: { id: string; name: string; slug: string }
}

interface CategoryOption {
  id: string
  name: string
  slug: string
}

interface UnmappedItem {
  sourceCategoryKey: string
  sourceCategoryLabel: string
  products: number
}

export default function AzanWholesalePage() {
  const [summary, setSummary] = useState<AzanSummary | null>(null)
  const [coverage, setCoverage] = useState<AzanCoverage | null | undefined>(undefined)
  const [loadingSummary, setLoadingSummary] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [marginPercent, setMarginPercent] = useState('30')
  const [mappings, setMappings] = useState<MappingItem[]>([])
  const [categories, setCategories] = useState<CategoryOption[]>([])
  const [unmapped, setUnmapped] = useState<UnmappedItem[]>([])
  const [sourceCategoryInput, setSourceCategoryInput] = useState('')
  const [selectedLocalCategoryId, setSelectedLocalCategoryId] = useState('')
  const [savingMapping, setSavingMapping] = useState(false)

  const fetchSummary = async () => {
    setLoadingSummary(true)
    try {
      const res = await fetch('/api/admin/products/azan-sync?compare=1')
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Failed to load Azan stats')
        return
      }
      setSummary(data.summary)
      setCoverage(data.coverage ?? null)
    } catch {
      toast.error('Failed to load Azan stats')
    } finally {
      setLoadingSummary(false)
    }
  }

  const fetchMappings = async () => {
    try {
      const res = await fetch('/api/admin/products/azan-category-mappings')
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Failed to load category mappings')
        return
      }
      setMappings(data.mappings || [])
      setCategories(data.categories || [])
      setUnmapped(data.unmapped || [])
      if (!selectedLocalCategoryId && data.categories?.length) {
        setSelectedLocalCategoryId(data.categories[0].id)
      }
    } catch {
      toast.error('Failed to load category mappings')
    }
  }

  useEffect(() => {
    fetchSummary()
    fetchMappings()
  }, [])

  const handleSync = async () => {
    if (!confirm('Sync Azan products now? Products will stay draft by default.')) return

    setSyncing(true)
    try {
      const res = await fetch('/api/admin/products/azan-sync', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Azan sync failed')
        return
      }
      toast.success(
        `Sync complete: ${data.summary?.fetched ?? 0} fetched, ${data.summary?.created ?? 0} created, ${data.summary?.updated ?? 0} updated, ${data.summary?.mappedToLocalCategory ?? 0} mapped`
      )
      fetchSummary()
      fetchMappings()
    } catch {
      toast.error('Azan sync failed')
    } finally {
      setSyncing(false)
    }
  }

  const handleSaveMapping = async (sourceCategoryKey?: string) => {
    const source = (sourceCategoryKey || sourceCategoryInput).trim()
    if (!source) {
      toast.error('Enter source category key/name')
      return
    }
    if (!selectedLocalCategoryId) {
      toast.error('Select local category')
      return
    }

    setSavingMapping(true)
    try {
      const res = await fetch('/api/admin/products/azan-category-mappings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceCategoryKey: source,
          sourceCategoryLabel: source,
          localCategoryId: selectedLocalCategoryId,
          isActive: true,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Failed to save mapping')
        return
      }
      toast.success('Mapping saved')
      setSourceCategoryInput('')
      fetchMappings()
    } catch {
      toast.error('Failed to save mapping')
    } finally {
      setSavingMapping(false)
    }
  }

  const handleDeleteMapping = async (id: string) => {
    if (!confirm('Delete this mapping?')) return
    try {
      const res = await fetch(`/api/admin/products/azan-category-mappings?id=${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Failed to delete mapping')
        return
      }
      toast.success('Mapping removed')
      fetchMappings()
    } catch {
      toast.error('Failed to delete mapping')
    }
  }

  const handleMarginPublish = async () => {
    const margin = Number.parseFloat(marginPercent)
    if (!Number.isFinite(margin) || margin < 0) {
      toast.error('Enter a valid margin percent')
      return
    }

    if (!confirm(`Apply ${margin}% margin and publish all Azan products with cost price?`)) return

    setPublishing(true)
    try {
      const res = await fetch('/api/admin/products/bulk-margin-publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          marginPercent: margin,
          publish: true,
          applyToAzanCategory: true,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Margin publish failed')
        return
      }
      toast.success(
        `Updated ${data.summary?.updated ?? 0} products, skipped ${data.summary?.skippedMissingPurchasePrice ?? 0} (missing price)`
      )
      fetchSummary()
    } catch {
      toast.error('Margin publish failed')
    } finally {
      setPublishing(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Azan Wholesale</h1>
          <p className="mt-2 text-sm text-gray-600">
            Sync Azan catalog, apply margin, and publish from one place.
          </p>
        </div>
        <Store className="h-10 w-10 text-teal-600" />
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        {loadingSummary ? (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading Azan summary...
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-4">
            <div className="rounded-lg bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">Total</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{summary?.total ?? 0}</p>
            </div>
            <div className="rounded-lg bg-green-50 p-4">
              <p className="text-xs uppercase tracking-wide text-green-600">Published</p>
              <p className="mt-1 text-2xl font-bold text-green-700">{summary?.published ?? 0}</p>
            </div>
            <div className="rounded-lg bg-amber-50 p-4">
              <p className="text-xs uppercase tracking-wide text-amber-700">Draft</p>
              <p className="mt-1 text-2xl font-bold text-amber-800">{summary?.draft ?? 0}</p>
            </div>
            <div className="rounded-lg bg-rose-50 p-4">
              <p className="text-xs uppercase tracking-wide text-rose-600">Missing Cost Price</p>
              <p className="mt-1 text-2xl font-bold text-rose-700">{summary?.missingPrice ?? 0}</p>
            </div>
          </div>
        )}
      </div>

      {coverage && 'error' in coverage && coverage.error && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-semibold">API coverage (compare) unavailable</p>
          <p className="mt-1 text-amber-800">{coverage.error}</p>
        </div>
      )}

      {coverage && !('error' in coverage && coverage.error) && 'apiTotal' in coverage && (
        <div className="rounded-lg border border-sky-200 bg-sky-50 p-5">
          <h2 className="text-sm font-semibold text-sky-900">Azan API ↔ your DB (tracking)</h2>
          <p className="mt-1 text-xs text-sky-800">
            Compares catalog size from Azan (page 1 <code className="rounded bg-sky-100 px-1">meta.total</code>) with
            products in &quot;{summary?.categoryName ?? 'Azan'}&quot; category.
          </p>
          <dl className="mt-3 grid gap-2 text-sm md:grid-cols-2">
            <div className="flex justify-between gap-2 rounded bg-white/60 px-3 py-2">
              <dt className="text-sky-700">API total (Azan)</dt>
              <dd className="font-mono font-semibold text-sky-950">{coverage.apiTotal ?? '—'}</dd>
            </div>
            <div className="flex justify-between gap-2 rounded bg-white/60 px-3 py-2">
              <dt className="text-sky-700">DB total (this category)</dt>
              <dd className="font-mono font-semibold text-sky-950">{coverage.dbTotalInCategory}</dd>
            </div>
            <div className="flex justify-between gap-2 rounded bg-white/60 px-3 py-2">
              <dt className="text-sky-700">Gap (API − DB)</dt>
              <dd className="font-mono font-semibold text-sky-950">{coverage.gapToApiTotal ?? '—'}</dd>
            </div>
            <div className="flex justify-between gap-2 rounded bg-white/60 px-3 py-2">
              <dt className="text-sky-700">Max per sync run</dt>
              <dd className="text-xs text-sky-900">
                <span className="font-mono font-semibold">
                  {coverage.maxProductsPerSyncRun} = per_page {coverage.apiPerPage} × AZAN_WHOLESALE_MAX_PAGES (
                  {coverage.syncMaxPagesEnv})
                </span>
              </dd>
            </div>
            <div className="md:col-span-2 flex flex-wrap items-center justify-between gap-2 rounded bg-white/60 px-3 py-2">
              <dt className="text-sky-700">One run can load full API catalog?</dt>
              <dd className="font-semibold text-sky-950">
                {coverage.fullCatalogCoveredInOneRun == null
                  ? '—'
                  : coverage.fullCatalogCoveredInOneRun
                    ? 'Yes'
                    : 'No — increase max pages or run sync multiple times'}
              </dd>
            </div>
          </dl>
          {coverage.note && (
            <p className="mt-3 text-xs text-sky-900 border-t border-sky-200/80 pt-3">{coverage.note}</p>
          )}
        </div>
      )}

      <div className="rounded-lg border border-teal-100 bg-teal-50 p-5">
        <div className="flex flex-wrap items-end gap-3">
          <button
            onClick={handleSync}
            disabled={syncing}
            className="flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-50"
          >
            {syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Sync Azan (Draft)
          </button>

          <div>
            <label className="block text-xs font-medium uppercase tracking-wide text-teal-700">
              Margin %
            </label>
            <input
              type="number"
              min="0"
              step="0.1"
              value={marginPercent}
              onChange={(e) => setMarginPercent(e.target.value)}
              className="mt-1 w-28 rounded-lg border border-teal-200 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <button
            onClick={handleMarginPublish}
            disabled={publishing}
            className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-50"
          >
            {publishing ? 'Publishing...' : 'Apply Margin + Publish All Azan'}
          </button>
        </div>
      </div>

      <div className="rounded-lg border border-indigo-100 bg-indigo-50 p-5 space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-indigo-900">Azan Category Mapping</h2>
          <p className="mt-1 text-xs text-indigo-800">
            Map supplier category names to your local categories. Next sync will auto-place products category-wise.
          </p>
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs font-medium uppercase tracking-wide text-indigo-700">Source category</label>
            <input
              value={sourceCategoryInput}
              onChange={(e) => setSourceCategoryInput(e.target.value)}
              placeholder="e.g. skin care"
              className="mt-1 w-56 rounded-lg border border-indigo-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium uppercase tracking-wide text-indigo-700">Local category</label>
            <select
              value={selectedLocalCategoryId}
              onChange={(e) => setSelectedLocalCategoryId(e.target.value)}
              className="mt-1 w-56 rounded-lg border border-indigo-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={() => handleSaveMapping()}
            disabled={savingMapping}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {savingMapping ? 'Saving...' : 'Save Mapping'}
          </button>
        </div>

        {unmapped.length > 0 && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
            <p className="text-xs font-semibold text-amber-900">Unmapped source categories detected</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {unmapped.slice(0, 12).map((u) => (
                <button
                  key={u.sourceCategoryKey}
                  onClick={() => {
                    setSourceCategoryInput(u.sourceCategoryLabel)
                    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })
                  }}
                  className="rounded-full border border-amber-300 bg-white px-3 py-1 text-xs text-amber-900 hover:bg-amber-100"
                  title={`${u.products} products`}
                >
                  {u.sourceCategoryLabel} ({u.products})
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="rounded-lg border border-indigo-200 bg-white p-3">
          <p className="text-xs font-semibold text-indigo-900">Active mappings ({mappings.length})</p>
          <div className="mt-2 space-y-2">
            {mappings.length === 0 && <p className="text-xs text-gray-500">No mappings yet.</p>}
            {mappings.map((m) => (
              <div key={m.id} className="flex items-center justify-between rounded border border-gray-200 px-3 py-2 text-sm">
                <div>
                  <span className="font-medium text-gray-900">{m.sourceCategoryLabel || m.sourceCategoryKey}</span>
                  <span className="mx-2 text-gray-400">→</span>
                  <span className="text-indigo-700 font-medium">{m.localCategory.name}</span>
                </div>
                <button
                  onClick={() => handleDeleteMapping(m.id)}
                  className="text-xs text-red-600 hover:text-red-700"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
