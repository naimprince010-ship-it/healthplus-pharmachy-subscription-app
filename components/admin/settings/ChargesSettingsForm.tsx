'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Save } from 'lucide-react'
import {
  ChargesSettings,
  chargesSettingsSchema,
  DEFAULT_CHARGES_SETTINGS,
  fetchSettings,
  saveSettings,
} from '@/lib/admin/settings'

export default function ChargesSettingsForm() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<ChargesSettings>({
    resolver: zodResolver(chargesSettingsSchema),
    defaultValues: DEFAULT_CHARGES_SETTINGS,
  })

  useEffect(() => {
    async function loadSettings() {
      try {
        const data = await fetchSettings<ChargesSettings>('charges')
        const merged = { ...DEFAULT_CHARGES_SETTINGS, ...data }
        reset(merged)
      } catch (err) {
        console.error('Failed to load charges settings:', err)
        setMessage({ type: 'error', text: 'Failed to load settings' })
      } finally {
        setLoading(false)
      }
    }
    loadSettings()
  }, [reset])

  const onSubmit = async (data: ChargesSettings) => {
    setSaving(true)
    setMessage(null)
    try {
      await saveSettings('charges', data)
      reset(data)
      setMessage({ type: 'success', text: 'Settings saved successfully!' })
    } catch (err) {
      console.error('Failed to save charges settings:', err)
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
        <h3 className="text-lg font-medium text-gray-900 mb-4">Delivery Charges</h3>
        
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <label htmlFor="insideDhaka" className="block text-sm font-medium text-gray-700">
              Inside Dhaka (BDT) <span className="text-red-500">*</span>
            </label>
            <div className="mt-1 relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">৳</span>
              <input
                type="number"
                id="insideDhaka"
                {...register('insideDhaka', { valueAsNumber: true })}
                className="block w-full rounded-md border border-gray-300 pl-8 pr-3 py-2 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                placeholder="60"
                min="0"
              />
            </div>
            {errors.insideDhaka && (
              <p className="mt-1 text-sm text-red-600">{errors.insideDhaka.message}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">Delivery charge for orders within Dhaka city</p>
          </div>

          <div>
            <label htmlFor="outsideDhaka" className="block text-sm font-medium text-gray-700">
              Outside Dhaka (BDT) <span className="text-red-500">*</span>
            </label>
            <div className="mt-1 relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">৳</span>
              <input
                type="number"
                id="outsideDhaka"
                {...register('outsideDhaka', { valueAsNumber: true })}
                className="block w-full rounded-md border border-gray-300 pl-8 pr-3 py-2 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                placeholder="120"
                min="0"
              />
            </div>
            {errors.outsideDhaka && (
              <p className="mt-1 text-sm text-red-600">{errors.outsideDhaka.message}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">Delivery charge for orders outside Dhaka</p>
          </div>
        </div>
      </div>

      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Additional Charges</h3>
        
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <label htmlFor="codCharge" className="block text-sm font-medium text-gray-700">
              COD Charge (BDT) <span className="text-red-500">*</span>
            </label>
            <div className="mt-1 relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">৳</span>
              <input
                type="number"
                id="codCharge"
                {...register('codCharge', { valueAsNumber: true })}
                className="block w-full rounded-md border border-gray-300 pl-8 pr-3 py-2 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                placeholder="0"
                min="0"
              />
            </div>
            {errors.codCharge && (
              <p className="mt-1 text-sm text-red-600">{errors.codCharge.message}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">Extra charge for Cash on Delivery orders</p>
          </div>

          <div>
            <label htmlFor="minOrderAmount" className="block text-sm font-medium text-gray-700">
              Minimum Order Amount (BDT) <span className="text-red-500">*</span>
            </label>
            <div className="mt-1 relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">৳</span>
              <input
                type="number"
                id="minOrderAmount"
                {...register('minOrderAmount', { valueAsNumber: true })}
                className="block w-full rounded-md border border-gray-300 pl-8 pr-3 py-2 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                placeholder="0"
                min="0"
              />
            </div>
            {errors.minOrderAmount && (
              <p className="mt-1 text-sm text-red-600">{errors.minOrderAmount.message}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">Minimum order value required for checkout (0 = no minimum)</p>
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
