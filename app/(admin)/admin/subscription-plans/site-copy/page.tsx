'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Loader2, Save } from 'lucide-react'
import type { SubscriptionsPageSettings } from '@/lib/subscriptions-page-settings'
import { DEFAULT_SUBSCRIPTIONS_PAGE_SETTINGS } from '@/lib/subscriptions-page-settings'

export default function SubscriptionsSiteCopyPage() {
  const [copy, setCopy] = useState<SubscriptionsPageSettings>(DEFAULT_SUBSCRIPTIONS_PAGE_SETTINGS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    ;(async () => {
      try {
        const res = await fetch('/api/admin/subscriptions-page')
        if (res.ok) {
          const data = await res.json()
          setCopy({ ...DEFAULT_SUBSCRIPTIONS_PAGE_SETTINGS, ...data })
        }
      } catch {
        setMessage({ type: 'error', text: 'লোড ব্যর্থ' })
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const set = (field: keyof SubscriptionsPageSettings, value: string) => {
    setCopy((prev) => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    setSaving(true)
    setMessage(null)
    try {
      const res = await fetch('/api/admin/subscriptions-page', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(copy),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok) {
        setCopy({ ...DEFAULT_SUBSCRIPTIONS_PAGE_SETTINGS, ...data })
        setMessage({ type: 'success', text: 'সংরক্ষিত হয়েছে' })
      } else {
        setMessage({ type: 'error', text: data.error || 'সংরক্ষণ ব্যর্থ' })
      }
    } catch {
      setMessage({ type: 'error', text: 'সংরক্ষণ ব্যর্থ' })
    } finally {
      setSaving(false)
    }
  }

  const labelClass = 'block text-sm font-medium text-gray-700 mb-1'
  const inputClass =
    'mt-0 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:ring-teal-500'

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-3xl space-y-6">
        <Link
          href="/admin/subscription-plans"
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-teal-700"
        >
          <ArrowLeft className="h-4 w-4" />
          প্ল্যান তালিকা
        </Link>

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">সাবস্ক্রিপশন ল্যান্ডিং — টেকস্ট</h1>
            <p className="mt-1 text-sm text-gray-600">
              /subscriptions পেজের হিরো, ট্রাস্ট লাইন ও “কেন সাবস্ক্রাইব” ব্লক। প্ল্যান কার্ডের নাম ও বুলিট{' '}
              <Link href="/admin/subscription-plans" className="text-teal-600 hover:underline">
                প্ল্যান সম্পাদনা
              </Link>{' '}
              থেকে।
            </p>
          </div>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            সংরক্ষণ
          </button>
        </div>

        {message ? (
          <div
            className={`rounded-lg px-4 py-3 text-sm ${
              message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
            }`}
          >
            {message.text}
          </div>
        ) : null}

        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">হিরো</h2>
          <div className="mt-4 space-y-4">
            <div>
              <label className={labelClass}>ব্যাজ (ছোট পিল টেকস্ট)</label>
              <input className={inputClass} value={copy.heroBadgeBn} onChange={(e) => set('heroBadgeBn', e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>শিরোনাম</label>
              <input className={inputClass} value={copy.heroTitleBn} onChange={(e) => set('heroTitleBn', e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>উপশিরোনাম</label>
              <textarea
                rows={2}
                className={inputClass}
                value={copy.heroSubtitleBn}
                onChange={(e) => set('heroSubtitleBn', e.target.value)}
              />
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">ট্রাস্ট সিগন্যাল (প্ল্যানের নিচে)</h2>
          <div className="mt-4 space-y-4">
            {(['trust1Bn', 'trust2Bn', 'trust3Bn'] as const).map((k, i) => (
              <div key={k}>
                <label className={labelClass}>লাইন {i + 1}</label>
                <input className={inputClass} value={copy[k]} onChange={(e) => set(k, e.target.value)} />
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">কেন সাবস্ক্রাইব করবেন</h2>
          <div className="mt-4 space-y-4">
            <div>
              <label className={labelClass}>সেকশন শিরোনাম</label>
              <input
                className={inputClass}
                value={copy.whySectionTitleBn}
                onChange={(e) => set('whySectionTitleBn', e.target.value)}
              />
            </div>
            <div>
              <label className={labelClass}>ভূমিকা প্যারাগ্রাফ</label>
              <textarea
                rows={2}
                className={inputClass}
                value={copy.whySectionSubtitleBn}
                onChange={(e) => set('whySectionSubtitleBn', e.target.value)}
              />
            </div>
            {([
              ['why1TitleBn', 'why1BodyBn', 'কার্ড ১'],
              ['why2TitleBn', 'why2BodyBn', 'কার্ড ২'],
              ['why3TitleBn', 'why3BodyBn', 'কার্ড ৩'],
            ] as const).map(([titleKey, bodyKey, lab]) => (
              <fieldset key={titleKey} className="rounded-lg border border-gray-100 bg-gray-50/80 p-4">
                <legend className="px-1 text-xs font-semibold uppercase text-gray-500">{lab}</legend>
                <div className="mt-2 space-y-3">
                  <div>
                    <label className={labelClass}>শিরোনাম</label>
                    <input
                      className={inputClass}
                      value={copy[titleKey]}
                      onChange={(e) => set(titleKey, e.target.value)}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>বিবরণ</label>
                    <textarea
                      rows={3}
                      className={inputClass}
                      value={copy[bodyKey]}
                      onChange={(e) => set(bodyKey, e.target.value)}
                    />
                  </div>
                </div>
              </fieldset>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
