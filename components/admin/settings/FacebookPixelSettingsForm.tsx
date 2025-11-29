'use client'

import { useState, useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Save } from 'lucide-react'
import { z } from 'zod'
import {
  FacebookPixelSettings,
  DEFAULT_FACEBOOK_PIXEL_SETTINGS,
  fetchSettings,
  saveSettings,
} from '@/lib/admin/settings'

const facebookPixelFormSchema = z.object({
  enabled: z.boolean(),
  pixelId: z.string(),
}).refine(
  (data) => !data.enabled || data.pixelId.trim().length > 0,
  { message: 'Pixel ID is required when Facebook Pixel is enabled', path: ['pixelId'] }
)

export default function FacebookPixelSettingsForm() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    formState: { errors, isDirty },
  } = useForm<FacebookPixelSettings>({
    resolver: zodResolver(facebookPixelFormSchema),
    defaultValues: DEFAULT_FACEBOOK_PIXEL_SETTINGS,
  })

  const enabled = watch('enabled')

  useEffect(() => {
    async function loadSettings() {
      try {
        const data = await fetchSettings<FacebookPixelSettings>('facebook-pixel')
        const merged = { ...DEFAULT_FACEBOOK_PIXEL_SETTINGS, ...data }
        reset(merged)
      } catch (err) {
        console.error('Failed to load Facebook Pixel settings:', err)
        setMessage({ type: 'error', text: 'Failed to load settings' })
      } finally {
        setLoading(false)
      }
    }
    loadSettings()
  }, [reset])

  const onSubmit = async (data: FacebookPixelSettings) => {
    setSaving(true)
    setMessage(null)
    try {
      await saveSettings('facebook-pixel', data)
      reset(data)
      setMessage({ type: 'success', text: 'Settings saved successfully!' })
    } catch (err) {
      console.error('Failed to save Facebook Pixel settings:', err)
      setMessage({ type: 'error', text: 'Failed to save settings' })
    } finally {
      setSaving(false)
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
        <h3 className="text-lg font-medium text-gray-900 mb-4">Facebook Pixel</h3>
        <p className="text-sm text-gray-500 mb-6">
          Configure Facebook Pixel to track conversions and build audiences for your ads.
        </p>
        
        <div className="space-y-4">
          <Controller
            name="enabled"
            control={control}
            render={({ field }) => (
              <label className="flex items-center gap-3 cursor-pointer">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={field.value}
                    onChange={field.onChange}
                    className="sr-only"
                  />
                  <div
                    className={`h-6 w-11 rounded-full transition-colors ${
                      field.value ? 'bg-teal-600' : 'bg-gray-300'
                    }`}
                  >
                    <div
                      className={`h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                        field.value ? 'translate-x-5' : 'translate-x-0.5'
                      } mt-0.5`}
                    />
                  </div>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-900">
                    Enable Facebook Pixel
                  </span>
                  <p className="text-xs text-gray-500">
                    Inject Facebook Pixel tracking code on your storefront
                  </p>
                </div>
              </label>
            )}
          />

          <div>
            <label htmlFor="pixelId" className="block text-sm font-medium text-gray-700 mb-2">
              Pixel ID
            </label>
            <input
              type="text"
              id="pixelId"
              {...register('pixelId')}
              disabled={!enabled}
              placeholder="e.g. 1234567890"
              className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
            <p className="mt-1 text-xs text-gray-500">
              Find your Pixel ID in Facebook Events Manager
            </p>
            {errors.pixelId && (
              <p className="mt-1 text-sm text-red-600">{errors.pixelId.message}</p>
            )}
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
