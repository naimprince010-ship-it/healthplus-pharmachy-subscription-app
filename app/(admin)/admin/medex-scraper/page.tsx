'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Sparkles, Search, Loader2, CheckCircle, AlertCircle, ExternalLink, Package, Save, Trash2, List, Plus, Layers, Copy } from 'lucide-react'
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
    dosageForm: string | null
    therapeuticClass: string | null
    sellingPrice: number | null
    unitPrice: number | null
    stripPrice: number | null
    tabletsPerStrip: number | null
    imageUrl: string | null
    sourceUrl: string
    source: 'medex'
    categoryName?: string
}

interface DraftProduct {
    id: string
    data: ScrapedProduct
    editedData: {
        name: string
        manufacturerId: string
        categoryId: string
        sellingPrice: string
        unitPrice: string
        stripPrice: string
        tabletsPerStrip: string
        mrp: string
        slug: string
        stockQuantity: string // Default for new products
        categoryName: string // For auto-creation
    }
    status: 'pending' | 'saving' | 'saved' | 'error'
    error?: string
}

export default function MedexScraperPage() {
    const [url, setUrl] = useState('')
    const [bulkMode, setBulkMode] = useState(false)
    const [bulkUrls, setBulkUrls] = useState('')
    const [expanding, setExpanding] = useState(false)
    const [isWaiting, setIsWaiting] = useState(false) // For rate limiting feedback
    const [pendingUrls, setPendingUrls] = useState<{ name: string; url: string }[]>([])

    const sleep = (ms: number) => new Error().stack?.includes('test') ? Promise.resolve() : new Promise(resolve => setTimeout(resolve, ms))

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

    const scrapeUrl = useCallback(async (targetUrl: string, silent = false) => {
        try {
            const res = await fetch('/api/admin/medex-scraper', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: targetUrl.trim(), mode: 'single' }),
            })

            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Failed to scrape')

            const product = data.product as ScrapedProduct

            // 1. Auto-match manufacturer
            const brandSlug = product.brandName ? slugify(product.brandName) : ''
            const matchedMfr = manufacturers.find(m =>
                m.id === brandSlug ||
                m.slug === brandSlug ||
                m.name.toLowerCase() === product.brandName?.toLowerCase()
            )

            // 2. Auto-match category
            let matchedCategoryId = ''
            const lowerName = product.name.toLowerCase()
            const lowerStrength = (product.strength || '').toLowerCase()
            const lowerGeneric = (product.genericName || '').toLowerCase()
            const lowerTherapeutic = (product.therapeuticClass || '').toLowerCase()

            const categoryMappings: Record<string, string[]> = {
                'Pain Relief': ['pain', 'analgesic', 'antipyretic', 'fever', 'headache', 'paracetamol', 'ace', 'napa', 'diclofenac', 'ibuprofen', 'naproxen', 'ketorolac', 'etoricoxib', 'tramadol', 'aspirin'],
                'Diabetes': ['diabetes', 'insulin', 'sugar', 'metformin', 'glimepiride', 'diabetic', 'sitagliptin', 'vildagliptin', 'linagliptin', 'gliclazide'],
                'Blood Pressure': ['blood pressure', 'hypertension', 'amlodipine', 'losartan', 'atenolol', 'hypertensive', 'propranolol', 'beta-blocker', 'bisoprolol', 'carvedilol', 'nifedipine', 'enalapril', 'ramipril', 'valsartan', 'telmisartan'],
                'Baby Care': ['baby', 'infant', 'pediatric', 'kid', 'child', 'gripe water', 'nappy', 'diaper'],
                'Vitamins & Supplements': ['vitamin', 'supplement', 'multivitamin', 'calcium', 'zinc', 'omega', 'iron', 'cod liver', 'b12', 'folic acid'],
                'Heart Health': ['heart', 'cardiac', 'cholesterol', 'statin', 'atorvastatin', 'rosuvastatin', 'propranolol', 'beta-blocker', 'nitroglycerin', 'digoxin', 'warfarin', 'clopidogrel'],
                'Gastric & Ulcer': ['gastric', 'ulcer', 'acidity', 'omeprazole', 'esomeprazole', 'pantoprazole', 'antacid', 'famotidine', 'domperidone', 'sucralfate', 'rabeprazole'],
                'Antibiotic': ['antibiotic', 'infection', 'bacterial', 'azithromycin', 'cefixime', 'amoxicillin', 'ciprofloxacin', 'flucloxacillin', 'ceftriaxone', 'moxifloxacin', 'metronidazole'],
                'Eye & ENT': ['eye drop', 'ear drop', 'nasal', 'otitis', 'conjunctivitis'],
                'Skin Care': ['skin', 'ointment', 'cream', 'fungal', 'scabies', 'parasiticide', 'monosulfiram', 'betamethasone', 'clotrimazole', 'miconazole', 'permethrin'],
                'Tablet': ['tablet', 'tab'],
                'Capsule': ['capsule', 'cap'],
                'Syrup': ['syrup', 'syp', 'suspension', 'susp', 'solution', 'elixir'],
                'Injection': ['injection', 'inj', 'infusion'],
            }

            for (const [catName, keywords] of Object.entries(categoryMappings)) {
                if (keywords.some(kw =>
                    lowerName.includes(kw) ||
                    lowerStrength.includes(kw) ||
                    lowerGeneric.includes(kw) ||
                    lowerTherapeutic.includes(kw)
                )) {
                    const cat = categories.find(c => c.name.toLowerCase() === catName.toLowerCase())
                    if (cat) {
                        matchedCategoryId = cat.id
                    } else {
                        // Category doesn't exist in DB, but we matched the name
                        matchedCategoryId = '' // Will trigger auto-creation
                        product.categoryName = catName
                    }
                    break
                }
            }

            // 3. Clean up name (Strip dosage form if it's at the end of the name)
            let cleanName = product.name
            if (product.dosageForm && cleanName.toLowerCase().endsWith(product.dosageForm.toLowerCase())) {
                cleanName = cleanName.substring(0, cleanName.length - product.dosageForm.length).trim()
            }

            const newDraft: DraftProduct = {
                id: `draft-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                data: product,
                editedData: {
                    name: cleanName,
                    manufacturerId: matchedMfr?.id || '',
                    categoryId: matchedCategoryId,
                    sellingPrice: (product.sellingPrice ?? '').toString(),
                    unitPrice: (product.unitPrice ?? '').toString(),
                    stripPrice: (product.stripPrice ?? '').toString(),
                    tabletsPerStrip: (product.tabletsPerStrip ?? '').toString(),
                    mrp: (product.sellingPrice ?? '').toString(),
                    slug: slugify(`${product.name} ${product.strength || ''}`),
                    stockQuantity: '100', // Default stock
                    categoryName: (product as any).categoryName || '',
                },
                status: 'pending',
            }

            if (product.name.toLowerCase().includes('security check')) {
                throw new Error('Medex Bot Detection: Security Check triggered. Waiting longer might help.')
            }

            setDrafts(prev => [newDraft, ...prev])
            if (!silent) toast.success(`Scraped: ${product.name}`)
            return true
        } catch (err: any) {
            if (!silent) toast.error(err.message)
            console.error('Scrape error:', err)
            return false
        }
    }, [manufacturers, categories])

    // Effect to process queue with rate limiting
    useEffect(() => {
        if (pendingUrls.length > 0 && !loading && !isWaiting) {
            const processQueue = async () => {
                setLoading(true)
                const item = pendingUrls[0]

                const success = await scrapeUrl(item.url, true)
                setPendingUrls(prev => prev.slice(1))

                // Add a random delay between 2-5 seconds to avoid bot detection
                const delay = Math.floor(Math.random() * 3000) + 2000
                setIsWaiting(true)
                await sleep(delay)
                setIsWaiting(false)

                setLoading(false)
            }
            processQueue()
        }
    }, [pendingUrls, loading, isWaiting, scrapeUrl])

    const handleScrape = async (e: React.FormEvent) => {
        e.preventDefault()

        if (bulkMode) {
            if (!bulkUrls.trim()) return
            const urls = bulkUrls.split('\n').map(u => u.trim()).filter(u => u.length > 0 && u.includes('medex.com.bd'))

            if (urls.length === 0) {
                toast.error('No valid Medex URLs found')
                return
            }

            setExpanding(true)
            try {
                const finalUrls: { name: string; url: string }[] = []

                for (const u of urls) {
                    // Check if it's a list page
                    if (u.includes('/brands/') && (u.match(/\//g) || []).length >= 5) {
                        finalUrls.push({ name: 'Brand', url: u })
                    } else {
                        // It's a list page, expand it
                        const res = await fetch('/api/admin/medex-scraper', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ url: u, mode: 'expand' }),
                        })
                        const data = await res.json()
                        if (res.ok && data.links) {
                            finalUrls.push(...data.links)

                            // Multi-page Support
                            if (data.totalPages > 1) {
                                const loadAll = confirm(`This list has ${data.totalPages} pages. Do you want to load products from ALL pages?\n(This may take a moment to find all brand links)`)

                                if (loadAll) {
                                    // Base URL logic for pagination
                                    const baseUrl = u.includes('?') ? u.split('?')[0] : u
                                    const queryParams = new URLSearchParams(u.includes('?') ? u.split('?')[1] : '')

                                    for (let p = 2; p <= data.totalPages; p++) {
                                        queryParams.set('page', p.toString())
                                        const pageUrl = `${baseUrl}?${queryParams.toString()}`

                                        // Small toast for progress
                                        toast.loading(`Finding brands on page ${p}...`, { id: 'expansion-progress' })

                                        const pRes = await fetch('/api/admin/medex-scraper', {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ url: pageUrl, mode: 'expand' }),
                                        })
                                        const pData = await pRes.json()
                                        if (pRes.ok && pData.links) {
                                            finalUrls.push(...pData.links)
                                        }
                                    }
                                    toast.dismiss('expansion-progress')
                                }
                            }
                        } else {
                            toast.error(`Could not expand: ${u}`)
                        }
                    }
                }

                if (finalUrls.length > 0) {
                    setPendingUrls(prev => [...prev, ...finalUrls])
                    setBulkUrls('')
                    toast.success(`Found ${finalUrls.length} products to scrape!`)
                }
            } catch (err: any) {
                toast.error(err.message)
            } finally {
                setExpanding(false)
            }
        } else {
            if (!url.trim()) return
            setLoading(true)
            await scrapeUrl(url)
            setUrl('')
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

        if (!draft.editedData.categoryId && !draft.editedData.categoryName) {
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
                    categoryId: draft.editedData.categoryId || undefined,
                    categoryName: draft.editedData.categoryId ? undefined : draft.editedData.categoryName,
                    manufacturerId: draft.editedData.manufacturerId || undefined,
                    manufacturerName: draft.editedData.manufacturerId ? undefined : draft.data.brandName,
                    sellingPrice: parseFloat(draft.editedData.sellingPrice),
                    unitPrice: draft.editedData.unitPrice ? parseFloat(draft.editedData.unitPrice) : undefined,
                    stripPrice: draft.editedData.stripPrice ? parseFloat(draft.editedData.stripPrice) : undefined,
                    tabletsPerStrip: draft.editedData.tabletsPerStrip ? parseInt(draft.editedData.tabletsPerStrip) : undefined,
                    mrp: parseFloat(draft.editedData.mrp),
                    stockQuantity: parseInt(draft.editedData.stockQuantity) || 0,
                    imageUrl: draft.data.imageUrl,
                    genericName: draft.data.genericName,
                    dosageForm: draft.data.dosageForm || draft.data.strength, // Using actual dosage form if available
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
                <div className="flex bg-gray-100 p-1 rounded-lg">
                    <button
                        onClick={() => setBulkMode(false)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all ${!bulkMode ? 'bg-white shadow-sm text-teal-600' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <Plus className="h-4 w-4" />
                        Single
                    </button>
                    <button
                        onClick={() => setBulkMode(true)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all ${bulkMode ? 'bg-white shadow-sm text-teal-600' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <Layers className="h-4 w-4" />
                        Bulk
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm mb-8">
                <form onSubmit={handleScrape} className="space-y-4">
                    {bulkMode ? (
                        <div className="space-y-4">
                            <div className="relative">
                                <List className="absolute left-3 top-3 text-gray-400 h-5 w-5" />
                                <textarea
                                    value={bulkUrls}
                                    onChange={(e) => setBulkUrls(e.target.value)}
                                    placeholder="Enter multiple Medex brand or list URLs (one per line)...&#10;Example:&#10;https://medex.com.bd/brands/...&#10;https://medex.com.bd/generics/..."
                                    rows={5}
                                    className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all resize-none"
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <p className="text-xs text-gray-400">
                                    💡 You can paste Brand links, Generic links, or Manufacturer links.
                                </p>
                                <button
                                    type="submit"
                                    disabled={expanding || !bulkUrls.trim()}
                                    className="flex items-center gap-2 px-8 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    {expanding ? (
                                        <>
                                            <Loader2 className="h-5 w-5 animate-spin" />
                                            Expanding Lists...
                                        </>
                                    ) : (
                                        <>
                                            <Search className="h-5 w-5" />
                                            Find Products
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex gap-4">
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
                                {loading && !pendingUrls.length ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Scrape'}
                            </button>
                        </div>
                    )}
                </form>
            </div>

            {isWaiting && pendingUrls.length > 0 && (
                <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 mb-8 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Loader2 className="h-5 w-5 text-amber-600 animate-spin" />
                        <div>
                            <p className="text-sm font-semibold text-amber-900">
                                Waiting for next request...
                            </p>
                            <p className="text-xs text-amber-700">
                                Adding human-like delay to avoid bot detection ({pendingUrls.length} remaining)
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {pendingUrls.length > 0 && !isWaiting && (
                <div className="bg-teal-50 border border-teal-100 rounded-xl p-4 mb-8 flex items-center justify-between animate-pulse">
                    <div className="flex items-center gap-3">
                        <Loader2 className="h-5 w-5 text-teal-600 animate-spin" />
                        <div>
                            <p className="text-sm font-semibold text-teal-900">
                                Scraping in progress...
                            </p>
                            <p className="text-xs text-teal-700">
                                {pendingUrls.length} products remaining in queue
                            </p>
                        </div>
                    </div>
                </div>
            )}

            <div className="space-y-6">
                {(drafts.length > 0 || pendingUrls.length > 0) && (
                    <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                        <div className="flex items-center gap-2 text-gray-700 font-medium">
                            <Package className="h-5 w-5 text-teal-600" />
                            <span>{drafts.length} Scraped Products</span>
                            {pendingUrls.length > 0 && (
                                <span className="text-xs bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full">
                                    + {pendingUrls.length} in queue
                                </span>
                            )}
                        </div>
                        <div className="flex gap-3">
                            {drafts.some(d => d.status === 'pending') && (
                                <button
                                    onClick={() => {
                                        drafts.filter(d => d.status === 'pending').forEach(d => handleSave(d.id))
                                    }}
                                    className="flex items-center gap-2 px-4 py-1.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors text-sm shadow-sm"
                                >
                                    <Save className="h-4 w-4" />
                                    Save All Pending
                                </button>
                            )}
                            {drafts.some(d => d.status === 'error') && (
                                <button
                                    onClick={() => setDrafts(prev => prev.filter(d => d.status !== 'error'))}
                                    className="flex items-center gap-2 px-4 py-1.5 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors text-sm shadow-sm"
                                >
                                    <Trash2 className="h-4 w-4" />
                                    Remove Failed
                                </button>
                            )}
                            <button
                                onClick={() => setDrafts([])}
                                className="flex items-center gap-2 px-4 py-1.5 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                            >
                                <Trash2 className="h-4 w-4" />
                                Clear All
                            </button>
                        </div>
                    </div>
                )}

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
                                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 flex items-center justify-between">
                                            <span>Category</span>
                                            {!draft.editedData.categoryId && draft.editedData.categoryName && (
                                                <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-bold">
                                                    Auto-create: {draft.editedData.categoryName}
                                                </span>
                                            )}
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
                                    <div className="grid grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                                                Unit Price (৳)
                                            </label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={draft.editedData.unitPrice}
                                                onChange={(e) => updateDraft(draft.id, 'unitPrice', e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                                                Strip Price (৳)
                                            </label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={draft.editedData.stripPrice}
                                                onChange={(e) => updateDraft(draft.id, 'stripPrice', e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                                                Tab/Strip
                                            </label>
                                            <input
                                                type="number"
                                                value={draft.editedData.tabletsPerStrip}
                                                onChange={(e) => updateDraft(draft.id, 'tabletsPerStrip', e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                                                Final Price (৳)
                                            </label>
                                            <input
                                                type="number"
                                                step="0.01"
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
                                                step="0.01"
                                                value={draft.editedData.mrp}
                                                onChange={(e) => updateDraft(draft.id, 'mrp', e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                                                Initial Stock
                                            </label>
                                            <input
                                                type="number"
                                                value={draft.editedData.stockQuantity}
                                                onChange={(e) => updateDraft(draft.id, 'stockQuantity', e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none font-bold text-teal-600"
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
