import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { Metadata } from 'next'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  
  const page = await prisma.page.findUnique({
    where: { slug, isPublished: true },
    select: { title: true },
  })

  if (!page) {
    return {
      title: 'Page Not Found',
    }
  }

  return {
    title: `${page.title} | HealthPlus`,
  }
}

export default async function PublicPage({ params }: PageProps) {
  const { slug } = await params

  const page = await prisma.page.findUnique({
    where: { slug, isPublished: true },
  })

  if (!page) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <article className="rounded-lg bg-white p-8 shadow">
          <h1 className="mb-8 text-3xl font-bold text-gray-900">{page.title}</h1>
          <div 
            className="prose prose-teal max-w-none"
            dangerouslySetInnerHTML={{ __html: page.content }}
          />
        </article>
      </div>
    </div>
  )
}
