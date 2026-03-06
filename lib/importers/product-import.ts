import { slugify, cleanProductName } from '@/lib/slugify'

export interface ImportedProduct {
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
  source: 'arogga' | 'chaldal' | 'medeasy' | 'othoba'
}

const ALLOWED_HOSTS = [
  'arogga.com',
  'www.arogga.com',
  'chaldal.com',
  'www.chaldal.com',
  'medeasy.health',
  'www.medeasy.health',
  'othoba.com',
  'www.othoba.com',
]

function validateUrl(url: string): { valid: boolean; host: string | null; error?: string } {
  try {
    const parsed = new URL(url)

    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      return { valid: false, host: null, error: 'Only HTTP/HTTPS URLs are allowed' }
    }

    const host = parsed.hostname.toLowerCase()

    if (!ALLOWED_HOSTS.includes(host)) {
      return { valid: false, host, error: 'Only Arogga, Chaldal, MedEasy, and Othoba URLs are supported' }
    }

    if (host.includes('localhost') || host.match(/^(\d{1,3}\.){3}\d{1,3}$/)) {
      return { valid: false, host: null, error: 'Invalid URL' }
    }

    return { valid: true, host }
  } catch {
    return { valid: false, host: null, error: 'Invalid URL format' }
  }
}

function parsePrice(priceText: string | number | null | undefined): number | null {
  if (priceText === undefined || priceText === null) return null
  let str = priceText.toString().trim()
  if (!str) return null

  // Handle Bengali digits
  const bnToEn: { [key: string]: string } = {
    '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4',
    '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9'
  }

  for (const [bn, en] of Object.entries(bnToEn)) {
    str = str.replace(new RegExp(bn, 'g'), en)
  }

  // Remove commas and any other characters except digits and the first period
  const cleaned = str.replace(/,/g, '').replace(/[^\d.]/g, '')
  const price = parseFloat(cleaned)
  return isNaN(price) ? null : price
}

import * as cheerio from 'cheerio'

function cleanNextImageUrl(url: string | null): string | null {
  if (!url) return url
  if (!url.includes('/_next/image')) return url

  const urlMatch = url.match(/url=([^&]+)/)
  if (urlMatch) {
    return decodeURIComponent(urlMatch[1])
  }
  return url
}

