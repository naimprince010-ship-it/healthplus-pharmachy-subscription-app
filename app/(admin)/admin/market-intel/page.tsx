'use client'

import { useState, useEffect } from 'react'
import { RefreshCw, TrendingUp, BarChart3, ExternalLink, AlertCircle, CheckCircle } from 'lucide-react'

interface CompetitorProduct {
  id: string
  siteName: string
  category: string
  productName: string
  price: number
  reviewCount: number
  trendScore: number
  productUrl: string | null
  imageUrl: string | null
  collectedAt: string
}

interface HeatMapCell {
  category: string
  siteName: string
  avgTrendScore: number
  count: number
}

const CATEGORIES = ['rice', 'oil', 'paracetamol', 'cough-syrup', 'face-wash']
const SITES = ['chaldal', 'arogga', 'shajgoj']

const CATEGORY_LABELS: Record<string, string> = {
  'rice': 'Rice',
  'oil': 'Cooking Oil',
  'paracetamol': 'Paracetamol',
  'cough-syrup': 'Cough Syrup',
  'face-wash': 'Face Wash',
}

const SITE_LABELS: Record<string, string> = {
  'chaldal': 'Chaldal',
  'arogga': 'Arogga',
  'shajgoj': 'Shajgoj',
}

function getTrendScoreColor(score: number): string {
  if (score >= 50) return 'bg-green-500 text-white'
  if (score >= 20) return 'bg-green-300 text-green-900'
  if (score >= 0) return 'bg-yellow-200 text-yellow-900'
  if (score >= -20) return 'bg-orange-200 text-orange-900'
  return 'bg-red-200 text-red-900'
}

export default function MarketIntelPage() {
  const [trendingProducts, setTrendingProducts] = useState<CompetitorProduct[]>([])
  const [heatMapData, setHeatMapData] = useState<HeatMapCell[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [lastSync, setLastSync] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const fetchData = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/market-intel')
      const data = await res.json()
      
      if (res.ok) {
        setTrendingProducts(data.trending || [])
        setHeatMapData(data.heatMap || [])
        setLastSync(data.lastSync || null)
      } else {
        setError(data.error || 'Failed to fetch data')
      }
    } catch {
      setError('Failed to fetch market intelligence data')
    } finally {
      setLoading(false)
    }
  }

  const handleSync = async () => {
    setSyncing(true)
    setError('')
    setSuccess('')
    try {
      const res = await fetch('/api/admin/market-intel/sync', { method: 'POST' })
      const data = await res.json()
      
      if (res.ok) {
        setSuccess(`Synced ${data.inserted} products successfully`)
        fetchData()
      } else {
        setError(data.error || 'Sync failed')
      }
    } catch {
      setError('Sync failed')
    } finally {
      setSyncing(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const getHeatMapValue = (category: string, site: string): HeatMapCell | null => {
    return heatMapData.find(cell => cell.category === category && cell.siteName === site) || null
  }

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Market Intelligence (MVP)</h1>
            <p className="text-sm text-gray-500 mt-1">
              Competitor analysis for Rice, Oil, Paracetamol, Cough Syrup, Face Wash
            </p>
          </div>
          <div className="flex items-center gap-4">
            {lastSync && (
              <span className="text-sm text-gray-500">
                Last sync: {new Date(lastSync).toLocaleString()}
              </span>
            )}
            <button
              onClick={handleSync}
              disabled={syncing}
              className="flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:bg-gray-400"
            >
              <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Syncing...' : 'Sync Now'}
            </button>
          </div>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600 flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}

        {success && (
          <div className="rounded-lg bg-green-50 p-4 text-sm text-green-600 flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            {success}
          </div>
        )}

        {/* Category Heat Map */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="h-5 w-5 text-teal-600" />
          <h2 className="text-lg font-semibold text-gray-900">Category Heat Map</h2>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          Average trend score by category and site. Higher scores indicate more popular products.
        </p>
        
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Category</th>
                  {SITES.map(site => (
                    <th key={site} className="px-4 py-2 text-center text-sm font-medium text-gray-700">
                      {SITE_LABELS[site]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {CATEGORIES.map(category => (
                  <tr key={category} className="border-t border-gray-100">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {CATEGORY_LABELS[category]}
                    </td>
                    {SITES.map(site => {
                      const cell = getHeatMapValue(category, site)
                      return (
                        <td key={site} className="px-4 py-3 text-center">
                          {cell ? (
                            <div className={`inline-flex flex-col items-center rounded-lg px-3 py-2 ${getTrendScoreColor(cell.avgTrendScore)}`}>
                              <span className="text-sm font-semibold">{cell.avgTrendScore.toFixed(1)}</span>
                              <span className="text-xs opacity-75">{cell.count} products</span>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">N/A</span>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        <div className="mt-4 flex items-center gap-4 text-xs text-gray-500">
          <span>Legend:</span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-4 h-4 rounded bg-green-500"></span> High (&gt;50)
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-4 h-4 rounded bg-green-300"></span> Good (20-50)
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-4 h-4 rounded bg-yellow-200"></span> Medium (0-20)
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-4 h-4 rounded bg-orange-200"></span> Low (-20-0)
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-4 h-4 rounded bg-red-200"></span> Very Low (&lt;-20)
          </span>
        </div>
      </div>

      {/* Trending Products Table */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-5 w-5 text-teal-600" />
          <h2 className="text-lg font-semibold text-gray-900">Trending Products</h2>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          Top 50 products by trend score (reviews - price * 0.01) from the last 7 days.
        </p>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : trendingProducts.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p>No data available. Click &quot;Sync Now&quot; to fetch competitor data.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Site</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Reviews</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Trend Score</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Link</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {trendingProducts.map((product, index) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-500">{index + 1}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {product.imageUrl && (
                          <img
                            src={product.imageUrl}
                            alt={product.productName}
                            className="h-10 w-10 rounded-lg object-cover"
                          />
                        )}
                        <span className="text-sm font-medium text-gray-900 line-clamp-2">
                          {product.productName}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        product.siteName === 'chaldal' ? 'bg-red-100 text-red-800' :
                        product.siteName === 'arogga' ? 'bg-teal-100 text-teal-800' :
                        'bg-pink-100 text-pink-800'
                      }`}>
                        {SITE_LABELS[product.siteName]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {CATEGORY_LABELS[product.category]}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 text-right">
                      ৳{product.price.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 text-right">
                      {product.reviewCount}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getTrendScoreColor(product.trendScore)}`}>
                        {product.trendScore.toFixed(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {product.productUrl && (
                        <a
                          href={product.productUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-teal-600 hover:text-teal-800"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
