'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, Search, Edit, Trash2, RefreshCw, FileText } from 'lucide-react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

interface BlogTopic {
  id: string
  title: string
  description: string | null
  block: 'BEAUTY' | 'GROCERY'
  type: 'BEAUTY' | 'GROCERY' | 'RECIPE' | 'MONEY_SAVING'
  isActive: boolean
  lastUsedAt: string | null
  timesUsed: number
  createdAt: string
}

export default function BlogTopicsPage() {
  const router = useRouter()
  const [topics, setTopics] = useState<BlogTopic[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [blockFilter, setBlockFilter] = useState<string>('ALL')
  const [typeFilter, setTypeFilter] = useState<string>('ALL')
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingTopic, setEditingTopic] = useState<BlogTopic | null>(null)
  const [creatingBlog, setCreatingBlog] = useState<string | null>(null)

  const fetchTopics = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (searchQuery) params.set('search', searchQuery)
      if (blockFilter !== 'ALL') params.set('block', blockFilter)
      if (typeFilter !== 'ALL') params.set('type', typeFilter)

      const res = await fetch(`/api/admin/blog-topics?${params}`)
      const data = await res.json()
      if (res.ok) {
        setTopics(data.topics || [])
      } else {
        toast.error(data.error || 'Failed to fetch topics')
      }
    } catch {
      toast.error('Failed to fetch topics')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTopics()
  }, [blockFilter, typeFilter])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchTopics()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this topic?')) return

    try {
      const res = await fetch(`/api/admin/blog-topics/${id}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        toast.success('Topic deleted')
        fetchTopics()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to delete topic')
      }
    } catch {
      toast.error('Failed to delete topic')
    }
  }

    const handleToggleActive = async (topic: BlogTopic) => {
      try {
        const res = await fetch(`/api/admin/blog-topics/${topic.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isActive: !topic.isActive }),
        })
        if (res.ok) {
          toast.success(topic.isActive ? 'Topic deactivated' : 'Topic activated')
          fetchTopics()
        } else {
          const data = await res.json()
          toast.error(data.error || 'Failed to update topic')
        }
      } catch {
        toast.error('Failed to update topic')
      }
    }

    const handleCreateBlog = async (topicId: string) => {
      setCreatingBlog(topicId)
      try {
        const res = await fetch(`/api/admin/blog-topics/${topicId}/create-blog`, {
          method: 'POST',
        })
        const data = await res.json()
        if (res.ok) {
          if (data.alreadyExists) {
            toast.success('Blog already exists! Redirecting to Blog Queue...')
          } else {
            toast.success('Blog created! Redirecting to Blog Queue...')
          }
          fetchTopics()
          setTimeout(() => {
            router.push('/admin/blog-queue')
          }, 1000)
        } else {
          toast.error(data.error || 'Failed to create blog')
        }
      } catch {
        toast.error('Failed to create blog')
      } finally {
        setCreatingBlog(null)
      }
    }

  const getBlockBadgeColor = (block: string) => {
    return block === 'BEAUTY' ? 'bg-pink-100 text-pink-800' : 'bg-green-100 text-green-800'
  }

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'BEAUTY': return 'bg-purple-100 text-purple-800'
      case 'GROCERY': return 'bg-emerald-100 text-emerald-800'
      case 'RECIPE': return 'bg-orange-100 text-orange-800'
      case 'MONEY_SAVING': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Never'
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const beautyCount = topics.filter(t => t.block === 'BEAUTY').length
  const groceryCount = topics.filter(t => t.block === 'GROCERY').length

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Blog Topics</h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage AI blog topic pool. Beauty: {beautyCount} | Grocery: {groceryCount} | Total: {topics.length}
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700"
            >
              <Plus className="h-4 w-4" />
              Add Topic
            </button>
            <Link
              href="/admin/blog-topics/generate"
              className="flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700"
            >
              <RefreshCw className="h-4 w-4" />
              AI Generate Topics
            </Link>
          </div>
        </div>

        <div className="mb-6 rounded-lg bg-white p-4 shadow">
          <form onSubmit={handleSearch} className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search topics..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>
            </div>
            <select
              value={blockFilter}
              onChange={(e) => setBlockFilter(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
            >
              <option value="ALL">All Blocks</option>
              <option value="BEAUTY">Beauty Block</option>
              <option value="GROCERY">Grocery Block</option>
            </select>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
            >
              <option value="ALL">All Types</option>
              <option value="BEAUTY">Beauty</option>
              <option value="GROCERY">Grocery</option>
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
            <div className="p-8 text-center text-gray-500">Loading topics...</div>
          ) : topics.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No topics found. Add some topics to get started!
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Topic
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Block
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Last Used
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Times Used
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {topics.map((topic) => (
                  <tr key={topic.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{topic.title}</div>
                      {topic.description && (
                        <div className="text-sm text-gray-500 truncate max-w-md">
                          {topic.description}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getBlockBadgeColor(topic.block)}`}>
                        {topic.block}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getTypeBadgeColor(topic.type)}`}>
                        {topic.type.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatDate(topic.lastUsedAt)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {topic.timesUsed}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggleActive(topic)}
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                          topic.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {topic.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                                        <td className="px-6 py-4 text-right">
                                          <div className="flex justify-end gap-2">
                                            <button
                                              onClick={() => handleCreateBlog(topic.id)}
                                              disabled={creatingBlog === topic.id || !topic.isActive}
                                              className="rounded p-1 text-teal-500 hover:bg-teal-100 hover:text-teal-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                              title={topic.isActive ? 'Create Blog' : 'Topic is inactive'}
                                            >
                                              {creatingBlog === topic.id ? (
                                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-teal-500 border-t-transparent" />
                                              ) : (
                                                <FileText className="h-4 w-4" />
                                              )}
                                            </button>
                                            <button
                                              onClick={() => setEditingTopic(topic)}
                                              className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                                              title="Edit Topic"
                                            >
                                              <Edit className="h-4 w-4" />
                                            </button>
                                            <button
                                              onClick={() => handleDelete(topic.id)}
                                              className="rounded p-1 text-gray-400 hover:bg-red-100 hover:text-red-600"
                                              title="Delete Topic"
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

        {(showAddModal || editingTopic) && (
          <TopicModal
            topic={editingTopic}
            onClose={() => {
              setShowAddModal(false)
              setEditingTopic(null)
            }}
            onSave={() => {
              setShowAddModal(false)
              setEditingTopic(null)
              fetchTopics()
            }}
          />
        )}
      </div>
    </div>
  )
}

interface TopicModalProps {
  topic: BlogTopic | null
  onClose: () => void
  onSave: () => void
}

function TopicModal({ topic, onClose, onSave }: TopicModalProps) {
  const [formData, setFormData] = useState({
    title: topic?.title || '',
    description: topic?.description || '',
    block: topic?.block || 'BEAUTY',
    type: topic?.type || 'BEAUTY',
    isActive: topic?.isActive ?? true,
  })
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const url = topic
        ? `/api/admin/blog-topics/${topic.id}`
        : '/api/admin/blog-topics'
      const method = topic ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (res.ok) {
        toast.success(topic ? 'Topic updated' : 'Topic created')
        onSave()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to save topic')
      }
    } catch {
      toast.error('Failed to save topic')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
        <h2 className="mb-4 text-xl font-bold text-gray-900">
          {topic ? 'Edit Topic' : 'Add New Topic'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
              placeholder="e.g., Best Morning Skincare Routine for Oily Skin"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
              placeholder="Optional description or notes about this topic"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Block <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.block}
                onChange={(e) => setFormData({ ...formData, block: e.target.value as 'BEAUTY' | 'GROCERY' })}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
              >
                <option value="BEAUTY">Beauty</option>
                <option value="GROCERY">Grocery</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Type <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as 'BEAUTY' | 'GROCERY' | 'RECIPE' | 'MONEY_SAVING' })}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
              >
                <option value="BEAUTY">Beauty</option>
                <option value="GROCERY">Grocery</option>
                <option value="RECIPE">Recipe</option>
                <option value="MONEY_SAVING">Money Saving</option>
              </select>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
            />
            <label htmlFor="isActive" className="text-sm text-gray-700">
              Active (available for scheduling)
            </label>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : topic ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
