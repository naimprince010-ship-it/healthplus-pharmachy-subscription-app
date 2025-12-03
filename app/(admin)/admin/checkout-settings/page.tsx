'use client'

import { useState, useEffect } from 'react'
import { Save, Loader2 } from 'lucide-react'

interface CheckoutSettings {
  id: string
  pageTitleBn: string
  addressSectionTitleBn: string
  addAddressButtonBn: string
  paymentSectionTitleBn: string
  codLabelBn: string
  bkashLabelBn: string
  couponSectionTitleBn: string
  couponPlaceholderBn: string
  couponApplyBn: string
  orderSummarySectionTitleBn: string
  viewDetailsBn: string
  totalLabelBn: string
  confirmButtonBn: string
  successPageTitleBn: string
  successLine1Bn: string
  successLine2Bn: string
  orderIdLabelBn: string
  successTotalLabelBn: string
  successPaymentLabelBn: string
  infoNoteBn: string
  trackOrderButtonBn: string
  goHomeButtonBn: string
}

export default function CheckoutSettingsPage() {
  const [settings, setSettings] = useState<CheckoutSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/admin/checkout/settings')
      const data = await res.json()
      if (data.settings) {
        setSettings(data.settings)
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error)
      setMessage({ type: 'error', text: 'Failed to load settings' })
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!settings) return

    setSaving(true)
    setMessage(null)

    try {
      const res = await fetch('/api/admin/checkout/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })

      if (res.ok) {
        setMessage({ type: 'success', text: 'Settings saved successfully!' })
      } else {
        const data = await res.json()
        setMessage({ type: 'error', text: data.error || 'Failed to save settings' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save settings' })
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (field: keyof CheckoutSettings, value: string) => {
    if (!settings) return
    setSettings({ ...settings, [field]: value })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Checkout & Order Success Settings</h1>
          <p className="mt-1 text-sm text-gray-500">
            Configure all text labels for the checkout and order success pages
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-white hover:bg-teal-700 disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save Changes
        </button>
      </div>

      {message && (
        <div
          className={`rounded-lg p-4 ${
            message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}
        >
          {message.text}
        </div>
      )}

      {settings && (
        <div className="space-y-6">
          {/* Checkout Page Settings */}
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Checkout Page - Header & Sections</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Page Title (Bangla)
                </label>
                <input
                  type="text"
                  value={settings.pageTitleBn}
                  onChange={(e) => handleChange('pageTitleBn', e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Address Section Title (Bangla)
                </label>
                <input
                  type="text"
                  value={settings.addressSectionTitleBn}
                  onChange={(e) => handleChange('addressSectionTitleBn', e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Add Address Button (Bangla)
                </label>
                <input
                  type="text"
                  value={settings.addAddressButtonBn}
                  onChange={(e) => handleChange('addAddressButtonBn', e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Payment Section Title (Bangla)
                </label>
                <input
                  type="text"
                  value={settings.paymentSectionTitleBn}
                  onChange={(e) => handleChange('paymentSectionTitleBn', e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Checkout Page - Payment Methods</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Cash on Delivery Label (Bangla)
                </label>
                <input
                  type="text"
                  value={settings.codLabelBn}
                  onChange={(e) => handleChange('codLabelBn', e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  bKash/Nagad Label (Bangla)
                </label>
                <input
                  type="text"
                  value={settings.bkashLabelBn}
                  onChange={(e) => handleChange('bkashLabelBn', e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Checkout Page - Coupon & Summary</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Coupon Section Title (Bangla)
                </label>
                <input
                  type="text"
                  value={settings.couponSectionTitleBn}
                  onChange={(e) => handleChange('couponSectionTitleBn', e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Coupon Placeholder (Bangla)
                </label>
                <input
                  type="text"
                  value={settings.couponPlaceholderBn}
                  onChange={(e) => handleChange('couponPlaceholderBn', e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Coupon Apply Button
                </label>
                <input
                  type="text"
                  value={settings.couponApplyBn}
                  onChange={(e) => handleChange('couponApplyBn', e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Order Summary Title (Bangla)
                </label>
                <input
                  type="text"
                  value={settings.orderSummarySectionTitleBn}
                  onChange={(e) => handleChange('orderSummarySectionTitleBn', e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  View Details Text (Bangla)
                </label>
                <input
                  type="text"
                  value={settings.viewDetailsBn}
                  onChange={(e) => handleChange('viewDetailsBn', e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Total Label (Bangla)
                </label>
                <input
                  type="text"
                  value={settings.totalLabelBn}
                  onChange={(e) => handleChange('totalLabelBn', e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700">
                  Confirm Order Button (Bangla)
                </label>
                <input
                  type="text"
                  value={settings.confirmButtonBn}
                  onChange={(e) => handleChange('confirmButtonBn', e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>
            </div>
          </div>

          {/* Order Success Page Settings */}
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Order Success Page - Messages</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Page Title (Bangla)
                </label>
                <input
                  type="text"
                  value={settings.successPageTitleBn}
                  onChange={(e) => handleChange('successPageTitleBn', e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Order ID Label (Bangla)
                </label>
                <input
                  type="text"
                  value={settings.orderIdLabelBn}
                  onChange={(e) => handleChange('orderIdLabelBn', e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Success Line 1 (Bangla)
                </label>
                <input
                  type="text"
                  value={settings.successLine1Bn}
                  onChange={(e) => handleChange('successLine1Bn', e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
                <p className="mt-1 text-xs text-gray-500">First line of success message</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Success Line 2 (Bangla)
                </label>
                <input
                  type="text"
                  value={settings.successLine2Bn}
                  onChange={(e) => handleChange('successLine2Bn', e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
                <p className="mt-1 text-xs text-gray-500">Second line of success message</p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Order Success Page - Labels & Buttons</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Total Label (Bangla)
                </label>
                <input
                  type="text"
                  value={settings.successTotalLabelBn}
                  onChange={(e) => handleChange('successTotalLabelBn', e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Payment Method Label (Bangla)
                </label>
                <input
                  type="text"
                  value={settings.successPaymentLabelBn}
                  onChange={(e) => handleChange('successPaymentLabelBn', e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700">
                  Info Note (Bangla)
                </label>
                <textarea
                  value={settings.infoNoteBn}
                  onChange={(e) => handleChange('infoNoteBn', e.target.value)}
                  rows={2}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
                <p className="mt-1 text-xs text-gray-500">Message shown below order details</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Track Order Button (Bangla)
                </label>
                <input
                  type="text"
                  value={settings.trackOrderButtonBn}
                  onChange={(e) => handleChange('trackOrderButtonBn', e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Go Home Button (Bangla)
                </label>
                <input
                  type="text"
                  value={settings.goHomeButtonBn}
                  onChange={(e) => handleChange('goHomeButtonBn', e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
