'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Upload, X } from 'lucide-react'

interface Category {
  id: string
  name: string
}

export default function NewProductPage() {
  const router = useRouter()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    type: 'GENERAL' as const,
    name: '',
    brandName: '',
    description: '',
    categoryId: '',
    mrp: '',
    sellingPrice: '',
    stockQuantity: '0',
    minStockAlert: '',
    unit: 'pcs',
    imageUrl: '',
    imagePath: '',
    seoTitle: '',
    seoDescription: '',
    seoKeywords: '',
    canonicalUrl: '',
    isFeatured: false,
    isActive: true,
    excludeFromMembershipDiscount: false,
    sizeLabel: '',
    keyFeatures: '',
    specSummary: '',
    isFlashSale: false,
    flashSalePrice: '',
    flashSaleStart: '',
    flashSaleEnd: '',
  })

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/admin/categories')
      const data = await res.json()
      if (res.ok) {
        setCategories(data.categories || [])
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setError('')

    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/admin/uploads/product-image', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      if (res.ok) {
        setFormData((prev) => ({
          ...prev,
          imageUrl: data.imageUrl,
          imagePath: data.imagePath,
        }))
      } else {
        setError(data.error || 'Failed to upload image')
      }
    } catch (error) {
      setError('Failed to upload image')
    } finally {
      setUploading(false)
    }
  }

  const handleRemoveImage = () => {
    setFormData((prev) => ({
      ...prev,
      imageUrl: '',
      imagePath: '',
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const payload = {
        ...formData,
        mrp: formData.mrp ? parseFloat(formData.mrp) : undefined,
        sellingPrice: parseFloat(formData.sellingPrice),
        stockQuantity: parseInt(formData.stockQuantity),
        minStockAlert: formData.minStockAlert ? parseInt(formData.minStockAlert) : undefined,
        flashSalePrice: formData.flashSalePrice ? parseFloat(formData.flashSalePrice) : undefined,
        flashSaleStart: formData.flashSaleStart ? new Date(formData.flashSaleStart).toISOString() : undefined,
        flashSaleEnd: formData.flashSaleEnd ? new Date(formData.flashSaleEnd).toISOString() : undefined,
      }

      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (res.ok) {
        router.push('/admin/products')
      } else {
        setError(data.error || 'Failed to create product')
      }
    } catch (error) {
      setError('Failed to create product')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/admin/products"
          className="rounded-lg border border-gray-300 p-2 transition-colors hover:bg-gray-50"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Add New Product</h1>
          <p className="mt-2 text-sm text-gray-600">
            Create a new general product (skin care, baby care, devices, cosmetics, etc.)
          </p>
          <p className="mt-1 text-sm text-amber-600">
            💊 For medicines, please use <Link href="/admin/medicines" className="font-semibold underline">Admin → Medicines</Link>
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Basic Information</h2>
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Product Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Brand Name
              </label>
              <input
                type="text"
                value={formData.brandName}
                onChange={(e) => setFormData({ ...formData, brandName: e.target.value })}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                required
              >
                <option value="">Select Category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Pricing & Stock</h2>
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                MRP (Maximum Retail Price)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.mrp}
                onChange={(e) => setFormData({ ...formData, mrp: e.target.value })}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Selling Price <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.sellingPrice}
                onChange={(e) => setFormData({ ...formData, sellingPrice: e.target.value })}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Stock Quantity <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={formData.stockQuantity}
                onChange={(e) => setFormData({ ...formData, stockQuantity: e.target.value })}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Low Stock Alert Threshold
              </label>
              <input
                type="number"
                value={formData.minStockAlert}
                onChange={(e) => setFormData({ ...formData, minStockAlert: e.target.value })}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Unit
              </label>
              <input
                type="text"
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Size Label (e.g., 100ml, 50g)
              </label>
              <input
                type="text"
                value={formData.sizeLabel}
                onChange={(e) => setFormData({ ...formData, sizeLabel: e.target.value })}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Product Image</h2>
          <div className="space-y-4">
            {formData.imageUrl ? (
              <div className="relative inline-block">
                <img
                  src={formData.imageUrl}
                  alt="Product"
                  className="h-48 w-48 rounded-lg object-cover"
                />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute -right-2 -top-2 rounded-full bg-red-500 p-1 text-white hover:bg-red-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50">
                  <Upload className="h-4 w-4" />
                  {uploading ? 'Uploading...' : 'Upload Image'}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={uploading}
                  />
                </label>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Additional Details</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Key Features
              </label>
              <textarea
                value={formData.keyFeatures}
                onChange={(e) => setFormData({ ...formData, keyFeatures: e.target.value })}
                rows={3}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="Enter key features, one per line"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Specifications Summary
              </label>
              <textarea
                value={formData.specSummary}
                onChange={(e) => setFormData({ ...formData, specSummary: e.target.value })}
                rows={3}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="Enter specifications"
              />
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">SEO Settings</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                SEO Title
              </label>
              <input
                type="text"
                value={formData.seoTitle}
                onChange={(e) => setFormData({ ...formData, seoTitle: e.target.value })}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                SEO Description
              </label>
              <textarea
                value={formData.seoDescription}
                onChange={(e) => setFormData({ ...formData, seoDescription: e.target.value })}
                rows={3}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                SEO Keywords (comma separated)
              </label>
              <input
                type="text"
                value={formData.seoKeywords}
                onChange={(e) => setFormData({ ...formData, seoKeywords: e.target.value })}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Canonical URL
              </label>
              <input
                type="text"
                value={formData.canonicalUrl}
                onChange={(e) => setFormData({ ...formData, canonicalUrl: e.target.value })}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="Leave empty to use /products/[slug]"
              />
              <p className="mt-1 text-xs text-gray-500">
                Optional. If empty, will default to /products/[slug]
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Settings</h2>
          <div className="space-y-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.isFeatured}
                onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
              />
              <span className="text-sm text-gray-700">Featured Product</span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
              />
              <span className="text-sm text-gray-700">Active (Published)</span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.excludeFromMembershipDiscount}
                onChange={(e) => setFormData({ ...formData, excludeFromMembershipDiscount: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
              />
              <span className="text-sm text-gray-700">Exclude from Membership Discount</span>
            </label>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">⚡ Flash Sale Settings</h2>
          <div className="space-y-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.isFlashSale}
                onChange={(e) => setFormData({ ...formData, isFlashSale: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
              />
              <span className="text-sm font-medium text-gray-700">Enable Flash Sale</span>
            </label>

            {formData.isFlashSale && (
              <div className="grid gap-4 md:grid-cols-3 pl-6 border-l-2 border-teal-200">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Flash Sale Price <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.flashSalePrice}
                    onChange={(e) => setFormData({ ...formData, flashSalePrice: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    required={formData.isFlashSale}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Must be less than selling price (৳{formData.sellingPrice || '0'})
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Start Date & Time <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.flashSaleStart}
                    onChange={(e) => setFormData({ ...formData, flashSaleStart: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    required={formData.isFlashSale}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    End Date & Time <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.flashSaleEnd}
                    onChange={(e) => setFormData({ ...formData, flashSaleEnd: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    required={formData.isFlashSale}
                  />
                </div>

                <div className="md:col-span-3 bg-teal-50 border border-teal-200 rounded-lg p-3">
                  <p className="text-sm text-teal-800">
                    💡 <strong>Tip:</strong> Flash sale products will appear on the <a href="/flash-sale" target="_blank" className="underline font-semibold">/flash-sale</a> page with countdown timer and discount badges.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-4">
          <Link
            href="/admin/products"
            className="rounded-lg border border-gray-300 px-6 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-teal-600 px-6 py-2 text-sm font-semibold text-white transition-colors hover:bg-teal-700 disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Product'}
          </button>
        </div>
      </form>
    </div>
  )
}
