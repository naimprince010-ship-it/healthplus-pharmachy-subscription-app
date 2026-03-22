/**
 * BDShop Product Scraper & Importer (Playwright Version)
 *
 * Scrapes all products from bdshop.com and imports them into the
 * HealthPlus database as GENERAL type Products.
 * Uses Playwright to render JavaScript and capture dynamic prices.
 *
 * Usage:
 *   npm run import:bdshop           # Full import
 *   npm run import:bdshop:dry       # Preview only, no DB writes
 *   npm run import:bdshop:test      # Dry-run, first 10 products only
 */

import { prisma } from '../lib/prisma'
import { chromium, Browser, Page } from 'playwright'
import { ProductType } from '@prisma/client'

const BASE_URL = 'https://www.bdshop.com'
const IS_DRY_RUN = process.argv.includes('--dry-run')
const LIMIT_ARG = process.argv.find((a) => a.startsWith('--limit='))
const MAX_PRODUCTS: number = LIMIT_ARG ? parseInt(LIMIT_ARG.split('=')[1], 10) : Number.MAX_SAFE_INTEGER

const HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface BdShopCategory {
    name: string
    slug: string
    url: string
}

interface ProductEntry {
    url: string
    cat: BdShopCategory
}

interface BdShopProduct {
    name: string
    slug: string
    url: string
    price: number
    imageUrl: string | null
    description: string | null
    brandName: string | null
    categoryName: string
    categorySlug: string
}

// ─── Known BDShop Categories ──────────────────────────────────────────────────

const KNOWN_CATEGORIES: BdShopCategory[] = [
    { name: 'Headphone & Earphone', slug: 'bdshop-headphone-earphone', url: `${BASE_URL}/products.php?category=headphone-earphone` },
    { name: 'Computer & Office', slug: 'bdshop-computer-office', url: `${BASE_URL}/products.php?category=computer-and-office` },
    { name: 'Office Supplies', slug: 'bdshop-office-supplies', url: `${BASE_URL}/products.php?category=office-supplies` },
    { name: 'Solar and Wind Energy', slug: 'bdshop-solar-wind-energy', url: `${BASE_URL}/products.php?category=solar-and-wind-energy` },
    { name: 'YouTube Studio Gears', slug: 'bdshop-youtube-studio-gears', url: `${BASE_URL}/products.php?category=youtube-studio-gears` },
    { name: 'Mobile Accessories', slug: 'bdshop-mobile-accessories', url: `${BASE_URL}/products.php?category=mobile-accessories` },
    { name: 'Watches Collection', slug: 'bdshop-watches-collection', url: `${BASE_URL}/products.php?category=watches-collection` },
    { name: 'Consumer Electronics', slug: 'bdshop-consumer-electronics', url: `${BASE_URL}/products.php?category=consumer-electronics` },
    { name: 'Health Fashion & Grooming', slug: 'bdshop-health-fashion-grooming', url: `${BASE_URL}/products.php?category=health-fashion-grooming` },
    { name: 'Bags and Accessories', slug: 'bdshop-bags-accessories', url: `${BASE_URL}/products.php?category=bags-and-accessories` },
    { name: 'Personal Care', slug: 'bdshop-personal-care', url: `${BASE_URL}/products.php?category=personal-care` },
    { name: 'Kitchen and Home Appliances', slug: 'bdshop-kitchen-home-appliances', url: `${BASE_URL}/products.php?category=kitchen-and-home-appliances` },
    { name: 'Keyboard & Mouse', slug: 'bdshop-keyboard-mouse', url: `${BASE_URL}/products.php?category=keyboard-and-mouse` },
    { name: 'Smart Home IoT', slug: 'bdshop-smart-home-iot', url: `${BASE_URL}/products.php?category=smart-home-iot` },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parsePrice(text: string): number {
    if (!text) return 0
    const cleaned = text.replace(/,/g, '').replace(/৳/g, '').trim()
    const match = cleaned.match(/[\d]+(?:\.\d+)?/)
    return match ? parseFloat(match[0]) : 0
}

// ─── Playwright Scraping Functions ────────────────────────────────────────────

async function getProductUrlsFromPage(page: Page, url: string): Promise<string[]> {
    try {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 })

        // Wait for product links to appear (bdshop uses standard anchor tags)
        await page.waitForSelector('a[href*="/product/"]', { timeout: 10000 }).catch(() => { })

        const urls = await page.evaluate((baseUrl) => {
            const links = Array.from(document.querySelectorAll('a[href*="/product/"]'))
            const found = new Set<string>()

            links.forEach((a) => {
                let href = a.getAttribute('href') || ''
                if (!href) return

                let fullUrl = href.startsWith('http') ? href : `${baseUrl}${href.startsWith('/') ? '' : '/'}${href}`
                fullUrl = fullUrl.replace('www.bdshop.com/bdshop/product/', 'www.bdshop.com/product/')
                const cleanUrl = fullUrl.split('?')[0]

                if (cleanUrl.includes('/product/')) {
                    found.add(cleanUrl)
                }
            })

            return Array.from(found)
        }, BASE_URL)

        return urls
    } catch (err) {
        console.error(`❌ Error fetching URLs from ${url}:`, err)
        return []
    }
}

