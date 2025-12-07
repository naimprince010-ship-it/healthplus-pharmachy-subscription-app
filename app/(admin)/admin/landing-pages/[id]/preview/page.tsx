'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Edit, ExternalLink } from 'lucide-react'
import toast from 'react-hot-toast'
import { LandingPageSection } from '@/lib/landing-page/types'
import LandingPageRenderer from '@/app/campaign/[slug]/components/LandingPageRenderer'

interface LandingPageData {
  id: string
  title: string
  slug: string
  status: 'DRAFT' | 'PUBLISHED'
  sections: LandingPageSection[]
  metaTitle: string | null
  metaDescription: string | null
  primaryColor: string | null
  createdAt: string
  updatedAt: string
  publishedAt: string | null
}

export default function PreviewLandingPagePage() {
  const params = useParams()
  const [landingPage, setLandingPage] = useState<LandingPageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchLandingPage = async () => {
      try {
        const res = await fetch(`/api/admin/landing-pages/${params.id}`)
        const data = await res.json()
        if (res.ok) {
          setLandingPage(data.landingPage)
        } else {
          setError(data.error || 'Failed to fetch landing page')
          toast.error(data.error || 'Failed to fetch landing page')
        }
      } catch {
        setError('Failed to fetch landing page')
        toast.error('Failed to fetch landing page')
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      fetchLandingPage()
    }
  }, [params.id])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="mx-auto max-w-5xl">
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-600 border-t-transparent"></div>
            <span className="ml-3 text-gray-600">Loading preview...</span>
          </div>
        </div>
      </div>
    )
  }

  if (error || !landingPage) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="mx-auto max-w-5xl">
          <div className="rounded-lg bg-red-50 p-6 text-center">
            <p className="text-red-600">{error || 'Landing page not found'}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Preview Header */}
      <div className="sticky top-0 z-50 border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            <Link
              href="/admin/landing-pages"
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to List
            </Link>
            <div className="h-6 w-px bg-gray-300" />
            <div>
              <h1 className="font-semibold text-gray-900">{landingPage.title}</h1>
              <p className="text-xs text-gray-500">Preview Mode</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={`rounded-full px-2 py-1 text-xs font-semibold ${
              landingPage.status === 'PUBLISHED' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              {landingPage.status}
            </span>
            <Link
              href={`/admin/landing-pages/${landingPage.id}/edit`}
              className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <Edit className="h-4 w-4" />
              Edit
            </Link>
            {landingPage.status === 'PUBLISHED' && (
              <a
                href={`/campaign/${landingPage.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-lg bg-teal-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-700"
              >
                <ExternalLink className="h-4 w-4" />
                View Live
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Preview Content */}
      <div className="mx-auto max-w-4xl py-4">
        <div className="overflow-hidden rounded-lg border border-gray-300 bg-white shadow-lg">
          <LandingPageRenderer
            sections={landingPage.sections}
            primaryColor={landingPage.primaryColor || '#036666'}
          />
        </div>
      </div>
    </div>
  )
}
