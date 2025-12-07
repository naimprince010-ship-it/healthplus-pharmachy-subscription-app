'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Download, ExternalLink, AlertCircle, CheckCircle, Loader2, Sparkles, FolderOpen, Package } from 'lucide-react'
import toast from 'react-hot-toast'
import { slugify } from '@/lib/slugify'
import { SearchableSelect } from '@/components/SearchableSelect'

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

interface ImportedProduct {
  name: string
  brandName: string | null
  description: string | null
  sellingPrice: number | null
  mrp: number | null
  imageUrl: string | null
  packSize: string | null
  genericName: string | null
  dosageForm: string | null
  strength: string | null
  sourceUrl: string
  source: 'arogga' | 'chaldal' | 'medeasy'
}

interface CategoryProduct {
  name: string
  url: string
  price: number | null
  imageUrl: string | null
  selected?: boolean
}

export default function ProductImportPage() {
  const router = useRouter()
  const [importMode, setImportMode] = useState<'single' | 'bulk'>('single')
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [importedProduct, setImportedProduct] = useState<ImportedProduct | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([])
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState('')
  const [aiLanguage, setAiLanguage] = useState<'en' | 'bn'>('en')
  
  const [categoryUrl, setCategoryUrl] = useState('')
  const [categoryProducts, setCategoryProducts] = useState<CategoryProduct[]>([])
  const [bulkLoading, setBulkLoading] = useState(false)
  const [bulkImporting, setBulkImporting] = useState(false)
  const [bulkProgress, setBulkProgress] = useState({ current: 0, total: 0, success: 0, failed: 0 })
  
        const [editedProduct, setEditedProduct] = useState({
          name: '',
          manufacturerId: '',
          description: '',
          sellingPrice: '',
          mrp: '',
          stockQuantity: '100',
          categoryId: '',
          packSize: '',
          keyFeatures: '',
          specSummary: '',
          seoTitle: '',
          seoDescription: '',
          seoKeywords: '',
          slug: '',
        })

    useEffect(() => {
      fetchCategories()
      fetchManufacturers()
    }, [])

    const fetchCategories = async () => {
      try {
        const res = await fetch('/api/admin/categories')
        const data = await res.json()
        if (res.ok) {
          setCategories(data.categories || [])
        }
      } catch (error) {
        console.error('Failed to fetch categories:', error)
      }
    }

    const fetchManufacturers = async () => {
      try {
        const res = await fetch('/api/admin/manufacturers')
        const data = await res.json()
        if (res.ok) {
          setManufacturers(data.manufacturers || [])
        }
      } catch (error) {
        console.error('Failed to fetch manufacturers:', error)
      }
    }

  const handleAIGenerate = async () => {
    if (!editedProduct.name) {
      setAiError('Please enter a product name first')
      return
    }

    setAiLoading(true)
    setAiError('')

    try {
      const res = await fetch('/api/ai/product-helper', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  productName: editedProduct.name,
                  brandName: manufacturers.find(m => m.id === editedProduct.manufacturerId)?.name || undefined,
                  category: categories.find(c => c.id === editedProduct.categoryId)?.name || undefined,
                  language: aiLanguage,
                }),
      })

      const data = await res.json()

            if (res.ok) {
              setEditedProduct(prev => {
                const baseSlug = prev.packSize 
                  ? `${prev.name} ${prev.packSize}` 
                  : prev.name
                return {
                  ...prev,
                  description: data.description || prev.description,
                  keyFeatures: data.keyFeatures?.join('\n') || prev.keyFeatures,
                  specSummary: data.specsSummary || prev.specSummary,
                  seoTitle: data.seoTitle || prev.seoTitle,
                  seoDescription: data.seoDescription || prev.seoDescription,
                  seoKeywords: data.seoKeywords?.join(', ') || prev.seoKeywords,
                  slug: slugify(baseSlug),
                }
              })
              setAiError('')
              toast.success('AI content generated successfully!')
      } else {
        setAiError(data.error || 'AI generation failed')
      }
    } catch (error) {
      setAiError('AI generation failed. Please try again.')
    } finally {
      setAiLoading(false)
    }
  }

  const handleFetch= async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!url.trim()) {
      setError('URL is required')
      return
    }
    
    setLoading(true)
    setError(null)
    setImportedProduct(null)
    
    try {
      const res = await fetch('/api/admin/product-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      })
      
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to import product')
      }
      
                        setImportedProduct(data.product)
                        setEditedProduct({
                          name: data.product.name || '',
                          manufacturerId: '',
                          description: data.product.description || '',
                          sellingPrice: data.product.sellingPrice?.toString() || '',
                          mrp: data.product.mrp?.toString() || '',
                          stockQuantity: '100',
                          categoryId: '',
                          packSize: data.product.packSize || '',
                          keyFeatures: '',
                          specSummary: '',
                          seoTitle: '',
                          seoDescription: '',
                          seoKeywords: '',
                          slug: '',
                        })
      
      toast.success('Product details fetched successfully!')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch product'
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

    const handleFetchCategory = async (e: React.FormEvent) => {
      e.preventDefault()
    
      if (!categoryUrl.trim()) {
        setError('Category URL is required')
        return
      }
    
      setBulkLoading(true)
      setError(null)
      setCategoryProducts([])
    
      try {
        const res = await fetch('/api/admin/product-import/category', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: categoryUrl.trim() }),
        })
      
        const data = await res.json()
      
        if (!res.ok) {
          throw new Error(data.error || 'Failed to fetch category products')
        }
      
        const productsWithSelection = data.products.map((p: CategoryProduct) => ({ ...p, selected: true }))
        setCategoryProducts(productsWithSelection)
        toast.success(`Found ${data.count} products in category`)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to fetch category'
        setError(message)
        toast.error(message)
      } finally {
        setBulkLoading(false)
      }
    }

    const toggleProductSelection = (url: string) => {
      setCategoryProducts(prev => 
        prev.map(p => p.url === url ? { ...p, selected: !p.selected } : p)
      )
    }

    const toggleAllProducts = (selected: boolean) => {
      setCategoryProducts(prev => prev.map(p => ({ ...p, selected })))
    }

    const handleBulkImport = async () => {
      const selectedProducts = categoryProducts.filter(p => p.selected)
      if (selectedProducts.length === 0) {
        toast.error('Please select at least one product to import')
        return
      }
    
      setBulkImporting(true)
      setBulkProgress({ current: 0, total: selectedProducts.length, success: 0, failed: 0 })
    
      let success = 0
      let failed = 0
    
      for (let i = 0; i < selectedProducts.length; i++) {
        const product = selectedProducts[i]
        setBulkProgress(prev => ({ ...prev, current: i + 1 }))
      
        try {
          const res = await fetch('/api/admin/product-import', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: product.url }),
          })
        
          if (res.ok) {
            success++
          } else {
            failed++
          }
        } catch {
          failed++
        }
      
        setBulkProgress(prev => ({ ...prev, success, failed }))
      }
    
      setBulkImporting(false)
      toast.success(`Imported ${success} products, ${failed} failed`)
    }

    const handleSaveProduct = async () => {
      if (!editedProduct.name.trim()) {
        toast.error('Product name is required')
        return
      }
    
      if (!editedProduct.sellingPrice || parseFloat(editedProduct.sellingPrice) <= 0) {
        toast.error('Valid selling price is required')
        return
      }
    
      if (!editedProduct.categoryId) {
        toast.error('Please select a category')
        return
      }
    
      setLoading(true)
    
      try {
                        const productData = {
                          type: 'GENERAL',
                          name: editedProduct.name.trim(),
                          slug: editedProduct.slug.trim() || undefined,
                          manufacturerId: editedProduct.manufacturerId || undefined,
                          description: editedProduct.description.trim() || undefined,
                          sellingPrice: parseFloat(editedProduct.sellingPrice),
                          mrp: editedProduct.mrp ? parseFloat(editedProduct.mrp) : undefined,
                          stockQuantity: parseInt(editedProduct.stockQuantity) || 100,
                          imageUrl: importedProduct?.imageUrl || undefined,
                          isActive: true,
                          categoryId: editedProduct.categoryId,
                          sizeLabel: editedProduct.packSize.trim() || undefined,
                          keyFeatures: editedProduct.keyFeatures.trim() || undefined,
                          specSummary: editedProduct.specSummary.trim() || undefined,
                          seoTitle: editedProduct.seoTitle.trim() || undefined,
                          seoDescription: editedProduct.seoDescription.trim() || undefined,
                          seoKeywords: editedProduct.seoKeywords.trim() || undefined,
                        }
      
      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData),
      })
      
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save product')
      }
      
      toast.success('Product saved successfully!')
      router.push('/admin/products')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save product'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Import Product</h1>
          <p className="mt-2 text-sm text-gray-600">
            Import product details from Arogga, Chaldal, or MedEasy
          </p>
        </div>

        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-yellow-600" />
            <div className="text-sm text-yellow-800">
              <p className="font-medium">Important Notice</p>
              <p className="mt-1">
                  This feature imports product data from external websites. Please ensure you have 
                  permission to use the imported content (images, descriptions, etc.) before saving.
                  Only Arogga, Chaldal, and MedEasy URLs are supported.
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-2 border-b border-gray-200">
          <button
            onClick={() => setImportMode('single')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
              importMode === 'single'
                ? 'border-b-2 border-teal-600 text-teal-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Package className="h-4 w-4" />
            Single Product
          </button>
          <button
            onClick={() => setImportMode('bulk')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
              importMode === 'bulk'
                ? 'border-b-2 border-teal-600 text-teal-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <FolderOpen className="h-4 w-4" />
            Bulk Import (Category)
          </button>
        </div>

        {importMode === 'single' ? (
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-gray-900">Step 1: Enter Product URL</h2>
            <p className="mt-1 text-sm text-gray-600">
              Paste a product URL from Arogga, Chaldal, or MedEasy
            </p>
          
            <form onSubmit={handleFetch} className="mt-4">
              <div className="flex gap-3">
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://www.arogga.com/product/... or https://chaldal.com/... or https://medeasy.health/medicines/..."
                  className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  disabled={loading}
                />
                <button
                  type="submit"
                  disabled={loading || !url.trim()}
                  className="flex items-center gap-2 rounded-lg bg-teal-600 px-6 py-2 font-semibold text-white transition-colors hover:bg-teal-700 disabled:bg-gray-400"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Fetching...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4" />
                      Fetch Details
                    </>
                  )}
                </button>
              </div>
            </form>
          
            {error && (
              <div className="mt-4 flex items-center gap-2 text-sm text-red-600">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}
          
            <div className="mt-4 text-xs text-gray-500">
              <p>Supported URLs:</p>
              <ul className="mt-1 list-inside list-disc">
                <li>Arogga: https://www.arogga.com/product/...</li>
                <li>Chaldal: https://chaldal.com/...</li>
                <li>MedEasy: https://medeasy.health/medicines/...</li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="rounded-lg border border-gray-200 bg-white p-6">
              <h2 className="text-lg font-semibold text-gray-900">Step 1: Enter Category URL</h2>
              <p className="mt-1 text-sm text-gray-600">
                Paste a category page URL to extract all products from that category
              </p>
            
              <form onSubmit={handleFetchCategory} className="mt-4">
                <div className="flex gap-3">
                  <input
                    type="url"
                    value={categoryUrl}
                    onChange={(e) => setCategoryUrl(e.target.value)}
                    placeholder="https://www.arogga.com/category/... or https://chaldal.com/soaps or https://medeasy.health/skin-care"
                    className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    disabled={bulkLoading}
                  />
                  <button
                    type="submit"
                    disabled={bulkLoading || !categoryUrl.trim()}
                    className="flex items-center gap-2 rounded-lg bg-teal-600 px-6 py-2 font-semibold text-white transition-colors hover:bg-teal-700 disabled:bg-gray-400"
                  >
                    {bulkLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Scanning...
                      </>
                    ) : (
                      <>
                        <FolderOpen className="h-4 w-4" />
                        Scan Category
                      </>
                    )}
                  </button>
                </div>
              </form>
            
              {error && (
                <div className="mt-4 flex items-center gap-2 text-sm text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </div>
              )}
            
              <div className="mt-4 text-xs text-gray-500">
                <p>Supported Category URLs:</p>
                <ul className="mt-1 list-inside list-disc">
                  <li>Arogga: https://www.arogga.com/category/beauty/6980/skincare</li>
                  <li>Chaldal: https://chaldal.com/soaps</li>
                  <li>MedEasy: https://medeasy.health/skin-care</li>
                </ul>
              </div>
            </div>

            {categoryProducts.length > 0 && (
              <div className="rounded-lg border border-gray-200 bg-white p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Step 2: Select Products to Import</h2>
                    <p className="mt-1 text-sm text-gray-600">
                      Found {categoryProducts.length} products. Select which ones to import.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleAllProducts(true)}
                      className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Select All
                    </button>
                    <button
                      onClick={() => toggleAllProducts(false)}
                      className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Deselect All
                    </button>
                  </div>
                </div>
              
                <div className="mt-4 max-h-96 overflow-y-auto rounded-lg border border-gray-200">
                  {categoryProducts.map((product, index) => (
                    <div
                      key={product.url}
                      className={`flex items-center gap-3 p-3 ${index !== 0 ? 'border-t border-gray-100' : ''}`}
                    >
                      <input
                        type="checkbox"
                        checked={product.selected}
                        onChange={() => toggleProductSelection(product.url)}
                        className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                      />
                      {product.imageUrl && (
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="h-12 w-12 rounded object-cover bg-gray-100"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-sm font-medium text-gray-900">{product.name}</p>
                        <p className="text-xs text-gray-500 truncate">{product.url}</p>
                      </div>
                      {product.price && (
                        <span className="text-sm font-medium text-gray-900">৳{product.price}</span>
                      )}
                    </div>
                  ))}
                </div>
              
                <div className="mt-4 flex items-center justify-between border-t border-gray-200 pt-4">
                  <p className="text-sm text-gray-600">
                    {categoryProducts.filter(p => p.selected).length} of {categoryProducts.length} products selected
                  </p>
                  <button
                    onClick={handleBulkImport}
                    disabled={bulkImporting || categoryProducts.filter(p => p.selected).length === 0}
                    className="flex items-center gap-2 rounded-lg bg-teal-600 px-6 py-2 font-semibold text-white transition-colors hover:bg-teal-700 disabled:bg-gray-400"
                  >
                    {bulkImporting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Importing {bulkProgress.current}/{bulkProgress.total}...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4" />
                        Import Selected ({categoryProducts.filter(p => p.selected).length})
                      </>
                    )}
                  </button>
                </div>
              
                {bulkImporting && (
                  <div className="mt-4 rounded-lg bg-gray-50 p-4">
                    <div className="flex items-center justify-between text-sm">
                      <span>Progress: {bulkProgress.current}/{bulkProgress.total}</span>
                      <span className="text-green-600">{bulkProgress.success} success</span>
                      {bulkProgress.failed > 0 && (
                        <span className="text-red-600">{bulkProgress.failed} failed</span>
                      )}
                    </div>
                    <div className="mt-2 h-2 w-full rounded-full bg-gray-200">
                      <div
                        className="h-2 rounded-full bg-teal-600 transition-all"
                        style={{ width: `${(bulkProgress.current / bulkProgress.total) * 100}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

      {importedProduct && (
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Step 2: Review & Edit</h2>
              <p className="mt-1 text-sm text-gray-600">
                Review the imported data and make any necessary changes
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm text-green-600">
              <CheckCircle className="h-4 w-4" />
              Imported from {importedProduct.source}
            </div>
          </div>
          
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Product Name *
                </label>
                <input
                  type="text"
                  value={editedProduct.name}
                  onChange={(e) => setEditedProduct({ ...editedProduct, name: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Manufacturer
                </label>
                <SearchableSelect
                  options={manufacturers.map((mfr) => ({ value: mfr.id, label: mfr.name }))}
                  value={editedProduct.manufacturerId}
                  onChange={(value) => setEditedProduct({ ...editedProduct, manufacturerId: value })}
                  placeholder="Select Manufacturer"
                  className="mt-1"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Selling Price (BDT) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={editedProduct.sellingPrice}
                    onChange={(e) => setEditedProduct({ ...editedProduct, sellingPrice: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    MRP (BDT)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={editedProduct.mrp}
                    onChange={(e) => setEditedProduct({ ...editedProduct, mrp: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Stock Quantity
                  </label>
                  <input
                    type="number"
                    value={editedProduct.stockQuantity}
                    onChange={(e) => setEditedProduct({ ...editedProduct, stockQuantity: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Pack Size
                  </label>
                  <input
                    type="text"
                    value={editedProduct.packSize}
                    onChange={(e) => setEditedProduct({ ...editedProduct, packSize: e.target.value })}
                    placeholder="e.g., 500 ml, 300 gm"
                    className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Category <span className="text-red-500">*</span>
                </label>
                <SearchableSelect
                  options={categories.map((cat) => ({ value: cat.id, label: cat.name }))}
                  value={editedProduct.categoryId}
                  onChange={(value) => setEditedProduct({ ...editedProduct, categoryId: value })}
                  placeholder="Select Category"
                  className="mt-1"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  rows={4}
                  value={editedProduct.description}
                  onChange={(e) => setEditedProduct({ ...editedProduct, description: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Key Features
                </label>
                <textarea
                  rows={3}
                  value={editedProduct.keyFeatures}
                  onChange={(e) => setEditedProduct({ ...editedProduct, keyFeatures: e.target.value })}
                  placeholder="Enter key features, one per line"
                  className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Specifications Summary
                </label>
                <textarea
                  rows={3}
                  value={editedProduct.specSummary}
                  onChange={(e) => setEditedProduct({ ...editedProduct, specSummary: e.target.value })}
                  placeholder="Enter specifications"
                  className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>
            
            <div className="space-y-4">
              {importedProduct.imageUrl && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Product Image
                  </label>
                  <div className="mt-2 overflow-hidden rounded-lg border border-gray-200">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={importedProduct.imageUrl}
                      alt={importedProduct.name}
                      className="h-48 w-full object-contain bg-gray-50"
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Image will be saved from: {importedProduct.source}
                  </p>
                </div>
              )}
              
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <h3 className="text-sm font-medium text-gray-700">Additional Info</h3>
                <dl className="mt-2 space-y-2 text-sm">
                  {importedProduct.genericName && (
                    <div>
                      <dt className="text-gray-500">Generic Name:</dt>
                      <dd className="font-medium text-gray-900">{importedProduct.genericName}</dd>
                    </div>
                  )}
                  {importedProduct.dosageForm && (
                    <div>
                      <dt className="text-gray-500">Dosage Form:</dt>
                      <dd className="font-medium text-gray-900">{importedProduct.dosageForm}</dd>
                    </div>
                  )}
                  {importedProduct.strength && (
                    <div>
                      <dt className="text-gray-500">Strength:</dt>
                      <dd className="font-medium text-gray-900">{importedProduct.strength}</dd>
                    </div>
                  )}
                  {importedProduct.packSize && (
                    <div>
                      <dt className="text-gray-500">Pack Size:</dt>
                      <dd className="font-medium text-gray-900">{importedProduct.packSize}</dd>
                    </div>
                  )}
                  <div>
                    <dt className="text-gray-500">Source:</dt>
                    <dd>
                      <a
                        href={importedProduct.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-teal-600 hover:text-teal-700"
                      >
                        {importedProduct.source}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="rounded-lg border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50 p-4">
                <div className="mb-3 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-purple-600" />
                  <h3 className="text-sm font-semibold text-gray-900">AI Assistant</h3>
                  <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">
                    Beta
                  </span>
                </div>
                
                <p className="mb-3 text-xs text-gray-600">
                  Generate SEO content automatically based on product name and category.
                </p>

                {aiError && (
                  <div className="mb-3 rounded-lg bg-red-50 p-2 text-xs text-red-600">
                    {aiError}
                  </div>
                )}

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Language
                    </label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setAiLanguage('en')}
                        className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                          aiLanguage === 'en'
                            ? 'bg-purple-600 text-white'
                            : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        English
                      </button>
                      <button
                        type="button"
                        onClick={() => setAiLanguage('bn')}
                        className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                          aiLanguage === 'bn'
                            ? 'bg-purple-600 text-white'
                            : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        বাংলা
                      </button>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleAIGenerate}
                    disabled={aiLoading || !editedProduct.name}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Sparkles className="h-4 w-4" />
                    {aiLoading ? 'Generating...' : 'Regenerate with AI'}
                  </button>

                                    <p className="text-xs text-purple-700">
                                      <strong>Tip:</strong> Click to generate Description, Key Features, Specifications, SEO URL, and SEO fields.
                                    </p>
                </div>
              </div>

                            <div className="rounded-lg border border-gray-200 bg-white p-4">
                              <h3 className="text-sm font-semibold text-gray-900 mb-3">SEO Settings</h3>
                              <div className="space-y-3">
                                <div>
                                  <label className="block text-xs font-medium text-gray-700">
                                    SEO URL (Slug)
                                  </label>
                                  <div className="mt-1 flex items-center gap-1">
                                    <span className="text-xs text-gray-500">/products/</span>
                                    <input
                                      type="text"
                                      value={editedProduct.slug}
                                      onChange={(e) => setEditedProduct({ ...editedProduct, slug: e.target.value })}
                                      placeholder="vim-dishwashing-liquid-pouch-200-ml"
                                      className="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                                    />
                                  </div>
                                  <p className="mt-1 text-xs text-gray-500">
                                    Auto-generated when you click &quot;Regenerate with AI&quot;
                                  </p>
                                </div>

                                <div>
                                  <label className="block text-xs font-medium text-gray-700">
                                    SEO Title
                                  </label>
                                  <input
                                    type="text"
                                    value={editedProduct.seoTitle}
                                    onChange={(e) => setEditedProduct({ ...editedProduct, seoTitle: e.target.value })}
                                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                                  />
                                </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700">
                      SEO Description
                    </label>
                    <textarea
                      rows={2}
                      value={editedProduct.seoDescription}
                      onChange={(e) => setEditedProduct({ ...editedProduct, seoDescription: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700">
                      SEO Keywords
                    </label>
                    <input
                      type="text"
                      value={editedProduct.seoKeywords}
                      onChange={(e) => setEditedProduct({ ...editedProduct, seoKeywords: e.target.value })}
                      placeholder="keyword1, keyword2, keyword3"
                      className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-6 flex items-center justify-end gap-3 border-t border-gray-200 pt-6">
            <Link
              href="/admin/products"
              className="rounded-lg border border-gray-300 px-6 py-2 font-semibold text-gray-700 transition-colors hover:bg-gray-50"
            >
              Cancel
            </Link>
            <button
              onClick={handleSaveProduct}
              disabled={loading}
              className="flex items-center gap-2 rounded-lg bg-teal-600 px-6 py-2 font-semibold text-white transition-colors hover:bg-teal-700 disabled:bg-gray-400"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Product'
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
