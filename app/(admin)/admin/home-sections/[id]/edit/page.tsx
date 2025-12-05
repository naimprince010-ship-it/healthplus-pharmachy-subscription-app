import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { HomeSectionForm } from '@/components/admin/HomeSectionForm'

interface PageProps {
  params: Promise<{ id: string }>
}

async function getHomeSection(id: string) {
  const section = await prisma.homeSection.findUnique({
    where: { id },
  })
  return section
}

export default async function EditHomeSectionPage({ params }: PageProps) {
  const { id } = await params
  const section = await getHomeSection(id)

  if (!section) {
    notFound()
  }

  const initialData = {
    title: section.title,
    slug: section.slug,
    filterType: section.filterType as 'category' | 'brand' | 'manual',
    categoryId: section.categoryId,
    brandName: section.brandName,
    productIds: section.productIds as string[] | null,
    maxProducts: section.maxProducts,
    bgColor: section.bgColor,
    badgeText: section.badgeText,
    sortOrder: section.sortOrder,
    isActive: section.isActive,
    displayLocations: section.displayLocations as string[] | null,
  }

  return <HomeSectionForm mode="edit" sectionId={id} initialData={initialData} />
}
