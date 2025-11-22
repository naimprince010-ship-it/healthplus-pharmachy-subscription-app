'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { updateMedicineSchema, type UpdateMedicineInput } from '@/lib/validations/medicine'

interface Category {
  id: string
  name: string
}

interface Medicine {
  id: string
  name: string
  genericName: string | null
  brandName: string | null
  dosageForm: string | null
  packSize: string | null
  strength: string | null
  description: string | null
  categoryId: string
  mrp: number | null
  sellingPrice: number
  stockQuantity: number
  minStockAlert: number | null
  seoTitle: string | null
  seoDescription: string | null
  seoKeywords: string | null
  canonicalUrl: string | null
  imageUrl: string | null
  requiresPrescription: boolean
  isFeatured: boolean
  isActive: boolean
}

export default function EditMedicinePage() {
  const router = useRouter()
  const params = useParams()
  const medicineId = params.id as string

  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<UpdateMedicineInput>({
    resolver: zodResolver(updateMedicineSchema),
  })

  useEffect(() => {
    fetchCategories()
    fetchMedicine()
  }, [medicineId])

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/admin/categories')
      const data = await res.json()
      if (res.ok) {
        setCategories(data.categories || [])
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error)
    }
  }

  const fetchMedicine = async () => {
    setFetching(true)
    try {
      const res = await fetch(`/api/admin/medicines/${medicineId}`)
      const data = await res.json()

      if (res.ok) {
        const medicine: Medicine = data.medicine
        reset({
          id: medicine.id,
          name: medicine.name,
          genericName: medicine.genericName || undefined,
          brandName: medicine.brandName || undefined,
          dosageForm: medicine.dosageForm || undefined,
          packSize: medicine.packSize || undefined,
          strength: medicine.strength || undefined,
          description: medicine.description || undefined,
          categoryId: medicine.categoryId,
          mrp: medicine.mrp || undefined,
          sellingPrice: medicine.sellingPrice,
          stockQuantity: medicine.stockQuantity,
          minStockAlert: medicine.minStockAlert || undefined,
          seoTitle: medicine.seoTitle || undefined,
          seoDescription: medicine.seoDescription || undefined,
          seoKeywords: medicine.seoKeywords || undefined,
          canonicalUrl: medicine.canonicalUrl || undefined,
          imageUrl: medicine.imageUrl || undefined,
          requiresPrescription: medicine.requiresPrescription,
          isFeatured: medicine.isFeatured,
          isActive: medicine.isActive,
        })
      } else {
        setError('Medicine not found')
      }
    } catch (error) {
      setError('Failed to fetch medicine')
    } finally {
      setFetching(false)
    }
  }

  const onSubmit = async (data: UpdateMedicineInput) => {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/admin/medicines/${medicineId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const result = await res.json()

      if (res.ok) {
        router.push('/admin/medicines?success=updated')
      } else {
        setError(result.error || 'Failed to update medicine')
      }
    } catch (error) {
      setError('Failed to update medicine')
    } finally {
      setLoading(false)
    }
  }

  if (fetching) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading medicine...</div>
      </div>
    )
  }

  if (error && fetching) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
        {error}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/admin/medicines"
          className="rounded-lg border border-gray-300 p-2 transition-colors hover:bg-gray-50"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Edit Medicine</h1>
          <p className="mt-2 text-sm text-gray-600">
            Update medicine details
          </p>
        </div>
      </div>

      {error && !fetching && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Basic Information</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Medicine Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...register('name')}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="e.g., Paracetamol"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Generic Name
              </label>
              <input
                type="text"
                {...register('genericName')}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="e.g., Acetaminophen"
              />
              {errors.genericName && (
                <p className="mt-1 text-sm text-red-600">{errors.genericName.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Brand Name
              </label>
              <input
                type="text"
                {...register('brandName')}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="e.g., Napa"
              />
              {errors.brandName && (
                <p className="mt-1 text-sm text-red-600">{errors.brandName.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                {...register('categoryId')}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="">Select a category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              {errors.categoryId && (
                <p className="mt-1 text-sm text-red-600">{errors.categoryId.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Dosage Form
              </label>
              <input
                type="text"
                {...register('dosageForm')}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="e.g., Tablet, Capsule, Syrup"
              />
              {errors.dosageForm && (
                <p className="mt-1 text-sm text-red-600">{errors.dosageForm.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Strength
              </label>
              <input
                type="text"
                {...register('strength')}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="e.g., 500mg"
              />
              {errors.strength && (
                <p className="mt-1 text-sm text-red-600">{errors.strength.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Pack Size
              </label>
              <input
                type="text"
                {...register('packSize')}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="e.g., 1 strip x 10 tablets"
              />
              {errors.packSize && (
                <p className="mt-1 text-sm text-red-600">{errors.packSize.message}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                {...register('description')}
                rows={3}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="Enter medicine description..."
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Pricing & Stock</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                MRP (Maximum Retail Price)
              </label>
              <input
                type="number"
                step="0.01"
                {...register('mrp', { valueAsNumber: true })}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="0.00"
              />
              {errors.mrp && (
                <p className="mt-1 text-sm text-red-600">{errors.mrp.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Selling Price <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                {...register('sellingPrice', { valueAsNumber: true })}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="0.00"
              />
              {errors.sellingPrice && (
                <p className="mt-1 text-sm text-red-600">{errors.sellingPrice.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Stock Quantity <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                {...register('stockQuantity', { valueAsNumber: true })}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="0"
              />
              {errors.stockQuantity && (
                <p className="mt-1 text-sm text-red-600">{errors.stockQuantity.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Low Stock Alert Threshold
              </label>
              <input
                type="number"
                {...register('minStockAlert', { valueAsNumber: true })}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="10"
              />
              {errors.minStockAlert && (
                <p className="mt-1 text-sm text-red-600">{errors.minStockAlert.message}</p>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">SEO & Metadata</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                SEO Title
              </label>
              <input
                type="text"
                {...register('seoTitle')}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="Leave empty to use medicine name"
              />
              {errors.seoTitle && (
                <p className="mt-1 text-sm text-red-600">{errors.seoTitle.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                SEO Description
              </label>
              <textarea
                {...register('seoDescription')}
                rows={2}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="Brief description for search engines"
              />
              {errors.seoDescription && (
                <p className="mt-1 text-sm text-red-600">{errors.seoDescription.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                SEO Keywords
              </label>
              <input
                type="text"
                {...register('seoKeywords')}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="keyword1, keyword2, keyword3"
              />
              {errors.seoKeywords && (
                <p className="mt-1 text-sm text-red-600">{errors.seoKeywords.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Canonical URL
              </label>
              <input
                type="url"
                {...register('canonicalUrl')}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="https://example.com/medicines/..."
              />
              {errors.canonicalUrl && (
                <p className="mt-1 text-sm text-red-600">{errors.canonicalUrl.message}</p>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Media</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Image URL
            </label>
            <input
              type="url"
              {...register('imageUrl')}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
              placeholder="https://example.com/image.jpg"
            />
            {errors.imageUrl && (
              <p className="mt-1 text-sm text-red-600">{errors.imageUrl.message}</p>
            )}
            <p className="mt-1 text-sm text-gray-500">
              Enter the full URL of the medicine image
            </p>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Settings</h2>
          <div className="space-y-3">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                {...register('requiresPrescription')}
                className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-2 focus:ring-teal-500"
              />
              <span className="text-sm font-medium text-gray-700">
                Requires Prescription
              </span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                {...register('isFeatured')}
                className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-2 focus:ring-teal-500"
              />
              <span className="text-sm font-medium text-gray-700">
                Featured Medicine
              </span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                {...register('isActive')}
                className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-2 focus:ring-teal-500"
              />
              <span className="text-sm font-medium text-gray-700">
                Active (visible to customers)
              </span>
            </label>
          </div>
        </div>

        <div className="flex items-center justify-end gap-4">
          <Link
            href="/admin/medicines"
            className="rounded-lg border border-gray-300 px-6 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 rounded-lg bg-teal-600 px-6 py-2 text-sm font-semibold text-white transition-colors hover:bg-teal-700 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {loading ? 'Updating...' : 'Update Medicine'}
          </button>
        </div>
      </form>
    </div>
  )
}
