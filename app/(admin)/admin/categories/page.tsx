import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { unstable_noStore as noStore } from 'next/cache'
import Link from 'next/link'
import { Edit, Plus } from 'lucide-react'
import CategoryFilters from '@/components/admin/CategoryFilters'
import DeleteCategoryButton from '@/components/admin/DeleteCategoryButton'

export const dynamic = 'force-dynamic'

export default async function CategoriesPage({
  searchParams,
}: {
  searchParams: { search?: string; status?: string }
}) {
  noStore()

  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') {
    redirect('/auth/signin')
  }

  const search = searchParams.search || ''
  const status = searchParams.status?.toUpperCase() || 'ALL'

  const where: {
    OR?: Array<{ name: { contains: string; mode: 'insensitive' } } | { slug: { contains: string; mode: 'insensitive' } }>
    isActive?: boolean
  } = {}

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { slug: { contains: search, mode: 'insensitive' } },
    ]
  }

  if (status === 'ACTIVE') {
    where.isActive = true
  } else if (status === 'INACTIVE') {
    where.isActive = false
  }

  const categories = await prisma.category.findMany({
    where,
    select: {
      id: true,
      name: true,
      slug: true,
      isActive: true,
      parentCategoryId: true,
      sortOrder: true,
      _count: {
        select: { medicines: true },
      },
    },
    orderBy: [
      { sortOrder: 'asc' },
      { name: 'asc' },
    ],
  })

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Categories</h1>
          <Link
            href="/admin/categories/new"
            className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700"
          >
            <Plus className="h-4 w-4" />
            Add Category
          </Link>
        </div>

        <CategoryFilters />

        <div className="overflow-hidden rounded-lg bg-white shadow">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Slug
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Medicines
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {categories.map((category) => (
                <tr key={category.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      {category.name}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {category.slug}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {category._count.medicines}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm">
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                        category.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {category.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm">
                    <div className="flex items-center gap-3">
                      <Link
                        href={`/admin/categories/${category.id}/edit`}
                        className="text-teal-600 hover:text-teal-700"
                      >
                        <Edit className="h-4 w-4" />
                      </Link>
                      <DeleteCategoryButton
                        categoryId={category.id}
                        categoryName={category.name}
                        medicineCount={category._count.medicines}
                        subCategoryCount={0}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {categories.length === 0 && (
            <div className="py-12 text-center text-gray-500">
              {search || status !== 'ALL'
                ? 'No categories found matching your filters'
                : 'No categories yet. Create your first category to get started.'}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
