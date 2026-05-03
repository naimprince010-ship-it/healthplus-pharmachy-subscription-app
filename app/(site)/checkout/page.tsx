'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Image from 'next/image'
import { ArrowLeft, ChevronDown, ChevronUp, Plus, Pencil, Trash2, Shield, Truck, Award } from 'lucide-react'
import { useCart } from '@/contexts/CartContext'
import { trackBeginCheckout, trackPurchase, type GA4Item } from '@/lib/trackEvent'
import { MAIN_CONTAINER } from '@/lib/layout'

interface Zone {
  id: string
  name: string
  deliveryCharge: number
}

interface LocationOption {
  id: string
  name: string
}

interface SavedAddress {
  id: string
  fullName: string
  phone: string
  addressLine1: string
  addressLine2: string | null
  city: string
  zoneId: string
  isDefault: boolean
  zone: { id: string; name: string }
}

interface CheckoutSettings {
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
}

const DEFAULT_SETTINGS: CheckoutSettings = {
  pageTitleBn: 'চেকআউট',
  addressSectionTitleBn: '১. ডেলিভারি ঠিকানা',
  addAddressButtonBn: 'নতুন ঠিকানা যোগ করুন',
  paymentSectionTitleBn: '২. পেমেন্ট মেথড',
  codLabelBn: 'ক্যাশ অন ডেলিভারি',
  bkashLabelBn: 'বিকাশ / নগদ',
  couponSectionTitleBn: '৩. কুপন কোড',
  couponPlaceholderBn: 'কুপন কোড লিখুন',
  couponApplyBn: 'Apply',
  orderSummarySectionTitleBn: '৪. অর্ডার সামারি',
  viewDetailsBn: 'বিস্তারিত দেখুন',
  totalLabelBn: 'সর্বমোট:',
  confirmButtonBn: 'অর্ডার কনফার্ম করুন',
}

