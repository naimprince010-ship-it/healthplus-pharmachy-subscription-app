import * as cheerio from 'cheerio'

export type SiteName = 'chaldal' | 'arogga' | 'shajgoj' | 'medeasy'
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
    'paracetamol': 'paracetamol', // Category slug for API
    'cough-syrup': 'cough-syrup',
    'face-wash': 'face-wash',
    'baby-food': 'baby-food',
    'diapers': 'diapers',
    'milk': 'milk',
    'tea-coffee': 'tea-coffee',
    'biscuits': 'biscuits',
    'snacks': 'snacks',
    'soap': 'soap',
    'shampoo': 'shampoo',
    'toothpaste': 'toothpaste',
    'detergent': 'detergent',
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
  medeasy: {
    'rice': '',
    'oil': '',
    'paracetamol': 'https://medeasy.health/medicines/search?q=napa',
    'cough-syrup': 'https://medeasy.health/medicines/search?q=syrup',
    'face-wash': 'https://medeasy.health/medicines/search?q=face+wash',
    'baby-food': 'https://medeasy.health/medicines/search?q=baby+food',
    'diapers': 'https://medeasy.health/medicines/search?q=diapers',
    'milk': 'https://medeasy.health/medicines/search?q=milk',
    'tea-coffee': 'https://medeasy.health/medicines/search?q=tea',
    'biscuits': 'https://medeasy.health/medicines/search?q=biscuits',
    'snacks': 'https://medeasy.health/medicines/search?q=chips',
    'soap': 'https://medeasy.health/medicines/search?q=soap',
    'shampoo': 'https://medeasy.health/medicines/search?q=shampoo',
    'toothpaste': 'https://medeasy.health/medicines/search?q=toothpaste',
    'detergent': 'https://medeasy.health/medicines/search?q=detergent',
  },
}

const CHALDAL_COOKING_ROOT_URL = 'https://chaldal.com/cooking'

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function extractChaldalProductsFromHtml(html: string, category: CategoryKey): ScrapedCompetitorProduct[] {
  const parseChaldalState = (pageHtml: string): unknown | null => {
    const stateMatch = pageHtml.match(/window\.__reactAsyncStatePacket\s*=\s*(\{[\s\S]*?\})\s*<\/script>/)
    if (!stateMatch) return null
    try {
      return JSON.parse(stateMatch[1])
    } catch {
      return null
    }
  }

  const parseChaldalProductsFromState = (state: unknown): Array<Record<string, unknown>> => {
    if (!state || typeof state !== 'object') return []
    const blocks = Object.values(state as Record<string, unknown>).filter(
      block => !!block && typeof block === 'object'
    ) as Array<Record<string, unknown>>

    for (const block of blocks) {
      const maybeProducts = (block as any).products
      if (
        maybeProducts &&
        typeof maybeProducts === 'object' &&
        Array.isArray((maybeProducts as { items?: unknown[] }).items)
      ) {
        return (maybeProducts as { items: unknown[] }).items.filter(
          (it): it is Record<string, unknown> => !!it && typeof it === 'object'
        )
      }
    }
    return []
  }

  const parseBigDtoPrice = (val: unknown): number | null => {
    if (typeof val === 'number' && Number.isFinite(val)) return val
    if (!val || typeof val !== 'object') return null
    const v = val as Record<string, unknown>
    const lo = typeof v.Lo === 'number' ? v.Lo : null
    const mid = typeof v.Mid === 'number' ? v.Mid : null
    const hi = typeof v.Hi === 'number' ? v.Hi : null
    if (mid != null && mid > 0) return mid
    if (lo != null && lo > 0) return lo
    if (hi != null && hi > 0) return hi
    return lo ?? null
  }

  const pickFirstString = (val: unknown): string | null => {
    if (typeof val === 'string') return val
    if (Array.isArray(val)) {
      const first = val.find((x): x is string => typeof x === 'string' && x.trim().length > 0)
      return first ?? null
    }
    return null
  }

  // Prefer embedded state parsing: stable and avoids "Loading more..." artifacts.
  const state = parseChaldalState(html)
  if (state) {
    const items = parseChaldalProductsFromState(state)
    if (items.length > 0) {
      const products: ScrapedCompetitorProduct[] = []
      let positionIndex = 0

      for (const item of items) {
        const slug = typeof item.Slug === 'string' ? item.Slug.trim() : null
        const name =
          (typeof item.NameWithoutSubText === 'string' && item.NameWithoutSubText.trim()) ? item.NameWithoutSubText.trim() :
          (typeof item.Name === 'string' && item.Name.trim()) ? item.Name.trim() :
          null

        const discounted = parseBigDtoPrice(item.DiscountedPrice)
        const regular = parseBigDtoPrice(item.Price)
        const price = discounted ?? regular

        const imageUrl =
          pickFirstString(item.PictureUrls) || pickFirstString(item.OfferPictureUrls)

        if (!slug || !name || price == null || !Number.isFinite(price)) continue

        products.push({
          siteName: 'chaldal',
          category,
          productName: name,
          price,
          reviewCount: 0,
          position: positionIndex++,
          productUrl: `https://chaldal.com/${slug}`,
          imageUrl,
        })
      }

      if (products.length > 0) return products
    }
  }

  const $ = cheerio.load(html)
  const products: ScrapedCompetitorProduct[] = []
  let positionIndex = 0

  $('div.productPane').each((_, el) => {
    const $el = $(el)
    const name = $el.find('.name').text().trim()
    const priceText = $el.find('.price').text().trim()
    const priceMatch = priceText.match(/৳\s*([\d,]+)/)
    const price = priceMatch ? parseFloat(priceMatch[1].replace(/,/g, '')) : null

    const img = $el.find('img').first()
    const imageUrl = img.attr('src') || null

    const link = $el.find('a').first()
    const href = link.attr('href')
    const fullUrl = href ? `https://chaldal.com${href}` : null

    if (price && name) {
      products.push({
        siteName: 'chaldal',
        category,
        productName: name,
        price,
        reviewCount: 0,
        position: positionIndex++,
        productUrl: fullUrl,
        imageUrl,
      })
    }
  })

  // Fallback if div.productPane fails
  if (products.length === 0) {
    $('a.btnShowDetails').each((_, el) => {
      const href = $(el).attr('href')
      if (!href) return

      let productContainer = $(el).parent()
      for (let i = 0; i < 10; i++) {
        const text = productContainer.text()
        if (text.includes('৳')) break
        productContainer = productContainer.parent()
      }

      const containerText = productContainer.text()
      const priceMatch = containerText.match(/৳\s*([\d,]+)/)
      const price = priceMatch ? parseFloat(priceMatch[1].replace(/,/g, '')) : null

      if (price) {
        products.push({
          siteName: 'chaldal',
          category,
          productName: href.split('/').pop()?.replace(/-/g, ' ') || 'Product',
          price,
          reviewCount: 0,
          position: positionIndex++,
          productUrl: `https://chaldal.com${href}`,
          imageUrl: null,
        })
      }
    })
  }

  return products
}

