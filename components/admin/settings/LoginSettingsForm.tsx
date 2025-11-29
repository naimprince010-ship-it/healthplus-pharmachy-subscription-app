'use client'

import { useState, useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Save } from 'lucide-react'
import { z } from 'zod'
import {
  LoginSettings,
  DEFAULT_LOGIN_SETTINGS,
  fetchSettings,
  saveSettings,
} from '@/lib/admin/settings'

// Custom schema with refinement for form validation
const loginSettingsFormSchema = z.object({
  enableOtpLogin: z.boolean(),
  enablePasswordLogin: z.boolean(),
  otpLoginMode: z.enum(['phone_only', 'email_phone']),
}).refine(
  (data) => data.enableOtpLogin || data.enablePasswordLogin,
  { message: 'At least one login method must remain enabled', path: ['enablePasswordLogin'] }
)

const OTP_LOGIN_MODES = [
  { value: 'phone_only', label: 'Phone Only' },
  { value: 'email_phone', label: 'Email or Phone' },
]

export default function LoginSettingsForm() {
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
  } = useForm<LoginSettings>({
    resolver: zodResolver(loginSettingsFormSchema),
    defaultValues: DEFAULT_LOGIN_SETTINGS,
  })

  const enableOtpLogin = watch('enableOtpLogin')
  const enablePasswordLogin = watch('enablePasswordLogin')

  useEffect(() => {
    async function loadSettings() {
      try {
        const data = await fetchSettings<LoginSettings>('login')
        const merged = { ...DEFAULT_LOGIN_SETTINGS, ...data }
        reset(merged)
      } catch (err) {
        console.error('Failed to load login settings:', err)
        setMessage({ type: 'error', text: 'Failed to load settings' })
      } finally {
        setLoading(false)
      }
    }
    loadSettings()
  }, [reset])

  const onSubmit = async (data: LoginSettings) => {
    setSaving(true)
    setMessage(null)
    try {
      await saveSettings('login', data)
      reset(data)
      setMessage({ type: 'success', text: 'Settings saved successfully!' })
    } catch (err) {
      console.error('Failed to save login settings:', err)
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
        <h3 className="text-lg font-medium text-gray-900 mb-4">Login Methods</h3>
        <p className="text-sm text-gray-500 mb-6">
          Configure which login methods are available to customers. At least one method must remain enabled.
        </p>
        
        <div className="space-y-4">
          <Controller
            name="enablePasswordLogin"
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
                    Enable Password Login
                  </span>
                  <p className="text-xs text-gray-500">
                    Allow customers to log in with email/phone and password
                  </p>
                </div>
              </label>
            )}
          />

          <Controller
            name="enableOtpLogin"
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
                    Enable OTP Login
                  </span>
                  <p className="text-xs text-gray-500">
                    Allow customers to log in with one-time password sent via SMS/email
                  </p>
                </div>
              </label>
            )}
          />
        </div>

        {errors.enablePasswordLogin && (
          <p className="mt-4 text-sm text-red-600 bg-red-50 p-3 rounded-lg">
            {errors.enablePasswordLogin.message}
          </p>
        )}

        {!enableOtpLogin && !enablePasswordLogin && (
          <p className="mt-4 text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">
            Warning: At least one login method must remain enabled.
          </p>
        )}
      </div>

      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <h3 className="text-lg font-medium text-gray-900 mb-4">OTP Login Options</h3>
        <p className="text-sm text-gray-500 mb-4">
          Configure how OTP login works when enabled.
        </p>
        
        <div>
          <label htmlFor="otpLoginMode" className="block text-sm font-medium text-gray-700 mb-2">
            OTP Login Mode
          </label>
          <select
            id="otpLoginMode"
            {...register('otpLoginMode')}
            disabled={!enableOtpLogin}
            className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            {OTP_LOGIN_MODES.map((mode) => (
              <option key={mode.value} value={mode.value}>
                {mode.label}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-gray-500">
            {enableOtpLogin 
              ? 'Choose whether OTP can be sent to phone only, or both email and phone.'
              : 'Enable OTP login above to configure this option.'}
          </p>
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
