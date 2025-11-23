import { auth } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import CategoryForm from '@/components/admin/CategoryForm'

export default async function EditCategoryPage({
  params,
}: {
  params: { id: string }
}) {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') {
    redirect('/auth/signin')
  }

  const category = await prisma.category.findUnique({
    where: { id: params.id },
  })

  if (!category) {
    notFound()
  }

  const categories = await prisma.category.findMany({
    where: {
      isActive: true,
      id: { not: params.id },
    },
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
    },
  })

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-8 text-3xl font-bold text-gray-900">Edit Category</h1>
        <CategoryForm category={category} categories={categories} />
      </div>
    </div>
  )
}