async function getChaldalCookingSubcategoryUrls(maxLinks: number = 20): Promise<string[]> {
  try {
    const response = await fetch(CHALDAL_COOKING_ROOT_URL, { headers: HEADERS })
    if (!response.ok) return []

    const html = await response.text()
    const $ = cheerio.load(html)
    const urls = new Set<string>()

    $('a[href]').each((_, el) => {
      const href = ($(el).attr('href') || '').trim()
      if (!href) return
      if (!href.startsWith('/')) return
      if (!href.toLowerCase().includes('/cooking')) return

      // Skip root category and keep likely subcategory/filter URLs
      if (href === '/cooking' || href === '/cooking/') return
      urls.add(`https://chaldal.com${href}`)
    })

    return Array.from(urls).slice(0, maxLinks)
  } catch {
    return []
  }
}

async function scrapeChaldalCategory(category: CategoryKey): Promise<ScrapedCompetitorProduct[]> {
  const baseUrl = CATEGORY_URLS.chaldal[category]
  const urlCandidates = new Set<string>()
  urlCandidates.add(baseUrl)

  // "Cooking" hub includes many subcategories. Expand crawl for oil category.
  if (category === 'oil') {
    urlCandidates.add(CHALDAL_COOKING_ROOT_URL)
    const subUrls = await getChaldalCookingSubcategoryUrls()
    for (const subUrl of subUrls) urlCandidates.add(subUrl)
  }

  const urls = Array.from(urlCandidates).filter(Boolean)
  if (!urls.length) return []

  const productsByKey = new Map<string, ScrapedCompetitorProduct>()
  let nextPosition = 0
  const maxPagesPerUrl = category === 'oil' ? 3 : 1

  for (const url of urls) {
    for (let page = 1; page <= maxPagesPerUrl; page++) {
      const pageUrl = new URL(url)
      if (page > 1) pageUrl.searchParams.set('page', String(page))

      try {
        const response = await fetch(pageUrl.toString(), { headers: HEADERS })
        if (!response.ok) break

        const html = await response.text()
        const extracted = extractChaldalProductsFromHtml(html, category)
        if (extracted.length === 0) break

        let newlyAdded = 0
        for (const product of extracted) {
          const key = (product.productUrl || `${product.productName}|${product.price}`).toLowerCase()
          if (productsByKey.has(key)) continue
          productsByKey.set(key, { ...product, position: nextPosition++ })
          newlyAdded++
        }

        // Stop pagination if this page had only duplicates.
        if (newlyAdded === 0) break
      } catch (error) {
        console.error(`Error scraping Chaldal ${category} ${pageUrl.toString()}:`, error)
        break
      }
    }
  }

  const products = Array.from(productsByKey.values())
  console.log(`Chaldal ${category}: found ${products.length} products across ${urls.length} page groups`)
  return products.slice(0, 300) // Keep higher ceiling for cooking coverage
}

