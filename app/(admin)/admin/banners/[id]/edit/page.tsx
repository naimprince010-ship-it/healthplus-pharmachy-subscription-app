import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect, notFound } from 'next/navigation'
import { BannerForm } from '@/components/admin/BannerForm'

export const dynamic = 'force-dynamic'

export default async function EditBannerPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') {
    redirect('/auth/signin')
  }

  const { id } = await params

  const banner = await prisma.banner.findUnique({
    where: { id },
  })

  if (!banner) {
    notFound()
  }

  const initialData = {
    ...banner,
    startAt: banner.startAt ? banner.startAt.toISOString().slice(0, 16) : undefined,
    endAt: banner.endAt ? banner.endAt.toISOString().slice(0, 16) : undefined,
  }

  return <BannerForm mode="edit" bannerId={id} initialData={initialData as any} />
}