async function importFromArogga(url: string): Promise<ImportedProduct> {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch page: ${response.status}`)
  }

  const html = await response.text()
  const $ = cheerio.load(html)

  const name = cleanProductName($('h1').first().text().trim() || '')

  let brandName: string | null = null
  // Arogga usually has brand link like /brand/100063/eskayef-pharmaceuticals-ltd
  $('a[href*="/brand/"]').each((_, el) => {
    const text = $(el).text().trim()
    if (text && !brandName) {
      brandName = text
    }
  })

  let sellingPrice: number | null = null
  let mrp: number | null = null

  // Try to find price in structured way first
  const priceContainer = $('.price-container, .product-price-section').first()
  if (priceContainer.length) {
    const prices = priceContainer.text().match(/৳\s*([\d,.]+)/g)
    if (prices && prices.length >= 1) {
      sellingPrice = parsePrice(prices[0])
      if (prices.length >= 2) {
        mrp = parsePrice(prices[1])
      }
    }
  }

  // Fallback price extraction
  if (!sellingPrice) {
    const priceText = $('body').text()
    const priceMatch = priceText.match(/৳\s*([\d,.]+)/g)
    if (priceMatch && priceMatch.length >= 1) {
      sellingPrice = parsePrice(priceMatch[0])
      if (priceMatch.length >= 2) {
        mrp = parsePrice(priceMatch[1])
      }
    }
  }

  let imageUrl: string | null = null
  $('img[src*="cdn2.arogga.com"]').each((_, el) => {
    const src = $(el).attr('src')
    if (src && !imageUrl && !src.includes('logo') && !src.includes('icon')) {
      imageUrl = src
    }
  })

  let genericName: string | null = null
  // Arogga has generic link like /generic/123/vitamin-b-complex-zinc
  $('a[href*="/generic/"]').each((_, el) => {
    const text = $(el).text().trim()
    if (text && !genericName) {
      genericName = text
    }
  })

  // Fallback for generic
  if (!genericName) {
    const genericMatch = $('body').text().match(/Generic:\s*([^\n]+)/i)
    if (genericMatch) {
      genericName = genericMatch[1].trim()
    }
  }

  let dosageForm: string | null = null
  let strength: string | null = null

  // Try to find form and strength from the sub-header (e.g. "Tablet", "Capsule")
  const subHeaderText = $('h1').first().next().text().trim()
  if (subHeaderText && subHeaderText.length < 50) {
    dosageForm = subHeaderText
  }

  const formMatch = $('body').text().match(/(\d+mg|\d+ml|\d+g|\d+mcg|\d+iu)\s*-\s*(Tablet|Syrup|Capsule|Injection|Cream|Ointment|Drops|Suppository|Suspension|Gel|Spray)/i)
  if (formMatch) {
    strength = formMatch[1]
    if (!dosageForm) dosageForm = formMatch[2]
  }

  let packSize: string | null = null
  // Look for patterns like "30 Tablets (1 Box)" or "10's Strip"
  const packMatch = $('body').text().match(/(\d+\s*(?:Tablets?|Capsules?|ml|g|pcs?|Strip|Bottle|Pads?|Sachets?)(?:\s*\([^)]+\))?)/i)
  if (packMatch) {
    packSize = packMatch[1].trim()
  }

  let description: string | null = null
  const introMatch = $('body').text().match(/Introduction\s+([\s\S]*?)(?:Uses of|Side effects|Indication|Therapeutic Class|$)/i)
  if (introMatch) {
    description = introMatch[1].trim().substring(0, 1000)
  }

  // If still no description, look for Indication
  if (!description || description.length < 10) {
    const indicationMatch = $('body').text().match(/Indication\s+([\s\S]*?)(?:Side effects|Pharmacology|$)/i)
    if (indicationMatch) {
      description = indicationMatch[1].trim().substring(0, 1000)
    }
  }

  return {
    name,
    brandName,
    description,
    sellingPrice,
    mrp,
    imageUrl,
    packSize,
    genericName,
    dosageForm,
    strength: strength || null,
    sourceUrl: url,
    source: 'arogga',
  }
}

async function importFromChaldal(url: string): Promise<ImportedProduct> {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch page: ${response.status}`)
  }

  const html = await response.text()
  const $ = cheerio.load(html)

  const pageTitle = $('title').text()
  const name = cleanProductName(pageTitle.replace(/ - Online Grocery.*$/i, '').replace(/ \| Buy.*$/i, '').trim() || '')

  let brandName: string | null = null
  const nameParts = name.split(' ')
  if (nameParts.length > 1) {
    brandName = nameParts[0]
  }

  let sellingPrice: number | null = null
  let mrp: number | null = null

  const priceText = $('body').text()
  const priceMatches = priceText.match(/৳\s*([\d,.]+)/g) || []
  const validPrices = priceMatches
    .map(p => parsePrice(p))
    .filter((p): p is number => p !== null && p > 0)

  if (validPrices.length >= 1) {
    sellingPrice = validPrices[0]
    if (validPrices.length >= 2 && validPrices[1] > validPrices[0]) {
      mrp = validPrices[1]
    }
  }

  let imageUrl: string | null = null
  const ogImage = $('meta[property="og:image"]').attr('content')
  if (ogImage) {
    imageUrl = ogImage
  } else {
    $('img[src*="chaldn.com"]').each((_, el) => {
      const src = $(el).attr('src')
      if (src && !imageUrl && src.includes('m=400') && !src.includes('components')) {
        imageUrl = src
      }
    })
  }

  let packSize: string | null = null
  const packMatch = name.match(/(\d+\s*(?:gm?|kg|ml|L|pcs?|pack|piece))/i) ||
    url.match(/(\d+)-(gm?|kg|ml|l|pcs?|pack)/i)
  if (packMatch) {
    packSize = packMatch[0].replace('-', ' ').trim()
  }

  let description: string | null = null
  $('[class*="description"]').each((_, el) => {
    const text = $(el).text().trim()
    if (text && !description) {
      description = text.substring(0, 500)
    }
  })

  return {
    name,
    brandName,
    description,
    sellingPrice,
    mrp,
    imageUrl,
    packSize,
    genericName: null,
    dosageForm: null,
    strength: null,
    sourceUrl: url,
    source: 'chaldal',
  }
}

