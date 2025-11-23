import { auth } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import CategoryForm from '@/components/admin/CategoryForm'

export default async function EditCategoryPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') {
    redirect('/auth/signin')
  }

  const { id } = await params

  const category = await prisma.category.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      imageUrl: true,
      isActive: true,
      parentCategoryId: true,
      sortOrder: true,
    },
  })

  if (!category) {
    notFound()
  }

  const categories = await prisma.category.findMany({
    where: {
      isActive: true,
      id: { not: id },
    },
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
    },
  })

  const categoryData = {
    id: category.id,
    name: category.name,
    slug: category.slug,
    description: category.description ?? null,
    imageUrl: category.imageUrl ?? null,
    isActive: category.isActive,
    parentCategoryId: category.parentCategoryId ?? null,
    sortOrder: category.sortOrder ?? 0,
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-8 text-3xl font-bold text-gray-900">Edit Category</h1>
        <CategoryForm category={categoryData} categories={categories} />
      </div>
    </div>
  )
}

export const runtime = 'nodejs'
