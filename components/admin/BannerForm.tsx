'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save } from 'lucide-react'
import { useForm, type DefaultValues, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createBannerSchema, updateBannerSchema, type CreateBannerInput } from '@/lib/validations/banner'
import { BANNER_LOCATIONS, BANNER_LOCATION_LABELS, DEVICE_OPTIONS, DEVICE_LABELS, RECOMMENDED_IMAGE_SIZES } from '@/lib/banner-constants'
import { ImageUpload } from '@/components/admin/ImageUpload'

interface BannerFormProps {
  mode: 'create' | 'edit'
  bannerId?: string
  initialData?: Partial<CreateBannerInput>
}

export function BannerForm({ mode, bannerId, initialData }: BannerFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [imageDesktopUrl, setImageDesktopUrl] = useState(initialData?.imageDesktopUrl || initialData?.imageUrl || '')
  const [imageMobileUrl, setImageMobileUrl] = useState(initialData?.imageMobileUrl || '')
  const [imageDesktopPath, setImageDesktopPath] = useState('')
  const [imageMobilePath, setImageMobilePath] = useState('')

  type FormValues = CreateBannerInput & { id?: string }

  const defaults: DefaultValues<CreateBannerInput> = (initialData ?? {
    isActive: true,
    order: 0,
    visibilityDevice: 'all',
  }) as DefaultValues<CreateBannerInput>

  const resolver: Resolver<FormValues> =
    mode === 'edit'
      ? (zodResolver(updateBannerSchema) as unknown as Resolver<FormValues>)
      : (zodResolver(createBannerSchema) as unknown as Resolver<FormValues>)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver,
    defaultValues: defaults as Partial<FormValues>,
  })

  const onSubmit = async (data: CreateBannerInput) => {
    setLoading(true)
    setError(null)

    try {
      const payload = {
        ...data,
        imageUrl: imageDesktopUrl || imageMobileUrl || data.imageUrl,
        imageDesktopUrl: imageDesktopUrl || null,
        imageMobileUrl: imageMobileUrl || null,
      }

      const url = mode === 'create' 
        ? '/api/admin/banners'
        : `/api/admin/banners/${bannerId}`
      
      const method = mode === 'create' ? 'POST' : 'PUT'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const result = await res.json()

      if (!res.ok) {
        throw new Error(result.error || 'Failed to save banner')
      }

      router.push('/admin/banners')
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/admin/banners"
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-300 bg-white transition-colors hover:bg-gray-50"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {mode === 'create' ? 'Create Banner' : 'Edit Banner'}
              </h1>
              <p className="text-sm text-gray-600">
                {mode === 'create' ? 'Add a new banner to your site' : 'Update the banner details'}
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-lg bg-red-50 p-4 text-red-800">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8" noValidate>
          {/* Basic Info Section */}
          <div className="rounded-lg bg-white p-6 shadow">
            <h2 className="mb-4 text-xl font-semibold text-gray-900">Basic Info</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  {...register('title')}
                  type="text"
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="e.g., Summer Sale 2024"
                />
                {errors.title && (
                  <p className="mt-1 text-sm text-red-600">{errors.title.message as string}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Subtitle
                </label>
                <input
                  {...register('subtitle')}
                  type="text"
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="e.g., Up to 50% off on all medicines"
                />
                {errors.subtitle && (
                  <p className="mt-1 text-sm text-red-600">{errors.subtitle.message as string}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  {...register('description')}
                  rows={3}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="Enter banner description..."
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-600">{errors.description.message as string}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Location <span className="text-red-500">*</span>
                  </label>
                  <select
                    {...register('location')}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    {Object.entries(BANNER_LOCATIONS).map(([key, value]) => (
                      <option key={value} value={value}>
                        {BANNER_LOCATION_LABELS[key as keyof typeof BANNER_LOCATIONS]}
                      </option>
                    ))}
                  </select>
                  {errors.location && (
                    <p className="mt-1 text-sm text-red-600">{errors.location.message as string}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Order
                  </label>
                  <input
                    {...register('order', { valueAsNumber: true })}
                    type="number"
                    min="0"
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    placeholder="0"
                  />
                  {errors.order && (
                    <p className="mt-1 text-sm text-red-600">{errors.order.message as string}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2">
                  <input
                    {...register('isActive')}
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-2 focus:ring-teal-500"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Active (visible to customers)
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Media Section */}
          <div className="rounded-lg bg-white p-6 shadow">
            <h2 className="mb-4 text-xl font-semibold text-gray-900">Media</h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Desktop Image <span className="text-red-500">*</span>
                </label>
                <p className="mt-1 text-xs text-gray-500">
                  Recommended size: {RECOMMENDED_IMAGE_SIZES.desktop}
                </p>
                <div className="mt-2">
                  <ImageUpload
                    value={imageDesktopUrl}
                    path={imageDesktopPath}
                    onChange={(url, path) => {
                      setImageDesktopUrl(url)
                      setImageDesktopPath(path || '')
                    }}
                    bannerId={bannerId}
                    folder="banners"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Mobile Image
                </label>
                <p className="mt-1 text-xs text-gray-500">
                  Recommended size: {RECOMMENDED_IMAGE_SIZES.mobile}
                </p>
                <div className="mt-2">
                  <ImageUpload
                    value={imageMobileUrl}
                    path={imageMobilePath}
                    onChange={(url, path) => {
                      setImageMobileUrl(url)
                      setImageMobilePath(path || '')
                    }}
                    bannerId={bannerId}
                    folder="banners"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* CTA & Link Section */}
          <div className="rounded-lg bg-white p-6 shadow">
            <h2 className="mb-4 text-xl font-semibold text-gray-900">CTA & Link</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  CTA Button Label
                </label>
                <input
                  {...register('ctaLabel')}
                  type="text"
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="e.g., Shop Now"
                />
                {errors.ctaLabel && (
                  <p className="mt-1 text-sm text-red-600">{errors.ctaLabel.message as string}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  CTA URL
                </label>
                <input
                  {...register('ctaUrl')}
                  type="url"
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="https://example.com/sale"
                />
                {errors.ctaUrl && (
                  <p className="mt-1 text-sm text-red-600">{errors.ctaUrl.message as string}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Background Color
                  </label>
                  <input
                    {...register('bgColor')}
                    type="text"
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    placeholder="#ffffff or rgb(255,255,255)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Text Color
                  </label>
                  <input
                    {...register('textColor')}
                    type="text"
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    placeholder="#000000 or rgb(0,0,0)"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Display Rules Section */}
          <div className="rounded-lg bg-white p-6 shadow">
            <h2 className="mb-4 text-xl font-semibold text-gray-900">Display Rules</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Start Date/Time
                  </label>
                  <input
                    {...register('startAt')}
                    type="datetime-local"
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Leave empty for immediate activation
                  </p>
                  {errors.startAt && (
                    <p className="mt-1 text-sm text-red-600">{errors.startAt.message as string}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    End Date/Time
                  </label>
                  <input
                    {...register('endAt')}
                    type="datetime-local"
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Leave empty for no expiration
                  </p>
                  {errors.endAt && (
                    <p className="mt-1 text-sm text-red-600">{errors.endAt.message as string}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Device Visibility
                </label>
                <div className="space-y-2">
                  {Object.entries(DEVICE_OPTIONS).map(([key, value]) => (
                    <label key={value} className="flex items-center gap-2">
                      <input
                        {...register('visibilityDevice')}
                        type="radio"
                        value={value}
                        className="h-4 w-4 border-gray-300 text-teal-600 focus:ring-2 focus:ring-teal-500"
                      />
                      <span className="text-sm text-gray-700">
                        {DEVICE_LABELS[value]}
                      </span>
                    </label>
                  ))}
                </div>
                {errors.visibilityDevice && (
                  <p className="mt-1 text-sm text-red-600">{errors.visibilityDevice.message as string}</p>
                )}
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-4">
            <Link
              href="/admin/banners"
              className="rounded-lg border border-gray-300 px-6 py-2 font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 rounded-lg bg-teal-600 px-6 py-2 font-medium text-white transition-colors hover:bg-teal-700 disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {loading ? 'Saving...' : mode === 'create' ? 'Create Banner' : 'Update Banner'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
