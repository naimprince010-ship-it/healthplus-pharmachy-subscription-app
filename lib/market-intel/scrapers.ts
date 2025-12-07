import * as cheerio from 'cheerio'

export type SiteName = 'chaldal' | 'arogga' | 'shajgoj'
export type CategoryKey = 'rice' | 'oil' | 'paracetamol' | 'cough-syrup' | 'face-wash'

export interface ScrapedCompetitorProduct {
  siteName: SiteName
  category: CategoryKey
  productName: string
  price: number
  reviewCount: number
  productUrl: string | null
  imageUrl: string | null
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
    'paracetamol': 'https://chaldal.com/search/napa', // Use "napa" as paracetamol brand
    'cough-syrup': 'https://chaldal.com/search/syrup', // Use "syrup" as search term
    'face-wash': 'https://chaldal.com/search/face%20wash',
  },
  arogga: {
    'rice': 'https://www.arogga.com/category/rice',
    'oil': 'https://www.arogga.com/category/oil',
    'paracetamol': 'https://www.arogga.com/products?_generics=paracetamol',
    'cough-syrup': 'https://www.arogga.com/products?_generics=dextromethorphan',
    'face-wash': 'https://www.arogga.com/category/beauty/6032/cleansers',
  },
  shajgoj: {
    'rice': '', // Shajgoj doesn't sell rice
    'oil': '', // Shajgoj doesn't sell cooking oil
    'paracetamol': '', // Shajgoj doesn't sell medicine
    'cough-syrup': '', // Shajgoj doesn't sell medicine
    'face-wash': 'https://shop.shajgoj.com/product-category/face',
  },
}

function parsePrice(priceText: string): number | null {
  if (!priceText) return null
  const cleaned = priceText.replace(/[^\d.]/g, '')
  const price = parseFloat(cleaned)
  return isNaN(price) ? null : price
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
            productUrl: fullUrl,
            imageUrl,
          })
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
  const categories: CategoryKey[] = ['rice', 'oil', 'paracetamol', 'cough-syrup', 'face-wash']

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

export function calculateTrendScore(reviewCount: number, price: number): number {
  return reviewCount - (price * 0.01)
}
