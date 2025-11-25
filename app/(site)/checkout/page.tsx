'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useCart } from '@/contexts/CartContext'
import { trackBeginCheckout, trackPurchase, type GA4Item } from '@/lib/trackEvent'

interface Zone {
  id: string
  name: string
  deliveryCharge: number
}

export default function CheckoutPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const { items, total, clearCart } = useCart()
  const [zones, setZones] = useState<Zone[]>([])
  const [selectedZone, setSelectedZone] = useState('')
  const [notes, setNotes] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!session) {
      router.push('/auth/signin?redirect=/checkout')
      return
    }

    if (items.length === 0) {
      router.push('/cart')
      return
    }

    const ga4Items: GA4Item[] = items.map((item) => ({
      item_id: item.medicineId,
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
        }
      })
      .catch((err) => console.error('Failed to fetch zones:', err))
  }, [session, items, router, total])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    if (!selectedZone) {
      setError('Please select a delivery zone')
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          zoneId: selectedZone,
          items: items.map((item) => ({
            medicineId: item.medicineId,
            quantity: item.quantity,
            price: item.price,
          })),
          paymentMethod: 'COD',
          notes,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to create order')
        setIsLoading(false)
        return
      }

      const ga4Items: GA4Item[] = items.map((item) => ({
        item_id: item.medicineId,
        item_name: item.name,
        price: item.price,
        quantity: item.quantity,
      }))

      trackPurchase({
        transaction_id: data.order.id,
        value: grandTotal,
        shipping: deliveryCharge,
        items: ga4Items,
      })

      clearCart()
      router.push(`/orders/${data.order.id}`)
    } catch (err) {
      console.error('Checkout error:', err)
      setError('An error occurred. Please try again.')
      setIsLoading(false)
    }
  }

  const selectedZoneData = zones.find((z) => z.id === selectedZone)
  const deliveryCharge = selectedZoneData?.deliveryCharge || 0
  const grandTotal = total + deliveryCharge

  if (!session || items.length === 0) {
    return null
  }

  return (
    <div className="bg-gray-50 py-16">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900">Checkout</h1>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div className="rounded-lg bg-white p-6 shadow">
            <h2 className="text-xl font-bold text-gray-900">Delivery Information</h2>

            <div className="mt-4">
              <label htmlFor="zone" className="block text-sm font-medium text-gray-700">
                Delivery Zone *
              </label>
              <select
                id="zone"
                value={selectedZone}
                onChange={(e) => setSelectedZone(e.target.value)}
                required
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-teal-500 focus:outline-none focus:ring-teal-500"
              >
                <option value="">Select a zone</option>
                {zones.map((zone) => (
                  <option key={zone.id} value={zone.id}>
                    {zone.name} - ৳{zone.deliveryCharge} delivery
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-4">
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                Delivery Notes (Optional)
              </label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-teal-500 focus:outline-none focus:ring-teal-500"
                placeholder="Any special instructions for delivery..."
              />
            </div>
          </div>

          <div className="rounded-lg bg-white p-6 shadow">
            <h2 className="text-xl font-bold text-gray-900">Order Summary</h2>

            <div className="mt-4 space-y-3">
              {items.map((item) => (
                <div key={item.medicineId} className="flex justify-between text-sm">
                  <span className="text-gray-600">
                    {item.name} x {item.quantity}
                  </span>
                  <span className="font-semibold text-gray-900">৳{item.price * item.quantity}</span>
                </div>
              ))}

              <div className="border-t border-gray-200 pt-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-semibold text-gray-900">৳{total}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Delivery Charge</span>
                  <span className="font-semibold text-gray-900">৳{deliveryCharge}</span>
                </div>
                <div className="mt-3 flex justify-between border-t border-gray-200 pt-3">
                  <span className="text-lg font-bold text-gray-900">Total</span>
                  <span className="text-lg font-bold text-gray-900">৳{grandTotal}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-white p-6 shadow">
            <h2 className="text-xl font-bold text-gray-900">Payment Method</h2>
            <div className="mt-4">
              <div className="flex items-center">
                <input
                  type="radio"
                  id="cod"
                  name="payment"
                  checked
                  readOnly
                  className="h-4 w-4 text-teal-600"
                />
                <label htmlFor="cod" className="ml-3 text-gray-900">
                  Cash on Delivery (COD)
                </label>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-lg bg-teal-600 py-3 font-semibold text-white hover:bg-teal-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Placing Order...' : 'Place Order'}
          </button>
        </form>
      </div>
    </div>
  )
}
