'use client'

import React, { useState, useEffect } from 'react'
import { AlertCircle, TrendingDown, TrendingUp, ExternalLink, RefreshCw } from 'lucide-react'

interface ComparisonMatch {
    siteName: string
    productName: string
    price: number
    url: string | null
}

interface PriceComparisonData {
    productId: string
    productName: string
    localPrice: number
    competitorAvgPrice: number
    competitorMinPrice: number
    gapPercentage: number
    status: 'CHEAPER' | 'EXPENSIVE' | 'COMPETITIVE'
    matches: ComparisonMatch[]
}

export default function PriceComparison() {
    const [data, setData] = useState<PriceComparisonData[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [filter, setFilter] = useState<'ALL' | 'CHEAPER' | 'EXPENSIVE' | 'COMPETITIVE'>('ALL')

    useEffect(() => {
        fetchData()
    }, [filter])

    const fetchData = async () => {
        setLoading(true)
        setError(null)
        try {
            const statusParam = filter === 'ALL' ? '' : `?status=${filter}`
            const response = await fetch(`/api/admin/market-intel/comparison${statusParam}`)
            if (!response.ok) throw new Error('Failed to fetch comparison data')
            const result = await response.json()
            setData(result)
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Price Comparison Analysis</h1>
                    <p className="text-gray-500">Compare your medicine prices with Arogga, MedEasy, and Chaldal.</p>
                </div>
                <button
                    onClick={fetchData}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    <span>Refresh Data</span>
                </button>
            </div>

            <div className="flex space-x-4">
                {['ALL', 'EXPENSIVE', 'CHEAPER', 'COMPETITIVE'].map((f) => (
                    <button
                        key={f}
                        onClick={() => setFilter(f as any)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition ${filter === f
                                ? 'bg-blue-100 text-blue-700 ring-2 ring-blue-500'
                                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                            }`}
                    >
                        {f}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <RefreshCw className="w-10 h-10 text-blue-500 animate-spin" />
                </div>
            ) : error ? (
                <div className="bg-red-50 p-4 rounded-lg flex items-center space-x-3 text-red-700">
                    <AlertCircle className="w-5 h-5" />
                    <span>{error}</span>
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-gray-600 text-sm uppercase">
                            <tr>
                                <th className="px-6 py-4 font-semibold">Medicine</th>
                                <th className="px-6 py-4 font-semibold text-center">Your Price</th>
                                <th className="px-6 py-4 font-semibold text-center">Market Avg</th>
                                <th className="px-6 py-4 font-semibold text-center">Gap</th>
                                <th className="px-6 py-4 font-semibold">Status</th>
                                <th className="px-6 py-4 font-semibold">Competitors</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {data.map((item) => (
                                <tr key={item.productId} className="hover:bg-gray-50/50 transition">
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-gray-900">{item.productName}</div>
                                    </td>
                                    <td className="px-6 py-4 text-center font-bold text-gray-700">
                                        ৳{item.localPrice.toFixed(2)}
                                    </td>
                                    <td className="px-6 py-4 text-center text-gray-600">
                                        ৳{item.competitorAvgPrice.toFixed(2)}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <div className={`flex items-center justify-center space-x-1 font-bold ${item.gapPercentage > 0 ? 'text-red-500' : 'text-green-500'
                                            }`}>
                                            {item.gapPercentage > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                                            <span>{Math.abs(item.gapPercentage).toFixed(1)}%</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${item.status === 'EXPENSIVE' ? 'bg-red-100 text-red-700' :
                                                item.status === 'CHEAPER' ? 'bg-green-100 text-green-700' :
                                                    'bg-blue-100 text-blue-700'
                                            }`}>
                                            {item.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex -space-x-2">
                                            {item.matches.map((m, i) => (
                                                <a
                                                    key={i}
                                                    href={m.url || '#'}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    title={`${m.siteName}: ৳${m.price}`}
                                                    className="w-8 h-8 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-gray-600 hover:z-10 hover:border-blue-500 transition"
                                                >
                                                    {m.siteName.charAt(0).toUpperCase()}
                                                </a>
                                            ))}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {data.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-10 text-center text-gray-500 italic">
                                        No price comparison data found for the selected filter.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}
