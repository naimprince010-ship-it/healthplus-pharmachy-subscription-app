'use client'

import { useState, useEffect, useRef } from 'react'
import { Save, Loader2, Plus, Trash2, Eye, EyeOff, Truck, Percent, Stethoscope, Check, Upload } from 'lucide-react'

interface Feature {
  iconKey: string
  text: string
}

type ImageSize = 'small' | 'medium' | 'large'
type DisplayLocation = 'home' | 'dashboard' | 'membership'

interface MembershipBannerSettings {
  id: string
  isEnabled: boolean
  badge: string
  headline: string
  subheadline: string
  priceText: string
  ctaLabel: string
  ctaHref: string
  features: Feature[]
  bgColor: string
  textColor: string
  displayLocations: DisplayLocation[]
  imageUrl: string | null
  imageAlt: string
  imageSize: ImageSize
}

const IMAGE_SIZE_OPTIONS: { value: ImageSize; label: string }[] = [
  { value: 'small', label: 'Small (25%)' },
  { value: 'medium', label: 'Medium (40%)' },
  { value: 'large', label: 'Large (50%)' },
]

const DISPLAY_LOCATION_OPTIONS: { value: DisplayLocation; label: string }[] = [
  { value: 'home', label: 'Home Page (হোম পেজ)' },
  { value: 'dashboard', label: 'Dashboard (ড্যাশবোর্ড)' },
  { value: 'membership', label: 'Membership Page (মেম্বারশিপ পেজ)' },
]

const DEFAULT_SETTINGS: Omit<MembershipBannerSettings, 'id'> = {
  isEnabled: true,
  badge: 'Premium Membership',
  headline: 'হালালজি প্রিমিয়াম মেম্বারশিপ',
  subheadline: 'আনলিমিটেড ফ্রি ডেলিভারি, অতিরিক্ত ডিসকাউন্ট এবং ফ্রি ডাক্তার পরামর্শ—সবই এক ছাদের নিচে। আপনার এবং পরিবারের সুস্বাস্থ্যের জন্য সেরা ইনভেস্টমেন্ট।',
  priceText: 'প্যাকেজ শুরু মাত্র ৯৯ টাকা থেকে!',
  ctaLabel: 'সব প্ল্যান দেখুন',
  ctaHref: '/membership',
  features: [
    { iconKey: 'delivery', text: 'আনলিমিটেড ফ্রি ডেলিভারি' },
    { iconKey: 'discount', text: 'ফ্ল্যাট ডিসকাউন্ট' },
    { iconKey: 'doctor', text: 'ডাক্তার কনসালটেশন' },
  ],
  bgColor: '#0b3b32',
  textColor: '#ffffff',
  displayLocations: ['home'],
  imageUrl: null,
  imageAlt: '',
  imageSize: 'medium',
}

const ICON_OPTIONS = [
  { key: 'delivery', label: 'Delivery (Truck)' },
  { key: 'discount', label: 'Discount (Percent)' },
  { key: 'doctor', label: 'Doctor (Stethoscope)' },
  { key: 'check', label: 'Check Mark' },
]

function FeatureIcon({ iconKey, className }: { iconKey: string; className?: string }) {
  switch (iconKey) {
    case 'delivery':
      return <Truck className={className} />
    case 'discount':
      return <Percent className={className} />
    case 'doctor':
      return <Stethoscope className={className} />
    case 'check':
    default:
      return <Check className={className} />
  }
}