async function getEntriesForCategory(page: Page, cat: BdShopCategory): Promise<ProductEntry[]> {
    console.log(`\n  📂 ${cat.name}`)
    const allEntries: ProductEntry[] = []
    const seenUrls = new Set<string>()
    let pageNum = 1

    while (true) {
        const pageUrl = pageNum === 1 ? cat.url : `${cat.url}&page=${pageNum}`
        const urls = await getProductUrlsFromPage(page, pageUrl)

        if (urls.length === 0) break

        let addedCount = 0
        for (const url of urls) {
            if (!seenUrls.has(url)) {
                seenUrls.add(url)
                allEntries.push({ url, cat })
                addedCount++
            }
        }

        if (addedCount === 0) break // Duplicate page -> end of category
        console.log(`     Page ${pageNum}: +${addedCount} (total: ${allEntries.length})`)
        pageNum++
    }

    return allEntries
}

async function scrapeProductDetail(page: Page, entry: ProductEntry): Promise<BdShopProduct | null> {
    const { url, cat } = entry

    try {
        // Navigate to product page and wait for network to be somewhat idle
        // This allows JS to render the prices
        await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 })

        const productData = await page.evaluate((urlStr) => {
            // 1. Name
            const parts = urlStr.split('/product/')
            const urlSlug = parts[parts.length - 1].split('?')[0] || ''

            let name = document.querySelector('h1')?.textContent?.trim() || ''
            if (!name) {
                const ogTitle = document.querySelector('meta[property="og:title"]')?.getAttribute('content')
                if (ogTitle) name = ogTitle.replace(' - BDShop', '').trim()
            }
            if (!name) name = urlSlug.replace(/-/g, ' ')

            // 2. Price
            let priceText = ''

            // Look for the specific price element first
            const priceElement = document.querySelector('.product-price, .price, [class*="price"], [class*="Price"]')
            if (priceElement && priceElement.textContent?.includes('৳')) {
                priceText = priceElement.textContent.trim()
            }

            // If not found in a specific class, scan all elements for the currency symbol
            if (!priceText) {
                const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null)
                let node
                while ((node = walker.nextNode())) {
                    if (node.nodeValue && node.nodeValue.includes('৳')) {
                        // Check if it looks like a price (e.g., ৳ 1,500)
                        if (/\৳\s*[\d,]+/.test(node.nodeValue)) {
                            priceText = node.nodeValue.trim()
                            break
                        }
                    }
                }
            }

            // 3. Image
            const imageUrl = document.querySelector('meta[property="og:image"]')?.getAttribute('content') ||
                document.querySelector('.product-image img, .main-image img')?.getAttribute('src') || null

            // 4. Description
            let description = document.querySelector('meta[property="og:description"]')?.getAttribute('content') || ''
            if (!description) {
                const descEl = document.querySelector('.product-description, .description, .details')
                if (descEl) description = descEl.textContent?.trim() || ''
            }

            // 5. Brand
            const brandRaw = document.querySelector('.product-brand, .brand')?.textContent?.trim() || ''

            return {
                name,
                urlSlug,
                priceText,
                imageUrl,
                description: description.substring(0, 2000),
                brandName: brandRaw.length < 100 && brandRaw.length > 0 ? brandRaw : null
            }
        }, url)

        if (!productData.name || productData.name.length < 2) return null

        return {
            name: productData.name,
            slug: `bdshop-${productData.urlSlug}`,
            url,
            price: parsePrice(productData.priceText),
            imageUrl: productData.imageUrl?.startsWith('http') ? productData.imageUrl : null,
            description: productData.description || null,
            brandName: productData.brandName,
            categoryName: cat.name,
            categorySlug: cat.slug,
        }

    } catch (err) {
        console.error(`     ❌ Error scraping ${url}:`, err)
        return null
    }
}

// ─── DB Helpers ───────────────────────────────────────────────────────────────

const catCache = new Map<string, string>()

async function ensureCategory(name: string, slug: string): Promise<string> {
    if (catCache.has(slug)) return catCache.get(slug)!
    if (IS_DRY_RUN) { catCache.set(slug, `dry-${slug}`); return `dry-${slug}` }

    const existing = await prisma.category.findUnique({ where: { slug } })
    if (existing) { catCache.set(slug, existing.id); return existing.id }

    const created = await prisma.category.create({
        data: { name, slug, isActive: true, isMedicineCategory: false },
    })
    catCache.set(slug, created.id)
    console.log(`     🗂️  Created category: "${name}"`)
    return created.id
}

