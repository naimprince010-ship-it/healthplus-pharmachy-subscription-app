'use client'

import { useState, useEffect } from 'react'
import { Save, Loader2, Plus, Trash2 } from 'lucide-react'

interface FooterLink {
  label: string
  href: string
}

interface SocialLink {
  platform: string
  url: string
}

interface PaymentMethod {
  name: string
  iconKey: string
}

interface FooterSettings {
  id: string
  brandName: string
  brandDescription: string
  drugLicense: string | null
  tradeLicense: string | null
  quickLinks: FooterLink[]
  quickLinksTitle: string
  supportLinks: FooterLink[]
  supportLinksTitle: string
  contactTitle: string
  address: string
  phone: string
  email: string | null
  socialLinks: SocialLink[]
  googlePlayUrl: string | null
  appStoreUrl: string | null
  copyrightText: string
  developerCredit: string | null
  paymentMethods: PaymentMethod[]
  bgColor: string
  textColor: string
  headingColor: string
  hoverColor: string
  copyrightBgColor: string
}

const DEFAULT_SETTINGS: Omit<FooterSettings, 'id'> = {
  brandName: 'Halalzi',
  brandDescription: 'আপনার পরিবারের সুস্বাস্থ্যের বিশ্বস্ত সঙ্গী। আমরা ১০০% অথেনটিক ঔষধ এবং স্বাস্থ্যপণ্য নিশ্চিত করি।',
  drugLicense: null,
  tradeLicense: null,
  quickLinks: [
    { label: 'হোম', href: '/' },
    { label: 'সব ঔষধ', href: '/products' },
    { label: 'মেম্বারশিপ প্ল্যান', href: '/membership' },
    { label: 'প্রেসক্রিপশন আপলোড', href: '/prescription' },
    { label: 'অফারসমূহ', href: '/offers' },
  ],
  quickLinksTitle: 'কুইক লিংকস',
  supportLinks: [
    { label: 'প্রাইভেসি পলিসি', href: '/pages/privacy' },
    { label: 'রিফান্ড ও রিটার্ন পলিসি', href: '/pages/refund' },
    { label: 'শর্তাবলী', href: '/pages/terms' },
    { label: 'সচরাচর জিজ্ঞাসিত প্রশ্ন', href: '/pages/faq' },
  ],
  supportLinksTitle: 'কাস্টমার সাপোর্ট',
  contactTitle: 'যোগাযোগ',
  address: 'ঢাকা, বাংলাদেশ',
  phone: '01700000000',
  email: null,
  socialLinks: [
    { platform: 'facebook', url: 'https://facebook.com' },
    { platform: 'youtube', url: 'https://youtube.com' },
  ],
  googlePlayUrl: null,
  appStoreUrl: null,
  copyrightText: '© 2025 Halalzi. All rights reserved.',
  developerCredit: null,
  paymentMethods: [
    { name: 'bKash', iconKey: 'bkash' },
    { name: 'Nagad', iconKey: 'nagad' },
    { name: 'Visa', iconKey: 'visa' },
    { name: 'Mastercard', iconKey: 'mastercard' },
  ],
  bgColor: '#0b3b32',
  textColor: '#e0e0e0',
  headingColor: '#ffffff',
  hoverColor: '#0A9F6E',
  copyrightBgColor: '#04241e',
}

