import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import { LandingPageSection } from '@/lib/landing-page/types'
import LandingPageRenderer from './components/LandingPageRenderer'

interface PageProps {
  params: Promise<{ slug: string }>
}

// Generate metadata for SEO
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  
  const landingPage = await prisma.landingPage.findUnique({
    where: { slug, status: 'PUBLISHED' },
    select: {
      title: true,
      metaTitle: true,
      metaDescription: true,
    },
  })

  if (!landingPage) {
    return {
      title: 'Page Not Found',
    }
  }

  return {
    title: landingPage.metaTitle || landingPage.title,
    description: landingPage.metaDescription || undefined,
  }
}

export default async function CampaignPage({ params }: PageProps) {
  const { slug } = await params

  const landingPage = await prisma.landingPage.findUnique({
    where: { slug, status: 'PUBLISHED' },
  })

  if (!landingPage) {
    notFound()
  }

  // Parse sections from JSON
  const sections = landingPage.sections as LandingPageSection[]
  const primaryColor = landingPage.primaryColor || '#036666'

  return (
    <main>
      <LandingPageRenderer sections={sections} primaryColor={primaryColor} />
    </main>
  )
}
