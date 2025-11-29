'use client'

import { useState, useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Save, Eye, EyeOff } from 'lucide-react'
import { z } from 'zod'
import {
  FacebookCapiSettings,
  DEFAULT_FACEBOOK_CAPI_SETTINGS,
  fetchSettings,
  saveSettings,
} from '@/lib/admin/settings'

const facebookCapiFormSchema = z.object({
  enabled: z.boolean(),
  accessToken: z.string(),
  testEventCode: z.string().nullable(),
}).refine(
  (data) => !data.enabled || data.accessToken.trim().length > 0,
  { message: 'Access Token is required when Facebook CAPI is enabled', path: ['accessToken'] }
)

export default function FacebookCapiSettingsForm() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showToken, setShowToken] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    formState: { errors, isDirty },
  } = useForm<FacebookCapiSettings>({
    resolver: zodResolver(facebookCapiFormSchema),
    defaultValues: DEFAULT_FACEBOOK_CAPI_SETTINGS,
  })

  const enabled = watch('enabled')

  useEffect(() => {
    async function loadSettings() {
      try {
        const data = await fetchSettings<FacebookCapiSettings>('facebook-capi')
        const merged = { ...DEFAULT_FACEBOOK_CAPI_SETTINGS, ...data }
        reset(merged)
      } catch (err) {
        console.error('Failed to load Facebook CAPI settings:', err)
        setMessage({ type: 'error', text: 'Failed to load settings' })
      } finally {
        setLoading(false)
      }
    }
    loadSettings()
  }, [reset])

  const onSubmit = async (data: FacebookCapiSettings) => {
    setSaving(true)
    setMessage(null)
    try {
      await saveSettings('facebook-capi', data)
      reset(data)
      setMessage({ type: 'success', text: 'Settings saved successfully!' })
    } catch (err) {
      console.error('Failed to save Facebook CAPI settings:', err)
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
        <h3 className="text-lg font-medium text-gray-900 mb-4">Facebook Conversion API</h3>
        <p className="text-sm text-gray-500 mb-6">
          Configure Facebook Conversion API (CAPI) for server-side event tracking. This provides more reliable conversion data than browser-based tracking.
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
                    Enable Facebook Conversion API
                  </span>
                  <p className="text-xs text-gray-500">
                    Send server-side events to Facebook for better tracking accuracy
                  </p>
                </div>
              </label>
            )}
          />

          <div>
            <label htmlFor="accessToken" className="block text-sm font-medium text-gray-700 mb-2">
              Access Token
            </label>
            <div className="relative">
              <input
                type={showToken ? 'text' : 'password'}
                id="accessToken"
                {...register('accessToken')}
                disabled={!enabled}
                placeholder="Enter your access token"
                className="block w-full rounded-md border border-gray-300 px-3 py-2 pr-10 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
              <button
                type="button"
                onClick={() => setShowToken(!showToken)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showToken ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Generate an access token in Facebook Events Manager
            </p>
            {errors.accessToken && (
              <p className="mt-1 text-sm text-red-600">{errors.accessToken.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="testEventCode" className="block text-sm font-medium text-gray-700 mb-2">
              Test Event Code (Optional)
            </label>
            <input
              type="text"
              id="testEventCode"
              {...register('testEventCode')}
              disabled={!enabled}
              placeholder="e.g. TEST12345"
              className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
            <p className="mt-1 text-xs text-gray-500">
              Use a test event code to verify your CAPI setup in Events Manager
            </p>
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
