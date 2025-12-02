'use client'

import { useState, useEffect } from 'react'
import { Save, Loader2 } from 'lucide-react'

interface CartSettings {
  id: string
  freeDeliveryThreshold: number
  freeDeliveryTextBn: string
  freeDeliverySuccessTextBn: string
  promoLabelBn: string
  promoApplyTextBn: string
  deliveryInfoTextBn: string
  totalMrpLabelBn: string
  savingsLabelBn: string
  grandTotalLabelBn: string
  checkoutButtonTextBn: string
  suggestionTitleBn: string
  emptyCartTextBn: string
  emptyCartSubtextBn: string
  startShoppingTextBn: string
  cartTitleBn: string
}

export default function CartSettingsPage() {
  const [settings, setSettings] = useState<CartSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/admin/cart-settings')
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
      const res = await fetch('/api/admin/cart-settings', {
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

  const handleChange = (field: keyof CartSettings, value: string | number) => {
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
          <h1 className="text-2xl font-bold text-gray-900">Cart Page Settings</h1>
          <p className="mt-1 text-sm text-gray-500">
            Configure all text labels and thresholds for the cart page
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
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Free Delivery Settings</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Free Delivery Threshold (৳)
                </label>
                <input
                  type="number"
                  value={settings.freeDeliveryThreshold}
                  onChange={(e) => handleChange('freeDeliveryThreshold', parseInt(e.target.value) || 0)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
                <p className="mt-1 text-xs text-gray-500">Minimum order amount for free delivery</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Progress Text (Bangla)
                </label>
                <input
                  type="text"
                  value={settings.freeDeliveryTextBn}
                  onChange={(e) => handleChange('freeDeliveryTextBn', e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
                <p className="mt-1 text-xs text-gray-500">Use {'{remaining}'} for remaining amount</p>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700">
                  Success Text (Bangla)
                </label>
                <input
                  type="text"
                  value={settings.freeDeliverySuccessTextBn}
                  onChange={(e) => handleChange('freeDeliverySuccessTextBn', e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
                <p className="mt-1 text-xs text-gray-500">Shown when free delivery threshold is reached</p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Promo & Delivery</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Promo Label (Bangla)
                </label>
                <input
                  type="text"
                  value={settings.promoLabelBn}
                  onChange={(e) => handleChange('promoLabelBn', e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Apply Button Text
                </label>
                <input
                  type="text"
                  value={settings.promoApplyTextBn}
                  onChange={(e) => handleChange('promoApplyTextBn', e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700">
                  Delivery Info Text (Bangla)
                </label>
                <input
                  type="text"
                  value={settings.deliveryInfoTextBn}
                  onChange={(e) => handleChange('deliveryInfoTextBn', e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Order Summary Labels</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Total MRP Label (Bangla)
                </label>
                <input
                  type="text"
                  value={settings.totalMrpLabelBn}
                  onChange={(e) => handleChange('totalMrpLabelBn', e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Savings Label (Bangla)
                </label>
                <input
                  type="text"
                  value={settings.savingsLabelBn}
                  onChange={(e) => handleChange('savingsLabelBn', e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Grand Total Label (Bangla)
                </label>
                <input
                  type="text"
                  value={settings.grandTotalLabelBn}
                  onChange={(e) => handleChange('grandTotalLabelBn', e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Checkout Button Text (Bangla)
                </label>
                <input
                  type="text"
                  value={settings.checkoutButtonTextBn}
                  onChange={(e) => handleChange('checkoutButtonTextBn', e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Other Labels</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Cart Title (Bangla)
                </label>
                <input
                  type="text"
                  value={settings.cartTitleBn}
                  onChange={(e) => handleChange('cartTitleBn', e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Suggestion Title (Bangla)
                </label>
                <input
                  type="text"
                  value={settings.suggestionTitleBn}
                  onChange={(e) => handleChange('suggestionTitleBn', e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Empty Cart Text (Bangla)
                </label>
                <input
                  type="text"
                  value={settings.emptyCartTextBn}
                  onChange={(e) => handleChange('emptyCartTextBn', e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Empty Cart Subtext (Bangla)
                </label>
                <input
                  type="text"
                  value={settings.emptyCartSubtextBn}
                  onChange={(e) => handleChange('emptyCartSubtextBn', e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700">
                  Start Shopping Button Text (Bangla)
                </label>
                <input
                  type="text"
                  value={settings.startShoppingTextBn}
                  onChange={(e) => handleChange('startShoppingTextBn', e.target.value)}
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
