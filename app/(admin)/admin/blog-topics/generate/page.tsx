'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Sparkles, Plus, Check, X } from 'lucide-react'
import toast from 'react-hot-toast'

interface GeneratedTopic {
  title: string
  description: string
  block: 'BEAUTY' | 'GROCERY'
  type: 'BEAUTY' | 'GROCERY' | 'RECIPE' | 'MONEY_SAVING'
  selected: boolean
}

export default function GenerateTopicsPage() {
  const router = useRouter()
  const [block, setBlock] = useState<'BEAUTY' | 'GROCERY'>('BEAUTY')
  const [type, setType] = useState<'BEAUTY' | 'GROCERY' | 'RECIPE' | 'MONEY_SAVING'>('BEAUTY')
  const [count, setCount] = useState(5)
  const [generating, setGenerating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [generatedTopics, setGeneratedTopics] = useState<GeneratedTopic[]>([])

  const handleGenerate = async () => {
    setGenerating(true)
    setGeneratedTopics([])

    try {
      const res = await fetch('/api/admin/blog-topics/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ block, type, count }),
      })

      const data = await res.json()

      if (res.ok && data.topics) {
        setGeneratedTopics(
          data.topics.map((t: { title: string; description: string }) => ({
            ...t,
            block,
            type,
            selected: true,
          }))
        )
        toast.success(`Generated ${data.topics.length} topic suggestions!`)
      } else {
        toast.error(data.error || 'Failed to generate topics')
      }
    } catch {
      toast.error('Failed to generate topics')
    } finally {
      setGenerating(false)
    }
  }

  const toggleTopic = (index: number) => {
    setGeneratedTopics((prev) =>
      prev.map((t, i) => (i === index ? { ...t, selected: !t.selected } : t))
    )
  }

  const handleSaveSelected = async () => {
    const selectedTopics = generatedTopics.filter((t) => t.selected)
    if (selectedTopics.length === 0) {
      toast.error('Please select at least one topic to save')
      return
    }

    setSaving(true)

    try {
      let savedCount = 0
      for (const topic of selectedTopics) {
        const res = await fetch('/api/admin/blog-topics', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: topic.title,
            description: topic.description,
            block: topic.block,
            type: topic.type,
            isActive: true,
          }),
        })

        if (res.ok) {
          savedCount++
        }
      }

      if (savedCount > 0) {
        toast.success(`Saved ${savedCount} topics!`)
        router.push('/admin/blog-topics')
      } else {
        toast.error('Failed to save topics')
      }
    } catch {
      toast.error('Failed to save topics')
    } finally {
      setSaving(false)
    }
  }

  const selectedCount = generatedTopics.filter((t) => t.selected).length

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <Link
            href="/admin/blog-topics"
            className="mb-4 inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Blog Topics
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">AI Generate Topics</h1>
          <p className="mt-1 text-sm text-gray-500">
            Use AI to generate blog topic suggestions based on your product catalog
          </p>
        </div>

        <div className="mb-8 rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Generation Settings</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">Block</label>
              <select
                value={block}
                onChange={(e) => {
                  const newBlock = e.target.value as 'BEAUTY' | 'GROCERY'
                  setBlock(newBlock)
                  if (newBlock === 'BEAUTY' && type === 'GROCERY') {
                    setType('BEAUTY')
                  } else if (newBlock === 'GROCERY' && type === 'BEAUTY') {
                    setType('GROCERY')
                  }
                }}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
              >
                <option value="BEAUTY">Beauty</option>
                <option value="GROCERY">Grocery</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as 'BEAUTY' | 'GROCERY' | 'RECIPE' | 'MONEY_SAVING')}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
              >
                {block === 'BEAUTY' ? (
                  <option value="BEAUTY">Beauty (Skincare Routines)</option>
                ) : (
                  <option value="GROCERY">Grocery (Buying Guides)</option>
                )}
                <option value="RECIPE">Recipe</option>
                <option value="MONEY_SAVING">Money Saving</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Number of Topics</label>
              <select
                value={count}
                onChange={(e) => setCount(Number(e.target.value))}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
              >
                <option value={3}>3 topics</option>
                <option value={5}>5 topics</option>
                <option value={10}>10 topics</option>
              </select>
            </div>
          </div>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="mt-4 flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50"
          >
            <Sparkles className="h-4 w-4" />
            {generating ? 'Generating...' : 'Generate Topics with AI'}
          </button>
        </div>

        {generatedTopics.length > 0 && (
          <div className="rounded-lg bg-white p-6 shadow">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                Generated Topics ({selectedCount} selected)
              </h2>
              <button
                onClick={handleSaveSelected}
                disabled={saving || selectedCount === 0}
                className="flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-50"
              >
                <Plus className="h-4 w-4" />
                {saving ? 'Saving...' : `Save ${selectedCount} Selected`}
              </button>
            </div>
            <div className="space-y-3">
              {generatedTopics.map((topic, index) => (
                <div
                  key={index}
                  onClick={() => toggleTopic(index)}
                  className={`cursor-pointer rounded-lg border-2 p-4 transition-colors ${
                    topic.selected
                      ? 'border-teal-500 bg-teal-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{topic.title}</h3>
                      {topic.description && (
                        <p className="mt-1 text-sm text-gray-600">{topic.description}</p>
                      )}
                      <div className="mt-2 flex gap-2">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                          topic.block === 'BEAUTY' ? 'bg-pink-100 text-pink-800' : 'bg-green-100 text-green-800'
                        }`}>
                          {topic.block}
                        </span>
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                          topic.type === 'BEAUTY' ? 'bg-purple-100 text-purple-800' :
                          topic.type === 'GROCERY' ? 'bg-emerald-100 text-emerald-800' :
                          topic.type === 'RECIPE' ? 'bg-orange-100 text-orange-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {topic.type.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                    <div className={`ml-4 flex h-6 w-6 items-center justify-center rounded-full ${
                      topic.selected ? 'bg-teal-500 text-white' : 'bg-gray-200 text-gray-400'
                    }`}>
                      {topic.selected ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {generating && (
          <div className="rounded-lg bg-white p-8 shadow">
            <div className="flex flex-col items-center justify-center">
              <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-purple-200 border-t-purple-600"></div>
              <p className="text-gray-600">AI is generating topic suggestions...</p>
              <p className="mt-1 text-sm text-gray-500">This may take a few seconds</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
