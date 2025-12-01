import { auth } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import ManufacturerForm from '@/components/admin/ManufacturerForm'

export default async function EditManufacturerPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') {
    redirect('/auth/signin')
  }

  const { id } = await params

  const manufacturer = await prisma.manufacturer.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      slug: true,
      logoUrl: true,
      websiteUrl: true,
      description: true,
      aliasList: true,
    },
  })

  if (!manufacturer) {
    notFound()
  }

  const manufacturerData = {
    id: manufacturer.id,
    name: manufacturer.name,
    slug: manufacturer.slug,
    logoUrl: manufacturer.logoUrl ?? null,
    websiteUrl: manufacturer.websiteUrl ?? null,
    description: manufacturer.description ?? null,
    aliasList: manufacturer.aliasList as string[] | null,
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-8 text-3xl font-bold text-gray-900">Edit Manufacturer</h1>
        <ManufacturerForm manufacturer={manufacturerData} />
      </div>
    </div>
  )
}

export const runtime = 'nodejs'