export default function FooterSettingsPage() {
  const [settings, setSettings] = useState<FooterSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/admin/footer-settings')
      const data = await res.json()
      if (data.settings) {
        setSettings(data.settings)
      } else {
        setSettings({ id: '', ...DEFAULT_SETTINGS })
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error)
      setSettings({ id: '', ...DEFAULT_SETTINGS })
      setMessage({ type: 'error', text: 'Failed to load settings, using defaults' })
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!settings) return

    setSaving(true)
    setMessage(null)

    try {
      const res = await fetch('/api/admin/footer-settings', {
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

  const handleChange = (field: keyof FooterSettings, value: string | null) => {
    if (!settings) return
    setSettings({ ...settings, [field]: value })
  }

  const handleQuickLinkChange = (index: number, field: 'label' | 'href', value: string) => {
    if (!settings) return
    const newLinks = [...settings.quickLinks]
    newLinks[index] = { ...newLinks[index], [field]: value }
    setSettings({ ...settings, quickLinks: newLinks })
  }

  const addQuickLink = () => {
    if (!settings) return
    setSettings({
      ...settings,
      quickLinks: [...settings.quickLinks, { label: '', href: '' }],
    })
  }

  const removeQuickLink = (index: number) => {
    if (!settings) return
    setSettings({
      ...settings,
      quickLinks: settings.quickLinks.filter((_, i) => i !== index),
    })
  }

  const handleSupportLinkChange = (index: number, field: 'label' | 'href', value: string) => {
    if (!settings) return
    const newLinks = [...settings.supportLinks]
    newLinks[index] = { ...newLinks[index], [field]: value }
    setSettings({ ...settings, supportLinks: newLinks })
  }

  const addSupportLink = () => {
    if (!settings) return
    setSettings({
      ...settings,
      supportLinks: [...settings.supportLinks, { label: '', href: '' }],
    })
  }

  const removeSupportLink = (index: number) => {
    if (!settings) return
    setSettings({
      ...settings,
      supportLinks: settings.supportLinks.filter((_, i) => i !== index),
    })
  }

  const handleSocialLinkChange = (index: number, field: 'platform' | 'url', value: string) => {
    if (!settings) return
    const newLinks = [...settings.socialLinks]
    newLinks[index] = { ...newLinks[index], [field]: value }
    setSettings({ ...settings, socialLinks: newLinks })
  }

  const addSocialLink = () => {
    if (!settings) return
    setSettings({
      ...settings,
      socialLinks: [...settings.socialLinks, { platform: 'facebook', url: '' }],
    })
  }

  const removeSocialLink = (index: number) => {
    if (!settings) return
    setSettings({
      ...settings,
      socialLinks: settings.socialLinks.filter((_, i) => i !== index),
    })
  }

  const handlePaymentMethodChange = (index: number, field: 'name' | 'iconKey', value: string) => {
    if (!settings) return
    const newMethods = [...settings.paymentMethods]
    newMethods[index] = { ...newMethods[index], [field]: value }
    setSettings({ ...settings, paymentMethods: newMethods })
  }

  const addPaymentMethod = () => {
    if (!settings) return
    setSettings({
      ...settings,
      paymentMethods: [...settings.paymentMethods, { name: '', iconKey: '' }],
    })
  }

  const removePaymentMethod = (index: number) => {
    if (!settings) return
    setSettings({
      ...settings,
      paymentMethods: settings.paymentMethods.filter((_, i) => i !== index),
    })
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
          <h1 className="text-2xl font-bold text-gray-900">Footer Settings</h1>
          <p className="mt-1 text-sm text-gray-500">
            Configure the website footer content and styling
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
          {/* Brand Info Section */}
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Brand Information</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">Brand Name</label>
                <input
                  type="text"
                  value={settings.brandName}
                  onChange={(e) => handleChange('brandName', e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Brand Description (Bangla)</label>
                <textarea
                  value={settings.brandDescription}
                  onChange={(e) => handleChange('brandDescription', e.target.value)}
                  rows={3}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Drug License Number</label>
                <input
                  type="text"
                  value={settings.drugLicense || ''}
                  onChange={(e) => handleChange('drugLicense', e.target.value || null)}
                  placeholder="e.g., DL-12345"
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Trade License Number</label>
                <input
                  type="text"
                  value={settings.tradeLicense || ''}
                  onChange={(e) => handleChange('tradeLicense', e.target.value || null)}
                  placeholder="e.g., TL-67890"
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>
            </div>
          </div>

          {/* Quick Links Section */}
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Quick Links</h2>
                <p className="text-sm text-gray-500">Links shown in the second column</p>
              </div>
              <button
                onClick={addQuickLink}
                className="flex items-center gap-1 rounded-lg bg-teal-50 px-3 py-1.5 text-sm text-teal-600 hover:bg-teal-100"
              >
                <Plus className="h-4 w-4" /> Add Link
              </button>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">Section Title</label>
              <input
                type="text"
                value={settings.quickLinksTitle}
                onChange={(e) => handleChange('quickLinksTitle', e.target.value)}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>
            <div className="space-y-3">
              {settings.quickLinks.map((link, index) => (
                <div key={index} className="flex items-center gap-3">
                  <input
                    type="text"
                    value={link.label}
                    onChange={(e) => handleQuickLinkChange(index, 'label', e.target.value)}
                    placeholder="Link Label"
                    className="flex-1 rounded-lg border border-gray-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                  <input
                    type="text"
                    value={link.href}
                    onChange={(e) => handleQuickLinkChange(index, 'href', e.target.value)}
                    placeholder="URL (e.g., /products)"
                    className="flex-1 rounded-lg border border-gray-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                  <button
                    onClick={() => removeQuickLink(index)}
                    className="rounded-lg p-2 text-red-500 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Support Links Section */}
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Support & Policy Links</h2>
                <p className="text-sm text-gray-500">Links shown in the third column</p>
              </div>
              <button
                onClick={addSupportLink}
                className="flex items-center gap-1 rounded-lg bg-teal-50 px-3 py-1.5 text-sm text-teal-600 hover:bg-teal-100"
              >
                <Plus className="h-4 w-4" /> Add Link
              </button>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">Section Title</label>
              <input
                type="text"
                value={settings.supportLinksTitle}
                onChange={(e) => handleChange('supportLinksTitle', e.target.value)}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>
            <div className="space-y-3">
              {settings.supportLinks.map((link, index) => (
                <div key={index} className="flex items-center gap-3">
                  <input
                    type="text"
                    value={link.label}
                    onChange={(e) => handleSupportLinkChange(index, 'label', e.target.value)}
                    placeholder="Link Label"
                    className="flex-1 rounded-lg border border-gray-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                  <input
                    type="text"
                    value={link.href}
                    onChange={(e) => handleSupportLinkChange(index, 'href', e.target.value)}
                    placeholder="URL (e.g., /pages/privacy)"
                    className="flex-1 rounded-lg border border-gray-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                  <button
                    onClick={() => removeSupportLink(index)}
                    className="rounded-lg p-2 text-red-500 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Contact Info Section */}
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Contact Information</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">Section Title</label>
                <input
                  type="text"
                  value={settings.contactTitle}
                  onChange={(e) => handleChange('contactTitle', e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Address</label>
                <textarea
                  value={settings.address}
                  onChange={(e) => handleChange('address', e.target.value)}
                  rows={2}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                <input
                  type="text"
                  value={settings.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  placeholder="01700000000"
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  value={settings.email || ''}
                  onChange={(e) => handleChange('email', e.target.value || null)}
                  placeholder="info@halalzi.com"
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>
            </div>
          </div>

          {/* Social Links Section */}
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Social Media Links</h2>
                <p className="text-sm text-gray-500">Social media icons in the footer</p>
              </div>
              <button
                onClick={addSocialLink}
                className="flex items-center gap-1 rounded-lg bg-teal-50 px-3 py-1.5 text-sm text-teal-600 hover:bg-teal-100"
              >
                <Plus className="h-4 w-4" /> Add Social
              </button>
            </div>
            <div className="space-y-3">
              {settings.socialLinks.map((link, index) => (
                <div key={index} className="flex items-center gap-3">
                  <select
                    value={link.platform}
                    onChange={(e) => handleSocialLinkChange(index, 'platform', e.target.value)}
                    className="rounded-lg border border-gray-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  >
                    <option value="facebook">Facebook</option>
                    <option value="youtube">YouTube</option>
                    <option value="instagram">Instagram</option>
                    <option value="twitter">Twitter/X</option>
                    <option value="linkedin">LinkedIn</option>
                    <option value="tiktok">TikTok</option>
                  </select>
                  <input
                    type="url"
                    value={link.url}
                    onChange={(e) => handleSocialLinkChange(index, 'url', e.target.value)}
                    placeholder="https://facebook.com/yourpage"
                    className="flex-1 rounded-lg border border-gray-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                  <button
                    onClick={() => removeSocialLink(index)}
                    className="rounded-lg p-2 text-red-500 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* App Download Section */}
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">App Download Links</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">Google Play Store URL</label>
                <input
                  type="url"
                  value={settings.googlePlayUrl || ''}
                  onChange={(e) => handleChange('googlePlayUrl', e.target.value || null)}
                  placeholder="https://play.google.com/store/apps/details?id=..."
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">App Store URL</label>
                <input
                  type="url"
                  value={settings.appStoreUrl || ''}
                  onChange={(e) => handleChange('appStoreUrl', e.target.value || null)}
                  placeholder="https://apps.apple.com/app/..."
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>
            </div>
          </div>

          {/* Copyright Section */}
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Copyright Bar</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Copyright Text</label>
                <input
                  type="text"
                  value={settings.copyrightText}
                  onChange={(e) => handleChange('copyrightText', e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Developer Credit (optional)</label>
                <input
                  type="text"
                  value={settings.developerCredit || ''}
                  onChange={(e) => handleChange('developerCredit', e.target.value || null)}
                  placeholder="Developed by Your Company"
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>
            </div>
          </div>

          {/* Payment Methods Section */}
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Payment Methods</h2>
                <p className="text-sm text-gray-500">Payment icons shown in the copyright bar</p>
              </div>
              <button
                onClick={addPaymentMethod}
                className="flex items-center gap-1 rounded-lg bg-teal-50 px-3 py-1.5 text-sm text-teal-600 hover:bg-teal-100"
              >
                <Plus className="h-4 w-4" /> Add Method
              </button>
            </div>
            <div className="space-y-3">
              {settings.paymentMethods.map((method, index) => (
                <div key={index} className="flex items-center gap-3">
                  <input
                    type="text"
                    value={method.name}
                    onChange={(e) => handlePaymentMethodChange(index, 'name', e.target.value)}
                    placeholder="Payment Name (e.g., bKash)"
                    className="flex-1 rounded-lg border border-gray-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                  <select
                    value={method.iconKey}
                    onChange={(e) => handlePaymentMethodChange(index, 'iconKey', e.target.value)}
                    className="rounded-lg border border-gray-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  >
                    <option value="bkash">bKash</option>
                    <option value="nagad">Nagad</option>
                    <option value="visa">Visa</option>
                    <option value="mastercard">Mastercard</option>
                    <option value="amex">American Express</option>
                    <option value="cod">Cash on Delivery</option>
                  </select>
                  <button
                    onClick={() => removePaymentMethod(index)}
                    className="rounded-lg p-2 text-red-500 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Styling Section */}
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Footer Styling</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">Background Color</label>
                <div className="mt-1 flex items-center gap-2">
                  <input
                    type="color"
                    value={settings.bgColor}
                    onChange={(e) => handleChange('bgColor', e.target.value)}
                    className="h-10 w-14 rounded border border-gray-300"
                  />
                  <input
                    type="text"
                    value={settings.bgColor}
                    onChange={(e) => handleChange('bgColor', e.target.value)}
                    className="flex-1 rounded-lg border border-gray-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Text Color</label>
                <div className="mt-1 flex items-center gap-2">
                  <input
                    type="color"
                    value={settings.textColor}
                    onChange={(e) => handleChange('textColor', e.target.value)}
                    className="h-10 w-14 rounded border border-gray-300"
                  />
                  <input
                    type="text"
                    value={settings.textColor}
                    onChange={(e) => handleChange('textColor', e.target.value)}
                    className="flex-1 rounded-lg border border-gray-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Heading Color</label>
                <div className="mt-1 flex items-center gap-2">
                  <input
                    type="color"
                    value={settings.headingColor}
                    onChange={(e) => handleChange('headingColor', e.target.value)}
                    className="h-10 w-14 rounded border border-gray-300"
                  />
                  <input
                    type="text"
                    value={settings.headingColor}
                    onChange={(e) => handleChange('headingColor', e.target.value)}
                    className="flex-1 rounded-lg border border-gray-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Hover Color</label>
                <div className="mt-1 flex items-center gap-2">
                  <input
                    type="color"
                    value={settings.hoverColor}
                    onChange={(e) => handleChange('hoverColor', e.target.value)}
                    className="h-10 w-14 rounded border border-gray-300"
                  />
                  <input
                    type="text"
                    value={settings.hoverColor}
                    onChange={(e) => handleChange('hoverColor', e.target.value)}
                    className="flex-1 rounded-lg border border-gray-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Copyright Bar Background</label>
                <div className="mt-1 flex items-center gap-2">
                  <input
                    type="color"
                    value={settings.copyrightBgColor}
                    onChange={(e) => handleChange('copyrightBgColor', e.target.value)}
                    className="h-10 w-14 rounded border border-gray-300"
                  />
                  <input
                    type="text"
                    value={settings.copyrightBgColor}
                    onChange={(e) => handleChange('copyrightBgColor', e.target.value)}
                    className="flex-1 rounded-lg border border-gray-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Preview Section */}
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Preview</h2>
            <div
              className="rounded-lg p-6"
              style={{ backgroundColor: settings.bgColor, color: settings.textColor }}
            >
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                  <h3 className="text-lg font-bold mb-2" style={{ color: settings.headingColor }}>
                    {settings.brandName}
                  </h3>
                  <p className="text-sm">{settings.brandDescription}</p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold uppercase mb-2" style={{ color: settings.headingColor }}>
                    {settings.quickLinksTitle}
                  </h3>
                  <ul className="space-y-1 text-sm">
                    {settings.quickLinks.slice(0, 3).map((link, i) => (
                      <li key={i}>{link.label}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="text-sm font-semibold uppercase mb-2" style={{ color: settings.headingColor }}>
                    {settings.supportLinksTitle}
                  </h3>
                  <ul className="space-y-1 text-sm">
                    {settings.supportLinks.slice(0, 3).map((link, i) => (
                      <li key={i}>{link.label}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="text-sm font-semibold uppercase mb-2" style={{ color: settings.headingColor }}>
                    {settings.contactTitle}
                  </h3>
                  <p className="text-sm">{settings.address}</p>
                  <p className="text-sm">{settings.phone}</p>
                </div>
              </div>
              <div
                className="mt-4 pt-4 border-t text-center text-sm"
                style={{ borderColor: 'rgba(255,255,255,0.1)', backgroundColor: settings.copyrightBgColor }}
              >
                {settings.copyrightText}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
