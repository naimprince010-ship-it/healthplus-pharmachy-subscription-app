'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, Search, Edit, Trash2, Eye, ExternalLink } from 'lucide-react'
import toast from 'react-hot-toast'

interface LandingPage {
  id: string
  title: string
  slug: string
  status: 'DRAFT' | 'PUBLISHED'
  primaryColor: string | null
  createdAt: string
  updatedAt: string
  publishedAt: string | null
}

export default function LandingPagesPage() {
  const [landingPages, setLandingPages] = useState<LandingPage[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')

  const fetchLandingPages = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (searchQuery) params.set('search', searchQuery)
      if (statusFilter !== 'ALL') params.set('status', statusFilter)

      const res = await fetch(`/api/admin/landing-pages?${params}`)
      const data = await res.json()
      if (res.ok) {
        setLandingPages(data.landingPages || [])
      } else {
        toast.error(data.error || 'Failed to fetch landing pages')
      }
    } catch {
      toast.error('Failed to fetch landing pages')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLandingPages()
  }, [statusFilter])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchLandingPages()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this landing page?')) return

    try {
      const res = await fetch(`/api/admin/landing-pages/${id}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        toast.success('Landing page deleted')
        fetchLandingPages()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to delete landing page')
      }
    } catch {
      toast.error('Failed to delete landing page')
    }
  }

  const handleToggleStatus = async (page: LandingPage) => {
    const newStatus = page.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED'
    try {
      const res = await fetch(`/api/admin/landing-pages/${page.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (res.ok) {
        toast.success(newStatus === 'PUBLISHED' ? 'Landing page published' : 'Landing page unpublished')
        fetchLandingPages()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to update status')
      }
    } catch {
      toast.error('Failed to update status')
    }
  }

  const getStatusBadgeColor = (status: string) => {
    return status === 'PUBLISHED' 
      ? 'bg-green-100 text-green-800' 
      : 'bg-yellow-100 text-yellow-800'
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const draftCount = landingPages.filter(p => p.status === 'DRAFT').length
  const publishedCount = landingPages.filter(p => p.status === 'PUBLISHED').length

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Landing Pages</h1>
            <p className="mt-1 text-sm text-gray-500">
              Draft: {draftCount} | Published: {publishedCount} | Total: {landingPages.length}
            </p>
          </div>
          <Link
            href="/admin/landing-pages/new"
            className="flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700"
          >
            <Plus className="h-4 w-4" />
            Create Landing Page
          </Link>
        </div>

        <div className="mb-6 rounded-lg bg-white p-4 shadow">
          <form onSubmit={handleSearch} className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search landing pages..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
            >
              <option value="ALL">All Status</option>
              <option value="DRAFT">Draft</option>
              <option value="PUBLISHED">Published</option>
            </select>
            <button
              type="submit"
              className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
            >
              Search
            </button>
          </form>
        </div>

        <div className="rounded-lg bg-white shadow overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading landing pages...</div>
          ) : landingPages.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No landing pages found. Create your first landing page!
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Slug
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Updated
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {landingPages.map((page) => (
                  <tr key={page.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {page.primaryColor && (
                          <div 
                            className="h-4 w-4 rounded-full border border-gray-200" 
                            style={{ backgroundColor: page.primaryColor }}
                          />
                        )}
                        <span className="font-medium text-gray-900">{page.title}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <code className="rounded bg-gray-100 px-2 py-1 text-sm text-gray-600">
                        /campaign/{page.slug}
                      </code>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggleStatus(page)}
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getStatusBadgeColor(page.status)}`}
                      >
                        {page.status}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatDate(page.updatedAt)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        {page.status === 'PUBLISHED' && (
                          <a
                            href={`/campaign/${page.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded p-1 text-blue-500 hover:bg-blue-100 hover:text-blue-700"
                            title="View Live Page"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        )}
                        <Link
                          href={`/admin/landing-pages/${page.id}/preview`}
                          className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                          title="Preview"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                        <Link
                          href={`/admin/landing-pages/${page.id}/edit`}
                          className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(page.id)}
                          className="rounded p-1 text-gray-400 hover:bg-red-100 hover:text-red-600"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
