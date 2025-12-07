'use client'

import { useState, useEffect } from 'react'
import { 
  RefreshCw, TrendingUp, BarChart3, ExternalLink, AlertCircle, CheckCircle,
  Bell, LineChart, Lightbulb, Search, Plus, Trash2, Eye, EyeOff,
  ThumbsUp, ThumbsDown, ArrowUpRight, ArrowDownRight
} from 'lucide-react'

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

interface PriceAlert {
  id: string
  category: string
  siteName: string | null
  thresholdType: string
  thresholdValue: number
  isActive: boolean
  lastTriggeredAt: string | null
  alerts: PriceAlertLog[]
}

interface PriceAlertLog {
  id: string
  productName: string
  siteName: string
  oldPrice: number | null
  newPrice: number
  changePercent: number | null
  triggeredAt: string
  isRead: boolean
}

interface DemandForecast {
  id: string
  category: string
  siteName: string | null
  productName: string | null
  forecastDate: string
  predictedDemand: number
  confidence: number
  factors: string | null
}

interface ProductRecommendation {
  id: string
  productName: string
  category: string
  sourceSite: string
  reason: string
  priority: number
  estimatedDemand: number | null
  competitorPrice: number | null
  status: string
}

interface ProductGap {
  id: string
  competitorProduct: string
  category: string
  siteName: string
  competitorPrice: number
  reviewCount: number
  gapScore: number
  matchedProductId: string | null
  status: string
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

const THRESHOLD_TYPES = [
  { value: 'below', label: 'Price Below' },
  { value: 'above', label: 'Price Above' },
  { value: 'drop_percent', label: 'Price Drop %' },
  { value: 'rise_percent', label: 'Price Rise %' },
]

function getTrendScoreColor(score: number): string {
  if (score >= 50) return 'bg-green-500 text-white'
  if (score >= 20) return 'bg-green-300 text-green-900'
  if (score >= 0) return 'bg-yellow-200 text-yellow-900'
  if (score >= -20) return 'bg-orange-200 text-orange-900'
  return 'bg-red-200 text-red-900'
}

function getConfidenceColor(confidence: number): string {
  if (confidence >= 0.8) return 'text-green-600'
  if (confidence >= 0.5) return 'text-yellow-600'
  return 'text-red-600'
}

function getDemandColor(demand: number): string {
  if (demand >= 70) return 'bg-green-500'
  if (demand >= 50) return 'bg-green-300'
  if (demand >= 30) return 'bg-yellow-300'
  return 'bg-red-300'
}

type TabType = 'overview' | 'alerts' | 'forecast' | 'recommendations' | 'gaps'

export default function MarketIntelPage() {
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const [trendingProducts, setTrendingProducts] = useState<CompetitorProduct[]>([])
  const [heatMapData, setHeatMapData] = useState<HeatMapCell[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [lastSync, setLastSync] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [alerts, setAlerts] = useState<PriceAlert[]>([])
  const [unreadAlertCount, setUnreadAlertCount] = useState(0)
  const [alertsLoading, setAlertsLoading] = useState(false)
  const [newAlert, setNewAlert] = useState({
    category: 'rice',
    siteName: '',
    thresholdType: 'below',
    thresholdValue: '',
  })

  const [forecasts, setForecasts] = useState<DemandForecast[]>([])
  const [forecastsLoading, setForecastsLoading] = useState(false)
  const [generatingForecasts, setGeneratingForecasts] = useState(false)

  const [recommendations, setRecommendations] = useState<ProductRecommendation[]>([])
  const [recommendationsLoading, setRecommendationsLoading] = useState(false)
  const [generatingRecommendations, setGeneratingRecommendations] = useState(false)

  const [gaps, setGaps] = useState<ProductGap[]>([])
  const [gapsLoading, setGapsLoading] = useState(false)
  const [analyzingGaps, setAnalyzingGaps] = useState(false)

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

  const fetchAlerts = async () => {
    setAlertsLoading(true)
    try {
      const res = await fetch('/api/admin/market-intel/alerts')
      const data = await res.json()
      if (res.ok) {
        setAlerts(data.alerts || [])
        setUnreadAlertCount(data.unreadCount || 0)
      }
    } catch {
      console.error('Failed to fetch alerts')
    } finally {
      setAlertsLoading(false)
    }
  }

  const fetchForecasts = async () => {
    setForecastsLoading(true)
    try {
      const res = await fetch('/api/admin/market-intel/forecast')
      const data = await res.json()
      if (res.ok) {
        setForecasts(data.forecasts || [])
      }
    } catch {
      console.error('Failed to fetch forecasts')
    } finally {
      setForecastsLoading(false)
    }
  }

  const fetchRecommendations = async () => {
    setRecommendationsLoading(true)
    try {
      const res = await fetch('/api/admin/market-intel/recommendations')
      const data = await res.json()
      if (res.ok) {
        setRecommendations(data.recommendations || [])
      }
    } catch {
      console.error('Failed to fetch recommendations')
    } finally {
      setRecommendationsLoading(false)
    }
  }

  const fetchGaps = async () => {
    setGapsLoading(true)
    try {
      const res = await fetch('/api/admin/market-intel/gaps')
      const data = await res.json()
      if (res.ok) {
        setGaps(data.gaps || [])
      }
    } catch {
      console.error('Failed to fetch gaps')
    } finally {
      setGapsLoading(false)
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

  const handleCreateAlert = async () => {
    if (!newAlert.thresholdValue) return
    
    try {
      const res = await fetch('/api/admin/market-intel/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAlert),
      })
      
      if (res.ok) {
        setSuccess('Alert created successfully')
        setNewAlert({ category: 'rice', siteName: '', thresholdType: 'below', thresholdValue: '' })
        fetchAlerts()
      } else {
        setError('Failed to create alert')
      }
    } catch {
      setError('Failed to create alert')
    }
  }

  const handleDeleteAlert = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/market-intel/alerts?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        fetchAlerts()
      }
    } catch {
      console.error('Failed to delete alert')
    }
  }

