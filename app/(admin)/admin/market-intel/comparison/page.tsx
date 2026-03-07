import React from 'react'
import PriceComparison from '@/components/admin/PriceComparison'
import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Price Comparison | Admin',
    description: 'Analyze medicine prices against competitors',
}

export default function PriceComparisonPage() {
    return (
        <div className="min-h-screen bg-gray-50">
            <PriceComparison />
        </div>
    )
}
