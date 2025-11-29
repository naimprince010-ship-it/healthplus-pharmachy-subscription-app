'use client'

import { useState, useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Save, Info } from 'lucide-react'
import { z } from 'zod'
import {
  OrderOtpSettings,
  DEFAULT_ORDER_OTP_SETTINGS,
  fetchSettings,
  saveSettings,
} from '@/lib/admin/settings'

// Custom schema with refinement for form validation
const orderOtpSettingsFormSchema = z.object({
  enabled: z.boolean(),
  sendOn: z.array(z.enum(['order_created', 'order_confirmed'])),
  smsTemplate: z.string(),
  phoneField: z.enum(['shipping_phone', 'billing_phone']),
}).refine(
  (data) => !data.enabled || (data.sendOn.length > 0 && data.smsTemplate.trim().length > 0),
  { message: 'When enabled, at least one event must be selected and SMS template must not be empty', path: ['enabled'] }
)

const OTP_EVENTS = [
  { value: 'order_created', label: 'When order is placed' },
  { value: 'order_confirmed', label: 'When order is confirmed' },
]

const PHONE_FIELDS = [
  { value: 'shipping_phone', label: 'Shipping Phone' },
  { value: 'billing_phone', label: 'Billing Phone' },
]

export default function OrderOtpSettingsForm() {
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
  } = useForm<OrderOtpSettings>({
    resolver: zodResolver(orderOtpSettingsFormSchema),
    defaultValues: DEFAULT_ORDER_OTP_SETTINGS,
  })

  const enabled = watch('enabled')
  const sendOn = watch('sendOn')

  useEffect(() => {
    async function loadSettings() {
      try {
        const data = await fetchSettings<OrderOtpSettings>('order-otp')
        const merged = { ...DEFAULT_ORDER_OTP_SETTINGS, ...data }
        reset(merged)
      } catch (err) {
        console.error('Failed to load order OTP settings:', err)
        setMessage({ type: 'error', text: 'Failed to load settings' })
      } finally {
        setLoading(false)
      }
    }
    loadSettings()
  }, [reset])

  const onSubmit = async (data: OrderOtpSettings) => {
    setSaving(true)
    setMessage(null)
    try {
      await saveSettings('order-otp', data)
      reset(data)
      setMessage({ type: 'success', text: 'Settings saved successfully!' })
    } catch (err) {
      console.error('Failed to save order OTP settings:', err)
      setMessage({ type: 'error', text: 'Failed to save settings' })
    } finally {
      setSaving(false)
    }
  }

  const toggleEvent = (event: 'order_created' | 'order_confirmed') => {
    const current = sendOn || []
    if (current.includes(event)) {
      setValue(
        'sendOn',
        current.filter((e) => e !== event),
        { shouldDirty: true }
      )
    } else {
      setValue('sendOn', [...current, event], { shouldDirty: true })
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
        <h3 className="text-lg font-medium text-gray-900 mb-4">Order OTP SMS</h3>
        <p className="text-sm text-gray-500 mb-6">
          Send OTP verification SMS to customers when orders are placed or confirmed.
        </p>
        
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
                  Enable Order OTP SMS
                </span>
                <p className="text-xs text-gray-500">
                  Send SMS notifications with OTP for order verification
                </p>
              </div>
            </label>
          )}
        />

        {errors.enabled && (
          <p className="mt-4 text-sm text-red-600 bg-red-50 p-3 rounded-lg">
            {errors.enabled.message}
          </p>
        )}
      </div>

      <div className={`rounded-lg border bg-white p-6 shadow-sm ${!enabled ? 'opacity-60' : ''}`}>
        <h3 className="text-lg font-medium text-gray-900 mb-4">When to Send OTP</h3>
        <p className="text-sm text-gray-500 mb-4">
          Select which order events should trigger an OTP SMS.
        </p>
        
        <div className="space-y-3">
          {OTP_EVENTS.map((event) => {
            const isSelected = sendOn?.includes(event.value as 'order_created' | 'order_confirmed')
            return (
              <label
                key={event.value}
                className={`flex items-center gap-3 cursor-pointer ${!enabled ? 'cursor-not-allowed' : ''}`}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleEvent(event.value as 'order_created' | 'order_confirmed')}
                  disabled={!enabled}
                  className="h-4 w-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500 disabled:opacity-50"
                />
                <span className="text-sm text-gray-700">{event.label}</span>
              </label>
            )
          })}
        </div>
      </div>

      <div className={`rounded-lg border bg-white p-6 shadow-sm ${!enabled ? 'opacity-60' : ''}`}>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Phone Number</h3>
        
        <div>
          <label htmlFor="phoneField" className="block text-sm font-medium text-gray-700 mb-2">
            Which phone number to use
          </label>
          <select
            id="phoneField"
            {...register('phoneField')}
            disabled={!enabled}
            className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            {PHONE_FIELDS.map((field) => (
              <option key={field.value} value={field.value}>
                {field.label}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-gray-500">
            Choose which phone number from the order to send the OTP to.
          </p>
        </div>
      </div>

      <div className={`rounded-lg border bg-white p-6 shadow-sm ${!enabled ? 'opacity-60' : ''}`}>
        <h3 className="text-lg font-medium text-gray-900 mb-4">SMS Template</h3>
        
        <div>
          <label htmlFor="smsTemplate" className="block text-sm font-medium text-gray-700 mb-2">
            Message Template
          </label>
          <textarea
            id="smsTemplate"
            rows={4}
            {...register('smsTemplate')}
            disabled={!enabled}
            className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            placeholder="Your HealthPlus order {{order_id}} is confirmed..."
          />
          {errors.smsTemplate && (
            <p className="mt-1 text-sm text-red-600">{errors.smsTemplate.message}</p>
          )}
        </div>

        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-start gap-2">
            <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-800">Available Placeholders</p>
              <ul className="mt-1 text-xs text-blue-700 space-y-1">
                <li><code className="bg-blue-100 px-1 rounded">{'{{order_id}}'}</code> - Order ID</li>
                <li><code className="bg-blue-100 px-1 rounded">{'{{amount}}'}</code> - Order total amount</li>
                <li><code className="bg-blue-100 px-1 rounded">{'{{customer_name}}'}</code> - Customer name</li>
              </ul>
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
