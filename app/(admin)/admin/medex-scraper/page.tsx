'use client'

import React, { useState, useEffect } from 'react'
import { Sparkles, Search, Loader2, CheckCircle, AlertCircle, ExternalLink, Package, Save, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { SearchableSelect } from '@/components/SearchableSelect'
import { slugify } from '@/lib/slugify'

interface Category {
    id: string
    name: string
    isMedicineCategory?: boolean
}

interface Manufacturer {
    id: string
    name: string
    slug: string
}

interface ScrapedProduct {
    name: string
    genericName: string | null
    brandName: string | null
    strength: string | null
    sellingPrice: number | null
    imageUrl: string | null
    sourceUrl: string
    source: 'medex'
}

interface DraftProduct {
    id: string
    data: ScrapedProduct
    editedData: {
        name: string
        manufacturerId: string
        categoryId: string
        sellingPrice: string
        mrp: string
        slug: string
    }
    status: 'pending' | 'saving' | 'saved' | 'error'
    error?: string
}

export default function MedexScraperPage() {
    const [url, setUrl] = useState('')
    const [loading, setLoading] = useState(false)
    const [categories, setCategories] = useState<Category[]>([])
    const [manufacturers, setManufacturers] = useState<Manufacturer[]>([])
    const [drafts, setDrafts] = useState<DraftProduct[]>([])

    useEffect(() => {
        fetchCategories()
        fetchManufacturers()
    }, [])

    const fetchCategories = async () => {
        const res = await fetch('/api/admin/categories')
        const data = await res.json()
        if (res.ok) setCategories(data.categories || [])
    }

    const fetchManufacturers = async () => {
        const res = await fetch('/api/admin/manufacturers?limit=1000')
        const data = await res.json()
        if (res.ok) setManufacturers(data.manufacturers || [])
    }

    const handleScrape = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!url.trim()) return

        setLoading(true)
        try {
            const res = await fetch('/api/admin/medex-scraper', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: url.trim() }),
            })

            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Failed to scrape')

            const product = data.product as ScrapedProduct

            // Auto-match manufacturer
            const matchedMfr = manufacturers.find(m =>
                m.name.toLowerCase() === product.brandName?.toLowerCase()
            )

            const newDraft: DraftProduct = {
                id: `draft-${Date.now()}`,
                data: product,
                editedData: {
                    name: product.name,
                    manufacturerId: matchedMfr?.id || '',
                    categoryId: '',
                    sellingPrice: product.sellingPrice?.toString() || '',
                    mrp: product.sellingPrice?.toString() || '',
                    slug: slugify(`${product.name} ${product.strength || ''}`),
                },
                status: 'pending',
            }

            setDrafts(prev => [newDraft, ...prev])
            setUrl('')
            toast.success('Successfully scraped from Medex!')
        } catch (err: any) {
            toast.error(err.message)
        } finally {
            setLoading(false)
        }
    }

    const updateDraft = (id: string, field: string, value: any) => {
        setDrafts(prev => prev.map(d =>
            d.id === id ? { ...d, editedData: { ...d.editedData, [field]: value } } : d
        ))
    }

    const handleSave = async (id: string) => {
        const draft = drafts.find(d => d.id === id)
        if (!draft) return

        if (!draft.editedData.categoryId) {
            toast.error('Please select a category')
            return
        }

        updateDraft(id, 'status', 'saving')
        try {
            const category = categories.find(c => c.id === draft.editedData.categoryId)

            const res = await fetch('/api/admin/products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: draft.editedData.name,
                    slug: draft.editedData.slug,
                    categoryId: draft.editedData.categoryId,
                    manufacturerId: draft.editedData.manufacturerId || undefined,
                    sellingPrice: parseFloat(draft.editedData.sellingPrice),
                    mrp: parseFloat(draft.editedData.mrp),
                    imageUrl: draft.data.imageUrl,
                    genericName: draft.data.genericName,
                    strength: draft.data.strength,
                    isActive: true,
                    type: category?.isMedicineCategory ? 'MEDICINE' : 'GENERAL',
                }),
            })

            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.error || 'Failed to save')
            }

            setDrafts(prev => prev.map(d => d.id === id ? { ...d, status: 'saved' } : d))
            toast.success('Product saved successfully!')
        } catch (err: any) {
            updateDraft(id, 'status', 'error')
            updateDraft(id, 'error', err.message)
            toast.error(err.message)
        }
    }

    return (
        <div className="p-6 max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Sparkles className="text-teal-600" />
                        Medex Scraper
                    </h1>
                    <p className="text-gray-500 mt-1">
                        Scrape medicine data from Medex and get images from Arogga
                    </p>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm mb-8">
                <form onSubmit={handleScrape} className="flex gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                        <input
                            type="text"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder="Enter Medex brand URL (e.g., https://medex.com.bd/brands/501/napa-500-mg-tablet)"
                            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading || !url.trim()}
                        className="flex items-center gap-2 px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Scrape'}
                    </button>
                </form>
            </div>

            <div className="space-y-6">
                {drafts.map((draft) => (
                    <div key={draft.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm flex">
                        {/* Image Preview */}
                        <div className="w-48 bg-gray-50 flex items-center justify-center border-r border-gray-100 p-4 relative">
                            {draft.data.imageUrl ? (
                                <img
                                    src={draft.data.imageUrl}
                                    alt={draft.data.name}
                                    className="w-full h-auto object-contain rounded-lg"
                                />
                            ) : (
                                <div className="flex flex-col items-center text-gray-400">
                                    <Package className="h-10 w-10 mb-2" />
                                    <span className="text-xs">No Image</span>
                                </div>
                            )}
                            {draft.status === 'saved' && (
                                <div className="absolute top-2 right-2 flex items-center gap-1 bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium">
                                    <CheckCircle className="h-3 w-3" />
                                    Saved
                                </div>
                            )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 p-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                                            Product Name & Strength
                                        </label>
                                        <input
                                            type="text"
                                            value={draft.editedData.name}
                                            onChange={(e) => updateDraft(draft.id, 'name', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                                            Manufacturer
                                        </label>
                                        <div className="flex gap-2">
                                            <SearchableSelect
                                                options={manufacturers.map(m => ({ value: m.id, label: m.name }))}
                                                value={draft.editedData.manufacturerId}
                                                onChange={(val) => updateDraft(draft.id, 'manufacturerId', val)}
                                                placeholder="Select Manufacturer"
                                                className="flex-1"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                                            Category
                                        </label>
                                        <SearchableSelect
                                            options={categories.map(c => ({ value: c.id, label: c.name }))}
                                            value={draft.editedData.categoryId}
                                            onChange={(val) => updateDraft(draft.id, 'categoryId', val)}
                                            placeholder="Select Category"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                                                Selling Price (৳)
                                            </label>
                                            <input
                                                type="number"
                                                value={draft.editedData.sellingPrice}
                                                onChange={(e) => updateDraft(draft.id, 'sellingPrice', e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                                                MRP (৳)
                                            </label>
                                            <input
                                                type="number"
                                                value={draft.editedData.mrp}
                                                onChange={(e) => updateDraft(draft.id, 'mrp', e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                                            Generic Name
                                        </label>
                                        <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700">
                                            {draft.data.genericName}
                                        </div>
                                    </div>
                                    <div className="flex items-end justify-between gap-4 pt-2">
                                        <a
                                            href={draft.data.sourceUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-teal-600 hover:text-teal-700 text-sm flex items-center gap-1"
                                        >
                                            <ExternalLink className="h-4 w-4" />
                                            View on Medex
                                        </a>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setDrafts(prev => prev.filter(d => d.id !== draft.id))}
                                                className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                                            >
                                                <Trash2 className="h-5 w-5" />
                                            </button>
                                            <button
                                                onClick={() => handleSave(draft.id)}
                                                disabled={draft.status === 'saving' || draft.status === 'saved'}
                                                className="flex items-center gap-2 px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 transition-colors shadow-sm"
                                            >
                                                {draft.status === 'saving' ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <Save className="h-4 w-4" />
                                                )}
                                                {draft.status === 'saved' ? 'Saved' : 'Save Product'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {draft.status === 'error' && (
                                <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-lg flex items-center gap-2 text-red-700 text-sm">
                                    <AlertCircle className="h-4 w-4" />
                                    {draft.error}
                                </div>
                            )}
                        </div>
                    </div>
                ))}

                {drafts.length === 0 && !loading && (
                    <div className="text-center py-20 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                        <Search className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900">No products scraped yet</h3>
                        <p className="text-gray-500 mt-1 max-w-xs mx-auto">
                            Enter a Medex URL above to start scraping medicine details and images.
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}
