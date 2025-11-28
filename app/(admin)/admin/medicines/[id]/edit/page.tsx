'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { MedicineForm } from '@/components/admin/MedicineForm'

export default function EditMedicinePage() {
  const params = useParams()
  const medicineId = params.id as string
  const [initialData, setInitialData] = useState<Record<string, unknown> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchMedicine = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/medicines/${medicineId}`, { cache: 'no-store' })
      const json = await res.json().catch(() => null)

      if (!res.ok) {
        const msg = json?.error
          || (res.status === 404 ? 'Medicine not found'
              : res.status === 403 ? 'You are not authorized to view this medicine'
              : 'Failed to load medicine')
        setError(msg)
        setInitialData(null)
        return
      }

      const medicine = json.medicine
      setInitialData({
        name: medicine.name,
        genericName: medicine.genericName || '',
        brandName: medicine.brandName || '',
        manufacturer: medicine.manufacturer || '',
        dosageForm: medicine.dosageForm || '',
        packSize: medicine.packSize || '',
        strength: medicine.strength || '',
        description: medicine.description || '',
        categoryId: medicine.categoryId,
        mrp: medicine.mrp || undefined,
        sellingPrice: medicine.sellingPrice,
        purchasePrice: medicine.purchasePrice || undefined,
        discountPercentage: medicine.discountPercentage || undefined,
        unitPrice: medicine.unitPrice || undefined,
        stripPrice: medicine.stripPrice || undefined,
        tabletsPerStrip: medicine.tabletsPerStrip || undefined,
        stockQuantity: medicine.stockQuantity,
        minStockAlert: medicine.minStockAlert || undefined,
        seoTitle: medicine.seoTitle || '',
        seoDescription: medicine.seoDescription || '',
        seoKeywords: medicine.seoKeywords || '',
        canonicalUrl: medicine.canonicalUrl || '',
        imageUrl: medicine.imageUrl || '',
        imagePath: medicine.imagePath || '',
        uses: medicine.uses || '',
        sideEffects: medicine.sideEffects || '',
        contraindications: medicine.contraindications || '',
        storageInstructions: medicine.storageInstructions || '',
        expiryDate: medicine.expiryDate ? new Date(medicine.expiryDate).toISOString().split('T')[0] : '',
        requiresPrescription: medicine.requiresPrescription,
        isFeatured: medicine.isFeatured,
        isActive: medicine.isActive,
      })
    } catch {
      setError('Network error while loading medicine')
    } finally {
      setLoading(false)
    }
  }, [medicineId])

  useEffect(() => {
    fetchMedicine()
  }, [medicineId, fetchMedicine])


  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading medicine...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <div className="text-sm font-medium text-red-800 mb-2">{error}</div>
        <button
          onClick={fetchMedicine}
          className="text-sm text-red-600 hover:text-red-700 underline"
        >
          Retry
        </button>
      </div>
    )
  }

  if (!initialData) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
        Medicine not found
      </div>
    )
  }

  return <MedicineForm mode="edit" medicineId={medicineId} initialData={initialData} />
}
