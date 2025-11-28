import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { unstable_noStore as noStore } from 'next/cache'
import Link from 'next/link'
import { Edit, Plus, Trash2, ExternalLink } from 'lucide-react'
import DeletePageButton from '@/components/admin/DeletePageButton'

export const dynamic = 'force-dynamic'

export default async function PagesPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; group?: string; status?: string }>
}) {
  noStore()

  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') {
    redirect('/auth/signin')
  }

  const params = await searchParams
  const search = params.search || ''
  const group = params.group?.toUpperCase() || 'ALL'
  const status = params.status?.toUpperCase() || 'ALL'

  const where: {
    OR?: Array<{ title: { contains: string; mode: 'insensitive' } } | { slug: { contains: string; mode: 'insensitive' } }>
    group?: 'QUICK_LINKS' | 'SUPPORT' | 'NONE'
    isPublished?: boolean
  } = {}

  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { slug: { contains: search, mode: 'insensitive' } },
    ]
  }

  if (group === 'QUICK_LINKS' || group === 'SUPPORT' || group === 'NONE') {
    where.group = group
  }

  if (status === 'PUBLISHED') {
    where.isPublished = true
  } else if (status === 'DRAFT') {
    where.isPublished = false
  }

  const pages = await prisma.page.findMany({
    where,
    orderBy: [
      { group: 'asc' },
      { sortOrder: 'asc' },
      { title: 'asc' },
    ],
  })

  const groupLabels: Record<string, string> = {
    QUICK_LINKS: 'Quick Links',
    SUPPORT: 'Support',
    NONE: 'None',
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Pages</h1>
          <Link
            href="/admin/pages/new"
            className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700"
          >
            <Plus className="h-4 w-4" />
            Add Page
          </Link>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-wrap gap-4">
          <form className="flex flex-1 gap-4">
            <input
              type="text"
              name="search"
              placeholder="Search pages..."
              defaultValue={search}
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
            <select
              name="group"
              defaultValue={group}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
            >
              <option value="ALL">All Groups</option>
              <option value="QUICK_LINKS">Quick Links</option>
              <option value="SUPPORT">Support</option>
              <option value="NONE">None</option>
            </select>
            <select
              name="status"
              defaultValue={status}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
            >
              <option value="ALL">All Status</option>
              <option value="PUBLISHED">Published</option>
              <option value="DRAFT">Draft</option>
            </select>
            <button
              type="submit"
              className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
            >
              Filter
            </button>
          </form>
        </div>

        <div className="overflow-hidden rounded-lg bg-white shadow">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Slug
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Group
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Order
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
              {pages.map((page) => (
                <tr key={page.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      {page.title}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    <a
                      href={`/pages/${page.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-teal-600 hover:text-teal-700"
                    >
                      {page.slug}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    <span className="inline-flex rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-800">
                      {groupLabels[page.group]}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {page.sortOrder}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm">
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                        page.isPublished
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {page.isPublished ? 'Published' : 'Draft'}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm">
                    <div className="flex items-center gap-3">
                      <Link
                        href={`/admin/pages/${page.id}/edit`}
                        className="text-teal-600 hover:text-teal-700"
                      >
                        <Edit className="h-4 w-4" />
                      </Link>
                      <DeletePageButton
                        pageId={page.id}
                        pageTitle={page.title}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {pages.length === 0 && (
            <div className="py-12 text-center text-gray-500">
              {search || group !== 'ALL' || status !== 'ALL'
                ? 'No pages found matching your filters'
                : 'No pages yet. Create your first page to get started.'}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
