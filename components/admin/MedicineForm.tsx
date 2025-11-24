'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save } from 'lucide-react'
import { useForm, type DefaultValues, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createMedicineSchema, updateMedicineSchema, type CreateMedicineInput, type UpdateMedicineInput } from '@/lib/validations/medicine'
import { Tabs } from '@/components/ui/Tabs'
import { Tooltip } from '@/components/ui/Tooltip'
import { ImageUpload } from '@/components/admin/ImageUpload'
import { parseTabletsFromPackSize, computeStripPrice } from '@/lib/pricing'

interface Category {
  id: string
  name: string
}

interface MedicineFormProps {
  mode: 'create' | 'edit'
  medicineId?: string
  initialData?: Partial<CreateMedicineInput>
}

export function MedicineForm({ mode, medicineId, initialData }: MedicineFormProps) {
  const router = useRouter()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [imageUrl, setImageUrl] = useState(initialData?.imageUrl || '')
  const [imagePath, setImagePath] = useState(initialData?.imagePath || '')

  type FormValues = CreateMedicineInput & { id?: string }

  const defaults: DefaultValues<CreateMedicineInput> = (initialData ?? {
    isActive: true,
    requiresPrescription: false,
    isFeatured: false,
    stockQuantity: 0,
  }) as DefaultValues<CreateMedicineInput>

  const resolver: Resolver<FormValues> =
    mode === 'edit'
      ? (zodResolver(updateMedicineSchema) as unknown as Resolver<FormValues>)
      : (zodResolver(createMedicineSchema) as unknown as Resolver<FormValues>)

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<FormValues>({
    resolver,
    defaultValues: defaults as Partial<FormValues>,
    shouldUnregister: false,
  })

  const unitPrice = watch('unitPrice')
  const tabletsPerStrip = watch('tabletsPerStrip')
  const packSize = watch('packSize')

  useEffect(() => {
    fetchCategories()
  }, [])

  useEffect(() => {
    if (mode === 'edit' && initialData?.categoryId && categories.length > 0) {
      setValue('categoryId', initialData.categoryId, { shouldValidate: false })
    }
  }, [mode, initialData?.categoryId, categories.length, setValue])

  useEffect(() => {
    if (packSize && !tabletsPerStrip) {
      const parsed = parseTabletsFromPackSize(packSize)
      if (parsed) {
        setValue('tabletsPerStrip', parsed)
      }
    }
  }, [packSize, tabletsPerStrip, setValue])

  useEffect(() => {
    if (typeof unitPrice === 'number' && typeof tabletsPerStrip === 'number') {
      const computed = computeStripPrice(unitPrice, tabletsPerStrip)
      if (computed) {
        setValue('stripPrice', computed)
      }
    }
  }, [unitPrice, tabletsPerStrip, setValue])

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/admin/categories')
      const data = await res.json()
      if (res.ok) {
        setCategories(data.categories || [])
      }
    } catch (err) {
      console.error('Failed to fetch categories:', err)
    }
  }

  const onSubmit = async (data: CreateMedicineInput) => {
    setLoading(true)
    setError(null)

    try {
      const payload = {
        ...data,
        imageUrl,
        imagePath,
      }

      const url = mode === 'create' 
        ? '/api/admin/medicines'
        : `/api/admin/medicines/${medicineId}`
      
      const method = mode === 'create' ? 'POST' : 'PUT'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const result = await res.json()

      if (res.ok) {
        const successParam = mode === 'create' ? 'created' : 'updated'
        router.push(`/admin/medicines?success=${successParam}`)
      } else {
        setError(result.error || `Failed to ${mode} medicine`)
      }
    } catch (error) {
      setError(`Failed to ${mode} medicine`)
    } finally {
      setLoading(false)
    }
  }

  const tabs = [
    {
      id: 'basic',
      label: 'Basic Info',
      content: (
        <div className="space-y-4">
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
                <p className="mt-1 text-sm text-red-600">{errors.name.message as string}</p>
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
                <p className="mt-1 text-sm text-red-600">{errors.genericName.message as string}</p>
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
                <p className="mt-1 text-sm text-red-600">{errors.brandName.message as string}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Manufacturer <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...register('manufacturer')}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="e.g., Beximco Pharmaceuticals"
              />
              {errors.manufacturer && (
                <p className="mt-1 text-sm text-red-600">{errors.manufacturer.message as string}</p>
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
                <p className="mt-1 text-sm text-red-600">{errors.categoryId.message as string}</p>
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
                <p className="mt-1 text-sm text-red-600">{errors.dosageForm.message as string}</p>
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
                <p className="mt-1 text-sm text-red-600">{errors.strength.message as string}</p>
              )}
            </div>

            <div>
              <Tooltip content="e.g., '1 strip x 10 tablets' - tablets per strip will be auto-detected">
                <label className="block text-sm font-medium text-gray-700">
                  Pack Size
                </label>
              </Tooltip>
              <input
                type="text"
                {...register('packSize')}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="e.g., 1 strip x 10 tablets"
              />
              {errors.packSize && (
                <p className="mt-1 text-sm text-red-600">{errors.packSize.message as string}</p>
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
                <p className="mt-1 text-sm text-red-600">{errors.description.message as string}</p>
              )}
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'pricing',
      label: 'Pricing & Stock',
      content: (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Tooltip content="Price per single tablet/capsule">
                <label className="block text-sm font-medium text-gray-700">
                  Unit Price (per tablet)
                </label>
              </Tooltip>
              <input
                type="number"
                step="0.01"
                {...register('unitPrice', { valueAsNumber: true })}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="0.00"
              />
              {errors.unitPrice && (
                <p className="mt-1 text-sm text-red-600">{errors.unitPrice.message as string}</p>
              )}
            </div>

            <div>
              <Tooltip content="Number of tablets per strip - auto-filled from pack size">
                <label className="block text-sm font-medium text-gray-700">
                  Tablets Per Strip
                </label>
              </Tooltip>
              <input
                type="number"
                {...register('tabletsPerStrip', { valueAsNumber: true })}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="10"
              />
              {errors.tabletsPerStrip && (
                <p className="mt-1 text-sm text-red-600">{errors.tabletsPerStrip.message as string}</p>
              )}
            </div>

            <div>
              <Tooltip content="Auto-calculated: Unit Price × Tablets Per Strip">
                <label className="block text-sm font-medium text-gray-700">
                  Strip Price (computed)
                </label>
              </Tooltip>
              <input
                type="number"
                step="0.01"
                {...register('stripPrice', { valueAsNumber: true })}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 bg-gray-50 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="0.00"
                readOnly
              />
              {errors.stripPrice && (
                <p className="mt-1 text-sm text-red-600">{errors.stripPrice.message as string}</p>
              )}
            </div>

            <div>
              <Tooltip content="Final selling price - defaults to strip price if not provided">
                <label className="block text-sm font-medium text-gray-700">
                  Selling Price (override)
                </label>
              </Tooltip>
              <input
                type="number"
                step="0.01"
                {...register('sellingPrice', { valueAsNumber: true })}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="Leave empty to use strip price"
              />
              {errors.sellingPrice && (
                <p className="mt-1 text-sm text-red-600">{errors.sellingPrice.message as string}</p>
              )}
            </div>

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
                <p className="mt-1 text-sm text-red-600">{errors.mrp.message as string}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Stock Quantity
              </label>
              <input
                type="number"
                {...register('stockQuantity', { valueAsNumber: true })}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="0"
              />
              {errors.stockQuantity && (
                <p className="mt-1 text-sm text-red-600">{errors.stockQuantity.message as string}</p>
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
                <p className="mt-1 text-sm text-red-600">{errors.minStockAlert.message as string}</p>
              )}
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'seo',
      label: 'SEO',
      content: (
        <div className="space-y-4">
          <div>
            <Tooltip content="Auto-generated from medicine name if left empty">
              <label className="block text-sm font-medium text-gray-700">
                SEO Title
              </label>
            </Tooltip>
            <input
              type="text"
              {...register('seoTitle')}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
              placeholder="Leave empty to auto-generate"
            />
            {errors.seoTitle && (
              <p className="mt-1 text-sm text-red-600">{errors.seoTitle.message as string}</p>
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
              <p className="mt-1 text-sm text-red-600">{errors.seoDescription.message as string}</p>
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
              <p className="mt-1 text-sm text-red-600">{errors.seoKeywords.message as string}</p>
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
              <p className="mt-1 text-sm text-red-600">{errors.canonicalUrl.message as string}</p>
            )}
          </div>
        </div>
      ),
    },
    {
      id: 'details',
      label: 'Details',
      content: (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Uses
            </label>
            <textarea
              {...register('uses')}
              rows={3}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
              placeholder="Common uses of this medicine..."
            />
            {errors.uses && (
              <p className="mt-1 text-sm text-red-600">{errors.uses.message as string}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Side Effects
            </label>
            <textarea
              {...register('sideEffects')}
              rows={3}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
              placeholder="Possible side effects..."
            />
            {errors.sideEffects && (
              <p className="mt-1 text-sm text-red-600">{errors.sideEffects.message as string}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Contraindications
            </label>
            <textarea
              {...register('contraindications')}
              rows={3}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
              placeholder="When not to use this medicine..."
            />
            {errors.contraindications && (
              <p className="mt-1 text-sm text-red-600">{errors.contraindications.message as string}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Storage Instructions
            </label>
            <textarea
              {...register('storageInstructions')}
              rows={2}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
              placeholder="How to store this medicine..."
            />
            {errors.storageInstructions && (
              <p className="mt-1 text-sm text-red-600">{errors.storageInstructions.message as string}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Expiry Date
            </label>
            <input
              type="date"
              {...register('expiryDate')}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            {errors.expiryDate && (
              <p className="mt-1 text-sm text-red-600">{errors.expiryDate.message as string}</p>
            )}
          </div>

          <div className="space-y-3 pt-4 border-t">
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
      ),
    },
    {
      id: 'media',
      label: 'Media',
      content: (
        <div className="space-y-4">
          <ImageUpload
            value={imageUrl}
            path={imagePath}
            onChange={(url, path) => {
              setImageUrl(url)
              setImagePath(path || '')
            }}
            medicineId={medicineId}
          />
        </div>
      ),
    },
  ]

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
          <h1 className="text-3xl font-bold text-gray-900">
            {mode === 'create' ? 'Add New Medicine' : 'Edit Medicine'}
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            {mode === 'create'
              ? 'Fill in the details to add a new medicine to your inventory'
              : 'Update the medicine details'}
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {error}
        </div>
      )}

      <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <Tabs tabs={tabs} defaultTab="basic" />
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
            {loading ? (mode === 'create' ? 'Creating...' : 'Updating...') : (mode === 'create' ? 'Create Medicine' : 'Update Medicine')}
          </button>
        </div>
      </form>
    </div>
  )
}
