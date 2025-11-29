'use client'

import { useState, useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Save, X } from 'lucide-react'
import {
  CheckoutSettings,
  checkoutSettingsSchema,
  DEFAULT_CHECKOUT_SETTINGS,
  fetchSettings,
  saveSettings,
} from '@/lib/admin/settings'

const AVAILABLE_FIELDS = [
  { value: 'name', label: 'Customer Name' },
  { value: 'phone', label: 'Phone Number' },
  { value: 'address', label: 'Address' },
  { value: 'area', label: 'Area/District' },
  { value: 'notes', label: 'Order Notes' },
]

const PAYMENT_METHODS = [
  { value: 'cod', label: 'Cash on Delivery' },
  { value: 'online', label: 'Online Payment' },
  { value: 'wallet', label: 'Wallet (Future)' },
]

export default function CheckoutSettingsForm() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    setValue,
    formState: { errors, isDirty },
  } = useForm<CheckoutSettings>({
    resolver: zodResolver(checkoutSettingsSchema),
    defaultValues: DEFAULT_CHECKOUT_SETTINGS,
  })

  const requiredFields = watch('requiredFields')

  useEffect(() => {
    async function loadSettings() {
      try {
        const data = await fetchSettings<CheckoutSettings>('checkout')
        const merged = { ...DEFAULT_CHECKOUT_SETTINGS, ...data }
        reset(merged)
      } catch (err) {
        console.error('Failed to load checkout settings:', err)
        setMessage({ type: 'error', text: 'Failed to load settings' })
      } finally {
        setLoading(false)
      }
    }
    loadSettings()
  }, [reset])

  const onSubmit = async (data: CheckoutSettings) => {
    setSaving(true)
    setMessage(null)
    try {
      await saveSettings('checkout', data)
      reset(data)
      setMessage({ type: 'success', text: 'Settings saved successfully!' })
    } catch (err) {
      console.error('Failed to save checkout settings:', err)
      setMessage({ type: 'error', text: 'Failed to save settings' })
    } finally {
      setSaving(false)
    }
  }

  const toggleField = (field: string) => {
    const current = requiredFields || []
    if (current.includes(field)) {
      setValue(
        'requiredFields',
        current.filter((f) => f !== field),
        { shouldDirty: true }
      )
    } else {
      setValue('requiredFields', [...current, field], { shouldDirty: true })
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
        <h3 className="text-lg font-medium text-gray-900 mb-4">Guest Checkout</h3>
        
        <Controller
          name="allowGuestCheckout"
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
                  Allow Guest Checkout
                </span>
                <p className="text-xs text-gray-500">
                  Allow customers to checkout without creating an account
                </p>
              </div>
            </label>
          )}
        />
      </div>

      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Required Fields</h3>
        <p className="text-sm text-gray-500 mb-4">
          Select which fields are required during checkout
        </p>
        
        <div className="flex flex-wrap gap-2">
          {AVAILABLE_FIELDS.map((field) => {
            const isSelected = requiredFields?.includes(field.value)
            return (
              <button
                key={field.value}
                type="button"
                onClick={() => toggleField(field.value)}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                  isSelected
                    ? 'bg-teal-100 text-teal-800 border border-teal-300'
                    : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
                }`}
              >
                {field.label}
                {isSelected && <X className="h-3.5 w-3.5" />}
              </button>
            )
          })}
        </div>
        {errors.requiredFields && (
          <p className="mt-2 text-sm text-red-600">{errors.requiredFields.message}</p>
        )}
      </div>

      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Default Payment Method</h3>
        
        <div className="space-y-3">
          {PAYMENT_METHODS.map((method) => (
            <label
              key={method.value}
              className="flex items-center gap-3 cursor-pointer"
            >
              <input
                type="radio"
                value={method.value}
                {...register('defaultPaymentMethod')}
                className="h-4 w-4 text-teal-600 border-gray-300 focus:ring-teal-500"
              />
              <span className="text-sm text-gray-700">{method.label}</span>
            </label>
          ))}
        </div>
        {errors.defaultPaymentMethod && (
          <p className="mt-2 text-sm text-red-600">{errors.defaultPaymentMethod.message}</p>
        )}
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
