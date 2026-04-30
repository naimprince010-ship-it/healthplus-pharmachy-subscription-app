'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { ArrowLeft, Save } from 'lucide-react'

export default function BlogQueueEditPage() {
  const params = useParams()
  const router = useRouter()
  const id = typeof params?.id === 'string' ? params.id : ''

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [title, setTitle] = useState('')
  const [summary, setSummary] = useState('')
  const [contentMd, setContentMd] = useState('')
  const [seoTitle, setSeoTitle] = useState('')
  const [seoDescription, setSeoDescription] = useState('')
  const [seoKeywords, setSeoKeywords] = useState('')
  const [status, setStatus] = useState('')

  const load = useCallback(async () => {
    if (!id) return
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/blog-queue/${id}`)
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Failed to load blog')
        return
      }
      const b = data.blog
      setTitle(b.title ?? '')
      setSummary(b.summary ?? '')
      setContentMd(b.contentMd ?? '')
      setSeoTitle(b.seoTitle ?? '')
      setSeoDescription(b.seoDescription ?? '')
      setSeoKeywords(b.seoKeywords ?? '')
      setStatus(b.status ?? '')
    } catch {
      toast.error('Failed to load blog')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  const save = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/blog-queue/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          summary,
          contentMd,
          seoTitle,
          seoDescription,
          seoKeywords,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success('Saved')
        setStatus(data.blog?.status ?? status)
      } else {
        toast.error(data.error || 'Save failed')
      }
    } catch {
      toast.error('Save failed')
    } finally {
      setSaving(false)
    }
  }

  if (!id) {
    return (
      <div className="p-8">
        <p className="text-red-600">Invalid blog id</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/admin/blog-queue"
              className="rounded-lg border border-gray-200 bg-white p-2 text-gray-600 hover:bg-gray-50"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Edit blog</h1>
              {status && (
                <span className="mt-1 inline-block rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-700">
                  {status}
                </span>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => router.push('/admin/blog-queue')}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Queue
            </button>
            <button
              type="button"
              onClick={() => save()}
              disabled={saving || loading}
              className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>

        {loading ? (
          <p className="text-gray-500">Loading…</p>
        ) : (
          <>
            <div className="rounded-xl bg-white p-6 shadow-sm space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Summary</label>
                <textarea
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Content (Markdown)</label>
                <textarea
                  value={contentMd}
                  onChange={(e) => setContentMd(e.target.value)}
                  rows={22}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>
            </div>

            <div className="rounded-xl bg-white p-6 shadow-sm space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">SEO</h2>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">SEO title</label>
                <input
                  type="text"
                  value={seoTitle}
                  onChange={(e) => setSeoTitle(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">SEO description</label>
                <textarea
                  value={seoDescription}
                  onChange={(e) => setSeoDescription(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">SEO keywords</label>
                <input
                  type="text"
                  value={seoKeywords}
                  onChange={(e) => setSeoKeywords(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
