'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Save, Upload } from 'lucide-react'
import Image from 'next/image'
import {
  BrandingSettings,
  brandingSettingsSchema,
  DEFAULT_BRANDING_SETTINGS,
  fetchSettings,
  saveSettings,
} from '@/lib/admin/settings'

export default function BrandingSettingsForm() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isDirty },
  } = useForm<BrandingSettings>({
    resolver: zodResolver(brandingSettingsSchema),
    defaultValues: DEFAULT_BRANDING_SETTINGS,
  })

  const logoUrl = watch('logoUrl')
  const faviconUrl = watch('faviconUrl')
  const primaryColor = watch('primaryColor')
  const secondaryColor = watch('secondaryColor')

  useEffect(() => {
    async function loadSettings() {
      try {
        const data = await fetchSettings<BrandingSettings>('branding')
        const merged = { ...DEFAULT_BRANDING_SETTINGS, ...data }
        reset(merged)
      } catch (err) {
        console.error('Failed to load branding settings:', err)
        setMessage({ type: 'error', text: 'Failed to load settings' })
      } finally {
        setLoading(false)
      }
    }
    loadSettings()
  }, [reset])

  const onSubmit = async (data: BrandingSettings) => {
    setSaving(true)
    setMessage(null)
    try {
      await saveSettings('branding', data)
      reset(data)
      setMessage({ type: 'success', text: 'Settings saved successfully!' })
    } catch (err) {
      console.error('Failed to save branding settings:', err)
      setMessage({ type: 'error', text: 'Failed to save settings' })
    } finally {
      setSaving(false)
    }
  }

  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    field: 'logoUrl' | 'faviconUrl'
  ) => {
    const file = e.target.files?.[0]
    if (!file) return

    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Upload failed')
      }

      const data = await response.json()
      setValue(field, data.url, { shouldDirty: true })
    } catch (err) {
      console.error('Failed to upload image:', err)
      setMessage({ type: 'error', text: 'Failed to upload image' })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {message && (
        <div
          className={`rounded-lg p-4 ${
            message.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Logo & Favicon</h3>
        
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Store Logo
            </label>
            <div className="flex items-center gap-4">
              {logoUrl ? (
                <div className="relative h-16 w-32 rounded border bg-gray-50">
                  <Image
                    src={logoUrl}
                    alt="Store Logo"
                    fill
                    className="object-contain p-2"
                  />
                </div>
              ) : (
                <div className="flex h-16 w-32 items-center justify-center rounded border border-dashed border-gray-300 bg-gray-50">
                  <span className="text-xs text-gray-400">No logo</span>
                </div>
              )}
              <label className="cursor-pointer inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50">
                <Upload className="h-4 w-4" />
                Upload
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleImageUpload(e, 'logoUrl')}
                />
              </label>
            </div>
            <input type="hidden" {...register('logoUrl')} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Favicon
            </label>
            <div className="flex items-center gap-4">
              {faviconUrl ? (
                <div className="relative h-16 w-16 rounded border bg-gray-50">
                  <Image
                    src={faviconUrl}
                    alt="Favicon"
                    fill
                    className="object-contain p-2"
                  />
                </div>
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded border border-dashed border-gray-300 bg-gray-50">
                  <span className="text-xs text-gray-400">No icon</span>
                </div>
              )}
              <label className="cursor-pointer inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50">
                <Upload className="h-4 w-4" />
                Upload
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleImageUpload(e, 'faviconUrl')}
                />
              </label>
            </div>
            <input type="hidden" {...register('faviconUrl')} />
          </div>
        </div>
      </div>

      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Brand Colors</h3>
        
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <label htmlFor="primaryColor" className="block text-sm font-medium text-gray-700">
              Primary Color <span className="text-red-500">*</span>
            </label>
            <div className="mt-1 flex items-center gap-3">
              <input
                type="color"
                id="primaryColorPicker"
                value={primaryColor}
                onChange={(e) => setValue('primaryColor', e.target.value, { shouldDirty: true })}
                className="h-10 w-14 cursor-pointer rounded border border-gray-300"
              />
              <input
                type="text"
                id="primaryColor"
                {...register('primaryColor')}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                placeholder="#0F766E"
              />
            </div>
            {errors.primaryColor && (
              <p className="mt-1 text-sm text-red-600">{errors.primaryColor.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="secondaryColor" className="block text-sm font-medium text-gray-700">
              Secondary Color <span className="text-red-500">*</span>
            </label>
            <div className="mt-1 flex items-center gap-3">
              <input
                type="color"
                id="secondaryColorPicker"
                value={secondaryColor}
                onChange={(e) => setValue('secondaryColor', e.target.value, { shouldDirty: true })}
                className="h-10 w-14 cursor-pointer rounded border border-gray-300"
              />
              <input
                type="text"
                id="secondaryColor"
                {...register('secondaryColor')}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                placeholder="#14B8A6"
              />
            </div>
            {errors.secondaryColor && (
              <p className="mt-1 text-sm text-red-600">{errors.secondaryColor.message}</p>
            )}
          </div>
        </div>

        <div className="mt-4 p-4 rounded-lg bg-gray-50">
          <p className="text-sm text-gray-600 mb-2">Preview:</p>
          <div className="flex gap-4">
            <div
              className="h-12 w-24 rounded flex items-center justify-center text-white text-sm font-medium"
              style={{ backgroundColor: primaryColor }}
            >
              Primary
            </div>
            <div
              className="h-12 w-24 rounded flex items-center justify-center text-white text-sm font-medium"
              style={{ backgroundColor: secondaryColor }}
            >
              Secondary
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving || !isDirty}
          className="inline-flex items-center gap-2 rounded-md bg-teal-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Save Changes
            </>
          )}
        </button>
      </div>
    </form>
  )
}