async function importFromMedeasy(url: string): Promise<ImportedProduct> {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch page: ${response.status}`)
  }

  const html = await response.text()
  const $ = cheerio.load(html)

  // MedEasy uses JSON-LD structured data which is the most reliable source
  let name = ''
  let sellingPrice: number | null = null
  let mrp: number | null = null
  let imageUrl: string | null = null
  let description: string | null = null
  let brandName: string | null = null
  let packSize: string | null = null

  // Try to extract from JSON-LD structured data first
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const jsonText = $(el).html()
      if (jsonText) {
        const data = JSON.parse(jsonText)
        if (data['@type'] === 'Product') {
          name = cleanProductName(data.name || '')
          description = data.description || null
          imageUrl = data.image || null
          if (data.offers?.price) {
            sellingPrice = parsePrice(data.offers.price)
          }
        }
      }
    } catch {
      // Ignore JSON parse errors
    }
  })

  // Fallback: Extract from HTML if JSON-LD didn't provide all data
  if (!name) {
    const h1Text = $('h1').first().text().trim()
    name = cleanProductName(h1Text)
  }

  // Extract manufacturer/brand from the page
  const manufacturerText = $('h3').filter((_, el) => {
    const prevText = $(el).prev().text().toLowerCase()
    return prevText.includes('manufacturer') || prevText.includes('প্রস্তুতকারক')
  }).first().text().trim()

  if (manufacturerText) {
    brandName = manufacturerText
  } else {
    // Try to find brand from any h3 that looks like a brand name (short, capitalized)
    $('h3').each((_, el) => {
      const text = $(el).text().trim()
      if (text && text.length < 50 && !text.includes('Medicine') && !brandName) {
        const prevSibling = $(el).prev().text().toLowerCase()
        if (prevSibling.includes('manufacturer') || prevSibling.includes('brand') || prevSibling.includes('প্রস্তুতকারক') || prevSibling.includes('ব্র্যান্ড')) {
          brandName = text
        }
      }
    })
  }

  // Extract MRP (original price) from del tag
  if (!mrp) {
    const mrpText = $('del').first().text()
    const mrpMatch = mrpText.match(/৳?\s*([\d,.]+)/)
    if (mrpMatch) {
      mrp = parsePrice(mrpMatch[1])
    }
  }

  // Extract selling price from page if not from JSON-LD
  if (!sellingPrice) {
    const priceText = $('body').text()
    const priceMatch = priceText.match(/Best\s*Price\s*(?:Tk|৳)?\s*([\d,.]+)/i)
    if (priceMatch) {
      sellingPrice = parsePrice(priceMatch[1])
    }
  }

  // Extract pack size from the product name or URL
  const packMatch = url.match(/(\d+(?:ml|mg|gm?|kg|pcs?|pack|tablet|capsule)(?:-\d+(?:ml|mg|gm?|kg|pcs?|pack|tablet|capsule))?)/i) ||
    $('h1').first().text().match(/(\d+(?:ml|mg|gm?|kg|pcs?|pack|tablet|capsule)(?:\+\d+(?:ml|mg|gm?|kg|pcs?|pack|tablet|capsule))?)/i)
  if (packMatch) {
    packSize = packMatch[1].replace(/-/g, ' ').replace(/\+/g, '+').trim()
  }

  // Extract description from Medicine overview section
  if (!description) {
    const overviewSection = $('h2').filter((_, el) => {
      const text = $(el).text().toLowerCase()
      return text.includes('medicine overview') || text.includes('মেডিসিন ওভারভিউ') || text.includes('ওভারভিউ')
    }).parent()

    if (overviewSection.length) {
      const overviewText = overviewSection.text()
        .replace(/Medicine overview/i, '')
        .replace(/মেডিসিন ওভারভিউ/i, '')
        .replace(/ওভারভিউ/i, '')
        .trim()
      if (overviewText) {
        description = overviewText.substring(0, 500)
      }
    }
  }

  // Clean up image URL if it's a Next.js image URL
  const finalImageUrl = cleanNextImageUrl(imageUrl)

  return {
    name,
    brandName,
    description,
    sellingPrice,
    mrp,
    imageUrl: finalImageUrl,
    packSize,
    genericName: null,
    dosageForm: null,
    strength: null,
    sourceUrl: url,
    source: 'medeasy',
  }
}

async function importFromOthoba(url: string): Promise<ImportedProduct> {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch page: ${response.status}`)
  }

  const html = await response.text()
  const $ = cheerio.load(html)

  // Try to extract from JSON-LD structured data first
  let name = ''
  let sellingPrice: number | null = null
  let mrp: number | null = null
  let imageUrl: string | null = null
  let description: string | null = null
  let brandName: string | null = null
  let packSize: string | null = null

  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const jsonText = $(el).html()
      if (jsonText) {
        const data = JSON.parse(jsonText)
        // Othoba might have an array of objects or a single object
        const products = Array.isArray(data) ? data : [data]
        const productData = products.find((d: any) => d['@type'] === 'Product')

        if (productData) {
          name = productData.name || name
          description = productData.description || description
          imageUrl = productData.image || imageUrl
          brandName = productData.brand?.name || productData.brand || brandName

          if (productData.offers) {
            const offers = Array.isArray(productData.offers) ? productData.offers[0] : productData.offers
            if (offers.price) {
              sellingPrice = parsePrice(offers.price)
            } else if (offers.lowPrice) {
              sellingPrice = parsePrice(offers.lowPrice)
            }

            if (offers.highPrice) {
              const highPrice = parsePrice(offers.highPrice)
              if (highPrice && (!sellingPrice || highPrice > sellingPrice)) {
                mrp = highPrice
              }
            }
          }
        }
      }
    } catch {
      // Ignore JSON parse errors
    }
  })

  // Fallback: Extract from HTML if JSON-LD didn't provide all data
  if (!name) {
    name = cleanProductName($('h1').first().text().trim() || $('meta[property="og:title"]').attr('content')?.trim() || '')
  } else {
    name = cleanProductName(name)
  }

  if (!brandName) {
    $('.manufacturers a').each((_, el) => {
      const text = $(el).text().trim()
      if (text && !brandName) {
        brandName = text
      }
    })
  }

  // Fallback selectors for price
  if (!sellingPrice) {
    const sellingPriceText = $('.product-price .price-value, .gallery-info .price-value, .price.actual-price, .product-price .price').first().text().trim()
    if (sellingPriceText) {
      sellingPrice = parsePrice(sellingPriceText.replace('Tk', '').replace('৳', ''))
    }
  }

  if (!mrp) {
    const mrpPriceText = $('.old-product-price .price-value, .price.old-price, .old-product-price .price').first().text().trim()
    if (mrpPriceText) {
      mrp = parsePrice(mrpPriceText.replace('Tk', '').replace('৳', ''))
    }
  }

  if (!imageUrl) {
    const ogImage = $('meta[property="og:image"]').attr('content')
    if (ogImage) {
      imageUrl = ogImage
    } else {
      const mainImg = $('.picture img, .product-main-image img, #main-product-img').first()
      imageUrl = mainImg.attr('src') || mainImg.attr('data-src') || null
    }
  }

  if (!description) {
    const shortDesc = $('.short-description').text().trim()
    const fullDesc = $('.full-description, #product-tab-description').text().trim()
    description = shortDesc || (fullDesc ? fullDesc.substring(0, 500) : null)
  }

  if (!packSize) {
    const packMatch = name.match(/(\d+(?:ml|mg|gm?|kg|pcs?|pack|tablet|capsule))/i)
    if (packMatch) {
      packSize = packMatch[1].trim()
    }
  }

  return {
    name,
    brandName,
    description,
    sellingPrice,
    mrp,
    imageUrl,
    packSize,
    genericName: null,
    dosageForm: null,
    strength: null,
    sourceUrl: url,
    source: 'othoba',
  }
}

