'use client'

import { useState, useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Save } from 'lucide-react'
import { z } from 'zod'
import {
  GdprSettings,
  DEFAULT_GDPR_SETTINGS,
  fetchSettings,
  saveSettings,
} from '@/lib/admin/settings'

const gdprFormSchema = z.object({
  cookieBannerEnabled: z.boolean(),
  cookieBannerText: z.string(),
  requireConsentForTracking: z.boolean(),
}).refine(
  (data) => !data.cookieBannerEnabled || data.cookieBannerText.trim().length > 0,
  { message: 'Cookie banner text is required when banner is enabled', path: ['cookieBannerText'] }
)

export default function GdprSettingsForm() {
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
  } = useForm<GdprSettings>({
    resolver: zodResolver(gdprFormSchema),
    defaultValues: DEFAULT_GDPR_SETTINGS,
  })

  const cookieBannerEnabled = watch('cookieBannerEnabled')

  useEffect(() => {
    async function loadSettings() {
      try {
        const data = await fetchSettings<GdprSettings>('gdpr')
        const merged = { ...DEFAULT_GDPR_SETTINGS, ...data }
        reset(merged)
      } catch (err) {
        console.error('Failed to load GDPR settings:', err)
        setMessage({ type: 'error', text: 'Failed to load settings' })
      } finally {
        setLoading(false)
      }
    }
    loadSettings()
  }, [reset])

  const onSubmit = async (data: GdprSettings) => {
    setSaving(true)
    setMessage(null)
    try {
      await saveSettings('gdpr', data)
      reset(data)
      setMessage({ type: 'success', text: 'Settings saved successfully!' })
    } catch (err) {
      console.error('Failed to save GDPR settings:', err)
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
        <h3 className="text-lg font-medium text-gray-900 mb-4">Cookie Banner</h3>
        <p className="text-sm text-gray-500 mb-6">
          Configure the cookie consent banner shown to visitors on your storefront.
        </p>
        
        <div className="space-y-4">
          <Controller
            name="cookieBannerEnabled"
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
                    Enable Cookie Banner
                  </span>
                  <p className="text-xs text-gray-500">
                    Show a cookie consent banner to visitors
                  </p>
                </div>
              </label>
            )}
          />

          <div>
            <label htmlFor="cookieBannerText" className="block text-sm font-medium text-gray-700 mb-2">
              Banner Text
            </label>
            <textarea
              id="cookieBannerText"
              {...register('cookieBannerText')}
              disabled={!cookieBannerEnabled}
              rows={3}
              placeholder="We use cookies to improve your experience..."
              className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
            <p className="mt-1 text-xs text-gray-500">
              The message shown to visitors in the cookie consent banner
            </p>
            {errors.cookieBannerText && (
              <p className="mt-1 text-sm text-red-600">{errors.cookieBannerText.message}</p>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Tracking Consent</h3>
        <p className="text-sm text-gray-500 mb-6">
          Configure whether tracking scripts require user consent before loading.
        </p>
        
        <Controller
          name="requireConsentForTracking"
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
                  Require Consent for Tracking
                </span>
                <p className="text-xs text-gray-500">
                  Only load tracking scripts (FB Pixel, TikTok, GTM, GA4) after user accepts cookies
                </p>
              </div>
            </label>
          )}
        />
      </div>

      <div className="rounded-lg border bg-blue-50 p-4 border-blue-200">
        <p className="text-sm text-blue-800">
          <strong>GDPR Compliance:</strong> If you serve customers in the EU, enabling consent requirement helps comply with GDPR regulations. Tracking scripts will only load after the user clicks &quot;Accept&quot; on the cookie banner.
        </p>
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
