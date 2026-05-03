'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Loader2, Plus, Trash2, Pencil, ExternalLink } from 'lucide-react'
import { BlogSponsorPlacement } from '@prisma/client'

type SponsorAd = {
  id: string
  sponsorLabel: string
  imageUrl: string | null
  headline: string | null
  targetUrl: string
  placement: BlogSponsorPlacement
  priority: number
  isActive: boolean
  startAt: string | null
  endAt: string | null
  internalNotes: string | null
  updatedAt: string
}

const PLACEMENT_LABEL: Record<BlogSponsorPlacement, string> = {
  BLOG_LIST_TOP: 'Blog list (/blog): above article grid',
  BLOG_ARTICLE_SIDEBAR_TOP: 'Blog article sidebar (desktop)',
}

function toLocalInputValue(iso: string | null | undefined): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function fromLocalInputValue(v: string): string | null {
  const t = v?.trim()
  if (!t) return null
  const d = new Date(t)
  if (Number.isNaN(d.getTime())) return null
  return d.toISOString()
}

export default function BlogSponsorsAdminPage() {
  const [ads, setAds] = useState<SponsorAd[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState({
    sponsorLabel: '',
    imageUrl: '',
    headline: '',
    targetUrl: '',
    placement: BlogSponsorPlacement.BLOG_LIST_TOP as BlogSponsorPlacement,
    priority: 0,
    isActive: true,
    startAt: '',
    endAt: '',
    internalNotes: '',
  })

  const placementOptions = useMemo(() => Object.values(BlogSponsorPlacement), [])

  const fetchAds = useCallback(async () => {
    setLoading(true)
    setMsg(null)
    try {
      const res = await fetch('/api/admin/blog-sponsor-ads')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Load failed')
      setAds(data.ads || [])
    } catch (e) {
      setMsg({ type: 'err', text: e instanceof Error ? e.message : 'Failed to load sponsor ads' })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAds()
  }, [fetchAds])

  const resetForm = () => {
    setEditId(null)
    setForm({
      sponsorLabel: '',
      imageUrl: '',
      headline: '',
      targetUrl: '',
      placement: BlogSponsorPlacement.BLOG_LIST_TOP,
      priority: 0,
      isActive: true,
      startAt: '',
      endAt: '',
      internalNotes: '',
    })
  }

  const startEdit = (ad: SponsorAd) => {
    setEditId(ad.id)
    setForm({
      sponsorLabel: ad.sponsorLabel,
      imageUrl: ad.imageUrl || '',
      headline: ad.headline || '',
      targetUrl: ad.targetUrl,
      placement: ad.placement,
      priority: ad.priority,
      isActive: ad.isActive,
      startAt: toLocalInputValue(ad.startAt),
      endAt: toLocalInputValue(ad.endAt),
      internalNotes: ad.internalNotes || '',
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMsg(null)

    try {
      const imgTrim = form.imageUrl.trim()
      const headTrim = form.headline.trim()

      const payload: Record<string, unknown> = editId
        ? {
            sponsorLabel: form.sponsorLabel.trim(),
            imageUrl: imgTrim ? imgTrim : null,
            headline: headTrim ? headTrim : null,
            targetUrl: form.targetUrl.trim(),
            placement: form.placement,
            priority: Number(form.priority) || 0,
            isActive: form.isActive,
            startAt: fromLocalInputValue(form.startAt),
            endAt: fromLocalInputValue(form.endAt),
            internalNotes: form.internalNotes.trim() || null,
          }
        : {
            sponsorLabel: form.sponsorLabel.trim(),
            ...(imgTrim ? { imageUrl: imgTrim } : {}),
            ...(headTrim ? { headline: headTrim } : {}),
            targetUrl: form.targetUrl.trim(),
            placement: form.placement,
            priority: Number(form.priority) || 0,
            isActive: form.isActive,
            startAt: fromLocalInputValue(form.startAt),
            endAt: fromLocalInputValue(form.endAt),
            internalNotes: form.internalNotes.trim() || undefined,
          }

      const url = editId ? `/api/admin/blog-sponsor-ads/${editId}` : '/api/admin/blog-sponsor-ads'
      const method = editId ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Save failed')

      setMsg({
        type: 'ok',
        text: editId ? 'স্পন্সর বিজ্ঞাপন আপডেট হয়েছে।' : 'নতুন স্পন্সর বিজ্ঞাপন যোগ হয়েছে।',
      })
      resetForm()
      await fetchAds()
    } catch (e) {
      setMsg({
        type: 'err',
        text: e instanceof Error ? e.message : 'সেভ করা যায়নি',
      })
    } finally {
      setSaving(false)
    }
  }

  const remove = async (id: string) => {
    if (!confirm('Delete this sponsor placement?')) return
    try {
      const res = await fetch(`/api/admin/blog-sponsor-ads/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error || 'Delete failed')
      }
      setMsg({ type: 'ok', text: 'মুছে ফেলা হয়েছে।' })
      if (editId === id) resetForm()
      await fetchAds()
    } catch (e) {
      setMsg({ type: 'err', text: e instanceof Error ? e.message : 'মুছে ফেলতে ব্যর্থ' })
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">Blog sponsor ads</h1>
            <p className="mt-1 text-sm text-gray-600">
              ছোট স্পন্সর্ড স্পেস—ব্লগ লিস্ট ও আর্টিকেল সাইডবার। পাবলিক সাইটে <strong className="font-semibold">স্পন্সর্ড</strong>{' '}
              লেভেল দেখাবে। টাকার হিসাব এখানে নয়; invoicing এক্সটার্নাল করে মেয়াদ সেট করুন।
            </p>
            <Link href="/blog" target="_blank" className="mt-3 inline-flex items-center gap-1 text-sm text-teal-600 hover:underline">
              ব্লগ দেখুন <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
        </div>

        {msg && (
          <div
            className={`rounded-lg border p-3 text-sm ${msg.type === 'ok'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                : 'border-red-200 bg-red-50 text-red-800'
              }`}
          >
            {msg.text}
          </div>
        )}

        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
            {editId ? <Pencil className="h-5 w-5 text-teal-600" /> : <Plus className="h-5 w-5 text-teal-600" />}
            {editId ? 'Edit placement' : 'Add placement'}
          </h2>
          <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold uppercase text-gray-500">Advertiser name (shown on site)</label>
              <input
                required
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                value={form.sponsorLabel}
                onChange={(e) => setForm({ ...form, sponsorLabel: e.target.value })}
                placeholder='যেমন "Brand Ltd"'
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-gray-500">Placement</label>
              <select
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                value={form.placement}
                onChange={(e) =>
                  setForm({ ...form, placement: e.target.value as BlogSponsorPlacement })
                }
              >
                {placementOptions.map((p) => (
                  <option key={p} value={p}>
                    {PLACEMENT_LABEL[p]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-gray-500">Priority (higher shows first)</label>
              <input
                type="number"
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: Number(e.target.value) })}
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold uppercase text-gray-500">
                Target URL (https://… অ্যাডভার্টাইজারের ল্যান্ডিং)
              </label>
              <input
                required
                type="url"
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                value={form.targetUrl}
                onChange={(e) => setForm({ ...form, targetUrl: e.target.value })}
                placeholder="https://..."
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold uppercase text-gray-500">Banner image URL (ছোট ব্যানার; বিকল্প)</label>
              <input
                type="url"
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                value={form.imageUrl}
                onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                placeholder="https://... খালি থাকলে শুধু হেডলাইন লাগবে"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold uppercase text-gray-500">Text headline (যখন ছবি নেই অথবা অতিরিক্ত কপি)</label>
              <input
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                value={form.headline}
                onChange={(e) => setForm({ ...form, headline: e.target.value })}
                placeholder="যেমন: ট্রায়াল প্যাক ২০% ছাড়"
              />
              <p className="mt-1 text-xs text-gray-500">একটাতে টেক্সট বা ছবির URL অন্তত একটি দিতে হবে।</p>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-gray-500">Start (local time)</label>
              <input
                type="datetime-local"
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                value={form.startAt}
                onChange={(e) => setForm({ ...form, startAt: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-gray-500">End (local time)</label>
              <input
                type="datetime-local"
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                value={form.endAt}
                onChange={(e) => setForm({ ...form, endAt: e.target.value })}
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold uppercase text-gray-500">Internal notes (invoice id, টাকার রেট—গ্রাহক দেখাবে না)</label>
              <textarea
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                rows={2}
                value={form.internalNotes}
                onChange={(e) => setForm({ ...form, internalNotes: e.target.value })}
              />
            </div>
            <label className="flex items-center gap-2 md:col-span-2">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
              />
              <span className="text-sm text-gray-700">Active</span>
            </label>
            <div className="flex flex-wrap gap-3 md:col-span-2">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-60"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : editId ? 'Update' : 'Create'}
              </button>
              {editId && (
                <button
                  type="button"
                  onClick={() => resetForm()}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
                >
                  Cancel edit
                </button>
              )}
            </div>
          </form>
        </section>

        <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b bg-gray-50 px-6 py-3 text-sm font-medium text-gray-700">All placements</div>
          {loading ? (
            <div className="flex justify-center py-16 text-gray-500">
              <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
            </div>
          ) : ads.length === 0 ? (
            <p className="p-10 text-center text-gray-600">এখনো কোনো স্লট যোগ করা হয়নি।</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500">
                  <tr>
                    <th className="px-4 py-3">Advertiser</th>
                    <th className="px-4 py-3">Where</th>
                    <th className="px-4 py-3">Priority</th>
                    <th className="px-4 py-3">Schedule</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {ads.map((ad) => (
                    <tr key={ad.id} className="text-sm">
                      <td className="max-w-[200px] px-4 py-3">
                        <div className="font-medium text-gray-900">{ad.sponsorLabel}</div>
                        <a href={ad.targetUrl} target="_blank" rel="noopener noreferrer" className="truncate text-teal-600 hover:underline">
                          {ad.targetUrl}
                        </a>
                      </td>
                      <td className="whitespace-normal px-4 py-3 text-gray-700">{PLACEMENT_LABEL[ad.placement]}</td>
                      <td className="px-4 py-3">{ad.priority}</td>
                      <td className="px-4 py-3 text-xs text-gray-600">
                        {ad.startAt || ad.endAt ? (
                          <>
                            {ad.startAt ? new Date(ad.startAt).toLocaleString() : '…'} →{' '}
                            {ad.endAt ? new Date(ad.endAt).toLocaleString() : 'open'}
                          </>
                        ) : (
                          'Always (no window)'
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${ad.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-200 text-gray-700'
                            }`}
                        >
                          {ad.isActive ? 'Active' : 'Off'}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right">
                        <button type="button" onClick={() => startEdit(ad)} className="mr-2 text-teal-600 hover:underline">
                          Edit
                        </button>
                        <button type="button" onClick={() => remove(ad.id)} className="inline-flex items-center gap-1 text-red-600 hover:underline">
                          <Trash2 className="h-3 w-3" /> Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