export default function MembershipBannerSettingsPage() {
    const [settings, setSettings] = useState<MembershipBannerSettings | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
    const [showPreview, setShowPreview] = useState(true)
    const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/admin/membership-banner')
      const data = await res.json()
      if (data.settings) {
        // Parse features and displayLocations if they're strings
        const parsedSettings = {
          ...data.settings,
          features: typeof data.settings.features === 'string'
            ? JSON.parse(data.settings.features)
            : data.settings.features,
          displayLocations: typeof data.settings.displayLocations === 'string'
            ? JSON.parse(data.settings.displayLocations)
            : (data.settings.displayLocations || ['home']),
          imageUrl: data.settings.imageUrl || null,
          imageAlt: data.settings.imageAlt || '',
          imageSize: data.settings.imageSize || 'medium',
        }
        setSettings(parsedSettings)
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
      const res = await fetch('/api/admin/membership-banner', {
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

  const handleChange = (field: keyof MembershipBannerSettings, value: string | boolean | string[] | null) => {
    if (!settings) return
    setSettings({ ...settings, [field]: value })
  }

  const handleDisplayLocationToggle = (location: DisplayLocation) => {
    if (!settings) return
    const current = settings.displayLocations || []
    const newLocations = current.includes(location)
      ? current.filter((l) => l !== location)
      : [...current, location]
    setSettings({ ...settings, displayLocations: newLocations })
  }

  const handleFeatureChange = (index: number, field: 'iconKey' | 'text', value: string) => {
    if (!settings) return
    const newFeatures = [...settings.features]
    newFeatures[index] = { ...newFeatures[index], [field]: value }
    setSettings({ ...settings, features: newFeatures })
  }

  const addFeature = () => {
    if (!settings) return
    setSettings({
      ...settings,
      features: [...settings.features, { iconKey: 'check', text: '' }],
    })
  }

    const removeFeature = (index: number) => {
      if (!settings) return
      setSettings({
        ...settings,
        features: settings.features.filter((_, i) => i !== index),
      })
    }

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file || !settings) return

      setUploading(true)
      setMessage(null)

      try {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('bannerId', 'membership-banner')

        const res = await fetch('/api/admin/uploads/banner-image', {
          method: 'POST',
          body: formData,
        })

        const data = await res.json()

        if (res.ok && data.url) {
          setSettings({ ...settings, imageUrl: data.url })
          setMessage({ type: 'success', text: 'ছবি আপলোড হয়েছে!' })
        } else {
          setMessage({ type: 'error', text: data.error || 'ছবি আপলোড ব্যর্থ হয়েছে' })
        }
      } catch (error) {
        console.error('Image upload error:', error)
        setMessage({ type: 'error', text: 'ছবি আপলোড ব্যর্থ হয়েছে' })
      } finally {
        setUploading(false)
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Membership Banner Settings</h1>
          <p className="mt-1 text-sm text-gray-500">
            Configure the membership teaser banner on the homepage
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
          >
            {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {showPreview ? 'Hide Preview' : 'Show Preview'}
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-white hover:bg-teal-700 disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Changes
          </button>
        </div>
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
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Settings Form */}
          <div className="space-y-6">
            {/* Enable/Disable Toggle */}
            <div className="rounded-lg border border-gray-200 bg-white p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Banner Status</h2>
                  <p className="text-sm text-gray-500">Enable or disable the membership banner on homepage</p>
                </div>
                <label className="relative inline-flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    checked={settings.isEnabled}
                    onChange={(e) => handleChange('isEnabled', e.target.checked)}
                    className="peer sr-only"
                  />
                  <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-teal-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-300"></div>
                </label>
              </div>
            </div>

            {/* Content Section */}
            <div className="rounded-lg border border-gray-200 bg-white p-6">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">Banner Content</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Badge Text</label>
                  <input
                    type="text"
                    value={settings.badge}
                    onChange={(e) => handleChange('badge', e.target.value)}
                    placeholder="e.g., Premium Membership"
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Headline (Bangla)</label>
                  <input
                    type="text"
                    value={settings.headline}
                    onChange={(e) => handleChange('headline', e.target.value)}
                    placeholder="e.g., হালালজি প্রিমিয়াম মেম্বারশিপ"
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Sub-headline / Description (Bangla)</label>
                  <textarea
                    value={settings.subheadline}
                    onChange={(e) => handleChange('subheadline', e.target.value)}
                    rows={3}
                    placeholder="Enter description..."
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Price Text (Bangla)</label>
                  <input
                    type="text"
                    value={settings.priceText}
                    onChange={(e) => handleChange('priceText', e.target.value)}
                    placeholder="e.g., প্যাকেজ শুরু মাত্র ৯৯ টাকা থেকে!"
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>
              </div>
            </div>

            {/* CTA Button Section */}
            <div className="rounded-lg border border-gray-200 bg-white p-6">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">Call-to-Action Button</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Button Label (Bangla)</label>
                  <input
                    type="text"
                    value={settings.ctaLabel}
                    onChange={(e) => handleChange('ctaLabel', e.target.value)}
                    placeholder="e.g., সব প্ল্যান দেখুন"
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Button URL</label>
                  <input
                    type="text"
                    value={settings.ctaHref}
                    onChange={(e) => handleChange('ctaHref', e.target.value)}
                    placeholder="e.g., /membership"
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>
              </div>
            </div>

            {/* Features Section */}
            <div className="rounded-lg border border-gray-200 bg-white p-6">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Features List</h2>
                  <p className="text-sm text-gray-500">Benefits shown with checkmarks</p>
                </div>
                <button
                  onClick={addFeature}
                  className="flex items-center gap-1 rounded-lg bg-teal-50 px-3 py-1.5 text-sm text-teal-600 hover:bg-teal-100"
                >
                  <Plus className="h-4 w-4" /> Add Feature
                </button>
              </div>
              <div className="space-y-3">
                {settings.features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <select
                      value={feature.iconKey}
                      onChange={(e) => handleFeatureChange(index, 'iconKey', e.target.value)}
                      className="w-40 rounded-lg border border-gray-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    >
                      {ICON_OPTIONS.map((option) => (
                        <option key={option.key} value={option.key}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      value={feature.text}
                      onChange={(e) => handleFeatureChange(index, 'text', e.target.value)}
                      placeholder="Feature text (Bangla)"
                      className="flex-1 rounded-lg border border-gray-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    />
                    <button
                      onClick={() => removeFeature(index)}
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
              <h2 className="mb-4 text-lg font-semibold text-gray-900">Styling</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Background Color</label>
                  <div className="mt-1 flex items-center gap-2">
                    <input
                      type="color"
                      value={settings.bgColor}
                      onChange={(e) => handleChange('bgColor', e.target.value)}
                      className="h-10 w-10 cursor-pointer rounded border border-gray-300"
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
                      className="h-10 w-10 cursor-pointer rounded border border-gray-300"
                    />
                    <input
                      type="text"
                      value={settings.textColor}
                      onChange={(e) => handleChange('textColor', e.target.value)}
                      className="flex-1 rounded-lg border border-gray-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    />
                  </div>
                </div>
              </div>
            </div>

                        {/* Banner Image Section */}
                        <div className="rounded-lg border border-gray-200 bg-white p-6">
                          <h2 className="mb-4 text-lg font-semibold text-gray-900">Banner Image (ব্যানার ছবি)</h2>
                          <p className="mb-4 text-sm text-gray-500">
                            ডান পাশে একটি ছবি যোগ করুন। ছবি না দিলে শুধু টেক্সট দেখাবে।
                          </p>
                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700">ছবি আপলোড করুন</label>
                              <div className="mt-2 flex items-center gap-3">
                                <input
                                  ref={fileInputRef}
                                  type="file"
                                  accept="image/*"
                                  onChange={handleImageUpload}
                                  className="hidden"
                                  id="banner-image-upload"
                                />
                                <button
                                  type="button"
                                  onClick={() => fileInputRef.current?.click()}
                                  disabled={uploading}
                                  className="flex items-center gap-2 rounded-lg border border-teal-600 bg-teal-50 px-4 py-2 text-sm font-medium text-teal-700 hover:bg-teal-100 disabled:opacity-50"
                                >
                                  {uploading ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Upload className="h-4 w-4" />
                                  )}
                                  {uploading ? 'আপলোড হচ্ছে...' : 'ছবি আপলোড করুন'}
                                </button>
                                <span className="text-sm text-gray-500">অথবা</span>
                              </div>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700">Image URL (ছবির লিংক)</label>
                              <input
                                type="text"
                                value={settings.imageUrl || ''}
                                onChange={(e) => handleChange('imageUrl', e.target.value || null)}
                                placeholder="https://example.com/image.jpg or /images/banner.png"
                                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                              />
                              <p className="mt-1 text-xs text-gray-500">
                                সরাসরি URL দিতে পারেন অথবা উপরের বাটন দিয়ে আপলোড করুন
                              </p>
                            </div>
                {settings.imageUrl && (
                  <div className="mt-2">
                    <p className="mb-2 text-sm font-medium text-gray-700">Preview:</p>
                    <div className="relative h-32 w-48 overflow-hidden rounded-lg border border-gray-200 bg-gray-100">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={settings.imageUrl}
                        alt="Banner preview"
                        className="h-full w-full object-contain"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleChange('imageUrl', null)}
                      className="mt-2 text-sm text-red-600 hover:text-red-700"
                    >
                      Remove Image (ছবি মুছুন)
                    </button>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Alt Text (ছবির বর্ণনা)</label>
                  <input
                    type="text"
                    value={settings.imageAlt}
                    onChange={(e) => handleChange('imageAlt', e.target.value)}
                    placeholder="e.g., Happy family with medicine delivery"
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Image Size (ছবির আকার)</label>
                  <p className="mb-2 text-xs text-gray-500">ব্যানারে ছবি কতটুকু জায়গা নেবে</p>
                  <div className="mt-1 space-y-2">
                    {IMAGE_SIZE_OPTIONS.map((option) => (
                      <label key={option.value} className="flex items-center gap-2 text-sm text-gray-700">
                        <input
                          type="radio"
                          name="imageSize"
                          value={option.value}
                          checked={settings.imageSize === option.value}
                          onChange={(e) => handleChange('imageSize', e.target.value)}
                          className="h-4 w-4 border-gray-300 text-teal-600 focus:ring-teal-500"
                        />
                        {option.label}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Display Locations Section */}
            <div className="rounded-lg border border-gray-200 bg-white p-6">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">Display Locations (কোথায় দেখাবে)</h2>
              <p className="mb-4 text-sm text-gray-500">
                ব্যানারটি কোন কোন পেজে দেখাবে সেটা সিলেক্ট করুন
              </p>
              <div className="space-y-3">
                {DISPLAY_LOCATION_OPTIONS.map((option) => (
                  <label key={option.value} className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={settings.displayLocations?.includes(option.value) || false}
                      onChange={() => handleDisplayLocationToggle(option.value)}
                      className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                    />
                    <span className="text-sm text-gray-700">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Live Preview */}
          {showPreview && (
            <div className="lg:sticky lg:top-6">
              <div className="rounded-lg border border-gray-200 bg-white p-6">
                <h2 className="mb-4 text-lg font-semibold text-gray-900">Live Preview</h2>
                <div
                  className="overflow-hidden rounded-2xl p-6 shadow-xl"
                  style={{ backgroundColor: settings.bgColor, color: settings.textColor }}
                >
                  {/* Badge */}
                  <div className="mb-3 inline-flex items-center rounded-full bg-white/20 px-3 py-1.5 text-sm font-semibold">
                    {settings.badge}
                  </div>
                  
                  {/* Headline */}
                  <h2 className="text-2xl font-bold">{settings.headline}</h2>
                  
                  {/* Subheadline */}
                  <p className="mt-3 text-sm opacity-90">{settings.subheadline}</p>
                  
                  {/* Price Text */}
                  <div className="mt-4 inline-block rounded-lg bg-white/20 px-4 py-2 text-lg font-bold">
                    {settings.priceText}
                  </div>
                  
                  {/* Features */}
                  <ul className="mt-4 space-y-2">
                    {settings.features.map((feature, index) => (
                      <li key={index} className="flex items-center text-sm">
                        <FeatureIcon iconKey={feature.iconKey} className="mr-2 h-4 w-4" />
                        {feature.text}
                      </li>
                    ))}
                  </ul>
                  
                  {/* CTA Button */}
                  <button className="mt-6 rounded-lg bg-white px-6 py-3 font-semibold text-teal-700 transition-transform hover:scale-105">
                    {settings.ctaLabel}
                  </button>
                </div>
                
                {!settings.isEnabled && (
                  <div className="mt-4 rounded-lg bg-yellow-50 p-3 text-sm text-yellow-800">
                    Note: This banner is currently disabled and won&apos;t appear on the homepage.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
