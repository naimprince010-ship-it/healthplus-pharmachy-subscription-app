'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, Play, Trash2, Edit, Tag, Percent, Clock, CheckCircle, XCircle } from 'lucide-react'

interface DiscountRule {
  id: string
  name: string
  ruleType: 'CATEGORY' | 'BRAND' | 'CART_AMOUNT' | 'USER_GROUP'
  targetValue: string | null
  discountType: 'PERCENTAGE' | 'FIXED'
  discountAmount: number
  startDate: string
  endDate: string
  priority: number
  isActive: boolean
  _count: { logs: number }
}

interface Coupon {
  id: string
  code: string
  discountType: 'PERCENTAGE' | 'FIXED'
  discountAmount: number
  minCartAmount: number | null
  maxDiscount: number | null
  usageLimit: number | null
  usageCount: number
  startDate: string
  endDate: string
  isActive: boolean
  _count: { usages: number }
}

type TabType = 'rules' | 'coupons'
type StatusFilter = 'all' | 'active' | 'upcoming' | 'expired'

export default function DiscountManagerPage() {
  const [activeTab, setActiveTab] = useState<TabType>('rules')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [rules, setRules] = useState<DiscountRule[]>([])
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(true)
  const [engineRunning, setEngineRunning] = useState(false)
  const [engineResult, setEngineResult] = useState<string | null>(null)

  useEffect(() => {
    if (activeTab === 'rules') {
      fetchRules()
    } else {
      fetchCoupons()
    }
  }, [activeTab, statusFilter])

  const fetchRules = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/discount/rules?status=${statusFilter}`)
      const data = await res.json()
      setRules(data.rules || [])
    } catch (error) {
      console.error('Failed to fetch rules:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCoupons = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/discount/coupons?status=${statusFilter}`)
      const data = await res.json()
      setCoupons(data.coupons || [])
    } catch (error) {
      console.error('Failed to fetch coupons:', error)
    } finally {
      setLoading(false)
    }
  }

  const runEngine = async () => {
    setEngineRunning(true)
    setEngineResult(null)
    try {
      const res = await fetch('/api/admin/discount/engine', { method: 'POST' })
      const data = await res.json()
      setEngineResult(data.message)
      if (activeTab === 'rules') {
        fetchRules()
      }
    } catch (error) {
      setEngineResult('Failed to run discount engine')
    } finally {
      setEngineRunning(false)
    }
  }

  const deleteRule = async (id: string) => {
    if (!confirm('Are you sure you want to delete this rule?')) return
    try {
      await fetch(`/api/admin/discount/rules/${id}`, { method: 'DELETE' })
      fetchRules()
    } catch (error) {
      console.error('Failed to delete rule:', error)
    }
  }

  const deleteCoupon = async (id: string) => {
    if (!confirm('Are you sure you want to delete this coupon?')) return
    try {
      await fetch(`/api/admin/discount/coupons/${id}`, { method: 'DELETE' })
      fetchCoupons()
    } catch (error) {
      console.error('Failed to delete coupon:', error)
    }
  }

  const getRuleStatus = (rule: DiscountRule) => {
    const now = new Date()
    const start = new Date(rule.startDate)
    const end = new Date(rule.endDate)
    if (!rule.isActive) return 'inactive'
    if (now < start) return 'upcoming'
    if (now > end) return 'expired'
    return 'active'
  }

  const getCouponStatus = (coupon: Coupon) => {
    const now = new Date()
    const start = new Date(coupon.startDate)
    const end = new Date(coupon.endDate)
    if (!coupon.isActive) return 'inactive'
    if (now < start) return 'upcoming'
    if (now > end) return 'expired'
    return 'active'
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('bn-BD', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const getRuleTypeLabel = (type: string) => {
    switch (type) {
      case 'CATEGORY': return 'Category'
      case 'BRAND': return 'Brand/Manufacturer'
      case 'CART_AMOUNT': return 'Cart Amount'
      case 'USER_GROUP': return 'User Group'
      default: return type
    }
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Discount Manager</h1>
          <p className="text-gray-600">Manage discount rules and coupon codes</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={runEngine}
            disabled={engineRunning}
            className="flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2 text-white hover:bg-orange-700 disabled:opacity-50"
          >
            <Play className="h-4 w-4" />
            {engineRunning ? 'Running...' : 'Run Engine Now'}
          </button>
          {activeTab === 'rules' ? (
            <Link
              href="/admin/discounts/rules/create"
              className="flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-white hover:bg-teal-700"
            >
              <Plus className="h-4 w-4" />
              New Rule
            </Link>
          ) : (
            <Link
              href="/admin/discounts/coupons/create"
              className="flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-white hover:bg-teal-700"
            >
              <Plus className="h-4 w-4" />
              New Coupon
            </Link>
          )}
        </div>
      </div>

      {engineResult && (
        <div className="mb-4 rounded-lg bg-blue-50 p-4 text-blue-800">
          {engineResult}
        </div>
      )}

      <div className="mb-6 flex gap-4 border-b">
        <button
          onClick={() => setActiveTab('rules')}
          className={`flex items-center gap-2 border-b-2 px-4 py-2 ${
            activeTab === 'rules'
              ? 'border-teal-600 text-teal-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Percent className="h-4 w-4" />
          Discount Rules
        </button>
        <button
          onClick={() => setActiveTab('coupons')}
          className={`flex items-center gap-2 border-b-2 px-4 py-2 ${
            activeTab === 'coupons'
              ? 'border-teal-600 text-teal-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Tag className="h-4 w-4" />
          Coupons
        </button>
      </div>

      <div className="mb-4 flex gap-2">
        {(['all', 'active', 'upcoming', 'expired'] as StatusFilter[]).map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`rounded-lg px-3 py-1 text-sm ${
              statusFilter === status
                ? 'bg-teal-100 text-teal-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-600 border-t-transparent" />
        </div>
      ) : activeTab === 'rules' ? (
        <div className="overflow-hidden rounded-lg border bg-white">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Discount</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Duration</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Priority</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {rules.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    No discount rules found
                  </td>
                </tr>
              ) : (
                rules.map((rule) => {
                  const status = getRuleStatus(rule)
                  return (
                    <tr key={rule.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{rule.name}</td>
                      <td className="px-4 py-3 text-gray-600">{getRuleTypeLabel(rule.ruleType)}</td>
                      <td className="px-4 py-3 text-gray-600">
                        {rule.discountType === 'PERCENTAGE'
                          ? `${rule.discountAmount}%`
                          : `৳${rule.discountAmount}`}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {formatDate(rule.startDate)} - {formatDate(rule.endDate)}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{rule.priority}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${
                            status === 'active'
                              ? 'bg-green-100 text-green-700'
                              : status === 'upcoming'
                              ? 'bg-blue-100 text-blue-700'
                              : status === 'expired'
                              ? 'bg-gray-100 text-gray-600'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {status === 'active' && <CheckCircle className="h-3 w-3" />}
                          {status === 'upcoming' && <Clock className="h-3 w-3" />}
                          {status === 'expired' && <XCircle className="h-3 w-3" />}
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <Link
                            href={`/admin/discounts/rules/${rule.id}/edit`}
                            className="rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-teal-600"
                          >
                            <Edit className="h-4 w-4" />
                          </Link>
                          <button
                            onClick={() => deleteRule(rule.id)}
                            className="rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border bg-white">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Code</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Discount</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Min Cart</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Usage</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Duration</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {coupons.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    No coupons found
                  </td>
                </tr>
              ) : (
                coupons.map((coupon) => {
                  const status = getCouponStatus(coupon)
                  return (
                    <tr key={coupon.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono font-medium text-gray-900">{coupon.code}</td>
                      <td className="px-4 py-3 text-gray-600">
                        {coupon.discountType === 'PERCENTAGE'
                          ? `${coupon.discountAmount}%`
                          : `৳${coupon.discountAmount}`}
                        {coupon.maxDiscount && ` (max ৳${coupon.maxDiscount})`}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {coupon.minCartAmount ? `৳${coupon.minCartAmount}` : '-'}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {coupon.usageCount}
                        {coupon.usageLimit && ` / ${coupon.usageLimit}`}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {formatDate(coupon.startDate)} - {formatDate(coupon.endDate)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${
                            status === 'active'
                              ? 'bg-green-100 text-green-700'
                              : status === 'upcoming'
                              ? 'bg-blue-100 text-blue-700'
                              : status === 'expired'
                              ? 'bg-gray-100 text-gray-600'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {status === 'active' && <CheckCircle className="h-3 w-3" />}
                          {status === 'upcoming' && <Clock className="h-3 w-3" />}
                          {status === 'expired' && <XCircle className="h-3 w-3" />}
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <Link
                            href={`/admin/discounts/coupons/${coupon.id}/edit`}
                            className="rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-teal-600"
                          >
                            <Edit className="h-4 w-4" />
                          </Link>
                          <button
                            onClick={() => deleteCoupon(coupon.id)}
                            className="rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
