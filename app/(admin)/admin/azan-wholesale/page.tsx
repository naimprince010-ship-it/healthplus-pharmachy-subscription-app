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

export default function AzanWholesalePage() {
  const [summary, setSummary] = useState<AzanSummary | null>(null)
  const [coverage, setCoverage] = useState<AzanCoverage | null | undefined>(undefined)
  const [loadingSummary, setLoadingSummary] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [marginPercent, setMarginPercent] = useState('30')

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

  useEffect(() => {
    fetchSummary()
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
        `Sync complete: ${data.summary?.fetched ?? 0} fetched, ${data.summary?.created ?? 0} created, ${data.summary?.updated ?? 0} updated`
      )
      fetchSummary()
    } catch {
      toast.error('Azan sync failed')
    } finally {
      setSyncing(false)
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
    </div>
  )
}