export async function importProductFromUrl(url: string): Promise<ImportedProduct> {
  const validation = validateUrl(url)

  if (!validation.valid) {
    throw new Error(validation.error || 'Invalid URL')
  }

  const host = validation.host!

  if (host.includes('arogga')) {
    return importFromArogga(url)
  } else if (host.includes('chaldal')) {
    return importFromChaldal(url)
  } else if (host.includes('medeasy')) {
    return importFromMedeasy(url)
  } else if (host.includes('othoba')) {
    return importFromOthoba(url)
  }

  throw new Error('Unsupported website')
}

export interface CategoryProduct {
  name: string
  url: string
  price: number | null
  imageUrl: string | null
}

async function extractProductsFromMedeasyCategory(url: string, maxPages: number = 10): Promise<CategoryProduct[]> {
  const products: CategoryProduct[] = []
  const inputUrl = new URL(url)

  // Detect starting page from URL or default to 1
  const startPage = parseInt(inputUrl.searchParams.get('page') || '1')
  const baseUrl = new URL(url)
  baseUrl.searchParams.delete('page') // Remove to avoid conflicts in loop

  for (let page = startPage; page < startPage + maxPages; page++) {
    const currentUrl = new URL(baseUrl.toString())
    currentUrl.searchParams.set('page', page.toString())

    const response = await fetch(currentUrl.toString(), {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      },
    })

    if (!response.ok) break

    const html = await response.text()
    const $ = cheerio.load(html)

    let itemsFoundOnThisPage = 0

    $('a').each((_, el) => {
      const href = $(el).attr('href')
      if (!href || !href.includes('/medicines/')) return

      // Ensure it's a product link, not just a category or search link
      // Product links usually look like /medicines/[slug] or /bn/medicines/[slug]
      const parts = href.split('/')
      const medicinesIndex = parts.indexOf('medicines')
      if (medicinesIndex === -1 || medicinesIndex === parts.length - 1) return

      const article = $(el).find('article')
      if (!article.length) return

      let name = article.find('h4').text().trim()
      name = cleanProductName(name)

      const priceText = article.find('div').filter((_, div) => $(div).text().includes('৳')).first().text()
      // Use regex to find anything that looks like a price with currency symbol, 
      // supporting both English and Bengali digits
      const priceMatches = priceText.match(/[৳$]\s*([\d,.০-৯]+)/g) || priceText.match(/([\d,.০-৯]+)\s*[৳$]/g)
      let price: number | null = null

      if (priceMatches && priceMatches.length > 0) {
        const prices = priceMatches.map(p => parsePrice(p)).filter((p): p is number => p !== null)
        if (prices.length > 0) {
          price = Math.max(...prices)
        }
      }

      let imageUrl: string | null = null
      const img = article.find('img[alt="Product Image"]').first()
      if (img.length) {
        const srcSet = img.attr('srcset') || img.attr('srcSet')
        const src = img.attr('src')
        if (srcSet && srcSet.includes('medeasy')) {
          const match = srcSet.match(/url=([^&]+)/)
          if (match) {
            imageUrl = decodeURIComponent(match[1])
          }
        } else if (src && src.includes('medeasy')) {
          imageUrl = cleanNextImageUrl(src)
        }
      }

      const fullUrl = `https://medeasy.health${href}`

      if (name && !products.some(p => p.url === fullUrl)) {
        products.push({ name, url: fullUrl, price, imageUrl })
        itemsFoundOnThisPage++
      }
    })

    if (itemsFoundOnThisPage === 0) break

    const hasNextPage = $(`a[aria-label="Page ${page + 1}"]`).length > 0
    if (!hasNextPage) break
  }

  return products
}

