"use client"

import { useEffect, useState } from 'react'

export default function MembershipSettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    heroHeadlineBn: '',
    heroSubheadlineBn: '',
    guaranteeTextBn: '',
    testimonialsJson: [] as Array<{ name: string; text: string }>,
  })
  const [error, setError] = useState('')
  const [ok, setOk] = useState('')

  useEffect(() => {
    const run = async () => {
      try {
        const res = await fetch('/api/admin/membership-settings', { credentials: 'include' })
        const data = await res.json()
        setForm({
          heroHeadlineBn: data.heroHeadlineBn || form.heroHeadlineBn,
          heroSubheadlineBn: data.heroSubheadlineBn || form.heroSubheadlineBn,
          guaranteeTextBn: data.guaranteeTextBn || form.guaranteeTextBn,
          testimonialsJson: Array.isArray(data.testimonialsJson) ? data.testimonialsJson : [],
        })
      } catch (e) {
        // ignore, defaults will be used
      } finally {
        setLoading(false)
      }
    }
    run()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const save = async () => {
    setSaving(true)
    setError('')
    setOk('')
    try {
      const res = await fetch('/api/admin/membership-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error('Failed to save')
      setOk('Saved')
    } catch (e: any) {
      setError(e.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="p-6">Loading...</div>

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-xl font-semibold">Membership Page Settings</h1>

      {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      {ok && <div className="rounded-md bg-green-50 p-3 text-sm text-green-700">{ok}</div>}

      <div className="rounded-lg bg-white p-4 shadow">
        <label className="block text-sm font-medium text-gray-700">Hero Headline (Bn)</label>
        <input
          className="mt-1 w-full rounded-lg border px-3 py-2"
          value={form.heroHeadlineBn}
          onChange={(e) => setForm((f) => ({ ...f, heroHeadlineBn: e.target.value }))}
        />
      </div>

      <div className="rounded-lg bg-white p-4 shadow">
        <label className="block text-sm font-medium text-gray-700">Hero Subheadline (Bn)</label>
        <textarea
          className="mt-1 w-full rounded-lg border px-3 py-2"
          rows={2}
          value={form.heroSubheadlineBn}
          onChange={(e) => setForm((f) => ({ ...f, heroSubheadlineBn: e.target.value }))}
        />
      </div>

      <div className="rounded-lg bg-white p-4 shadow">
        <label className="block text-sm font-medium text-gray-700">Guarantee Text (Bn)</label>
        <input
          className="mt-1 w-full rounded-lg border px-3 py-2"
          value={form.guaranteeTextBn}
          onChange={(e) => setForm((f) => ({ ...f, guaranteeTextBn: e.target.value }))}
        />
      </div>

      <div className="rounded-lg bg-white p-4 shadow">
        <div className="mb-2 flex items-center justify-between">
          <label className="block text-sm font-medium text-gray-700">Testimonials</label>
          <button
            onClick={() =>
              setForm((f) => ({ ...f, testimonialsJson: [...f.testimonialsJson, { name: '', text: '' }] }))
            }
            className="rounded-md bg-teal-600 px-3 py-1 text-sm text-white"
          >
            + Add
          </button>
        </div>
        <div className="space-y-3">
          {form.testimonialsJson.map((t, i) => (
            <div key={i} className="grid grid-cols-1 gap-2 md:grid-cols-2">
              <input
                className="rounded-lg border px-3 py-2"
                placeholder="Name"
                value={t.name}
                onChange={(e) => {
                  const arr = [...form.testimonialsJson]
                  arr[i] = { ...arr[i], name: e.target.value }
                  setForm((f) => ({ ...f, testimonialsJson: arr }))
                }}
              />
              <input
                className="rounded-lg border px-3 py-2"
                placeholder="Text"
                value={t.text}
                onChange={(e) => {
                  const arr = [...form.testimonialsJson]
                  arr[i] = { ...arr[i], text: e.target.value }
                  setForm((f) => ({ ...f, testimonialsJson: arr }))
                }}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <button
          disabled={saving}
          onClick={save}
          className="rounded-lg bg-teal-600 px-4 py-2 text-white disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  )
}
