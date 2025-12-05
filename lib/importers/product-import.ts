import * as cheerio from 'cheerio'

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
  source: 'arogga' | 'chaldal'
}

const ALLOWED_HOSTS = [
  'arogga.com',
  'www.arogga.com',
  'chaldal.com',
  'www.chaldal.com',
]

function validateUrl(url: string): { valid: boolean; host: string | null; error?: string } {
  try {
    const parsed = new URL(url)
    
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      return { valid: false, host: null, error: 'Only HTTP/HTTPS URLs are allowed' }
    }
    
    const host = parsed.hostname.toLowerCase()
    
    if (!ALLOWED_HOSTS.includes(host)) {
      return { valid: false, host, error: 'Only Arogga and Chaldal URLs are supported' }
    }
    
    if (host.includes('localhost') || host.match(/^(\d{1,3}\.){3}\d{1,3}$/)) {
      return { valid: false, host: null, error: 'Invalid URL' }
    }
    
    return { valid: true, host }
  } catch {
    return { valid: false, host: null, error: 'Invalid URL format' }
  }
}

function parsePrice(priceText: string): number | null {
  if (!priceText) return null
  const cleaned = priceText.replace(/[^\d.]/g, '')
  const price = parseFloat(cleaned)
  return isNaN(price) ? null : price
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
  
  const name = $('h1').first().text().trim() || ''
  
  let brandName: string | null = null
  $('a[href*="/brand/"]').each((_, el) => {
    const text = $(el).text().trim()
    if (text && !brandName) {
      brandName = text
    }
  })
  
  let sellingPrice: number | null = null
  let mrp: number | null = null
  
  const priceText = $('body').text()
  const priceMatch = priceText.match(/৳\s*([\d,.]+)/g)
  if (priceMatch && priceMatch.length >= 1) {
    sellingPrice = parsePrice(priceMatch[0])
    if (priceMatch.length >= 2) {
      mrp = parsePrice(priceMatch[1])
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
  const genericMatch = $('body').text().match(/Generic:\s*([^\n]+)/i)
  if (genericMatch) {
    genericName = genericMatch[1].trim()
  }
  
  let dosageForm: string | null = null
  let strength: string | null = null
  const formMatch = $('body').text().match(/(\d+mg|\d+ml|\d+g)\s*-\s*(Tablet|Syrup|Capsule|Injection|Cream|Ointment|Drops|Suppository)/i)
  if (formMatch) {
    strength = formMatch[1]
    dosageForm = formMatch[2]
  }
  
  let packSize: string | null = null
  const packMatch = $('body').text().match(/(\d+\s*(?:Tablets?|Capsules?|ml|g|pcs?|Strip|Bottle)(?:\s*\([^)]+\))?)/i)
  if (packMatch) {
    packSize = packMatch[1].trim()
  }
  
  let description: string | null = null
  const introMatch = $('body').text().match(/Introduction\s+([\s\S]*?)(?:Uses of|Side effects|$)/i)
  if (introMatch) {
    description = introMatch[1].trim().substring(0, 500)
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
    strength,
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
  
  const name = $('h1').first().text().trim() || 
               $('[class*="productName"]').first().text().trim() ||
               $('title').text().replace(/ - Chaldal.*$/, '').trim() || ''
  
  let brandName: string | null = null
  $('[class*="brand"]').each((_, el) => {
    const text = $(el).text().trim()
    if (text && !brandName) {
      brandName = text
    }
  })
  
  let sellingPrice: number | null = null
  let mrp: number | null = null
  
  const priceText = $('body').text()
  const priceMatch = priceText.match(/৳\s*([\d,.]+)/g)
  if (priceMatch && priceMatch.length >= 1) {
    sellingPrice = parsePrice(priceMatch[0])
    if (priceMatch.length >= 2) {
      mrp = parsePrice(priceMatch[1])
    }
  }
  
  let imageUrl: string | null = null
  $('img[src*="chaldn.com"]').each((_, el) => {
    const src = $(el).attr('src')
    if (src && !imageUrl && !src.includes('logo') && !src.includes('icon')) {
      imageUrl = src
    }
  })
  
  let packSize: string | null = null
  const packMatch = $('body').text().match(/(\d+\s*(?:g|kg|ml|L|pcs?|pack|piece))/i)
  if (packMatch) {
    packSize = packMatch[1].trim()
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
  }
  
  throw new Error('Unsupported website')
}
