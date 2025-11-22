'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { MedicineForm } from '@/components/admin/MedicineForm'

export default function EditMedicinePage() {
  const params = useParams()
  const medicineId = params.id as string
  const [initialData, setInitialData] = useState<Record<string, unknown> | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchMedicine = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/medicines/${medicineId}`)
      const data = await res.json()

      if (res.ok) {
        const medicine = data.medicine
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
      }
    } catch (error) {
      console.error('Failed to fetch medicine:', error)
    } finally {
      setLoading(false)
    }
  }

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

  if (!initialData) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
        Medicine not found
      </div>
    )
  }

  return <MedicineForm mode="edit" medicineId={medicineId} initialData={initialData} />
}