export default function CheckoutPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const { items, total, clearCart } = useCart()
  const [zones, setZones] = useState<Zone[]>([])
  const [divisions, setDivisions] = useState<LocationOption[]>([])
  const [districts, setDistricts] = useState<LocationOption[]>([])
  const [upazilas, setUpazilas] = useState<LocationOption[]>([])
  const [selectedDivisionId, setSelectedDivisionId] = useState('')
  const [selectedDistrictId, setSelectedDistrictId] = useState('')
  const [selectedUpazilaId, setSelectedUpazilaId] = useState('')
  const [selectedZone, setSelectedZone] = useState('')
  const [notes, setNotes] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [addressesLoading, setAddressesLoading] = useState(true)
  const [addresses, setAddresses] = useState<SavedAddress[]>([])
  const [selectedSavedAddressId, setSelectedSavedAddressId] = useState<
    string | null
  >(null)
  const [showAddAddress, setShowAddAddress] = useState(false)
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null)
  const [addressForm, setAddressForm] = useState({
    fullName: '',
    phone: '',
    addressLine1: '',
    city: '',
  })
  const [couponCode, setCouponCode] = useState('')
  const [couponApplied, setCouponApplied] = useState(false)
  const [couponDiscount, setCouponDiscount] = useState(0)
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'BKASH'>('COD')
  const [orderSummaryExpanded, setOrderSummaryExpanded] = useState(false)
  const [settings, setSettings] = useState<CheckoutSettings>(DEFAULT_SETTINGS)
  const [hasSubmittedOrder, setHasSubmittedOrder] = useState(false)
  const [freeDeliveryThreshold, setFreeDeliveryThreshold] =
    useState<number | null>(null)
  const [addressNotice, setAddressNotice] = useState('')

  useEffect(() => {
    // Wait until session has finished loading before checking auth
    if (status === 'loading') {
      return
    }

    // If no session after loading is done, redirect to signin
    if (!session) {
      router.push('/auth/signin?redirect=/checkout')
      return
    }

    // Only redirect to cart if cart is empty AND we haven't just submitted an order
    // This prevents the redirect race condition when clearCart() is called after order submission
    if (items.length === 0 && !hasSubmittedOrder) {
      router.push('/cart')
      return
    }

    const ga4Items: GA4Item[] = items.map((item) => ({
      item_id: item.medicineId || item.productId || '',
      item_name: item.name,
      price: item.price,
      quantity: item.quantity,
    }))
    trackBeginCheckout(ga4Items, total)

    fetch('/api/zones')
      .then((res) => res.json())
      .then((data) => {
        if (data.zones) {
          setZones(data.zones)
          if (data.zones.length > 0) {
            setSelectedZone(data.zones[0].id)
          }
        }
      })
      .catch((err) => console.error('Failed to fetch zones:', err))

      fetch('/api/checkout/settings')
        .then((res) => res.json())
        .then((data) => {
          if (data.settings) {
            setSettings({ ...DEFAULT_SETTINGS, ...data.settings })
          }
        })
        .catch((err) => console.error('Failed to fetch checkout settings:', err))

      // Fetch cart settings to get free delivery threshold
      fetch('/api/cart/settings')
        .then((res) => res.json())
        .then((data) => {
          if (data.settings?.freeDeliveryThreshold) {
            setFreeDeliveryThreshold(data.settings.freeDeliveryThreshold)
          }
        })
        .catch((err) => console.error('Failed to fetch cart settings:', err))
    }, [status, session, items, router, total, hasSubmittedOrder])

  useEffect(() => {
    fetch('/api/locations')
      .then((res) => res.json())
      .then((data) => {
        if (data.divisions) setDivisions(data.divisions)
      })
      .catch((err) => console.error('Failed to fetch divisions:', err))
  }, [])

  const loadAddresses = useCallback(async () => {
    setAddressesLoading(true)
    try {
      const res = await fetch('/api/user/addresses')
      if (!res.ok) return
      const data = await res.json()
      const list: SavedAddress[] = data.addresses || []
      setAddresses(list)
      setSelectedSavedAddressId((prev) => {
        if (list.length === 0) return null
        if (prev && list.some((a) => a.id === prev)) return prev
        const def = list.find((a) => a.isDefault) || list[0]
        return def.id
      })
      if (list.length === 0) {
        setShowAddAddress(true)
      } else {
        setShowAddAddress(false)
      }
    } catch (e) {
      console.error('Failed to load addresses:', e)
    } finally {
      setAddressesLoading(false)
    }
  }, [])

  useEffect(() => {
    if (status !== 'authenticated' || !session) return
    void loadAddresses()
  }, [status, session, loadAddresses])

  useEffect(() => {
    if (!selectedSavedAddressId) return
    const a = addresses.find((x) => x.id === selectedSavedAddressId)
    if (a) setSelectedZone(a.zoneId)
  }, [selectedSavedAddressId, addresses])

  const handleDivisionChange = async (divisionId: string) => {
    setSelectedDivisionId(divisionId)
    setSelectedDistrictId('')
    setSelectedUpazilaId('')
    setUpazilas([])
    if (!divisionId) {
      setDistricts([])
      return
    }
    const res = await fetch(`/api/locations?divisionId=${encodeURIComponent(divisionId)}`)
    const data = await res.json()
    setDistricts(data.districts || [])
  }

  const handleDistrictChange = async (districtId: string) => {
    setSelectedDistrictId(districtId)
    setSelectedUpazilaId('')
    if (!districtId) {
      setUpazilas([])
      return
    }
    const res = await fetch(`/api/locations?districtId=${encodeURIComponent(districtId)}`)
    const data = await res.json()
    setUpazilas(data.upazilas || [])
  }

  useEffect(() => {
    if (!selectedDistrictId || zones.length === 0) return
    const districtName = districts.find((d) => d.id === selectedDistrictId)?.name
    if (!districtName) return
    const normalizedDistrict = districtName.trim().toLowerCase()
    const match =
      zones.find((z) => z.name.trim().toLowerCase() === normalizedDistrict) ||
      zones.find((z) => z.name.trim().toLowerCase().includes(normalizedDistrict))
    if (match) {
      queueMicrotask(() => setSelectedZone(match.id))
    }
  }, [selectedDistrictId, districts, zones])

  const mapCartItemsForApi = () =>
    items.map((item) => ({
      medicineId: item.medicineId,
      productId: item.productId,
      membershipPlanId: item.membershipPlanId,
      quantity: item.quantity,
      price: item.price,
    }))

  const resetAddressForm = () => {
    setAddressForm({ fullName: '', phone: '', addressLine1: '', city: '' })
    setEditingAddressId(null)
  }

  const handleSaveAddress = async () => {
    if (
      !addressForm.fullName.trim() ||
      !addressForm.addressLine1.trim() ||
      !addressForm.phone.trim() ||
      !addressForm.city.trim()
    ) {
      setError('ঠিকানা সেভ করতে নাম, ঠিকানা, শহর ও ফোন পূরণ করুন')
      return
    }
    if (!selectedZone) {
      setError('অনুগ্রহ করে ডেলিভারি জোন নির্বাচন করুন')
      return
    }
    setError('')
    try {
      if (editingAddressId) {
        const res = await fetch(`/api/user/addresses/${editingAddressId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fullName: addressForm.fullName.trim(),
            phone: addressForm.phone.trim(),
            addressLine1: addressForm.addressLine1.trim(),
            city: addressForm.city.trim(),
            zoneId: selectedZone,
          }),
        })
        if (!res.ok) {
          const d = await res.json().catch(() => ({}))
          setError(typeof d.error === 'string' ? d.error : 'ঠিকানা আপডেট ব্যর্থ')
          return
        }
      } else {
        const res = await fetch('/api/user/addresses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fullName: addressForm.fullName.trim(),
            phone: addressForm.phone.trim(),
            addressLine1: addressForm.addressLine1.trim(),
            city: addressForm.city.trim(),
            zoneId: selectedZone,
          }),
        })
        if (!res.ok) {
          const d = await res.json().catch(() => ({}))
          setError(typeof d.error === 'string' ? d.error : 'ঠিকানা সংরক্ষণ ব্যর্থ')
          return
        }
        const data = await res.json()
        if (data.address?.id) {
          setSelectedSavedAddressId(data.address.id)
        }
      }
      setShowAddAddress(false)
      resetAddressForm()
      await loadAddresses()
    } catch {
      setError('নেটওয়ার্ক ত্রুটি। আবার চেষ্টা করুন।')
    }
  }

  const handleDeleteAddress = async (addrId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!window.confirm('এই ডেলিভারি ঠিকানাটি মুছে ফেলবেন?')) return
    setError('')
    setAddressNotice('')
    try {
      const res = await fetch(`/api/user/addresses/${addrId}`, { method: 'DELETE' })
      const d = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(
          typeof d.error === 'string' ? d.error : 'ঠিকানা মোছা যায়নি'
        )
        return
      }
      if (typeof d.message === 'string' && d.message) {
        setAddressNotice(d.message)
      }
      await loadAddresses()
    } catch {
      setError('নেটওয়ার্ক ত্রুটি। আবার চেষ্টা করুন।')
    }
  }

  const openEditAddress = (addr: SavedAddress, e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingAddressId(addr.id)
    setAddressForm({
      fullName: addr.fullName,
      phone: addr.phone,
      addressLine1: addr.addressLine1,
      city: addr.city,
    })
    setSelectedZone(addr.zoneId)
    setShowAddAddress(true)
  }

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return
    setError('')
    setCouponApplied(false)
    setCouponDiscount(0)
    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: couponCode.trim(),
          items: mapCartItemsForApi().map(({ medicineId, productId, membershipPlanId, quantity }) => ({
            medicineId,
            productId,
            membershipPlanId,
            quantity,
          })),
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.valid) {
        setCouponApplied(true)
        setCouponDiscount(0)
        setError(typeof data?.error === 'string' ? data.error : '')
        return
      }
      setCouponDiscount(Number(data.discountAmount) || 0)
      setCouponApplied(true)
    } catch {
      setCouponApplied(true)
      setCouponDiscount(0)
      setError('কুপন যাচাই ব্যর্থ হয়েছে।')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    if (addressesLoading) {
      setError('ঠিকানা লোড হচ্ছে...')
      setIsLoading(false)
      return
    }

    if (addresses.length > 0) {
      if (
        !selectedSavedAddressId ||
        !addresses.some((a) => a.id === selectedSavedAddressId)
      ) {
        setError('একটি ডেলিভারি ঠিকানা নির্বাচন করুন')
        setIsLoading(false)
        return
      }
    } else if (!selectedZone) {
      setError('অনুগ্রহ করে ডেলিভারি জোন নির্বাচন করুন')
      setIsLoading(false)
      return
    }

    try {
      const paymentApi = paymentMethod === 'BKASH' ? 'ONLINE' : paymentMethod
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...(addresses.length > 0 && selectedSavedAddressId
            ? { addressId: selectedSavedAddressId }
            : { zoneId: selectedZone }),
          items: mapCartItemsForApi(),
          paymentMethod: paymentApi,
          notes,
          ...(couponApplied && couponDiscount > 0
            ? { couponCode: couponCode.trim().toUpperCase() }
            : {}),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'অর্ডার তৈরি করতে ব্যর্থ হয়েছে')
        setIsLoading(false)
        return
      }

      const ga4Items: GA4Item[] = items.map((item) => ({
        item_id: item.medicineId || item.productId || '',
        item_name: item.name,
        price: item.price,
        quantity: item.quantity,
      }))

      const paidApprox = grandTotal

      trackPurchase({
        transaction_id: data.order.id,
        value: paidApprox,
        shipping: deliveryCharge,
        items: ga4Items,
      })

      setHasSubmittedOrder(true)
      clearCart()
      const awaiting =
        paymentMethod === 'BKASH' ? '&awaitingPayment=1' : ''
      router.replace(
        `/order-success?orderId=${data.order.id}&amount=${Math.round(data.order.total ?? paidApprox)}&paymentMethod=${paymentMethod}${awaiting}`
      )
    } catch (err) {
      console.error('Checkout error:', err)
      setError('একটি ত্রুটি ঘটেছে। অনুগ্রহ করে আবার চেষ্টা করুন।')
      setIsLoading(false)
    }
  }

    const selectedZoneData = zones.find((z) => z.id === selectedZone)
    const selectedDistrictName = districts.find((d) => d.id === selectedDistrictId)?.name
    const filteredZones = selectedDistrictName
      ? zones.filter((z) => {
          const zName = z.name.trim().toLowerCase()
          const dName = selectedDistrictName.trim().toLowerCase()
          return zName === dName || zName.includes(dName)
        })
      : zones
    // Apply free delivery if cart total meets the threshold
    const qualifiesForFreeDelivery = freeDeliveryThreshold !== null && total >= freeDeliveryThreshold
    const deliveryCharge = qualifiesForFreeDelivery ? 0 : (selectedZoneData?.deliveryCharge || 0)
  
  const mrpTotal = items.reduce((sum, item) => {
    const mrp = item.mrp || item.price
    return sum + mrp * item.quantity
  }, 0)
  
    const savings = mrpTotal - total - couponDiscount
    const grandTotal = total + deliveryCharge - couponDiscount
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)

    // Show loading state while session is being fetched
    if (status === 'loading') {
      return (
        <div className="min-h-screen bg-gray-100">
          <div className="sticky top-0 z-50 bg-white border-b border-gray-200 lg:hidden">
            <div className="flex items-center gap-3 px-4 py-3">
              <div className="h-6 w-6 animate-pulse rounded bg-gray-200" />
              <div className="h-6 w-24 animate-pulse rounded bg-gray-200" />
            </div>
          </div>
          <div className="px-4 py-4 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl p-4 animate-pulse">
                <div className="h-6 w-1/3 bg-gray-200 rounded mb-4" />
                <div className="h-12 w-full bg-gray-200 rounded" />
              </div>
            ))}
          </div>
        </div>
      )
    }

    if (!session || items.length === 0) {
      return null
    }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Mobile Header - Simple with back arrow */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200 lg:hidden">
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="p-1 -ml-1"
          >
            <ArrowLeft className="h-6 w-6 text-gray-700" />
          </button>
          <h1 className="text-xl font-bold text-gray-900">{settings.pageTitleBn}</h1>
        </div>
      </div>

      {/* Desktop Header */}
      <div className="hidden lg:block bg-white border-b border-gray-200">
        <div className={`${MAIN_CONTAINER} py-4`}>
          <h1 className="text-2xl font-bold text-gray-900">{settings.pageTitleBn}</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Main Content - with bottom padding for sticky footer */}
        <div className="px-4 py-4 pb-32 lg:pb-8 space-y-4 lg:max-w-4xl lg:mx-auto">
          {error && (
            <div className="rounded-lg bg-red-50 p-4 border border-red-200">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}
          {addressNotice && (
            <div className="rounded-lg bg-teal-50 p-4 border border-teal-200">
              <p className="text-sm text-teal-900">{addressNotice}</p>
            </div>
          )}

          {/* Section 1: Delivery Address */}
          <div className="bg-white rounded-xl p-4">
            <h2 className="text-lg font-bold text-gray-900 mb-4">{settings.addressSectionTitleBn}</h2>

            {addressesLoading && (
              <p className="text-sm text-gray-500 mb-3">ঠিকানা লোড হচ্ছে…</p>
            )}

            {/* Saved addresses — রেডিও নির্বাচন + সম্পাদনা / মুছুন */}
            {!addressesLoading &&
              addresses.length > 0 &&
              addresses.map((addr) => (
              <div
                key={addr.id}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    setSelectedSavedAddressId(addr.id)
                  }
                }}
                className={`mb-3 flex items-start gap-3 rounded-xl border-2 p-4 cursor-pointer transition-all duration-200 ${
                  selectedSavedAddressId === addr.id
                    ? 'border-primary bg-primary/5 shadow-sm'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
                onClick={() => setSelectedSavedAddressId(addr.id)}
              >
                <div className="mt-0.5 shrink-0">
                  <div
                    className={`h-5 w-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                      selectedSavedAddressId === addr.id ? 'border-primary' : 'border-gray-300'
                    }`}
                  >
                    {selectedSavedAddressId === addr.id && (
                      <div className="h-2.5 w-2.5 rounded-full bg-primary" />
                    )}
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-900">{addr.fullName}</p>
                  <p className="text-gray-800 text-sm mt-0.5">
                    {addr.addressLine1}
                    {addr.addressLine2 ? `, ${addr.addressLine2}` : ''}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {addr.phone} · {addr.zone.name}
                  </p>
                  {addr.isDefault && (
                    <span className="inline-block mt-1 text-xs font-medium text-teal-700">
                      ডিফল্ট ঠিকানা
                    </span>
                  )}
                </div>
                <div className="flex shrink-0 gap-1" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    onClick={(e) => openEditAddress(addr, e)}
                    className="rounded-lg p-2 text-teal-600 hover:bg-teal-50"
                    title="সম্পাদনা"
                    aria-label="ঠিকানা সম্পাদনা"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => void handleDeleteAddress(addr.id, e)}
                    className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                    title="মুছুন"
                    aria-label="ঠিকানা মুছুন"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              ))}

            {/* Location + zone — নতুন ঠিকানা বা কোনো ঠিকানা নেই এমন সময় */}
            {(showAddAddress || addresses.length === 0) && (
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">
                  {addresses.length === 0
                    ? 'একটি ঠিকানা সংরক্ষণ করতে লোকেশন ও জোন নির্বাচন করুন:'
                    : 'নতুন ঠিকানা যোগ করতে:'}
                </p>
                <div className="mb-3 grid grid-cols-1 gap-3 md:grid-cols-3">
                  <select
                    value={selectedDivisionId}
                    onChange={(e) => void handleDivisionChange(e.target.value)}
                    className="block w-full rounded-lg border-2 border-gray-200 px-4 py-3 text-base text-gray-900 focus:border-teal-500 focus:outline-none"
                  >
                    <option value="">বিভাগ নির্বাচন করুন</option>
                    {divisions.map((division) => (
                      <option key={division.id} value={division.id}>
                        {division.name}
                      </option>
                    ))}
                  </select>
                  <select
                    value={selectedDistrictId}
                    onChange={(e) => void handleDistrictChange(e.target.value)}
                    className="block w-full rounded-lg border-2 border-gray-200 px-4 py-3 text-base text-gray-900 focus:border-teal-500 focus:outline-none"
                  >
                    <option value="">জেলা নির্বাচন করুন</option>
                    {districts.map((district) => (
                      <option key={district.id} value={district.id}>
                        {district.name}
                      </option>
                    ))}
                  </select>
                  <select
                    value={selectedUpazilaId}
                    onChange={(e) => setSelectedUpazilaId(e.target.value)}
                    className="block w-full rounded-lg border-2 border-gray-200 px-4 py-3 text-base text-gray-900 focus:border-teal-500 focus:outline-none"
                  >
                    <option value="">উপজেলা/থানা নির্বাচন করুন</option>
                    {upazilas.map((upazila) => (
                      <option key={upazila.id} value={upazila.id}>
                        {upazila.name}
                      </option>
                    ))}
                  </select>
                </div>
                <select
                  id="zone"
                  value={selectedZone}
                  onChange={(e) => setSelectedZone(e.target.value)}
                  required
                  className="block w-full rounded-lg border-2 border-gray-200 px-4 py-3 text-base text-gray-900 focus:border-teal-500 focus:outline-none"
                >
                  <option value="">জোন নির্বাচন করুন</option>
                  {filteredZones.map((zone) => (
                    <option key={zone.id} value={zone.id}>
                      {zone.name} - ৳{zone.deliveryCharge} ডেলিভারি
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Add New Address Button */}
            {!showAddAddress ? (
              <button
                type="button"
                onClick={() => {
                  resetAddressForm()
                  setShowAddAddress(true)
                }}
                className="w-full flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-primary/50 py-3.5 text-primary font-bold bg-primary/5 hover:bg-primary/10 transition-colors"
              >
                <Plus className="h-5 w-5" />
                <span>{settings.addAddressButtonBn}</span>
              </button>
            ) : (
              <div className="rounded-lg border-2 border-gray-200 p-4 bg-gray-50">
                <h3 className="font-semibold text-gray-900 mb-3">
                  {editingAddressId ? 'ঠিকানা সম্পাদনা করুন' : 'নতুন ঠিকানা যোগ করুন'}
                </h3>
                <p className="text-xs text-gray-600 mb-3">
                  উপরে বিভাগ/জেলা/জোন সিলেক্ট করুন। অর্ডারের ডেলিভারি চার্জ সেই জোন অনুযায়ী যাবে।
                </p>
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="পূর্ণ নাম"
                    value={addressForm.fullName}
                    onChange={(e) => setAddressForm({ ...addressForm, fullName: e.target.value })}
                    className="block w-full rounded-lg border-2 border-gray-200 px-4 py-3 text-base text-gray-900 focus:border-teal-500 focus:outline-none"
                  />
                  <textarea
                    placeholder="বিস্তারিত ঠিকানা (রোড, বাড়া/ফ্লাট)"
                    value={addressForm.addressLine1}
                    onChange={(e) => setAddressForm({ ...addressForm, addressLine1: e.target.value })}
                    rows={2}
                    className="block w-full rounded-lg border-2 border-gray-200 px-4 py-3 text-base text-gray-900 focus:border-teal-500 focus:outline-none"
                  />
                  <input
                    type="text"
                    placeholder="শহর / এলাকা"
                    value={addressForm.city}
                    onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                    className="block w-full rounded-lg border-2 border-gray-200 px-4 py-3 text-base text-gray-900 focus:border-teal-500 focus:outline-none"
                  />
                  <input
                    type="tel"
                    placeholder="ফোন নম্বর"
                    value={addressForm.phone}
                    onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                    className="block w-full rounded-lg border-2 border-gray-200 px-4 py-3 text-base text-gray-900 focus:border-teal-500 focus:outline-none"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => void handleSaveAddress()}
                      className="flex-1 px-4 py-2.5 bg-primary text-white rounded-lg font-bold hover:bg-primary-dark transition-all duration-200 hover:-translate-y-0.5"
                    >
                      সংরক্ষণ করুন
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddAddress(false)
                        resetAddressForm()
                      }}
                      className="px-4 py-2.5 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                    >
                      বাতিল
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Payment Method */}
          <div className="bg-white rounded-xl p-4">
            <h2 className="text-lg font-bold text-gray-900 mb-4">{settings.paymentSectionTitleBn}</h2>
            
            <div className="flex items-center gap-6">
              {/* Cash on Delivery */}
              <label className="flex items-center gap-2 cursor-pointer" onClick={() => setPaymentMethod('COD')}>
                <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'COD' ? 'border-teal-500' : 'border-gray-300'}`}>
                  {paymentMethod === 'COD' && <div className="h-2.5 w-2.5 rounded-full bg-teal-500" />}
                </div>
                <span className="text-gray-900">{settings.codLabelBn}</span>
              </label>

              {/* Bkash / Nagad */}
              <label className="flex items-center gap-2 cursor-pointer" onClick={() => setPaymentMethod('BKASH')}>
                <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'BKASH' ? 'border-teal-500' : 'border-gray-300'}`}>
                  {paymentMethod === 'BKASH' && <div className="h-2.5 w-2.5 rounded-full bg-teal-500" />}
                </div>
                <span className="text-gray-900">{settings.bkashLabelBn}</span>
              </label>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4">
            <label
              htmlFor="checkout-notes"
              className="text-lg font-bold text-gray-900 mb-3 block"
            >
              ডেলিভারি নোট (ঐচ্ছিক)
            </label>
            <textarea
              id="checkout-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="যেমন: গেট বক্স থেকে ফোন করবেন..."
              rows={2}
              className="block w-full rounded-lg border-2 border-gray-200 px-4 py-3 text-base text-gray-900 focus:border-teal-500 focus:outline-none resize-none"
            />
          </div>

          {/* Section 3: Coupon Code */}
          <div className="bg-white rounded-xl p-4">
            <h2 className="text-lg font-bold text-gray-900 mb-4">{settings.couponSectionTitleBn}</h2>
            
            <div className="flex gap-2">
              <input
                type="text"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                placeholder={settings.couponPlaceholderBn}
                className="flex-1 rounded-lg border-2 border-gray-200 px-4 py-3 text-base text-gray-900 focus:border-teal-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => void handleApplyCoupon()}
                className="px-6 py-3 bg-white border-2 border-primary text-primary font-bold rounded-lg hover:bg-primary/5 hover:shadow-sm transition-all"
              >
                {settings.couponApplyBn}
              </button>
            </div>
            {couponApplied && couponDiscount > 0 && (
              <p className="mt-2 text-sm text-green-700 font-medium">
                কুপন প্রযোজ্য: ছাড় ৳ {couponDiscount.toFixed(0)}
              </p>
            )}
          </div>

          {/* Section 4: Order Summary (Collapsible) */}
          <div className="bg-white rounded-xl">
            <button
              type="button"
              onClick={() => setOrderSummaryExpanded(!orderSummaryExpanded)}
              className="w-full flex items-center justify-between p-4"
            >
              <h2 className="text-lg font-bold text-gray-900">{settings.orderSummarySectionTitleBn} ({itemCount}টি আইটেম)</h2>
              <div className="flex items-center gap-3">
                <span className="text-lg font-bold text-gray-900">৳ {total.toFixed(0)}</span>
                {orderSummaryExpanded ? (
                  <ChevronUp className="h-5 w-5 text-gray-500" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-gray-500" />
                )}
              </div>
            </button>

            {/* View Details Link */}
            <div className="px-4 pb-2">
              <button
                type="button"
                onClick={() => setOrderSummaryExpanded(!orderSummaryExpanded)}
                className="flex items-center gap-1 text-teal-600 font-medium"
              >
                {orderSummaryExpanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
                <span>{settings.viewDetailsBn}</span>
              </button>
            </div>

            {/* Expanded Product List */}
            {orderSummaryExpanded && (
              <div className="border-t border-gray-100">
                <div className="max-h-80 overflow-y-auto">
                  {items.map((item) => {
                    const itemId = item.medicineId || item.productId || item.id
                    const mrp = item.mrp || item.price
                    const hasDiscount = mrp > item.price

                    return (
                      <div key={itemId} className="flex gap-3 p-4 border-b border-gray-100 last:border-b-0">
                        {/* Product Image */}
                        <div className="relative h-14 w-14 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                          {item.image ? (
                            <Image
                              src={item.image}
                              alt={item.name}
                              fill
                              unoptimized
                              className="object-cover"
                              sizes="56px"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-gray-400">
                              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                          )}
                        </div>

                        {/* Product Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 line-clamp-2">{item.name}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{item.quantity} টি</p>
                        </div>

                        {/* Price */}
                        <div className="text-right">
                          <p className="text-sm font-semibold text-gray-900">৳ {(item.price * item.quantity).toFixed(0)}</p>
                          {hasDiscount && (
                            <p className="text-xs text-gray-400 line-through">৳ {(mrp * item.quantity).toFixed(0)}</p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Price Breakdown */}
                <div className="p-4 border-t border-gray-200 space-y-2.5">
                  <div className="flex justify-between text-[15px]">
                    <span className="text-gray-600 font-medium">সাবটোটাল</span>
                    <span className="text-gray-900 font-bold">৳ {total.toFixed(0)}</span>
                  </div>
                  <div className="flex justify-between text-[15px]">
                    <span className="text-gray-600 font-medium">ডেলিভারি ফি</span>
                    <span className="text-gray-900 font-bold">৳ {deliveryCharge.toFixed(0)}</span>
                  </div>
                  {couponDiscount > 0 && (
                    <div className="flex justify-between text-[15px]">
                      <span className="text-green-700 font-medium">কুপন ছাড়</span>
                      <span className="text-green-700 font-bold">
                        − ৳ {couponDiscount.toFixed(0)}
                      </span>
                    </div>
                  )}
                  {savings > 0 && (
                    <div className="flex justify-between text-[15px]">
                      <span className="text-green-600 font-medium">সেভিংস</span>
                      <span className="text-green-600 font-bold">- ৳ {savings.toFixed(0)}</span>
                    </div>
                  )}
                  
                  {/* Grand Total Row */}
                  <div className="flex justify-between items-center pt-3 mt-3 border-t border-dashed border-gray-300">
                    <span className="text-lg font-bold text-gray-900">সর্বমোট:</span>
                    <span className="text-xl font-extrabold text-primary">৳ {grandTotal.toFixed(0)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Desktop Order Button */}
          <div className="hidden lg:block mt-6">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center items-center gap-2 rounded-xl bg-cta py-4 font-bold tracking-wide text-white text-[19px] hover:bg-cta-dark disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-300 hover:shadow-[0_4px_20px_rgba(249,115,22,0.3)] hover:-translate-y-1 active:translate-y-0"
            >
              {isLoading ? 'অপেক্ষা করুন...' : settings.confirmButtonBn}
            </button>

            {/* Trust Indicators */}
            <div className="mt-5 flex items-center justify-center gap-6 text-gray-500 text-sm font-medium">
              <div className="flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-green-600"/> 
                <span>নিরাপদ চেকআউট</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-primary"/> 
                <span>দ্রুত ডেলিভারি</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Award className="w-4 h-4 text-orange-500"/> 
                <span>১০০% আসল পণ্য</span>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Sticky Footer */}
        <div 
          className="fixed bottom-0 left-0 right-0 z-[100] bg-[#1a1a2e] lg:hidden"
          style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
        >
          <div className="flex items-center justify-between px-4 py-4">
            <span className="text-white text-lg font-bold">{settings.totalLabelBn} ৳ {grandTotal.toFixed(0)}</span>
            <button
              type="submit"
              disabled={isLoading}
              className="px-8 py-3 bg-cta text-white font-bold rounded-xl hover:bg-cta-dark disabled:bg-gray-500 disabled:cursor-not-allowed transition-all duration-300 hover:shadow-[0_4px_12px_rgba(249,115,22,0.3)] active:scale-95"
            >
              {isLoading ? 'অপেক্ষা করুন...' : settings.confirmButtonBn}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
