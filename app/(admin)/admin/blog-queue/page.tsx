'use client'

import { useState, useEffect } from 'react'
import { Search, Eye, Check, X, Edit, Send, Clock, FileText, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import Link from 'next/link'

interface Blog {
  id: string
  slug: string
  title: string
  type: string
  block: string
  status: string
  summary: string | null
  contentMd: string | null
  seoTitle: string | null
  seoDescription: string | null
  scheduledAt: string | null
  publishedAt: string | null
  createdAt: string
  topic: { title: string } | null
  _count: { blogProducts: number; missingProducts: number }
}

const STATUS_COLORS: Record<string, string> = {
  TOPIC_ONLY: 'bg-gray-100 text-gray-800',
  DRAFT: 'bg-yellow-100 text-yellow-800',
  QUEUED: 'bg-blue-100 text-blue-800',
  PUBLISHED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
}

const STATUS_LABELS: Record<string, string> = {
  TOPIC_ONLY: 'Topic Only',
  DRAFT: 'Draft',
  QUEUED: 'Queued',
  PUBLISHED: 'Published',
  REJECTED: 'Rejected',
}

const TYPE_LABELS: Record<string, string> = {
  BEAUTY: 'Beauty/Skincare',
  GROCERY: 'Grocery Guide',
  RECIPE: 'Recipe',
  MONEY_SAVING: 'Money Saving',
}

export default function BlogQueuePage() {
  const [blogs, setBlogs] = useState<Blog[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedBlog, setSelectedBlog] = useState<Blog | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [generating, setGenerating] = useState<string | null>(null)

  const fetchBlogs = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.set('status', statusFilter)
      if (typeFilter !== 'all') params.set('type', typeFilter)
      if (searchQuery) params.set('search', searchQuery)

      const res = await fetch(`/api/admin/blog-queue?${params}`)
      const data = await res.json()
      if (res.ok) {
        setBlogs(data.blogs || [])
      } else {
        toast.error(data.error || 'Failed to fetch blogs')
      }
    } catch {
      toast.error('Failed to fetch blogs')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBlogs()
  }, [statusFilter, typeFilter])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchBlogs()
  }

  const updateBlogStatus = async (blogId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/admin/blog-queue/${blogId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (res.ok) {
        toast.success(`Blog ${newStatus.toLowerCase()}`)
        fetchBlogs()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to update blog')
      }
    } catch {
      toast.error('Failed to update blog')
    }
  }

  const generateContent = async (blogId: string) => {
    setGenerating(blogId)
    try {
      const res = await fetch(`/api/admin/blog-queue/${blogId}/generate`, {
        method: 'POST',
      })
      const data = await res.json()
      if (res.ok) {
        toast.success('Content generated successfully')
        fetchBlogs()
      } else {
        toast.error(data.error || 'Failed to generate content')
      }
    } catch {
      toast.error('Failed to generate content')
    } finally {
      setGenerating(null)
    }
  }

  const publishBlog = async (blogId: string) => {
    try {
      const res = await fetch(`/api/admin/blog-queue/${blogId}/publish`, {
        method: 'POST',
      })
      if (res.ok) {
        toast.success('Blog published successfully')
        fetchBlogs()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to publish blog')
      }
    } catch {
      toast.error('Failed to publish blog')
    }
  }

  const pendingCount = blogs.filter(b => b.status === 'TOPIC_ONLY').length
  const draftCount = blogs.filter(b => b.status === 'DRAFT').length
  const queuedCount = blogs.filter(b => b.status === 'QUEUED').length

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Blog Queue</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage AI-generated blog content. Pending: {pendingCount} | Drafts: {draftCount} | Queued: {queuedCount}
          </p>
        </div>

        <div className="mb-6 grid grid-cols-4 gap-4">
          <div className="rounded-lg bg-white p-4 shadow">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-gray-100 p-2">
                <FileText className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingCount}</p>
                <p className="text-sm text-gray-500">Topics Only</p>
              </div>
            </div>
          </div>
          <div className="rounded-lg bg-white p-4 shadow">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-yellow-100 p-2">
                <Edit className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{draftCount}</p>
                <p className="text-sm text-gray-500">Drafts</p>
              </div>
            </div>
          </div>
          <div className="rounded-lg bg-white p-4 shadow">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-blue-100 p-2">
                <Clock className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{queuedCount}</p>
                <p className="text-sm text-gray-500">Queued</p>
              </div>
            </div>
          </div>
          <div className="rounded-lg bg-white p-4 shadow">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-green-100 p-2">
                <Check className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{blogs.filter(b => b.status === 'PUBLISHED').length}</p>
                <p className="text-sm text-gray-500">Published</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-6 rounded-lg bg-white p-4 shadow">
          <form onSubmit={handleSearch} className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search blogs..."
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
              <option value="all">All Statuses</option>
              <option value="TOPIC_ONLY">Topic Only</option>
              <option value="DRAFT">Draft</option>
              <option value="QUEUED">Queued</option>
              <option value="PUBLISHED">Published</option>
              <option value="REJECTED">Rejected</option>
            </select>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
            >
              <option value="all">All Types</option>
              <option value="BEAUTY">Beauty/Skincare</option>
              <option value="GROCERY">Grocery Guide</option>
              <option value="RECIPE">Recipe</option>
              <option value="MONEY_SAVING">Money Saving</option>
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
            <div className="p-8 text-center text-gray-500">Loading blogs...</div>
          ) : blogs.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No blogs found. Create topics in Blog Topics page first.
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Blog
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Products
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Created
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {blogs.map((blog) => (
                  <tr key={blog.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900">{blog.title}</p>
                        <p className="text-sm text-gray-500">{blog.slug}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600">
                        {TYPE_LABELS[blog.type] || blog.type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${STATUS_COLORS[blog.status]}`}>
                        {STATUS_LABELS[blog.status] || blog.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <span className="text-gray-600">{blog._count.blogProducts} products</span>
                        {blog._count.missingProducts > 0 && (
                          <span className="ml-2 text-orange-600">
                            ({blog._count.missingProducts} missing)
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(blog.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => { setSelectedBlog(blog); setShowPreview(true) }}
                          className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                          title="Preview"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        {blog.status === 'TOPIC_ONLY' && (
                          <button
                            onClick={() => generateContent(blog.id)}
                            disabled={generating === blog.id}
                            className="rounded p-1 text-blue-400 hover:bg-blue-50 hover:text-blue-600 disabled:opacity-50"
                            title="Generate Content"
                          >
                            {generating === blog.id ? (
                              <Clock className="h-4 w-4 animate-spin" />
                            ) : (
                              <Send className="h-4 w-4" />
                            )}
                          </button>
                        )}
                        {blog.status === 'DRAFT' && (
                          <>
                            <button
                              onClick={() => updateBlogStatus(blog.id, 'QUEUED')}
                              className="rounded p-1 text-green-400 hover:bg-green-50 hover:text-green-600"
                              title="Approve"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => updateBlogStatus(blog.id, 'REJECTED')}
                              className="rounded p-1 text-red-400 hover:bg-red-50 hover:text-red-600"
                              title="Reject"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </>
                        )}
                        {blog.status === 'QUEUED' && (
                          <button
                            onClick={() => publishBlog(blog.id)}
                            className="rounded p-1 text-green-400 hover:bg-green-50 hover:text-green-600"
                            title="Publish Now"
                          >
                            <Send className="h-4 w-4" />
                          </button>
                        )}
                        <Link
                          href={`/admin/blog-queue/${blog.id}/edit`}
                          className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {showPreview && selectedBlog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-lg bg-white p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-bold">{selectedBlog.title}</h2>
                <button
                  onClick={() => setShowPreview(false)}
                  className="rounded p-1 hover:bg-gray-100"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="mb-4 flex gap-2">
                <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${STATUS_COLORS[selectedBlog.status]}`}>
                  {STATUS_LABELS[selectedBlog.status]}
                </span>
                <span className="inline-flex rounded-full bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-800">
                  {TYPE_LABELS[selectedBlog.type]}
                </span>
              </div>
              {selectedBlog.summary && (
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-gray-500">Summary</h3>
                  <p className="text-gray-700">{selectedBlog.summary}</p>
                </div>
              )}
              {selectedBlog.seoTitle && (
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-gray-500">SEO Title</h3>
                  <p className="text-gray-700">{selectedBlog.seoTitle}</p>
                </div>
              )}
              {selectedBlog.seoDescription && (
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-gray-500">SEO Description</h3>
                  <p className="text-gray-700">{selectedBlog.seoDescription}</p>
                </div>
              )}
              {selectedBlog.contentMd ? (
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Content (Markdown)</h3>
                  <div className="rounded-lg bg-gray-50 p-4 max-h-96 overflow-y-auto">
                    <pre className="whitespace-pre-wrap text-sm text-gray-700">{selectedBlog.contentMd}</pre>
                  </div>
                </div>
              ) : (
                <div className="mb-4 rounded-lg bg-yellow-50 p-4">
                  <div className="flex items-center gap-2 text-yellow-800">
                    <AlertCircle className="h-5 w-5" />
                    <p>No content generated yet. Click &quot;Generate Content&quot; to create AI content.</p>
                  </div>
                </div>
              )}
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowPreview(false)}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Close
                </button>
                {selectedBlog.status === 'TOPIC_ONLY' && (
                  <button
                    onClick={() => { generateContent(selectedBlog.id); setShowPreview(false) }}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                  >
                    Generate Content
                  </button>
                )}
                {selectedBlog.status === 'DRAFT' && (
                  <button
                    onClick={() => { updateBlogStatus(selectedBlog.id, 'QUEUED'); setShowPreview(false) }}
                    className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
                  >
                    Approve
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
