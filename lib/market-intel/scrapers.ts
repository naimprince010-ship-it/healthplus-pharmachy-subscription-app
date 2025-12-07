import * as cheerio from 'cheerio'

export type SiteName = 'chaldal' | 'arogga' | 'shajgoj'
export type CategoryKey = 
  // Food & Grocery
  | 'rice' 
  | 'oil' 
  | 'spices'
  | 'dal'
  | 'flour'
  | 'sugar-salt'
  | 'noodles-pasta'
  | 'sauce-condiments'
  | 'ready-mix'
  // Beverages
  | 'milk'
  | 'tea-coffee'
  | 'juice'
  | 'soft-drinks'
  | 'water'
  // Snacks & Biscuits
  | 'biscuits'
  | 'snacks'
  | 'chips'
  | 'chocolates'
  | 'candy'
  // Baby Care
  | 'baby-food'
  | 'diapers'
  | 'baby-bath'
  | 'baby-accessories'
  // Personal Care
  | 'soap'
  | 'shampoo'
  | 'toothpaste'
  | 'face-wash'
  | 'body-lotion'
  | 'hair-oil'
  | 'deodorant'
  // Health & Wellness
  | 'paracetamol'
  | 'cough-syrup'
  | 'vitamins'
  | 'first-aid'
  // Cleaning & Household
  | 'detergent'
  | 'dishwash'
  | 'floor-cleaner'
  | 'toilet-cleaner'
  | 'air-freshener'
  // Fresh Items
  | 'fruits'
  | 'vegetables'
  | 'meat'
  | 'fish'
  | 'eggs'
  // Kitchen & Home
  | 'kitchen-tools'
  | 'storage'
  // Pet Care
  | 'pet-food'

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
    // Food & Grocery
    'rice': 'https://chaldal.com/search/rice',
    'oil': 'https://chaldal.com/search/cooking%20oil',
    'spices': 'https://chaldal.com/search/spices',
    'dal': 'https://chaldal.com/search/dal',
    'flour': 'https://chaldal.com/search/flour%20atta',
    'sugar-salt': 'https://chaldal.com/search/sugar',
    'noodles-pasta': 'https://chaldal.com/search/noodles',
    'sauce-condiments': 'https://chaldal.com/search/sauce',
    'ready-mix': 'https://chaldal.com/search/ready%20mix',
    // Beverages
    'milk': 'https://chaldal.com/search/milk',
    'tea-coffee': 'https://chaldal.com/search/tea',
    'juice': 'https://chaldal.com/search/juice',
    'soft-drinks': 'https://chaldal.com/search/soft%20drinks',
    'water': 'https://chaldal.com/search/mineral%20water',
    // Snacks & Biscuits
    'biscuits': 'https://chaldal.com/search/biscuits',
    'snacks': 'https://chaldal.com/search/snacks',
    'chips': 'https://chaldal.com/search/chips',
    'chocolates': 'https://chaldal.com/search/chocolate',
    'candy': 'https://chaldal.com/search/candy',
    // Baby Care
    'baby-food': 'https://chaldal.com/search/baby%20food',
    'diapers': 'https://chaldal.com/search/diapers',
    'baby-bath': 'https://chaldal.com/search/baby%20bath',
    'baby-accessories': 'https://chaldal.com/search/baby%20accessories',
    // Personal Care
    'soap': 'https://chaldal.com/search/soap',
    'shampoo': 'https://chaldal.com/search/shampoo',
    'toothpaste': 'https://chaldal.com/search/toothpaste',
    'face-wash': 'https://chaldal.com/search/face%20wash',
    'body-lotion': 'https://chaldal.com/search/body%20lotion',
    'hair-oil': 'https://chaldal.com/search/hair%20oil',
    'deodorant': 'https://chaldal.com/search/deodorant',
    // Health & Wellness
    'paracetamol': 'https://chaldal.com/search/napa',
    'cough-syrup': 'https://chaldal.com/search/syrup',
    'vitamins': 'https://chaldal.com/search/vitamins',
    'first-aid': 'https://chaldal.com/search/first%20aid',
    // Cleaning & Household
    'detergent': 'https://chaldal.com/search/detergent',
    'dishwash': 'https://chaldal.com/search/dishwash',
    'floor-cleaner': 'https://chaldal.com/search/floor%20cleaner',
    'toilet-cleaner': 'https://chaldal.com/search/toilet%20cleaner',
    'air-freshener': 'https://chaldal.com/search/air%20freshener',
    // Fresh Items
    'fruits': 'https://chaldal.com/search/fruits',
    'vegetables': 'https://chaldal.com/search/vegetables',
    'meat': 'https://chaldal.com/search/meat',
    'fish': 'https://chaldal.com/search/fish',
    'eggs': 'https://chaldal.com/search/eggs',
    // Kitchen & Home
    'kitchen-tools': 'https://chaldal.com/search/kitchen',
    'storage': 'https://chaldal.com/search/storage%20container',
    // Pet Care
    'pet-food': 'https://chaldal.com/search/pet%20food',
  },
  arogga: {
    'rice': '', 'oil': '', 'spices': '', 'dal': '', 'flour': '', 'sugar-salt': '',
    'noodles-pasta': '', 'sauce-condiments': '', 'ready-mix': '', 'milk': '',
    'tea-coffee': '', 'juice': '', 'soft-drinks': '', 'water': '', 'biscuits': '',
    'snacks': '', 'chips': '', 'chocolates': '', 'candy': '', 'baby-food': '',
    'diapers': '', 'baby-bath': '', 'baby-accessories': '', 'soap': '', 'shampoo': '',
    'toothpaste': '', 'face-wash': '', 'body-lotion': '', 'hair-oil': '', 'deodorant': '',
    'paracetamol': '', 'cough-syrup': '', 'vitamins': '', 'first-aid': '', 'detergent': '',
    'dishwash': '', 'floor-cleaner': '', 'toilet-cleaner': '', 'air-freshener': '',
    'fruits': '', 'vegetables': '', 'meat': '', 'fish': '', 'eggs': '',
    'kitchen-tools': '', 'storage': '', 'pet-food': '',
  },
  shajgoj: {
    'rice': '', 'oil': '', 'spices': '', 'dal': '', 'flour': '', 'sugar-salt': '',
    'noodles-pasta': '', 'sauce-condiments': '', 'ready-mix': '', 'milk': '',
    'tea-coffee': '', 'juice': '', 'soft-drinks': '', 'water': '', 'biscuits': '',
    'snacks': '', 'chips': '', 'chocolates': '', 'candy': '', 'baby-food': '',
    'diapers': '', 'baby-bath': '', 'baby-accessories': '', 'soap': '', 'shampoo': '',
    'toothpaste': '', 'face-wash': '', 'body-lotion': '', 'hair-oil': '', 'deodorant': '',
    'paracetamol': '', 'cough-syrup': '', 'vitamins': '', 'first-aid': '', 'detergent': '',
    'dishwash': '', 'floor-cleaner': '', 'toilet-cleaner': '', 'air-freshener': '',
    'fruits': '', 'vegetables': '', 'meat': '', 'fish': '', 'eggs': '',
    'kitchen-tools': '', 'storage': '', 'pet-food': '',
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
  const categories: CategoryKey[] = [
    // Food & Grocery
    'rice', 'oil', 'spices', 'dal', 'flour', 'sugar-salt', 'noodles-pasta', 'sauce-condiments', 'ready-mix',
    // Beverages
    'milk', 'tea-coffee', 'juice', 'soft-drinks', 'water',
    // Snacks & Biscuits
    'biscuits', 'snacks', 'chips', 'chocolates', 'candy',
    // Baby Care
    'baby-food', 'diapers', 'baby-bath', 'baby-accessories',
    // Personal Care
    'soap', 'shampoo', 'toothpaste', 'face-wash', 'body-lotion', 'hair-oil', 'deodorant',
    // Health & Wellness
    'paracetamol', 'cough-syrup', 'vitamins', 'first-aid',
    // Cleaning & Household
    'detergent', 'dishwash', 'floor-cleaner', 'toilet-cleaner', 'air-freshener',
    // Fresh Items
    'fruits', 'vegetables', 'meat', 'fish', 'eggs',
    // Kitchen & Home
    'kitchen-tools', 'storage',
    // Pet Care
    'pet-food'
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

export function calculateTrendScore(reviewCount: number, price: number): number {
  return reviewCount - (price * 0.01)
}
