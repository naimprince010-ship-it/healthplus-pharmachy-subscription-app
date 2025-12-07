import * as cheerio from 'cheerio'

export type SiteName = 'chaldal' | 'arogga' | 'shajgoj'
export type CategoryKey = 
  | 'rice' 
  | 'oil' 
  | 'paracetamol' 
  | 'cough-syrup' 
  | 'face-wash'
  | 'baby-food'
  | 'diapers'
  | 'milk'
  | 'tea-coffee'
  | 'biscuits'
  | 'snacks'
  | 'soap'
  | 'shampoo'
  | 'toothpaste'
  | 'detergent'

export interface ScrapedCompetitorProduct {
  siteName: SiteName
  category: CategoryKey
  productName: string
  price: number
  reviewCount: number
  position: number | null  // Position in listing (0 = top)
  productUrl: string | null
  imageUrl: string | null
}

// Raw score components stored in JSON field for analysis
export interface RawScoreComponents {
  priceScore: number      // 0-1, higher = cheaper relative to category
  positionScore: number   // 0-1, higher = higher on listing page
  reviewScore: number     // 0-1, normalized review count
  weights: {
    price: number
    position: number
    review: number
  }
  minPrice: number
  maxPrice: number
  maxPosition: number
  maxReviews: number
}

// All 15 categories for the frontend
export const ALL_CATEGORIES: CategoryKey[] = [
  'rice', 'oil', 'paracetamol', 'cough-syrup', 'face-wash',
  'baby-food', 'diapers', 'milk', 'tea-coffee', 'biscuits',
  'snacks', 'soap', 'shampoo', 'toothpaste', 'detergent'
]

export const CATEGORY_LABELS: Record<CategoryKey, string> = {
  'rice': 'Rice',
  'oil': 'Cooking Oil',
  'paracetamol': 'Paracetamol',
  'cough-syrup': 'Cough Syrup',
  'face-wash': 'Face Wash',
  'baby-food': 'Baby Food',
  'diapers': 'Diapers',
  'milk': 'Milk',
  'tea-coffee': 'Tea & Coffee',
  'biscuits': 'Biscuits',
  'snacks': 'Snacks',
  'soap': 'Soap',
  'shampoo': 'Shampoo',
  'toothpaste': 'Toothpaste',
  'detergent': 'Detergent',
}

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.5',
}

