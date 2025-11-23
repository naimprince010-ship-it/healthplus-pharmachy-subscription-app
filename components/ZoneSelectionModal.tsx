'use client'

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'

interface Zone {
  id: string
  name: string
  description?: string
  deliveryFee?: number
  deliveryCharge: number
  isActive: boolean
  sortOrder: number
}

interface ZoneSelectionModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (zoneId: string) => void
  customerName: string
  customerPhone: string
  prescriptionId: string
}

export function ZoneSelectionModal({
  isOpen,
  onClose,
  onConfirm,
  customerName,
  customerPhone,
  prescriptionId,
}: ZoneSelectionModalProps) {
  const [zones, setZones] = useState<Zone[]>([])
  const [selectedZoneId, setSelectedZoneId] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    if (isOpen) {
      fetchZones()
    }
  }, [isOpen])

  async function fetchZones() {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/zones')
      const data = await response.json()
      
      if (response.ok) {
        const activeZones = data.zones.filter((z: Zone) => z.isActive)
        setZones(activeZones)
        
        if (activeZones.length === 0) {
          setError('No active delivery zones available. Please create zones first.')
        }
      } else {
        setError(data.error || 'Failed to load zones')
      }
    } catch (err) {
      console.error('Failed to fetch zones:', err)
      setError('Failed to load delivery zones')
    } finally {
      setLoading(false)
    }
  }

  function handleConfirm() {
    if (!selectedZoneId) {
      setError('Please select a delivery zone')
      return
    }
    onConfirm(selectedZoneId)
  }

  function handleClose() {
    setSelectedZoneId('')
    setError('')
    onClose()
  }

  if (!isOpen) return null

  const selectedZone = zones.find(z => z.id === selectedZoneId)
  const deliveryFee = selectedZone ? (selectedZone.deliveryFee ?? selectedZone.deliveryCharge) : 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="relative w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl">
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
        >
          <X className="h-6 w-6" />
        </button>

        <h2 className="mb-4 text-2xl font-bold text-gray-900">
          Create Order from Prescription
        </h2>

        <div className="mb-6 rounded-lg bg-gray-50 p-4">
          <h3 className="mb-2 font-semibold text-gray-700">Customer Information</h3>
          <div className="space-y-1 text-sm text-gray-600">
            <p><span className="font-medium">Name:</span> {customerName}</p>
            <p><span className="font-medium">Phone:</span> {customerPhone}</p>
            <p><span className="font-medium">Prescription ID:</span> {prescriptionId}</p>
          </div>
        </div>

        {loading ? (
          <div className="py-8 text-center text-gray-600">Loading zones...</div>
        ) : error && zones.length === 0 ? (
          <div className="rounded-lg bg-red-50 p-4 text-red-700">
            {error}
          </div>
        ) : (
          <>
            <div className="mb-6">
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Select Delivery Zone <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedZoneId}
                onChange={(e) => {
                  setSelectedZoneId(e.target.value)
                  setError('')
                }}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="">-- Select a zone --</option>
                {zones.map((zone) => {
                  const fee = zone.deliveryFee ?? zone.deliveryCharge
                  return (
                    <option key={zone.id} value={zone.id}>
                      {zone.name} - ৳{fee} BDT
                    </option>
                  )
                })}
              </select>
              {error && (
                <p className="mt-1 text-sm text-red-600">{error}</p>
              )}
            </div>

            {selectedZone && (
              <div className="mb-6 rounded-lg border border-teal-200 bg-teal-50 p-4">
                <h4 className="mb-2 font-semibold text-teal-900">
                  {selectedZone.name}
                </h4>
                {selectedZone.description && (
                  <p className="mb-2 text-sm text-teal-700">
                    <span className="font-medium">Areas:</span> {selectedZone.description}
                  </p>
                )}
                <p className="text-lg font-bold text-teal-900">
                  Delivery Charge: ৳{deliveryFee} BDT
                </p>
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button
                onClick={handleClose}
                className="rounded-lg border border-gray-300 px-6 py-2 text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={!selectedZoneId}
                className="rounded-lg bg-teal-600 px-6 py-2 text-white hover:bg-teal-700 disabled:cursor-not-allowed disabled:bg-gray-300"
              >
                Create Order
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