  const handleGenerateForecasts = async () => {
    setGeneratingForecasts(true)
    setError('')
    try {
      const res = await fetch('/api/admin/market-intel/forecast', { method: 'POST' })
      const data = await res.json()
      if (res.ok) {
        setSuccess(`Generated ${data.generated} forecasts`)
        fetchForecasts()
      } else {
        setError(data.error || 'Failed to generate forecasts')
      }
    } catch {
      setError('Failed to generate forecasts')
    } finally {
      setGeneratingForecasts(false)
    }
  }

  const handleGenerateRecommendations = async () => {
    setGeneratingRecommendations(true)
    setError('')
    try {
      const res = await fetch('/api/admin/market-intel/recommendations', { method: 'POST' })
      const data = await res.json()
      if (res.ok) {
        setSuccess(`Generated ${data.generated} recommendations`)
        fetchRecommendations()
      } else {
        setError(data.error || 'Failed to generate recommendations')
      }
    } catch {
      setError('Failed to generate recommendations')
    } finally {
      setGeneratingRecommendations(false)
    }
  }

  const handleUpdateRecommendation = async (id: string, status: string) => {
    try {
      const res = await fetch('/api/admin/market-intel/recommendations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      })
      if (res.ok) {
        fetchRecommendations()
      }
    } catch {
      console.error('Failed to update recommendation')
    }
  }

  const handleAnalyzeGaps = async () => {
    setAnalyzingGaps(true)
    setError('')
    try {
      const res = await fetch('/api/admin/market-intel/gaps', { method: 'POST' })
      const data = await res.json()
      if (res.ok) {
        setSuccess(`Found ${data.gapsFound} product gaps`)
        fetchGaps()
      } else {
        setError(data.error || 'Failed to analyze gaps')
      }
    } catch {
      setError('Failed to analyze gaps')
    } finally {
      setAnalyzingGaps(false)
    }
  }

  const handleUpdateGap = async (id: string, status: string) => {
    try {
      const res = await fetch('/api/admin/market-intel/gaps', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      })
      if (res.ok) {
        fetchGaps()
      }
    } catch {
      console.error('Failed to update gap')
    }
  }

