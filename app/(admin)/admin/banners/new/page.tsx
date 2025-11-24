import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { BannerForm } from '@/components/admin/BannerForm'

export const dynamic = 'force-dynamic'

export default async function NewBannerPage() {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') {
    redirect('/auth/signin')
  }

  return <BannerForm mode="create" />
}
