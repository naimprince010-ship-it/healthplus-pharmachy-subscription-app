'use client'

import { useState, useEffect } from 'react'
import { Save, Loader2 } from 'lucide-react'

interface OrderTrackingSettings {
  id: string
  headerTitlePrefixBn: string
  statusSectionTitleBn: string
  deliverySectionTitleBn: string
  itemsSectionTitleBn: string
  totalLabelBn: string
  placedLabelBn: string
  confirmedLabelBn: string
  processingLabelBn: string
  shippedLabelBn: string
  deliveredLabelBn: string
  cancelledLabelBn: string
  riderLabelBn: string
  callButtonBn: string
  estimatedDeliveryLabelBn: string
  supportTextBn: string
  supportLinkTextBn: string
  supportPhone: string
}

export default function OrderTrackingSettingsPage() {
  const [settings, setSettings] = useState<OrderTrackingSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/admin/order-tracking/settings')
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
      const res = await fetch('/api/admin/order-tracking/settings', {
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
    } catch {
      setMessage({ type: 'error', text: 'Failed to save settings' })
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (field: keyof OrderTrackingSettings, value: string) => {
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
          <h1 className="text-2xl font-bold text-gray-900">Order Tracking Page Settings</h1>
          <p className="mt-1 text-sm text-gray-500">
            Configure all text labels for the order tracking page
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
          {/* Header Settings */}
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Header</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Header Title Prefix (Bangla)
                </label>
                <input
                  type="text"
                  value={settings.headerTitlePrefixBn}
                  onChange={(e) => handleChange('headerTitlePrefixBn', e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
                <p className="mt-1 text-xs text-gray-500">Shows as &quot;অর্ডার #ORD-001R&quot;</p>
              </div>
            </div>
          </div>

          {/* Section Titles */}
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Section Titles</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Status Section Title (Bangla)
                </label>
                <input
                  type="text"
                  value={settings.statusSectionTitleBn}
                  onChange={(e) => handleChange('statusSectionTitleBn', e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Delivery Section Title (Bangla)
                </label>
                <input
                  type="text"
                  value={settings.deliverySectionTitleBn}
                  onChange={(e) => handleChange('deliverySectionTitleBn', e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Items Section Title (Bangla)
                </label>
                <input
                  type="text"
                  value={settings.itemsSectionTitleBn}
                  onChange={(e) => handleChange('itemsSectionTitleBn', e.target.value)}
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
            </div>
          </div>

          {/* Status Labels */}
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Status Labels (Timeline)</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Placed Label (Bangla)
                </label>
                <input
                  type="text"
                  value={settings.placedLabelBn}
                  onChange={(e) => handleChange('placedLabelBn', e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Confirmed Label (Bangla)
                </label>
                <input
                  type="text"
                  value={settings.confirmedLabelBn}
                  onChange={(e) => handleChange('confirmedLabelBn', e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Processing Label (Bangla)
                </label>
                <input
                  type="text"
                  value={settings.processingLabelBn}
                  onChange={(e) => handleChange('processingLabelBn', e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Shipped Label (Bangla)
                </label>
                <input
                  type="text"
                  value={settings.shippedLabelBn}
                  onChange={(e) => handleChange('shippedLabelBn', e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Delivered Label (Bangla)
                </label>
                <input
                  type="text"
                  value={settings.deliveredLabelBn}
                  onChange={(e) => handleChange('deliveredLabelBn', e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Cancelled Label (Bangla)
                </label>
                <input
                  type="text"
                  value={settings.cancelledLabelBn}
                  onChange={(e) => handleChange('cancelledLabelBn', e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>
            </div>
          </div>

          {/* Rider & Delivery Info */}
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Rider & Delivery Info</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Rider Label (Bangla)
                </label>
                <input
                  type="text"
                  value={settings.riderLabelBn}
                  onChange={(e) => handleChange('riderLabelBn', e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Call Button Text
                </label>
                <input
                  type="text"
                  value={settings.callButtonBn}
                  onChange={(e) => handleChange('callButtonBn', e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Estimated Delivery Label (Bangla)
                </label>
                <input
                  type="text"
                  value={settings.estimatedDeliveryLabelBn}
                  onChange={(e) => handleChange('estimatedDeliveryLabelBn', e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>
            </div>
          </div>

          {/* Support / Footer */}
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Support / Footer</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Support Text (Bangla)
                </label>
                <input
                  type="text"
                  value={settings.supportTextBn}
                  onChange={(e) => handleChange('supportTextBn', e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Support Link Text (Bangla)
                </label>
                <input
                  type="text"
                  value={settings.supportLinkTextBn}
                  onChange={(e) => handleChange('supportLinkTextBn', e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Support Phone Number
                </label>
                <input
                  type="text"
                  value={settings.supportPhone}
                  onChange={(e) => handleChange('supportPhone', e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
                <p className="mt-1 text-xs text-gray-500">Phone number for &quot;Call Support&quot; link</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