  useEffect(() => {
    fetchData()
    fetchAlerts()
    fetchForecasts()
    fetchRecommendations()
    fetchGaps()
  }, [])

  const getHeatMapValue = (category: string, site: string): HeatMapCell | null => {
    return heatMapData.find(cell => cell.category === category && cell.siteName === site) || null
  }

  const tabs = [
    { id: 'overview' as TabType, label: 'Overview', icon: BarChart3 },
    { id: 'alerts' as TabType, label: 'Price Alerts', icon: Bell, badge: unreadAlertCount },
    { id: 'forecast' as TabType, label: 'Demand Forecast', icon: LineChart },
    { id: 'recommendations' as TabType, label: 'Recommendations', icon: Lightbulb },
    { id: 'gaps' as TabType, label: 'Gap Analysis', icon: Search },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Market Intelligence</h1>
          <p className="text-sm text-gray-500 mt-1">
            Competitor analysis, price alerts, demand forecasting & recommendations
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

      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-teal-500 text-teal-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
              {tab.badge && tab.badge > 0 && (
                <span className="ml-1 rounded-full bg-red-500 px-2 py-0.5 text-xs text-white">
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'overview' && (
        <>
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
        </>
      )}

      {activeTab === 'alerts' && (
        <>
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-teal-600" />
                <h2 className="text-lg font-semibold text-gray-900">Create Price Alert</h2>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={newAlert.category}
                  onChange={e => setNewAlert({ ...newAlert, category: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{CATEGORY_LABELS[cat]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Site (optional)</label>
                <select
                  value={newAlert.siteName}
                  onChange={e => setNewAlert({ ...newAlert, siteName: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                >
                  <option value="">All Sites</option>
                  {SITES.map(site => (
                    <option key={site} value={site}>{SITE_LABELS[site]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Alert Type</label>
                <select
                  value={newAlert.thresholdType}
                  onChange={e => setNewAlert({ ...newAlert, thresholdType: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                >
                  {THRESHOLD_TYPES.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {newAlert.thresholdType.includes('percent') ? 'Percentage' : 'Price (৳)'}
                </label>
                <input
                  type="number"
                  value={newAlert.thresholdValue}
                  onChange={e => setNewAlert({ ...newAlert, thresholdValue: e.target.value })}
                  placeholder={newAlert.thresholdType.includes('percent') ? '10' : '500'}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={handleCreateAlert}
                  disabled={!newAlert.thresholdValue}
                  className="w-full flex items-center justify-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:bg-gray-400"
                >
                  <Plus className="h-4 w-4" />
                  Create Alert
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <div className="flex items-center gap-2 mb-4">
              <Bell className="h-5 w-5 text-teal-600" />
              <h2 className="text-lg font-semibold text-gray-900">Active Alerts</h2>
            </div>

            {alertsLoading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : alerts.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p>No price alerts configured. Create one above.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {alerts.map(alert => (
                  <div key={alert.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <span className="font-medium text-gray-900">
                          {CATEGORY_LABELS[alert.category]}
                        </span>
                        {alert.siteName && (
                          <span className="text-sm text-gray-500">
                            on {SITE_LABELS[alert.siteName]}
                          </span>
                        )}
                        <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                          {THRESHOLD_TYPES.find(t => t.value === alert.thresholdType)?.label}: {alert.thresholdValue}
                          {alert.thresholdType.includes('percent') ? '%' : '৳'}
                        </span>
                      </div>
                      <button
                        onClick={() => handleDeleteAlert(alert.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    {alert.alerts && alert.alerts.length > 0 && (
                      <div className="mt-3 space-y-2">
                        <p className="text-xs font-medium text-gray-500 uppercase">Recent Triggers</p>
                        {alert.alerts.map(log => (
                          <div key={log.id} className="flex items-center justify-between text-sm bg-gray-50 rounded px-3 py-2">
                            <span className="text-gray-900">{log.productName}</span>
                            <div className="flex items-center gap-4">
                              <span className="text-gray-500">{SITE_LABELS[log.siteName]}</span>
                              <span className="flex items-center gap-1">
                                {log.oldPrice && (
                                  <>
                                    <span className="text-gray-400 line-through">৳{log.oldPrice}</span>
                                    <span className="text-gray-400">→</span>
                                  </>
                                )}
                                <span className="font-medium text-gray-900">৳{log.newPrice}</span>
                                {log.changePercent && (
                                  <span className={`flex items-center ${log.changePercent < 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {log.changePercent < 0 ? <ArrowDownRight className="h-3 w-3" /> : <ArrowUpRight className="h-3 w-3" />}
                                    {Math.abs(log.changePercent).toFixed(1)}%
                                  </span>
                                )}
                              </span>
                              {log.isRead ? (
                                <Eye className="h-4 w-4 text-gray-400" />
                              ) : (
                                <EyeOff className="h-4 w-4 text-blue-600" />
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {activeTab === 'forecast' && (
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <LineChart className="h-5 w-5 text-teal-600" />
              <h2 className="text-lg font-semibold text-gray-900">Demand Forecasts</h2>
            </div>
            <button
              onClick={handleGenerateForecasts}
              disabled={generatingForecasts}
              className="flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:bg-gray-400"
            >
              <RefreshCw className={`h-4 w-4 ${generatingForecasts ? 'animate-spin' : ''}`} />
              {generatingForecasts ? 'Generating...' : 'Generate Forecasts'}
            </button>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            AI-powered demand predictions based on trend analysis and review patterns.
          </p>

          {forecastsLoading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : forecasts.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p>No forecasts available. Click &quot;Generate Forecasts&quot; to create predictions.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {forecasts.map(forecast => {
                const factors = forecast.factors ? JSON.parse(forecast.factors) : null
                return (
                  <div key={forecast.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900">
                        {CATEGORY_LABELS[forecast.category] || forecast.category}
                      </span>
                      {forecast.siteName && (
                        <span className="text-xs text-gray-500">
                          {SITE_LABELS[forecast.siteName] || forecast.siteName}
                        </span>
                      )}
                    </div>
                    <div className="mb-3">
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-gray-500">Predicted Demand</span>
                        <span className="font-semibold text-gray-900">{forecast.predictedDemand.toFixed(0)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${getDemandColor(forecast.predictedDemand)}`}
                          style={{ width: `${forecast.predictedDemand}%` }}
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Confidence</span>
                      <span className={`font-medium ${getConfidenceColor(forecast.confidence)}`}>
                        {(forecast.confidence * 100).toFixed(0)}%
                      </span>
                    </div>
                    {factors && (
                      <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500">
                        <p>Trend Change: {factors.trendChange}</p>
                        <p>Review Growth: {factors.reviewGrowth}</p>
                        <p>Products Analyzed: {factors.productCount}</p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === 'recommendations' && (
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-teal-600" />
              <h2 className="text-lg font-semibold text-gray-900">Product Recommendations</h2>
            </div>
            <button
              onClick={handleGenerateRecommendations}
              disabled={generatingRecommendations}
              className="flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:bg-gray-400"
            >
              <RefreshCw className={`h-4 w-4 ${generatingRecommendations ? 'animate-spin' : ''}`} />
              {generatingRecommendations ? 'Generating...' : 'Generate Recommendations'}
            </button>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            AI-powered product suggestions based on competitor trends and market demand.
          </p>

          {recommendationsLoading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : recommendations.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p>No recommendations available. Click &quot;Generate Recommendations&quot; to get suggestions.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recommendations.map(rec => (
                <div key={rec.id} className={`border rounded-lg p-4 ${
                  rec.status === 'approved' ? 'border-green-200 bg-green-50' :
                  rec.status === 'rejected' ? 'border-red-200 bg-red-50' :
                  rec.status === 'added' ? 'border-blue-200 bg-blue-50' :
                  'border-gray-200'
                }`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-gray-900">{rec.productName}</span>
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          rec.priority >= 3 ? 'bg-red-100 text-red-800' :
                          rec.priority >= 2 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          Priority: {rec.priority}
                        </span>
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          rec.status === 'approved' ? 'bg-green-100 text-green-800' :
                          rec.status === 'rejected' ? 'bg-red-100 text-red-800' :
                          rec.status === 'added' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {rec.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{rec.reason}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>Category: {CATEGORY_LABELS[rec.category] || rec.category}</span>
                        <span>Source: {SITE_LABELS[rec.sourceSite] || rec.sourceSite}</span>
                        {rec.competitorPrice && <span>Price: ৳{rec.competitorPrice.toLocaleString()}</span>}
                        {rec.estimatedDemand && <span>Est. Demand: {rec.estimatedDemand.toFixed(0)}%</span>}
                      </div>
                    </div>
                    {rec.status === 'pending' && (
                      <div className="flex items-center gap-2 ml-4">
                        <button
                          onClick={() => handleUpdateRecommendation(rec.id, 'approved')}
                          className="p-2 rounded-lg bg-green-100 text-green-600 hover:bg-green-200"
                          title="Approve"
                        >
                          <ThumbsUp className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleUpdateRecommendation(rec.id, 'rejected')}
                          className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200"
                          title="Reject"
                        >
                          <ThumbsDown className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'gaps' && (
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Search className="h-5 w-5 text-teal-600" />
              <h2 className="text-lg font-semibold text-gray-900">Product Gap Analysis</h2>
            </div>
            <button
              onClick={handleAnalyzeGaps}
              disabled={analyzingGaps}
              className="flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:bg-gray-400"
            >
              <RefreshCw className={`h-4 w-4 ${analyzingGaps ? 'animate-spin' : ''}`} />
              {analyzingGaps ? 'Analyzing...' : 'Analyze Gaps'}
            </button>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            Products available at competitors but not in your catalog. Higher gap scores indicate more important opportunities.
          </p>

          {gapsLoading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : gaps.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p>No product gaps found. Click &quot;Analyze Gaps&quot; to identify opportunities.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Competitor</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Reviews</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Gap Score</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {gaps.map(gap => (
                    <tr key={gap.id} className={`hover:bg-gray-50 ${
                      gap.status === 'filled' ? 'bg-green-50' :
                      gap.status === 'ignored' ? 'bg-gray-50 opacity-60' : ''
                    }`}>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{gap.competitorProduct}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{CATEGORY_LABELS[gap.category] || gap.category}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          gap.siteName === 'chaldal' ? 'bg-red-100 text-red-800' :
                          gap.siteName === 'arogga' ? 'bg-teal-100 text-teal-800' :
                          'bg-pink-100 text-pink-800'
                        }`}>
                          {SITE_LABELS[gap.siteName] || gap.siteName}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 text-right">৳{gap.competitorPrice.toLocaleString()}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 text-right">{gap.reviewCount}</td>
                      <td className="px-4 py-3 text-right">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          gap.gapScore >= 50 ? 'bg-red-100 text-red-800' :
                          gap.gapScore >= 20 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {gap.gapScore.toFixed(1)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          gap.status === 'filled' ? 'bg-green-100 text-green-800' :
                          gap.status === 'ignored' ? 'bg-gray-100 text-gray-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {gap.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {gap.status === 'open' && (
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleUpdateGap(gap.id, 'filled')}
                              className="text-green-600 hover:text-green-800 text-xs"
                              title="Mark as Filled"
                            >
                              Fill
                            </button>
                            <button
                              onClick={() => handleUpdateGap(gap.id, 'ignored')}
                              className="text-gray-600 hover:text-gray-800 text-xs"
                              title="Ignore"
                            >
                              Ignore
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