async function upsertProduct(p: BdShopProduct, categoryId: string): Promise<void> {
    if (IS_DRY_RUN) {
        console.log(`  [DRY RUN] ✔ "${p.name}" | ৳${p.price} | ${p.categoryName}`)
        return
    }

    await prisma.product.upsert({
        where: { slug: p.slug },
        create: {
            type: ProductType.GENERAL,
            name: p.name,
            slug: p.slug,
            description: p.description,
            imageUrl: p.imageUrl,
            sellingPrice: p.price || 0,
            mrp: p.price || 0,
            stockQuantity: 100,
            inStock: p.price > 0,
            brandName: p.brandName,
            categoryId,
            isActive: true,
            unit: 'pcs',
        },
        update: {
            name: p.name,
            description: p.description,
            imageUrl: p.imageUrl,
            sellingPrice: p.price || 0,
            mrp: p.price || 0,
            brandName: p.brandName,
            categoryId,
        },
    })
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('🛒  BDShop → HealthPlus Product Importer (Playwright)')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    if (IS_DRY_RUN) console.log('🔍  DRY RUN — no DB writes')
    if (MAX_PRODUCTS !== Number.MAX_SAFE_INTEGER) console.log(`⚠️   Limit: ${MAX_PRODUCTS} products`)
    console.log('\n🚀 Launching headless browser...')

    const browser = await chromium.launch({ headless: true })
    // Use a single context and page to save memory but block common tracking/ads
    const context = await browser.newContext({
        userAgent: HEADERS['User-Agent'],
        viewport: { width: 1280, height: 800 }
    })

    // Optional: Block images/css to speed up scraping, but we need JS for prices
    await context.route('**/*', (route) => {
        const type = route.request().resourceType()
        if (['image', 'media', 'font'].includes(type)) {
            route.abort()
        } else {
            route.continue()
        }
    })

    const page = await context.newPage()

    try {
        // Phase 1: Collect product URLs
        const queue: ProductEntry[] = []
        const seenUrls = new Set<string>()

        console.log(`\n📂 Scanning ${KNOWN_CATEGORIES.length} categories for product URLs...`)

        for (const cat of KNOWN_CATEGORIES) {
            if (queue.length >= MAX_PRODUCTS) break
            const entries = await getEntriesForCategory(page, cat)
            for (const e of entries) {
                if (!seenUrls.has(e.url) && queue.length < MAX_PRODUCTS) {
                    seenUrls.add(e.url)
                    queue.push(e)
                }
            }
        }

        // Fallback: main products page
        if (queue.length === 0) {
            console.log('\n⚠️  Fallback: scraping /products.php directly...')
            const fallbackCat: BdShopCategory = { name: 'BDShop Products', slug: 'bdshop-products', url: `${BASE_URL}/products.php` }
            const fallbackUrls = await getProductUrlsFromPage(page, `${BASE_URL}/products.php`)
            for (const u of fallbackUrls) {
                if (!seenUrls.has(u)) { seenUrls.add(u); queue.push({ url: u, cat: fallbackCat }) }
            }
        }

        const total = queue.length
        console.log(`\n🏷️  Found ${total} unique products to process\n`)

        // Phase 2: Scrape details and import
        let ok = 0, skip = 0, fail = 0

        for (let i = 0; i < total; i++) {
            const entry = queue[i]
            console.log(`\n[${i + 1}/${total}] ${entry.url}`)

            try {
                const product = await scrapeProductDetail(page, entry)
                if (!product) {
                    console.warn(`  ⚠️  Parse failed`)
                    skip++
                    continue
                }

                const catId = await ensureCategory(product.categoryName, product.categorySlug)
                await upsertProduct(product, catId)

                if (!IS_DRY_RUN) {
                    console.log(`  ✅ "${product.name}" | ৳${product.price}`)
                }
                ok++
            } catch (err) {
                console.error(`  ❌`, err)
                fail++
            }
        }

        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        console.log('📊 Result')
        console.log(`  ✅ ${ok} imported`)
        console.log(`  ⏭️  ${skip} skipped`)
        console.log(`  ❌ ${fail} errors`)
        if (IS_DRY_RUN) console.log('\n  Run without --dry-run to import to database')
        else console.log('\n  🎉 Done! Check Admin → Products')
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

    } finally {
        console.log('🧹 Closing browser...')
        await browser.close()
        await prisma.$disconnect()
    }
}

main().catch((err) => {
    console.error('\n💥 Fatal:', err)
    process.exit(1)
})
