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
    'paracetamol': 'https://chaldal.com/search/paracetamol',
    'cough-syrup': 'https://chaldal.com/search/cough%20syrup',
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
    if (!response.ok) return []

    const html = await response.text()
    const $ = cheerio.load(html)

    $('a[href^="/"]').each((_, el) => {
      const href = $(el).attr('href')
      if (!href || href.length < 5) return

      const text = $(el).text().trim()
      if (text !== 'Details  >' && text !== 'Details >') return

      const productDiv = $(el).closest('div').parent()
      const name = productDiv.contents().filter(function() {
        return this.type === 'text'
      }).first().text().trim()

      if (!name || name.length < 3) return

      const priceText = productDiv.find('div').filter((_, div) => $(div).text().includes('৳')).first().text()
      const priceMatch = priceText.match(/৳\s*([\d,.]+)/)
      const price = priceMatch ? parseFloat(priceMatch[1].replace(/,/g, '')) : null

      if (!price) return

      const img = productDiv.find('img[src*="chaldn.com"]').first()
      const imageUrl = img.attr('src') || null

      const fullUrl = `https://chaldal.com${href}`

      if (!products.some(p => p.productUrl === fullUrl)) {
        products.push({
          siteName: 'chaldal',
          category,
          productName: name,
          price,
          reviewCount: 0, // Chaldal doesn't show review counts on listing pages
          productUrl: fullUrl,
          imageUrl,
        })
      }
    })
  } catch (error) {
    console.error(`Error scraping Chaldal ${category}:`, error)
  }

  return products.slice(0, 50) // Limit to top 50 products
}

async function scrapeAroggaCategory(category: CategoryKey): Promise<ScrapedCompetitorProduct[]> {
  const url = CATEGORY_URLS.arogga[category]
  if (!url) return []

  const products: ScrapedCompetitorProduct[] = []

  try {
    const response = await fetch(url, { headers: HEADERS })
    if (!response.ok) return []

    const html = await response.text()
    const $ = cheerio.load(html)

    $('a[href^="/product/"]').each((_, el) => {
      const href = $(el).attr('href')
      if (!href) return

      const h3 = $(el).find('h3').first()
      const name = h3.length ? h3.text().trim() : $(el).text().trim()
      if (!name || name.length < 3) return

      const parent = $(el).parent()
      const priceText = parent.text()
      const priceMatch = priceText.match(/৳([\d,.]+)/)
      const price = priceMatch ? parseFloat(priceMatch[1].replace(/,/g, '')) : null

      if (!price) return

      // Extract review count - Arogga shows it as "(15)" or similar
      const reviewMatch = parent.text().match(/\((\d+)\)/)
      const reviewCount = reviewMatch ? parseInt(reviewMatch[1], 10) : 0

      const img = parent.find('img[src*="cdn2.arogga.com"]').first()
      const imageUrl = img.attr('src') || null

      const fullUrl = `https://www.arogga.com${href}`

      if (!products.some(p => p.productUrl === fullUrl)) {
        products.push({
          siteName: 'arogga',
          category,
          productName: name,
          price,
          reviewCount,
          productUrl: fullUrl,
          imageUrl,
        })
      }
    })
  } catch (error) {
    console.error(`Error scraping Arogga ${category}:`, error)
  }

  return products.slice(0, 50) // Limit to top 50 products
}

async function scrapeShajgojCategory(category: CategoryKey): Promise<ScrapedCompetitorProduct[]> {
  const url = CATEGORY_URLS.shajgoj[category]
  if (!url) return []

  const products: ScrapedCompetitorProduct[] = []

  try {
    const response = await fetch(url, { headers: HEADERS })
    if (!response.ok) return []

    const html = await response.text()
    const $ = cheerio.load(html)

    // Shajgoj uses Next.js with product cards in <li> elements
    $('main ul li a[href^="/product/"]').each((_, el) => {
      const href = $(el).attr('href')
      if (!href) return

      const productDiv = $(el).find('div').first()
      const name = productDiv.contents().filter(function() {
        return this.type === 'text'
      }).first().text().trim()

      if (!name || name.length < 3) return

      // Extract price - Shajgoj shows sale price in second span
      const priceSpans = $(el).find('span')
      let price: number | null = null
      priceSpans.each((_, span) => {
        const text = $(span).text()
        if (text.includes('৳') && !price) {
          const match = text.match(/৳\s*([\d,.]+)/)
          if (match) {
            price = parseFloat(match[1].replace(/,/g, ''))
          }
        }
      })

      if (!price) return

      // Extract star rating and convert to review count estimate
      // Shajgoj shows "4.4 Stars" - we'll use the rating * 10 as a proxy for popularity
      const ratingDiv = $(el).find('div[title*="Stars"]')
      const ratingTitle = ratingDiv.attr('title') || ''
      const ratingMatch = ratingTitle.match(/([\d.]+)\s*Stars?/)
      const rating = ratingMatch ? parseFloat(ratingMatch[1]) : 0
      const reviewCount = Math.round(rating * 10) // Convert rating to a popularity score

      const img = $(el).find('img').first()
      let imageUrl = img.attr('src') || null
      // Clean Next.js image URL if needed
      if (imageUrl && imageUrl.includes('/_next/image')) {
        const urlMatch = imageUrl.match(/url=([^&]+)/)
        if (urlMatch) {
          imageUrl = decodeURIComponent(urlMatch[1])
        }
      }

      const fullUrl = `https://shop.shajgoj.com${href}`

      if (!products.some(p => p.productUrl === fullUrl)) {
        products.push({
          siteName: 'shajgoj',
          category,
          productName: name,
          price,
          reviewCount,
          productUrl: fullUrl,
          imageUrl,
        })
      }
    })
  } catch (error) {
    console.error(`Error scraping Shajgoj ${category}:`, error)
  }

  return products.slice(0, 50) // Limit to top 50 products
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
