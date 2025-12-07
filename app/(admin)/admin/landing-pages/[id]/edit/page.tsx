'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import toast from 'react-hot-toast'
import LandingPageEditor from '../../components/LandingPageEditor'
import { LandingPageSection } from '@/lib/landing-page/types'

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

export default function EditLandingPagePage() {
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
            <span className="ml-3 text-gray-600">Loading landing page...</span>
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
    <LandingPageEditor
      initialData={{
        id: landingPage.id,
        title: landingPage.title,
        slug: landingPage.slug,
        sections: landingPage.sections,
        metaTitle: landingPage.metaTitle,
        metaDescription: landingPage.metaDescription,
        primaryColor: landingPage.primaryColor,
      }}
      isEdit
    />
  )
}
