'use client'

import { useEffect } from 'react'
import { trackProductView } from '@/lib/trackEvent'

interface MedicineViewTrackerProps {
  medicineId: string
  name: string
  price: number
  category?: string
}

export function MedicineViewTracker({
  medicineId,
  name,
  price,
  category,
}: MedicineViewTrackerProps) {
  useEffect(() => {
    trackProductView({
      item_id: medicineId,
      item_name: name,
      item_category: category,
      price,
    })
  }, [medicineId, name, price, category])

  return null
}
