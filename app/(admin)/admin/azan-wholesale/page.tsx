'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import {
  AlertCircle,
  BarChart3,
  ChevronRight,
  ExternalLink,
  Layers,
  Link2,
  Loader2,
  Package,
  RefreshCw,
  Sparkles,
  Store,
  Tag,
  Trash2,
} from 'lucide-react'

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
  effectiveSyncPages?: number
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

function SectionLabel({ step, title, subtitle }: { step: string; title: string; subtitle: string }) {
  return (
    <div className="mb-4 flex items-start gap-3">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-100 text-sm font-bold text-teal-800">
        {step}
      </span>
      <div>
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        <p className="mt-0.5 text-sm text-gray-500">{subtitle}</p>
      </div>
    </div>
  )
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
  const [unmappedFilter, setUnmappedFilter] = useState('')
  const [unmappedShowAll, setUnmappedShowAll] = useState(false)
  const [sourceCategoryInput, setSourceCategoryInput] = useState('')
  const [selectedLocalCategoryId, setSelectedLocalCategoryId] = useState('')
  const [savingMapping, setSavingMapping] = useState(false)

  const fetchSummary = useCallback(async () => {
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
  }, [])

  const fetchMappings = useCallback(async () => {
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
      setSelectedLocalCategoryId((prev) => {
        if (prev) return prev
        return data.categories?.[0]?.id ?? ''
      })
    } catch {
      toast.error('Failed to load category mappings')
    }
  }, [])

  useEffect(() => {
    fetchSummary()
    fetchMappings()
  }, [fetchSummary, fetchMappings])

  const filteredUnmapped = useMemo(() => {
    const q = unmappedFilter.trim().toLowerCase()
    if (!q) return unmapped
    return unmapped.filter(
      (u) =>
        u.sourceCategoryLabel.toLowerCase().includes(q) || u.sourceCategoryKey.toLowerCase().includes(q)
    )
  }, [unmapped, unmappedFilter])

  const unmappedChips = unmappedShowAll ? filteredUnmapped : filteredUnmapped.slice(0, 16)

  const handleSync = async () => {
    if (!confirm('Run Azan sync? New/updated products stay in Draft until you publish.')) return

    setSyncing(true)
    try {
      const res = await fetch('/api/admin/products/azan-sync', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Azan sync failed')
        return
      }
      toast.success(
        `Sync: ${data.summary?.fetched ?? 0} fetched, +${data.summary?.created ?? 0} new, ${data.summary?.updated ?? 0} updated, ${data.summary?.mappedToLocalCategory ?? 0} manual map` +
          (data.summary?.assignedViaAutoCategory
            ? `, ${data.summary.assignedViaAutoCategory} auto category`
            : '') +
          (data.summary?.newSourceCategoriesCreated
            ? `, ${data.summary.newSourceCategoriesCreated} new Halalzi categories`
            : '')
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
      toast.error('Enter a supplier category name')
      return
    }
    if (!selectedLocalCategoryId) {
      toast.error('Choose a Halalzi category')
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
    if (!confirm('Remove this mapping?')) return
    try {
      const res = await fetch(`/api/admin/products/azan-category-mappings?id=${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Failed to delete')
        return
      }
      toast.success('Mapping removed')
      fetchMappings()
    } catch {
      toast.error('Failed to delete')
    }
  }

  const handleMarginPublish = async () => {
    const margin = Number.parseFloat(marginPercent)
    if (!Number.isFinite(margin) || margin < 0) {
      toast.error('Enter a valid margin %')
      return
    }

    if (!confirm(`Apply ${margin}% margin on cost price and publish all Azan-sourced products that have a cost?`)) return

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
        `Updated ${data.summary?.updated ?? 0} products, skipped ${data.summary?.skippedMissingPurchasePrice ?? 0} (no cost price)`
      )
      fetchSummary()
    } catch {
      toast.error('Margin publish failed')
    } finally {
      setPublishing(false)
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8 pb-10">
      {/* Hero */}
      <div className="overflow-hidden rounded-2xl border border-teal-100/80 bg-gradient-to-br from-teal-50/90 via-white to-slate-50/80 p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-teal-600 text-white shadow-md shadow-teal-600/25">
              <Store className="h-7 w-7" strokeWidth={1.75} />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">Azan Wholesale</h1>
              <p className="mt-1 max-w-xl text-sm leading-relaxed text-gray-600">
                Pull the supplier catalog, map categories to Halalzi, set margin, then publish—without leaving
                this page.
              </p>
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2 sm:justify-end">
            <button
              type="button"
              onClick={() => {
                void fetchSummary()
                void fetchMappings()
              }}
              disabled={loadingSummary}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:border-teal-200 hover:bg-teal-50/50 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${loadingSummary ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <Link
              href="/admin/categories"
              className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:border-teal-200 hover:bg-teal-50/50"
            >
              <Layers className="h-4 w-4" />
              Categories
              <ExternalLink className="h-3.5 w-3.5 opacity-50" />
            </Link>
            <Link
              href="/admin/products"
              className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:border-teal-200 hover:bg-teal-50/50"
            >
              <Package className="h-4 w-4" />
              All products
            </Link>
          </div>
        </div>
        <p className="mt-4 flex flex-wrap items-center gap-2 text-xs text-gray-500">
          <span className="inline-flex items-center gap-1 rounded-full bg-white/80 px-2.5 py-1 ring-1 ring-gray-200/80">
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            Optional: set{' '}
            <code className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-[10px] text-gray-800">
              AZAN_WHOLESALE_AUTO_CREATE_SOURCE_CATEGORIES=true
            </code>{' '}
            to auto-create Halalzi categories for unmapped Azan names.
          </span>
        </p>
      </div>

      {/* Stats */}
      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        {loadingSummary ? (
          <div className="flex items-center justify-center gap-2 py-10 text-sm text-gray-500">
            <Loader2 className="h-5 w-5 animate-spin text-teal-600" />
            Loading numbers…
          </div>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="group rounded-xl border border-slate-100 bg-slate-50/50 p-4 transition hover:border-slate-200 hover:shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium uppercase tracking-wide text-slate-500">Azan-sourced</span>
                  <Package className="h-4 w-4 text-slate-400" />
                </div>
                <p className="mt-2 text-3xl font-bold tabular-nums text-slate-900">{summary?.total ?? 0}</p>
                <p className="mt-1 text-xs text-slate-500">Total in your DB</p>
              </div>
              <div className="group rounded-xl border border-emerald-100 bg-emerald-50/50 p-4 transition hover:border-emerald-200 hover:shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium uppercase tracking-wide text-emerald-600">Live</span>
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                    <Tag className="h-3.5 w-3.5" />
                  </span>
                </div>
                <p className="mt-2 text-3xl font-bold tabular-nums text-emerald-800">{summary?.published ?? 0}</p>
                <p className="mt-1 text-xs text-emerald-600/80">Visible on store</p>
              </div>
              <div className="group rounded-xl border border-amber-100 bg-amber-50/40 p-4 transition hover:border-amber-200 hover:shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium uppercase tracking-wide text-amber-700">Draft</span>
                  <span className="text-amber-500">○</span>
                </div>
                <p className="mt-2 text-3xl font-bold tabular-nums text-amber-900">{summary?.draft ?? 0}</p>
                <p className="mt-1 text-xs text-amber-700/80">Not on storefront</p>
              </div>
              <div className="group rounded-xl border border-rose-100 bg-rose-50/40 p-4 transition hover:border-rose-200 hover:shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium uppercase tracking-wide text-rose-600">No cost</span>
                  <AlertCircle className="h-4 w-4 text-rose-400" />
                </div>
                <p className="mt-2 text-3xl font-bold tabular-nums text-rose-800">{summary?.missingPrice ?? 0}</p>
                <p className="mt-1 text-xs text-rose-600/80">Can&apos;t price / margin yet</p>
              </div>
            </div>
            <p className="mt-4 border-t border-gray-100 pt-3 text-center text-xs text-gray-500">
              Counts every Azan-linked product (not only the “{summary?.categoryName ?? 'Azan'}” bucket).{' '}
              <Link href="/admin/products" className="text-teal-700 underline decoration-teal-200 underline-offset-2 hover:text-teal-800">
                Open products
              </Link>
            </p>
          </>
        )}
      </div>

      {coverage && 'error' in coverage && coverage.error && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <div>
            <p className="font-semibold">API comparison unavailable</p>
            <p className="mt-1 text-amber-900/90">{coverage.error}</p>
          </div>
        </div>
      )}

      {coverage && !('error' in coverage && coverage.error) && 'apiTotal' in coverage && (
        <details className="group rounded-2xl border border-sky-100 bg-gradient-to-b from-sky-50/80 to-white open:shadow-sm">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-2xl p-4 pr-3 transition hover:bg-sky-50/50 [&::-webkit-details-marker]:hidden">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-100 text-sky-700">
                <BarChart3 className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-sky-950">API vs database</p>
                <p className="text-sm text-sky-800/80">
                  Gap:{' '}
                  <span className="font-mono font-semibold text-sky-950">
                    {coverage.gapToApiTotal ?? '—'}
                  </span>
                  {coverage.apiTotal != null && (
                    <span className="text-sky-700/90">
                      {' '}
                      (API {coverage.apiTotal} · DB {coverage.dbTotalInCategory})
                    </span>
                  )}
                </p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 shrink-0 text-sky-400 transition group-open:rotate-90" />
          </summary>
          <div className="border-t border-sky-100/80 px-4 pb-4 pt-0">
            <p className="pt-3 text-xs text-sky-800/90">
              Compares Azan <code className="rounded bg-sky-100/80 px-1">meta.total</code> to rows linked by supplier
              SKU, source category, or the default reseller category.
            </p>
            <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
              <div className="flex justify-between gap-2 rounded-lg bg-white/70 px-3 py-2.5 ring-1 ring-sky-100/80">
                <dt className="text-sky-800">API total</dt>
                <dd className="font-mono font-semibold text-sky-950">{coverage.apiTotal ?? '—'}</dd>
              </div>
              <div className="flex justify-between gap-2 rounded-lg bg-white/70 px-3 py-2.5 ring-1 ring-sky-100/80">
                <dt className="text-sky-800">DB (Azan-sourced)</dt>
                <dd className="font-mono font-semibold text-sky-950">{coverage.dbTotalInCategory}</dd>
              </div>
              <div className="flex justify-between gap-2 rounded-lg bg-white/70 px-3 py-2.5 ring-1 ring-sky-100/80">
                <dt className="text-sky-800">Max / sync run</dt>
                <dd className="text-right text-xs text-sky-900">
                  <span className="font-mono font-semibold">
                    {coverage.maxProductsPerSyncRun}
                  </span>
                  <span className="block text-[11px] text-sky-700/80">
                    per_page {coverage.apiPerPage} · pages env {coverage.syncMaxPagesEnv}
                    {typeof coverage.effectiveSyncPages === 'number' ? ` → ${coverage.effectiveSyncPages} used` : ''}
                  </span>
                </dd>
              </div>
              <div className="flex justify-between gap-2 rounded-lg bg-white/70 px-3 py-2.5 ring-1 ring-sky-100/80">
                <dt className="text-sky-800">Full catalog in 1 run?</dt>
                <dd className="text-right font-semibold text-sky-950">
                  {coverage.fullCatalogCoveredInOneRun == null
                    ? '—'
                    : coverage.fullCatalogCoveredInOneRun
                      ? 'Yes'
                      : 'No — raise pages or re-sync'}
                </dd>
              </div>
            </dl>
            {coverage.note && (
              <p className="mt-3 rounded-lg bg-amber-50/80 px-3 py-2 text-xs text-amber-950 ring-1 ring-amber-100/80">
                {coverage.note}
              </p>
            )}
          </div>
        </details>
      )}

      {/* Step 1 & 2 */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <SectionLabel step="1" title="Import from Azan" subtitle="Fetches the latest supplier catalog. New items start as draft." />
          <button
            type="button"
            onClick={handleSync}
            disabled={syncing}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-sky-600 py-3 text-sm font-semibold text-white shadow-md shadow-sky-600/20 transition hover:bg-sky-700 disabled:opacity-50"
          >
            {syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            {syncing ? 'Syncing…' : 'Run catalog sync (draft)'}
          </button>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <SectionLabel
            step="2"
            title="Price & go live"
            subtitle="Applies margin on purchase price, then publishes every Azan-sourced product that has a cost."
          />
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="min-w-0 flex-1">
              <label htmlFor="margin" className="text-xs font-medium text-gray-600">
                Margin on cost (%)
              </label>
              <input
                id="margin"
                type="number"
                min="0"
                step="0.1"
                value={marginPercent}
                onChange={(e) => setMarginPercent(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-gray-200 bg-gray-50/50 px-3 py-2.5 text-sm font-medium text-gray-900 focus:border-teal-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              />
            </div>
            <button
              type="button"
              onClick={handleMarginPublish}
              disabled={publishing}
              className="w-full shrink-0 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-teal-600/20 transition hover:bg-teal-700 disabled:opacity-50 sm:w-auto"
            >
              {publishing ? 'Working…' : 'Apply & publish all'}
            </button>
          </div>
        </div>
      </div>

      {/* Mapping */}
      <div className="rounded-2xl border border-indigo-100/80 bg-gradient-to-b from-indigo-50/50 to-white p-5 shadow-sm sm:p-6">
        <div className="mb-5 flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
            <Link2 className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Category mapping</h2>
            <p className="mt-1 text-sm text-gray-600">
              Tell Halalzi which local category should receive each Azan label. The next sync moves products
              automatically.
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <div>
            <label htmlFor="source-cat" className="text-xs font-medium text-gray-600">
              Azan (supplier) name
            </label>
            <input
              id="source-cat"
              value={sourceCategoryInput}
              onChange={(e) => setSourceCategoryInput(e.target.value)}
              placeholder="e.g. Face Care"
              className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
          <div>
            <label htmlFor="local-cat" className="text-xs font-medium text-gray-600">
              Halalzi category
            </label>
            <select
              id="local-cat"
              value={selectedLocalCategoryId}
              onChange={(e) => setSelectedLocalCategoryId(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              {categories.length === 0 ? (
                <option value="">Add categories in admin first</option>
              ) : (
                categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))
              )}
            </select>
          </div>
          <button
            type="button"
            onClick={() => handleSaveMapping()}
            disabled={savingMapping || !categories.length}
            className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-600/20 transition hover:bg-indigo-700 disabled:opacity-50"
          >
            {savingMapping ? 'Saving…' : 'Save'}
          </button>
        </div>

        {unmapped.length > 0 && (
          <div className="mt-6 rounded-2xl border border-amber-200/80 bg-amber-50/40 p-4">
            <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm font-semibold text-amber-950">Quick pick — unmapped supplier labels</p>
              <input
                type="search"
                value={unmappedFilter}
                onChange={(e) => setUnmappedFilter(e.target.value)}
                placeholder="Filter…"
                className="w-full rounded-lg border border-amber-200/80 bg-white px-3 py-1.5 text-sm sm:max-w-xs"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {unmappedChips.length === 0 && (
                <p className="text-sm text-amber-900/80">No matches. Clear the filter to see all.</p>
              )}
              {unmappedChips.map((u) => (
                <button
                  type="button"
                  key={u.sourceCategoryKey}
                  onClick={() => {
                    setSourceCategoryInput(u.sourceCategoryLabel)
                    document.getElementById('source-cat')?.focus()
                  }}
                  className="group inline-flex items-center gap-1.5 rounded-full border border-amber-300/80 bg-white px-3 py-1.5 text-left text-sm text-amber-950 shadow-sm transition hover:border-amber-400 hover:bg-amber-50"
                  title={`${u.products} products with this label`}
                >
                  <span className="max-w-[200px] truncate font-medium">{u.sourceCategoryLabel}</span>
                  <span className="rounded-md bg-amber-100/90 px-1.5 py-0.5 text-xs tabular-nums text-amber-900">
                    {u.products}
                  </span>
                </button>
              ))}
            </div>
            {filteredUnmapped.length > 16 && (
              <button
                type="button"
                onClick={() => setUnmappedShowAll((v) => !v)}
                className="mt-3 text-sm font-medium text-amber-900 underline decoration-amber-300 underline-offset-2"
              >
                {unmappedShowAll ? 'Show less' : `Show all ${filteredUnmapped.length}`}
              </button>
            )}
          </div>
        )}

        <div className="mt-6 overflow-hidden rounded-2xl border border-gray-200/80 bg-white">
          <div className="border-b border-gray-100 bg-gray-50/80 px-4 py-2.5">
            <p className="text-sm font-semibold text-gray-800">Saved mappings ({mappings.length})</p>
          </div>
          {mappings.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-gray-500">No mappings yet. Add one above or quick-pick a label.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {mappings.map((m) => (
                <li key={m.id} className="flex items-center justify-between gap-3 px-4 py-3 transition hover:bg-gray-50/80">
                  <div className="min-w-0 flex items-center gap-2 text-sm">
                    <span className="truncate font-medium text-gray-900">{m.sourceCategoryLabel || m.sourceCategoryKey}</span>
                    <ChevronRight className="h-4 w-4 shrink-0 text-gray-300" />
                    <span className="truncate text-indigo-700">{m.localCategory.name}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteMapping(m.id)}
                    className="flex shrink-0 items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-rose-600 transition hover:bg-rose-50"
                    aria-label="Remove mapping"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
