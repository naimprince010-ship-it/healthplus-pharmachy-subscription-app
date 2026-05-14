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
  'bdshop.com',
  'www.bdshop.com'
]

function validateUrl(url: string): { valid: boolean; host: string | null; error?: string } {
  try {
    const parsed = new URL(url)

    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      return { valid: false, host: null, error: 'Only HTTP/HTTPS URLs are allowed' }
    }

    const host = parsed.hostname.toLowerCase()

    if (!ALLOWED_HOSTS.includes(host)) {
      return { valid: false, host, error: 'Only Arogga, Chaldal, MedEasy, Othoba, and BDShop URLs are supported' }
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
  const match = url.match(/\/product\/(\d+)\/(.+)/);
  if (!match) {
    throw new Error('Could not identify Arogga product ID/slug from URL');
  }
  const id = match[1];
  const slug = match[2].split('?')[0];

  const apiUrl = `https://api.arogga.com/general/v3/search/?_search=${slug}&_type=web`;
  const response = await fetch(apiUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)',
      'Accept': 'application/json, text/plain, */*',
    },
  });

  if (!response.ok) {
    throw new Error(`Arogga API error: ${response.status}`);
  }

  const result = await response.json();
  if (!result || !result.data || !Array.isArray(result.data)) {
    throw new Error('Arogga API returned empty or invalid response');
  }

  const item = result.data.find((p: any) => p.p_id == id);
  if (!item) {
    throw new Error('Product not found in Arogga search API');
  }

  const firstVariant = (item.pv && Array.isArray(item.pv) && item.pv.length > 0) ? item.pv[0] : (item.pv || {});

  let strength = item.p_strength ? ` ${item.p_strength}` : '';
  let variantLabel = firstVariant.pu_base_unit_label && (!item.p_strength || !item.p_strength.includes(firstVariant.pu_base_unit_label))
    ? ` (${firstVariant.pu_base_unit_label})` : '';
  const name = `${cleanProductName(item.p_name).trim()}${strength}${variantLabel}`.trim();

  const sellingPrice = item.pv_b2c_price || firstVariant.pv_b2c_price || item.p_price || firstVariant.p_price || null;
  const mrp = item.pv_b2c_mrp || firstVariant.pv_b2c_mrp || item.p_mrp || firstVariant.p_mrp || sellingPrice;

  let imageUrl = item.p_f_image || firstVariant.p_f_image;
  if (!imageUrl && item.attachedFiles_p_images?.length > 0) {
    imageUrl = item.attachedFiles_p_images[0].src || item.attachedFiles_p_images[0];
  }
  if (!imageUrl && firstVariant.attachedFiles_pv_images?.length > 0) {
    imageUrl = firstVariant.attachedFiles_pv_images[0].src || firstVariant.attachedFiles_pv_images[0];
  }

  return {
    name,
    brandName: item.brand_name || item.p_brand || item.p_manufacturer || null,
    description: item.p_description ? item.p_description.replace(/<[^>]+>/g, '').substring(0, 1000) : null,
    sellingPrice: sellingPrice ? parseFloat(sellingPrice.toString()) : null,
    mrp: mrp ? parseFloat(mrp.toString()) : null,
    imageUrl: imageUrl || null,
    packSize: firstVariant.pu_base_unit_label || null,
    genericName: item.generic_name || item.p_generic_name || item.p_generic || null,
    dosageForm: item.p_form || null,
    strength: item.p_strength || null,
    sourceUrl: url,
    source: 'arogga',
  };
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

  // Prefer structured data first when available.
  $('script[type="application/ld+json"]').each((_, el) => {
    if (sellingPrice !== null) return
    const raw = $(el).contents().text().trim()
    if (!raw) return
    try {
      const parsed = JSON.parse(raw)
      const entries = Array.isArray(parsed) ? parsed : [parsed]
      for (const entry of entries) {
        if (!entry || typeof entry !== 'object') continue
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rec = entry as any
        const offers = Array.isArray(rec.offers) ? rec.offers : rec.offers ? [rec.offers] : []
        if (!offers.length) continue
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const offer = offers.find((o: any) => o && typeof o === 'object') || offers[0]
        if (!offer) continue

        const offerPrice = parsePrice(offer.price)
        const highPrice = parsePrice(offer.highPrice)
        const lowPrice = parsePrice(offer.lowPrice)
        const price = offerPrice ?? lowPrice ?? highPrice
        if (price !== null) {
          sellingPrice = price
          const strikePrice = parsePrice(offer.priceBeforeDiscount || offer.mrp || offer.listPrice)
          if (strikePrice !== null && strikePrice > price) {
            mrp = strikePrice
          } else if (highPrice !== null && highPrice > price) {
            mrp = highPrice
          }
          break
        }
      }
    } catch {
      // ignore malformed JSON-LD block
    }
  })

  const parseBigDtoPrice = (val: unknown): number | null => {
    if (typeof val === 'number') return val
    if (val && typeof val === 'object' && 'Lo' in (val as Record<string, unknown>)) {
      const lo = (val as Record<string, unknown>).Lo
      if (typeof lo === 'number') return lo
    }
    return null
  }

  const stateMatch = html.match(/window\.__reactAsyncStatePacket\s*=\s*(\{[\s\S]*?\})\s*<\/script>/)
  if (stateMatch && sellingPrice === null) {
    try {
      const state = JSON.parse(stateMatch[1])
      const blocks = Object.values(state).filter(b => b && typeof b === 'object') as any[]
      for (const block of blocks) {
        const items = block.products?.items || []
        for (const item of items) {
          const discounted = parseBigDtoPrice(item.DiscountedPrice)
          const regular = parseBigDtoPrice(item.Price)
          const price = discounted ?? regular ?? null
          if (price !== null && price > 0) {
            sellingPrice = price
            if (regular !== null && regular > price) {
              mrp = regular
            }
            break
          }
        }
        if (sellingPrice !== null) break
      }
    } catch {
      // ignore state parse errors
    }
  }

  const priceText = $('body').text()
  if (sellingPrice === null) {
    // Look for a price that comes right after "৳" but try to avoid taking the first one 
    // which might be the "Free delivery over ৳ 400" banner.
    // Instead of taking validPrices[0], let's try to find it near the add to cart button or take the most common price.
    // Since state extraction should cover 99% of cases, we just keep this as a very last resort,
    // but filter out common banner amounts like 400, 49, 59, 29, 19
    const priceMatches = priceText.match(/৳\s*([\d,.]+)/g) || []
    const validPrices = priceMatches
      .map(p => parsePrice(p))
      .filter((p): p is number => p !== null && p > 0 && ![400, 49, 59, 29, 19].includes(p))

    if (validPrices.length >= 1) {
      sellingPrice = validPrices[validPrices.length > 1 ? 1 : 0] // try second price if multiple exist
      if (validPrices.length >= 2 && validPrices[0] > validPrices[1]) {
        mrp = validPrices[0]
      }
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
  } else if (host.includes('bdshop')) {
    return importFromBdshop(url)
  }

  throw new Error('Unsupported website')
}

