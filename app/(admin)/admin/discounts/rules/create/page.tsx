'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save } from 'lucide-react'

interface Category {
  id: string
  name: string
}

interface Manufacturer {
  id: string
  name: string
}

export default function CreateDiscountRulePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([])

  const [formData, setFormData] = useState({
    name: '',
    ruleType: 'CATEGORY' as 'CATEGORY' | 'BRAND' | 'CART_AMOUNT' | 'USER_GROUP',
    targetValue: '',
    discountType: 'PERCENTAGE' as 'PERCENTAGE' | 'FIXED',
    discountAmount: '',
    minCartAmount: '',
    startDate: '',
    endDate: '',
    priority: '0',
    isActive: true,
    description: '',
  })

  useEffect(() => {
    fetchCategories()
    fetchManufacturers()
  }, [])

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/admin/categories')
      const data = await res.json()
      setCategories(data.categories || [])
    } catch (error) {
      console.error('Failed to fetch categories:', error)
    }
  }

  const fetchManufacturers = async () => {
    try {
      const res = await fetch('/api/admin/manufacturers')
      const data = await res.json()
      setManufacturers(data.manufacturers || [])
    } catch (error) {
      console.error('Failed to fetch manufacturers:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/admin/discount/rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          ruleType: formData.ruleType,
          targetValue: formData.targetValue || null,
          discountType: formData.discountType,
          discountAmount: parseFloat(formData.discountAmount),
          minCartAmount: formData.minCartAmount ? parseFloat(formData.minCartAmount) : null,
          startDate: formData.startDate,
          endDate: formData.endDate,
          priority: parseInt(formData.priority),
          isActive: formData.isActive,
          description: formData.description || null,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create rule')
      }

      router.push('/admin/discounts')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create rule')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <Link
          href="/admin/discounts"
          className="mb-4 inline-flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Discount Manager
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Create Discount Rule</h1>
        <p className="text-gray-600">Create a new discount rule for products</p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-4 text-red-800">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
        <div className="rounded-lg border bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold">Basic Information</h2>

          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Rule Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full rounded-lg border px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                placeholder="e.g., Summer Sale - Electronics"
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Rule Type *
              </label>
              <select
                value={formData.ruleType}
                onChange={(e) => setFormData({ ...formData, ruleType: e.target.value as typeof formData.ruleType, targetValue: '' })}
                className="w-full rounded-lg border px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
              >
                <option value="CATEGORY">Category-based</option>
                <option value="BRAND">Brand/Manufacturer-based</option>
                <option value="CART_AMOUNT">Cart Amount-based</option>
                <option value="USER_GROUP">User Group-based</option>
              </select>
            </div>

            {formData.ruleType === 'CATEGORY' && (
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Select Category *
                </label>
                <select
                  value={formData.targetValue}
                  onChange={(e) => setFormData({ ...formData, targetValue: e.target.value })}
                  className="w-full rounded-lg border px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  required
                >
                  <option value="">Select a category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {formData.ruleType === 'BRAND' && (
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Select Brand/Manufacturer *
                </label>
                <select
                  value={formData.targetValue}
                  onChange={(e) => setFormData({ ...formData, targetValue: e.target.value })}
                  className="w-full rounded-lg border px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  required
                >
                  <option value="">Select a manufacturer</option>
                  {manufacturers.map((mfr) => (
                    <option key={mfr.id} value={mfr.id}>
                      {mfr.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {formData.ruleType === 'CART_AMOUNT' && (
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Minimum Cart Amount (৳) *
                </label>
                <input
                  type="number"
                  value={formData.minCartAmount}
                  onChange={(e) => setFormData({ ...formData, minCartAmount: e.target.value })}
                  className="w-full rounded-lg border px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  placeholder="e.g., 1000"
                  min="0"
                  step="0.01"
                  required
                />
              </div>
            )}

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full rounded-lg border px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                placeholder="Optional description for this rule"
                rows={2}
              />
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold">Discount Settings</h2>

          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Discount Type *
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="discountType"
                    value="PERCENTAGE"
                    checked={formData.discountType === 'PERCENTAGE'}
                    onChange={(e) => setFormData({ ...formData, discountType: e.target.value as 'PERCENTAGE' | 'FIXED' })}
                    className="text-teal-600 focus:ring-teal-500"
                  />
                  Percentage (%)
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="discountType"
                    value="FIXED"
                    checked={formData.discountType === 'FIXED'}
                    onChange={(e) => setFormData({ ...formData, discountType: e.target.value as 'PERCENTAGE' | 'FIXED' })}
                    className="text-teal-600 focus:ring-teal-500"
                  />
                  Fixed Amount (৳)
                </label>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Discount Amount *
              </label>
              <input
                type="number"
                value={formData.discountAmount}
                onChange={(e) => setFormData({ ...formData, discountAmount: e.target.value })}
                className="w-full rounded-lg border px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                placeholder={formData.discountType === 'PERCENTAGE' ? 'e.g., 20' : 'e.g., 100'}
                min="0"
                max={formData.discountType === 'PERCENTAGE' ? '100' : undefined}
                step="0.01"
                required
              />
              <p className="mt-1 text-sm text-gray-500">
                {formData.discountType === 'PERCENTAGE'
                  ? 'Enter a value between 0 and 100'
                  : 'Enter the fixed discount amount in BDT'}
              </p>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Priority
              </label>
              <input
                type="number"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full rounded-lg border px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                placeholder="0"
                min="0"
              />
              <p className="mt-1 text-sm text-gray-500">
                Higher priority rules override lower priority rules
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold">Schedule</h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Start Date *
              </label>
              <input
                type="datetime-local"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full rounded-lg border px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                End Date *
              </label>
              <input
                type="datetime-local"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full rounded-lg border px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                required
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="rounded text-teal-600 focus:ring-teal-500"
              />
              <span className="text-sm font-medium text-gray-700">Active</span>
            </label>
            <p className="mt-1 text-sm text-gray-500">
              Inactive rules will not be applied by the discount engine
            </p>
          </div>
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 rounded-lg bg-teal-600 px-6 py-2 text-white hover:bg-teal-700 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {loading ? 'Creating...' : 'Create Rule'}
          </button>
          <Link
            href="/admin/discounts"
            className="rounded-lg border px-6 py-2 text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}
