import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import ManufacturerForm from '@/components/admin/ManufacturerForm'

export default async function NewManufacturerPage() {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') {
    redirect('/auth/signin')
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-8 text-3xl font-bold text-gray-900">Add New Manufacturer</h1>
        <ManufacturerForm />
      </div>
    </div>
  )
}