async function importFromBdshop(url: string): Promise<ImportedProduct> {
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9'
  }

  let response = await fetch(url, { headers })
  let html = ''

  if (!response.ok) {
    if (response.status === 403) {
      // Fallback for Cloudflare blocking
      const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`
      const proxyRes = await fetch(proxyUrl)
      if (proxyRes.ok) {
        const data = await proxyRes.json()
        html = data.contents
      } else {
        throw new Error(`Failed to fetch page: 403 (Proxy also failed)`)
      }
    } else {
      throw new Error(`Failed to fetch page: ${response.status}`)
    }
  } else {
    html = await response.text()
  }

  const $ = cheerio.load(html)

  const parts = url.split('/product/')
  const urlSlug = parts[parts.length - 1]?.split('?')[0] || ''

  const nameValue = $('h1').first().text().trim() ||
    $('meta[property="og:title"]').attr('content')?.replace(' - BDShop', '').trim() ||
    urlSlug.replace(/-/g, ' ')

  let priceText = ''
  $('[class*="price"], [class*="Price"]').each((_, el) => {
    const t = $(el).text().trim()
    if (t.includes('৳') && !priceText) priceText = t
  })

  if (!priceText) {
    const ogDesc = $('meta[property="og:description"]').attr('content') || ''
    const match = ogDesc.match(/৳\s*[\d,]+/)
    if (match) priceText = match[0]
  }

  const sellingPrice = priceText ? parsePrice(priceText) : null

  let imageUrl = $('meta[property="og:image"]').attr('content')?.startsWith('http')
    ? $('meta[property="og:image"]').attr('content')
    : null

  if (!imageUrl || imageUrl.includes('logo')) {
    const mainImg = $('.product-image img, #product-core-image img, .gallery img, img.img-responsive, .picture img').first()
    imageUrl = mainImg.attr('data-src') || mainImg.attr('src') || imageUrl
  }

  const description = $('meta[property="og:description"]').attr('content') ||
    $('[class*="description"], [class*="detail"]').first().text().trim().substring(0, 500) ||
    null

  const brandRaw = $('[class*="brand"]').first().text().trim()
  const brandName = brandRaw && brandRaw.length < 100 ? brandRaw : null

  return {
    name: nameValue.trim() || 'Unknown Product',
    brandName,
    description,
    sellingPrice,
    mrp: sellingPrice,
    imageUrl: imageUrl || null,
    packSize: null,
    genericName: null,
    dosageForm: null,
    strength: null,
    sourceUrl: url,
    source: 'medeasy' // bdshop does not have a defined enum in the database schema usually, using medeasy as fallback or generic if added later. Assuming Prisma has it mapped or we need to map to nearest or skip. Actually, DB schema accepts string for source? Let's check Prisma schema later. Let's use 'othoba' as a general goods fallback if BDShop isn't in Enum, or we update enum. 
  }
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
        // Prices and images are often inside the first variant (pv[0])
        const firstVariant = (item.pv && Array.isArray(item.pv) && item.pv.length > 0) ? item.pv[0] : (item.pv || {});

        const baseName = cleanProductName(item.p_name).trim()
        const strength = item.p_strength ? ` ${item.p_strength}` : ''
        const variantLabel = firstVariant.pu_base_unit_label && (!item.p_strength || !item.p_strength.includes(firstVariant.pu_base_unit_label))
          ? ` (${firstVariant.pu_base_unit_label})` : '';
        const name = `${baseName}${strength}${variantLabel}`.trim()

        const slugFallback = slugify(name)
        const productUrl = `https://www.arogga.com/product/${item.p_id}/${item.p_slug || slugFallback}`

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

  const seen = new Set<string>()
  const visitedCategorySlugs = new Set<string>()

  const fetchHtml = async (targetUrl: string): Promise<string> => {
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch page: ${response.status}`)
    }

    return response.text()
  }

  const pushProduct = (
    rawHref: string,
    rawName: string | null | undefined,
    price: number | null,
    imageUrl: string | null,
  ) => {
    if (!rawHref) return

    const fullUrl = rawHref.startsWith('http')
      ? rawHref
      : `https://chaldal.com${rawHref.startsWith('/') ? '' : '/'}${rawHref}`

    let pathname = ''
    try {
      pathname = new URL(fullUrl).pathname
    } catch {
      return
    }

    const excludedPrefixes = ['/search', '/offers', '/help', '/login', '/categories', '/category']
    if (
      pathname === '/' ||
      excludedPrefixes.some((prefix) => pathname.startsWith(prefix)) ||
      pathname.split('/').filter(Boolean).length !== 1
    ) {
      return
    }

    const slug = pathname.replace(/^\//, '').trim()
    if (!slug || slug.length < 3 || !slug.includes('-')) return
    if (seen.has(fullUrl)) return

    const derivedName = slug
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')

    const name = cleanProductName((rawName || '').trim() || derivedName)
    if (!name || name.length < 3) return

    seen.add(fullUrl)
    products.push({ name, url: fullUrl, price, imageUrl })
  }

  const parseBigDtoPrice = (val: unknown): number | null => {
    if (typeof val === 'number') return val
    if (val && typeof val === 'object' && 'Lo' in (val as Record<string, unknown>)) {
      const lo = (val as Record<string, unknown>).Lo
      if (typeof lo === 'number') return lo
    }
    return null
  }

  const parseChaldalState = (html: string): unknown | null => {
    const stateMatch = html.match(/window\.__reactAsyncStatePacket\s*=\s*(\{[\s\S]*?\})\s*<\/script>/)
    if (!stateMatch) return null
    try {
      return JSON.parse(stateMatch[1])
    } catch {
      return null
    }
  }

  const parseProductsFromState = (state: unknown) => {
    if (!state || typeof state !== 'object') return [] as Array<Record<string, unknown>>
    const blocks = Object.values(state as Record<string, unknown>)
      .filter((block): block is Record<string, unknown> => !!block && typeof block === 'object')
    for (const block of blocks) {
      const maybeProducts = block.products
      if (maybeProducts && typeof maybeProducts === 'object' && Array.isArray((maybeProducts as { items?: unknown[] }).items)) {
        return ((maybeProducts as { items: unknown[] }).items
          .filter((it): it is Record<string, unknown> => !!it && typeof it === 'object'))
      }
    }
    return [] as Array<Record<string, unknown>>
  }

  const parseSubcategorySlugsFromState = (state: unknown): string[] => {
    if (!state || typeof state !== 'object') return []
    const blocks = Object.values(state as Record<string, unknown>)
      .filter((block): block is Record<string, unknown> => !!block && typeof block === 'object')
    const slugs: string[] = []
    for (const block of blocks) {
      const categories = block.categories
      if (!Array.isArray(categories)) continue
      for (const cat of categories) {
        if (!cat || typeof cat !== 'object') continue
        const rec = cat as Record<string, unknown>
        let slug: string | null = null
        const picture = rec.Picture
        if (picture && typeof picture === 'object') {
          const seo = (picture as Record<string, unknown>).SeoFilename
          if (typeof seo === 'string' && seo.trim().length > 0) {
            slug = seo.trim()
          }
        }
        if (!slug && typeof rec.Name === 'string' && rec.Name.trim().length > 0) {
          slug = slugify(rec.Name)
        }
        if (slug && !slugs.includes(slug)) slugs.push(slug)
      }
    }
    return slugs
  }

  const collectFromHtml = (html: string) => {
    const state = parseChaldalState(html)
    const stateProducts = parseProductsFromState(state)

    // Prefer embedded state data: it is more stable than CSS selectors.
    if (stateProducts.length > 0) {
      for (const item of stateProducts) {
        const slug = typeof item.Slug === 'string' ? item.Slug : null
        const href = slug ? `/${slug}` : null
        if (!href) continue

        const name = typeof item.Name === 'string' ? item.Name : null
        const discounted = parseBigDtoPrice(item.DiscountedPrice)
        const regular = parseBigDtoPrice(item.Price)
        const price = discounted ?? regular ?? null

        let imageUrl: string | null = null
        if (Array.isArray(item.PictureUrls) && item.PictureUrls.length > 0) {
          const first = item.PictureUrls.find((p) => typeof p === 'string')
          if (typeof first === 'string') imageUrl = first
        }
        if (!imageUrl && Array.isArray(item.OfferPictureUrls) && item.OfferPictureUrls.length > 0) {
          const first = item.OfferPictureUrls.find((p) => typeof p === 'string')
          if (typeof first === 'string') imageUrl = first
        }

        pushProduct(href, name, price, imageUrl)
      }
      return
    }

    const $ = cheerio.load(html)

    // Legacy Chaldal layout selector.
    $('a.btnShowDetails').each((_, el) => {
      const href = $(el).attr('href')
      if (!href) return

      let productContainer = $(el).parent()
      for (let i = 0; i < 10 && productContainer.length; i++) {
        const text = productContainer.text()
        if (text.includes('৳') && text.length > 50) break
        productContainer = productContainer.parent()
      }

      const containerText = productContainer.text()
      const priceMatches = containerText.match(/(?:৳|Tk)\s*([\d,.০-৯]+)/gi)
      let price: number | null = null
      if (priceMatches && priceMatches.length > 0) {
        const prices = priceMatches.map((p) => parsePrice(p)).filter((p): p is number => p !== null)
        if (prices.length > 0) price = Math.max(...prices)
      }

      const img = productContainer.find('img[src*="chaldn.com"], img[src*="chaldal"]').first()
      const imageUrl = img.attr('src') || img.attr('data-src') || null

      pushProduct(href, $(el).text(), price, imageUrl)
    })

    if (products.length > 0) return

    // Fallback for newer layouts where product anchors/classes changed.
    $('a[href]').each((_, el) => {
      const href = $(el).attr('href')
      if (!href) return

      let container = $(el)
      for (let i = 0; i < 6 && container.length; i++) {
        const text = container.text().replace(/\s+/g, ' ').trim()
        if (/(?:৳|Tk)\s*[\d,.০-৯]+/i.test(text) && text.length > 15) break
        container = container.parent()
      }

      const containerText = container.text().replace(/\s+/g, ' ').trim()
      const priceMatches = containerText.match(/(?:৳|Tk)\s*([\d,.০-৯]+)/gi)
      if (!priceMatches || priceMatches.length === 0) return

      const prices = priceMatches.map((p) => parsePrice(p)).filter((p): p is number => p !== null)
      const price = prices.length > 0 ? Math.max(...prices) : null

      const imageUrl = container.find('img').first().attr('src') || container.find('img').first().attr('data-src') || null
      const rawName = $(el).text() || container.find('img').first().attr('alt') || null

      pushProduct(href, rawName, price, imageUrl)
    })
  }

  const rootHtml = await fetchHtml(url)
  collectFromHtml(rootHtml)

  // Some parent categories show only subcategories and no products.
  if (products.length === 0) {
    const rootState = parseChaldalState(rootHtml)
    const childSlugs = parseSubcategorySlugsFromState(rootState)
    for (const childSlug of childSlugs) {
      if (!childSlug || visitedCategorySlugs.has(childSlug)) continue
      visitedCategorySlugs.add(childSlug)
      try {
        const childHtml = await fetchHtml(`https://chaldal.com/${childSlug}`)
        collectFromHtml(childHtml)
      } catch {
        // Continue with other sub-categories even if one fails.
      }
    }
  }

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
  } else if (host.includes('bdshop')) {
    return extractProductsFromBdShopCategory(url)
  }

  throw new Error('Unsupported website for category extraction')
}

async function extractProductsFromBdShopCategory(url: string, maxPages: number = 20): Promise<CategoryProduct[]> {
  const products: CategoryProduct[] = []
  let page = 1

  while (page <= maxPages) {
    const urlObj = new URL(url)
    if (page > 1) {
      urlObj.searchParams.set('page', page.toString())
    }
    const pageUrl = page === 1 ? url : urlObj.toString()
    const response = await fetch(pageUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
    })

    if (!response.ok) break
    const html = await response.text()
    const $ = cheerio.load(html)

    let itemsFoundOnThisPage = 0

    // Common selectors for product cards on bdshop
    const cardSelectors = ['.product-card', '.product-item', '[class*="product-card"]', '.card']

    for (const sel of cardSelectors) {
      const cards = $(sel)
      if (cards.length === 0) continue

      cards.each((_, card) => {
        const linkEl = $(card).find('a[href*="/product/"]').first()
        const href = linkEl.attr('href') || ''
        if (!href) return

        let fullUrl = href.startsWith('http') ? href : `https://www.bdshop.com${href.startsWith('/') ? '' : '/'}${href}`
        fullUrl = fullUrl.replace('www.bdshop.com/bdshop/product/', 'www.bdshop.com/product/')
        const cleanUrl = fullUrl.split('?')[0]

        if (!cleanUrl.includes('/product/')) return

        let name = linkEl.text().trim() || $(card).find('h3, .title, .product-title').first().text().trim() || cleanUrl.split('/').pop()?.replace(/-/g, ' ') || ''

        let priceText = ''
        $(card).find('[class*="price"], [class*="Price"]').each((_, el) => {
          const t = $(el).text().trim()
          if (t.includes('৳') && !priceText) priceText = t
        })

        if (!priceText) {
          $(card).find('*').each((_, el) => {
            if ($(el).children().length > 0) return
            const t = $(el).text().trim()
            if (t.includes('৳') && !priceText) priceText = t
          })
        }

        const price = priceText ? parsePrice(priceText) : null
        const imgEl = $(card).find('img').first()
        const imageUrl = imgEl.attr('src') || imgEl.attr('data-src') || null

        if (name && !products.some(p => p.url === cleanUrl)) {
          products.push({ name, url: cleanUrl, price, imageUrl })
          itemsFoundOnThisPage++
        }
      })

      break // Stop after finding the right layout
    }

    if (itemsFoundOnThisPage === 0) {
      // Fallback: just standard links
      $('a[href*="/product/"]').each((_, el) => {
        const href = $(el).attr('href') || ''
        let fullUrl = href.startsWith('http') ? href : `https://www.bdshop.com${href.startsWith('/') ? '' : '/'}${href}`
        const cleanUrl = fullUrl.split('?')[0]

        if (cleanUrl.includes('/product/') && !products.some(p => p.url === cleanUrl)) {
          const name = $(el).text().trim() || cleanUrl.split('/').pop()?.replace(/-/g, ' ') || 'Unknown'
          products.push({ name, url: cleanUrl, price: null, imageUrl: null })
          itemsFoundOnThisPage++
        }
      })
    }

    if (itemsFoundOnThisPage === 0) break
    page++
  }

  return products
}