const CATEGORY_URLS: Record<SiteName, Record<CategoryKey, string>> = {
  chaldal: {
    'rice': 'https://chaldal.com/search/rice',
    'oil': 'https://chaldal.com/search/cooking%20oil',
    'paracetamol': 'https://chaldal.com/search/napa',
    'cough-syrup': 'https://chaldal.com/search/syrup',
    'face-wash': 'https://chaldal.com/search/face%20wash',
    'baby-food': 'https://chaldal.com/search/baby%20food',
    'diapers': 'https://chaldal.com/search/diapers',
    'milk': 'https://chaldal.com/search/milk',
    'tea-coffee': 'https://chaldal.com/search/tea',
    'biscuits': 'https://chaldal.com/search/biscuits',
    'snacks': 'https://chaldal.com/search/chips',
    'soap': 'https://chaldal.com/search/soap',
    'shampoo': 'https://chaldal.com/search/shampoo',
    'toothpaste': 'https://chaldal.com/search/toothpaste',
    'detergent': 'https://chaldal.com/search/detergent',
  },
  arogga: {
    'rice': '',
    'oil': '',
    'paracetamol': '',
    'cough-syrup': '',
    'face-wash': '',
    'baby-food': '',
    'diapers': '',
    'milk': '',
    'tea-coffee': '',
    'biscuits': '',
    'snacks': '',
    'soap': '',
    'shampoo': '',
    'toothpaste': '',
    'detergent': '',
  },
  shajgoj: {
    'rice': '',
    'oil': '',
    'paracetamol': '',
    'cough-syrup': '',
    'face-wash': '',
    'baby-food': '',
    'diapers': '',
    'milk': '',
    'tea-coffee': '',
    'biscuits': '',
    'snacks': '',
    'soap': '',
    'shampoo': '',
    'toothpaste': '',
    'detergent': '',
  },
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function scrapeChaldalCategory(category: CategoryKey): Promise<ScrapedCompetitorProduct[]> {
  const url = CATEGORY_URLS.chaldal[category]
  if (!url) return []

  const products: ScrapedCompetitorProduct[] = []

  try {
    const response = await fetch(url, { headers: HEADERS })
    if (!response.ok) {
      console.error(`Chaldal ${category}: HTTP ${response.status}`)
      return []
    }

    const html = await response.text()
    const $ = cheerio.load(html)

    // Find all product links with btnShowDetails class
    // Track position for trend score calculation
    let positionIndex = 0
    $('a.btnShowDetails').each((_, el) => {
      const href = $(el).attr('href')
      if (!href || href.length < 5) return

      // Navigate up to find the product container with price info
      let productContainer = $(el).parent()
      for (let i = 0; i < 10; i++) {
        const text = productContainer.text()
        if (text.includes('৳') && text.length > 50) break
        productContainer = productContainer.parent()
      }

      // Extract product name from href (e.g., /foodela-chinigura-rice-1-kg -> Foodela Chinigura Rice 1 Kg)
      const nameFromHref = href
        .replace(/^\//, '')
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')

      // Try to find price in the container
      const containerText = productContainer.text()
      const priceMatch = containerText.match(/৳\s*([\d,]+)/)
      const price = priceMatch ? parseFloat(priceMatch[1].replace(/,/g, '')) : null

      // Find image
      const img = productContainer.find('img[src*="chaldn.com"]').first()
      const imageUrl = img.attr('src') || null

      if (price && nameFromHref.length > 3) {
        const fullUrl = `https://chaldal.com${href}`
        if (!products.some(p => p.productUrl === fullUrl)) {
          products.push({
            siteName: 'chaldal',
            category,
            productName: nameFromHref,
            price,
            reviewCount: 0, // Chaldal doesn't show review counts on listing pages
            position: positionIndex, // Track listing position for trend score
            productUrl: fullUrl,
            imageUrl,
          })
          positionIndex++
        }
      }
    })
    
    console.log(`Chaldal ${category}: found ${products.length} products`)
  } catch (error) {
    console.error(`Error scraping Chaldal ${category}:`, error)
  }

  return products.slice(0, 50) // Limit to top 50 products
}

async function scrapeAroggaCategory(category: CategoryKey): Promise<ScrapedCompetitorProduct[]> {
  const url = CATEGORY_URLS.arogga[category]
  if (!url) return []

  // Note: Arogga is a Next.js SPA that renders products client-side via JavaScript.
  // Cheerio can only parse the initial HTML which doesn't contain product data.
  // This scraper will return 0 products until Arogga adds server-side rendering
  // or we find a JSON API endpoint.
  console.log(`Arogga ${category}: Site uses client-side rendering, scraping not supported`)
  return []
}

async function scrapeShajgojCategory(category: CategoryKey): Promise<ScrapedCompetitorProduct[]> {
  const url = CATEGORY_URLS.shajgoj[category]
  if (!url) return []

  // Note: Shajgoj is a Next.js SPA that renders products client-side via JavaScript.
  // The __NEXT_DATA__ script contains category metadata but not product data.
  // Cheerio can only parse the initial HTML which doesn't contain product listings.
  // This scraper will return 0 products until Shajgoj adds server-side rendering
  // or we find a JSON API endpoint.
  console.log(`Shajgoj ${category}: Site uses client-side rendering, scraping not supported`)
  return []
}

export async function scrapeSiteCategory(site: SiteName, category: CategoryKey): Promise<ScrapedCompetitorProduct[]> {
  switch (site) {
    case 'chaldal':
      return scrapeChaldalCategory(category)
    case 'arogga':
      return scrapeAroggaCategory(category)
    case 'shajgoj':
      return scrapeShajgojCategory(category)
    default:
      return []
  }
}

export async function scrapeAllSitesOnce(): Promise<ScrapedCompetitorProduct[]> {
  const allProducts: ScrapedCompetitorProduct[] = []
  const sites: SiteName[] = ['chaldal', 'arogga', 'shajgoj']
  const categories: CategoryKey[] = [
    'rice', 'oil', 'paracetamol', 'cough-syrup', 'face-wash',
    'baby-food', 'diapers', 'milk', 'tea-coffee', 'biscuits',
    'snacks', 'soap', 'shampoo', 'toothpaste', 'detergent'
  ]

  for (const site of sites) {
    for (const category of categories) {
      try {
        const products = await scrapeSiteCategory(site, category)
        allProducts.push(...products)
        // Small delay between requests to avoid rate limiting
        await sleep(300)
      } catch (error) {
        console.error(`Error scraping ${site} ${category}:`, error)
      }
    }
    // Longer delay between sites
    await sleep(500)
  }

  return allProducts
}

/**
 * Legacy trend score calculation (Phase 1)
 * @deprecated Use calculateTrendScoresForBatch instead
 */
export function calculateTrendScore(reviewCount: number, price: number): number {
  return reviewCount - (price * 0.01)
}

/**
 * Phase 2 Trend Score Formula
 * 
 * Calculates trend scores for a batch of products using relative pricing within each (site, category) group.
 * 
 * Formula: trendScore = (wPrice * priceScore) + (wPosition * positionScore) + (wReview * reviewScore)
 * 
 * Where:
 * - priceScore (0-1): 1 - (price - minPrice) / (maxPrice - minPrice + 1)
 *   Higher score = cheaper relative to category
 * - positionScore (0-1): 1 - (position / maxPosition)
 *   Higher score = higher on listing page (position 0 = top)
 * - reviewScore (0-1): reviewCount / (maxReviews + 1)
 *   Higher score = more reviews
 * 
 * Weights are dynamically adjusted based on data availability:
 * - Default: price=0.7, position=0.2, review=0.1
 * - If no reviews: price=0.78, position=0.22
 * - If no positions: price=0.875, review=0.125
 * - If only price: price=1.0
 * 
 * Final score is scaled to 0-100 range for easier interpretation.
 */
export interface EnrichedProduct extends ScrapedCompetitorProduct {
  trendScore: number
  rawScoreComponents: RawScoreComponents
}

export function calculateTrendScoresForBatch(products: ScrapedCompetitorProduct[]): EnrichedProduct[] {
  if (products.length === 0) return []

  // Group products by (siteName, category)
  const groups = new Map<string, ScrapedCompetitorProduct[]>()
  for (const product of products) {
    const key = `${product.siteName}:${product.category}`
    const group = groups.get(key) || []
    group.push(product)
    groups.set(key, group)
  }

  const enrichedProducts: EnrichedProduct[] = []

  for (const [, groupProducts] of groups) {
    // Calculate min/max for this group
    const prices = groupProducts.map(p => p.price)
    const minPrice = Math.min(...prices)
    const maxPrice = Math.max(...prices)
    
    const positions = groupProducts.map(p => p.position).filter((p): p is number => p !== null)
    const maxPosition = positions.length > 0 ? Math.max(...positions) : 0
    const hasPositions = positions.length > 0
    
    const reviews = groupProducts.map(p => p.reviewCount)
    const maxReviews = Math.max(...reviews)
    const hasReviews = maxReviews > 0

    // Determine weights based on data availability
    let wPrice = 0.7
    let wPosition = 0.2
    let wReview = 0.1

    if (!hasReviews && !hasPositions) {
      // Only price data available
      wPrice = 1.0
      wPosition = 0
      wReview = 0
    } else if (!hasReviews) {
      // Price and position available
      wPrice = 0.78
      wPosition = 0.22
      wReview = 0
    } else if (!hasPositions) {
      // Price and reviews available
      wPrice = 0.875
      wPosition = 0
      wReview = 0.125
    }
    // else: all three available, use default weights

    for (const product of groupProducts) {
      // Calculate priceScore: cheaper = higher score
      const priceDenom = maxPrice - minPrice + 1
      const priceScore = 1 - (product.price - minPrice) / priceDenom

      // Calculate positionScore: higher on page = higher score
      let positionScore = 0.5 // Default if no position data
      if (product.position !== null && maxPosition > 0) {
        positionScore = 1 - (product.position / maxPosition)
      } else if (product.position === 0) {
        positionScore = 1 // First position
      }

      // Calculate reviewScore: more reviews = higher score
      const reviewScore = maxReviews > 0 ? product.reviewCount / (maxReviews + 1) : 0

      // Calculate weighted trend score (0-1 range)
      const rawScore = (wPrice * priceScore) + (wPosition * positionScore) + (wReview * reviewScore)
      
      // Scale to 0-100 for easier interpretation
      const trendScore = rawScore * 100

      const rawScoreComponents: RawScoreComponents = {
        priceScore,
        positionScore,
        reviewScore,
        weights: { price: wPrice, position: wPosition, review: wReview },
        minPrice,
        maxPrice,
        maxPosition,
        maxReviews,
      }

      enrichedProducts.push({
        ...product,
        trendScore,
        rawScoreComponents,
      })
    }
  }

  return enrichedProducts
}
