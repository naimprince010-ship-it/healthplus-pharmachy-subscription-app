'use client'

import { useState, useEffect } from 'react'
import { Save, Loader2 } from 'lucide-react'

interface DashboardSettings {
  id: string
  pageTitleBn: string
  welcomeTextBn: string
  showTotalOrdersCard: boolean
  showSubscriptionsCard: boolean
  showMembershipCard: boolean
  showWishlistCard: boolean
  showCrossSellSections: boolean
  totalOrdersLabelBn: string
  subscriptionsLabelBn: string
  membershipLabelBn: string
  wishlistLabelBn: string
  membershipUpsellTitleBn: string
  membershipUpsellButtonBn: string
  membershipActiveTitleBn: string
  recentOrdersTitleBn: string
  viewAllBn: string
  subscriptionsTitleBn: string
  curatedForYouTitleBn: string
  trendingNowTitleBn: string
  noOrdersTextBn: string
  startShoppingBn: string
  noSubscriptionsTextBn: string
  browsePlansBn: string
  curatedProductsCount: number
  trendingProductsCount: number
}

export default function DashboardSettingsPage() {
  const [settings, setSettings] = useState<DashboardSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/admin/dashboard-settings')
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
      const res = await fetch('/api/admin/dashboard-settings', {
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
      console.error('Failed to save settings:', error)
      setMessage({ type: 'error', text: 'Failed to save settings' })
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (field: keyof DashboardSettings, value: string | number | boolean) => {
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
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Settings</h1>
          <p className="mt-1 text-sm text-gray-500">
            Configure the user dashboard page layout and text labels
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
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Page Header</h2>
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
                  Welcome Text (Bangla)
                </label>
                <input
                  type="text"
                  value={settings.welcomeTextBn}
                  onChange={(e) => handleChange('welcomeTextBn', e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Card Visibility</h2>
            <p className="mb-4 text-sm text-gray-500">Toggle which cards appear on the dashboard</p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.showTotalOrdersCard}
                  onChange={(e) => handleChange('showTotalOrdersCard', e.target.checked)}
                  className="h-5 w-5 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                />
                <span className="text-sm text-gray-700">Total Orders Card</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.showSubscriptionsCard}
                  onChange={(e) => handleChange('showSubscriptionsCard', e.target.checked)}
                  className="h-5 w-5 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                />
                <span className="text-sm text-gray-700">Subscriptions Card</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.showMembershipCard}
                  onChange={(e) => handleChange('showMembershipCard', e.target.checked)}
                  className="h-5 w-5 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                />
                <span className="text-sm text-gray-700">Membership Card</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.showWishlistCard}
                  onChange={(e) => handleChange('showWishlistCard', e.target.checked)}
                  className="h-5 w-5 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                />
                <span className="text-sm text-gray-700">Wishlist Card</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.showCrossSellSections}
                  onChange={(e) => handleChange('showCrossSellSections', e.target.checked)}
                  className="h-5 w-5 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                />
                <span className="text-sm text-gray-700">Cross-Sell Sections</span>
              </label>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Card Labels (Bangla)</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Total Orders Label
                </label>
                <input
                  type="text"
                  value={settings.totalOrdersLabelBn}
                  onChange={(e) => handleChange('totalOrdersLabelBn', e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Subscriptions Label
                </label>
                <input
                  type="text"
                  value={settings.subscriptionsLabelBn}
                  onChange={(e) => handleChange('subscriptionsLabelBn', e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Membership Label
                </label>
                <input
                  type="text"
                  value={settings.membershipLabelBn}
                  onChange={(e) => handleChange('membershipLabelBn', e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Wishlist Label
                </label>
                <input
                  type="text"
                  value={settings.wishlistLabelBn}
                  onChange={(e) => handleChange('wishlistLabelBn', e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Membership Upsell</h2>
            <p className="mb-4 text-sm text-gray-500">Text shown when user has no active membership</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700">
                  Upsell Title (Bangla)
                </label>
                <input
                  type="text"
                  value={settings.membershipUpsellTitleBn}
                  onChange={(e) => handleChange('membershipUpsellTitleBn', e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Upsell Button Text (Bangla)
                </label>
                <input
                  type="text"
                  value={settings.membershipUpsellButtonBn}
                  onChange={(e) => handleChange('membershipUpsellButtonBn', e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Active Membership Text (Bangla)
                </label>
                <input
                  type="text"
                  value={settings.membershipActiveTitleBn}
                  onChange={(e) => handleChange('membershipActiveTitleBn', e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
                <p className="mt-1 text-xs text-gray-500">Use {'{remaining}'} for remaining benefits</p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Section Titles (Bangla)</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Recent Orders Title
                </label>
                <input
                  type="text"
                  value={settings.recentOrdersTitleBn}
                  onChange={(e) => handleChange('recentOrdersTitleBn', e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  View All Button Text
                </label>
                <input
                  type="text"
                  value={settings.viewAllBn}
                  onChange={(e) => handleChange('viewAllBn', e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Subscriptions Title
                </label>
                <input
                  type="text"
                  value={settings.subscriptionsTitleBn}
                  onChange={(e) => handleChange('subscriptionsTitleBn', e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Curated For You Title
                </label>
                <input
                  type="text"
                  value={settings.curatedForYouTitleBn}
                  onChange={(e) => handleChange('curatedForYouTitleBn', e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Trending Now Title
                </label>
                <input
                  type="text"
                  value={settings.trendingNowTitleBn}
                  onChange={(e) => handleChange('trendingNowTitleBn', e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Empty States (Bangla)</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  No Orders Text
                </label>
                <input
                  type="text"
                  value={settings.noOrdersTextBn}
                  onChange={(e) => handleChange('noOrdersTextBn', e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Start Shopping Button
                </label>
                <input
                  type="text"
                  value={settings.startShoppingBn}
                  onChange={(e) => handleChange('startShoppingBn', e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  No Subscriptions Text
                </label>
                <input
                  type="text"
                  value={settings.noSubscriptionsTextBn}
                  onChange={(e) => handleChange('noSubscriptionsTextBn', e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Browse Plans Button
                </label>
                <input
                  type="text"
                  value={settings.browsePlansBn}
                  onChange={(e) => handleChange('browsePlansBn', e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Cross-Sell Settings</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Curated Products Count
                </label>
                <input
                  type="number"
                  value={settings.curatedProductsCount}
                  onChange={(e) => handleChange('curatedProductsCount', parseInt(e.target.value) || 10)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
                <p className="mt-1 text-xs text-gray-500">Number of products to show in &quot;Curated For You&quot;</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Trending Products Count
                </label>
                <input
                  type="number"
                  value={settings.trendingProductsCount}
                  onChange={(e) => handleChange('trendingProductsCount', parseInt(e.target.value) || 10)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
                <p className="mt-1 text-xs text-gray-500">Number of products to show in &quot;Trending Now&quot;</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
