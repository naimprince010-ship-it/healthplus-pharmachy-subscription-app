'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Save } from 'lucide-react'
import {
  BasicSettings,
  basicSettingsSchema,
  DEFAULT_BASIC_SETTINGS,
  fetchSettings,
  saveSettings,
} from '@/lib/admin/settings'

export default function BasicSettingsForm() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<BasicSettings>({
    resolver: zodResolver(basicSettingsSchema),
    defaultValues: DEFAULT_BASIC_SETTINGS,
  })

  useEffect(() => {
    async function loadSettings() {
      try {
        const data = await fetchSettings<BasicSettings>('basic')
        const merged = { ...DEFAULT_BASIC_SETTINGS, ...data }
        reset(merged)
      } catch (err) {
        console.error('Failed to load basic settings:', err)
        setMessage({ type: 'error', text: 'Failed to load settings' })
      } finally {
        setLoading(false)
      }
    }
    loadSettings()
  }, [reset])

  const onSubmit = async (data: BasicSettings) => {
    setSaving(true)
    setMessage(null)
    try {
      await saveSettings('basic', data)
      reset(data)
      setMessage({ type: 'success', text: 'Settings saved successfully!' })
    } catch (err) {
      console.error('Failed to save basic settings:', err)
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
        <h3 className="text-lg font-medium text-gray-900 mb-4">Store Information</h3>
        
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <label htmlFor="storeName" className="block text-sm font-medium text-gray-700">
              Store Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="storeName"
              {...register('storeName')}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
              placeholder="HealthPlus Pharmacy"
            />
            {errors.storeName && (
              <p className="mt-1 text-sm text-red-600">{errors.storeName.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="storePhone" className="block text-sm font-medium text-gray-700">
              Phone Number <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              id="storePhone"
              {...register('storePhone')}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
              placeholder="+880 1XXX-XXXXXX"
            />
            {errors.storePhone && (
              <p className="mt-1 text-sm text-red-600">{errors.storePhone.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="storeEmail" className="block text-sm font-medium text-gray-700">
              Email Address <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              id="storeEmail"
              {...register('storeEmail')}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
              placeholder="contact@healthplus.com"
            />
            {errors.storeEmail && (
              <p className="mt-1 text-sm text-red-600">{errors.storeEmail.message}</p>
            )}
          </div>

          <div className="md:col-span-2">
            <label htmlFor="storeAddress" className="block text-sm font-medium text-gray-700">
              Store Address <span className="text-red-500">*</span>
            </label>
            <textarea
              id="storeAddress"
              rows={3}
              {...register('storeAddress')}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
              placeholder="Enter your store address"
            />
            {errors.storeAddress && (
              <p className="mt-1 text-sm text-red-600">{errors.storeAddress.message}</p>
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