async function scrapeAroggaCategory(category: CategoryKey): Promise<ScrapedCompetitorProduct[]> {
  const categorySlug = CATEGORY_URLS.arogga[category]
  if (!categorySlug) return []

  const products: ScrapedCompetitorProduct[] = []

  try {
    // Arogga search API
    const apiUrl = `https://api.arogga.com/general/v3/search/?_search=${categorySlug}&_type=web&_perPage=50`

    const response = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)',
        'Accept': 'application/json, text/plain, */*',
      }
    })

    if (!response.ok) {
      console.error(`Arogga ${category}: HTTP ${response.status}`)
      return []
    }

    const result = await response.json()
    if (!result || !result.data || !Array.isArray(result.data)) return []

    let positionIndex = 0
    result.data.forEach((item: any) => {
      const firstVariant = (item.pv && Array.isArray(item.pv) && item.pv.length > 0) ? item.pv[0] : (item.pv || {});

      const sellingPrice = item.pv_b2c_price || firstVariant.pv_b2c_price || item.p_price || firstVariant.p_price
      if (!sellingPrice) return

      const productUrl = `https://www.arogga.com/product/${item.p_id}/${item.p_slug || 'p'}`

      let imageUrl = item.p_f_image || firstVariant.p_f_image
      if (!imageUrl && item.attachedFiles_p_images?.length > 0) {
        imageUrl = item.attachedFiles_p_images[0].src || item.attachedFiles_p_images[0]
      }

      products.push({
        siteName: 'arogga',
        category,
        productName: item.p_name,
        price: parseFloat(sellingPrice.toString()),
        reviewCount: parseInt(item.p_total_reviews || '0'),
        position: positionIndex++,
        productUrl,
        imageUrl,
      })
    })

    console.log(`Arogga ${category}: found ${products.length} products`)
  } catch (error) {
    console.error(`Error scraping Arogga ${category}:`, error)
  }

  return products
}

async function scrapeMedEasyCategory(category: CategoryKey): Promise<ScrapedCompetitorProduct[]> {
  const url = CATEGORY_URLS.medeasy[category]
  if (!url) return []

  const products: ScrapedCompetitorProduct[] = []

  try {
    const response = await fetch(url, { headers: HEADERS })
    if (!response.ok) return []

    const html = await response.text()
    const $ = cheerio.load(html)

    let positionIndex = 0
    $('a[href*="/medicines/"]').each((_, el) => {
      const $el = $(el)
      const href = $el.attr('href')
      if (!href) return

      let name = $el.find('h4').text().trim() || $el.find('span').first().text().trim()
      if (!name) {
        name = $el.attr('title') || $el.text().trim().split('৳')[0].trim()
      }

      if (!name || name.length < 3) return

      const text = $el.text()
      const priceMatch = text.match(/৳\s*([\d,.০-৯]+)/)
      let price = 0
      if (priceMatch) {
        const cleaned = priceMatch[1].replace(/,/g, '')
        price = parseFloat(cleaned)
      }

      if (!price) return

      let imageUrl: string | null = null
      const img = $el.find('img').first()
      if (img.length) {
        const src = img.attr('src')
        if (src && src.includes('url=')) {
          imageUrl = decodeURIComponent(src.split('url=')[1].split('&')[0])
        } else {
          imageUrl = src || null
        }
      }

      const fullUrl = `https://medeasy.health${href}`
      if (!products.some(p => p.productUrl === fullUrl)) {
        products.push({
          siteName: 'medeasy',
          category,
          productName: name,
          price,
          reviewCount: 0,
          position: positionIndex++,
          productUrl: fullUrl,
          imageUrl,
        })
      }
    })

    console.log(`MedEasy ${category}: found ${products.length} products`)
  } catch (error) {
    console.error(`Error scraping MedEasy ${category}:`, error)
  }

  return products
}

async function scrapeShajgojCategory(category: CategoryKey): Promise<ScrapedCompetitorProduct[]> {
  // Shajgoj remains a stub for now
  return []
}

export async function scrapeSiteCategory(site: SiteName, category: CategoryKey): Promise<ScrapedCompetitorProduct[]> {
  switch (site) {
    case 'chaldal':
      return scrapeChaldalCategory(category)
    case 'arogga':
      return scrapeAroggaCategory(category)
    case 'medeasy':
      return scrapeMedEasyCategory(category)
    case 'shajgoj':
      return scrapeShajgojCategory(category)
    default:
      return []
  }
}

export async function scrapeAllSitesOnce(): Promise<ScrapedCompetitorProduct[]> {
  const allProducts: ScrapedCompetitorProduct[] = []
  const sites: SiteName[] = ['chaldal', 'arogga', 'medeasy']
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