async function extractProductsFromAroggaCategory(url: string): Promise<CategoryProduct[]> {
  const products: CategoryProduct[] = []

  // Extract category ID from URL: https://www.arogga.com/category/medicine/6568/anesthetics-neuromuscular-blocking
  const categoryIdMatch = url.match(/\/category\/[^\/]+\/(\d+)/)
  if (!categoryIdMatch) {
    throw new Error('Could not identify Arogga category ID from URL')
  }
  const categoryId = categoryIdMatch[1]

  let page = 1
  const perPage = 20
  let totalItems = 0

  try {
    do {
      const apiUrl = `https://api.arogga.com/general/v3/search/?_page=${page}&_perPage=${perPage}&_product_category_id=${categoryId}&_type=web`

      const response = await fetch(apiUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/json, text/plain, */*',
          'Referer': url,
        },
      })

      if (!response.ok) {
        console.error(`Arogga API error: ${response.status}`)
        break
      }

      const result = await response.json()
      if (!result || !result.data || !Array.isArray(result.data)) break

      totalItems = parseInt(result.total) || 0
      const items = result.data

      items.forEach((item: any) => {
        // Map API fields: item.p_name, item.p_strength, and price/image from multiple possible locations
        const name = cleanProductName(`${item.p_name} ${item.p_strength || ''}`.trim())
        const slugFallback = slugify(name)
        const productUrl = `https://www.arogga.com/product/${item.p_id}/${item.p_slug || slugFallback}`

        // Prices and images are often inside the first variant (pv[0])
        const firstVariant = (item.pv && Array.isArray(item.pv) && item.pv.length > 0) ? item.pv[0] : (item.pv || {});

        // Price can be in pv_b2c_price or inside firstVariant
        const sellingPrice = item.pv_b2c_price || firstVariant.pv_b2c_price || item.p_price || firstVariant.p_price

        // Image can be p_f_image or in attachedFiles_p_images or firstVariant
        let imageUrl = item.p_f_image || firstVariant.p_f_image
        if (!imageUrl && item.attachedFiles_p_images && item.attachedFiles_p_images.length > 0) {
          imageUrl = item.attachedFiles_p_images[0].src || item.attachedFiles_p_images[0]
        }
        if (!imageUrl && firstVariant.attachedFiles_pv_images && firstVariant.attachedFiles_pv_images.length > 0) {
          imageUrl = firstVariant.attachedFiles_pv_images[0].src || firstVariant.attachedFiles_pv_images[0]
        }

        const product = {
          name,
          url: productUrl,
          price: sellingPrice ? parseFloat(sellingPrice.toString()) : null,
          imageUrl: imageUrl || null,
        }

        if (!products.some(p => p.url === productUrl)) {
          products.push(product)
        }
      })

      // Safety break
      if (products.length >= totalItems || products.length >= 500 || items.length === 0) {
        break
      }

      page++
    } while (products.length < totalItems)
  } catch (error) {
    console.error('Arogga pagination error:', error)
  }

  return products
}

async function extractProductsFromChaldalCategory(url: string): Promise<CategoryProduct[]> {
  const products: CategoryProduct[] = []

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch page: ${response.status}`)
  }

  const html = await response.text()
  const $ = cheerio.load(html)

  $('a.btnShowDetails').each((_, el) => {
    const href = $(el).attr('href')
    if (!href || href.length < 5) return

    let productContainer = $(el).parent()
    for (let i = 0; i < 10 && productContainer.length; i++) {
      const text = productContainer.text()
      if (text.includes('৳') && text.length > 50) break
      productContainer = productContainer.parent()
    }

    const nameFromHref = href
      .replace(/^\//, '')
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')

    if (nameFromHref.length < 3) return

    const containerText = productContainer.text()
    const priceMatches = containerText.match(/৳\s*([\d,.]+)/g)
    let price: number | null = null

    if (priceMatches && priceMatches.length > 0) {
      const prices = priceMatches.map(p => parsePrice(p)).filter((p): p is number => p !== null)
      if (prices.length > 0) {
        price = Math.max(...prices)
      }
    }

    const img = productContainer.find('img[src*="chaldn.com"]').first()
    const imageUrl = img.attr('src') || null

    const fullUrl = `https://chaldal.com${href}`

    if (!products.some(p => p.url === fullUrl)) {
      products.push({ name: nameFromHref, url: fullUrl, price, imageUrl })
    }
  })

  return products
}

async function extractProductsFromOthobaCategory(url: string): Promise<CategoryProduct[]> {
  const products: CategoryProduct[] = []

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch page: ${response.status}`)
  }

  const html = await response.text()
  const $ = cheerio.load(html)

  $('.product-wrapper .product, .product-wrap .product').each((_, el) => {
    const nameLink = $(el).find('.product-name a')
    const name = nameLink.text().trim()
    const relativeUrl = nameLink.attr('href')
    if (!name || !relativeUrl) return

    const fullUrl = `https://www.othoba.com${relativeUrl.startsWith('/') ? '' : '/'}${relativeUrl}`

    let price: number | null = null
    const priceText = $(el).find('.actual-price, .new-price, .product-price, .old-price, .price').text().trim()
    const priceMatches = priceText.match(/৳\s*([\d,.]+)|Tk\s*([\d,.]+)/g)

    if (priceMatches && priceMatches.length > 0) {
      const prices = priceMatches.map(p => parsePrice(p)).filter((p): p is number => p !== null)
      if (prices.length > 0) {
        price = Math.max(...prices)
      }
    }

    // Image extraction
    const imgEl = $(el).find('img').first()
    const imageUrl = imgEl.attr('data-src') || imgEl.attr('src') || null

    if (!products.some(p => p.url === fullUrl)) {
      products.push({ name, url: fullUrl, price, imageUrl })
    }
  })

  return products
}

export async function extractProductsFromCategory(url: string): Promise<CategoryProduct[]> {
  const validation = validateUrl(url)

  if (!validation.valid) {
    throw new Error(validation.error || 'Invalid URL')
  }

  const host = validation.host!

  if (host.includes('medeasy')) {
    return extractProductsFromMedeasyCategory(url)
  } else if (host.includes('arogga')) {
    return extractProductsFromAroggaCategory(url)
  } else if (host.includes('chaldal')) {
    return extractProductsFromChaldalCategory(url)
  } else if (host.includes('othoba')) {
    return extractProductsFromOthobaCategory(url)
  }

  throw new Error('Unsupported website for category extraction')
}
