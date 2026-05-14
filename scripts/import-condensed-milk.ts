/**
 * Import script: Chaldal "Condensed Milk & Cream" category
 * Run: npx tsx --env-file=.env scripts/import-condensed-milk.ts
 *
 * Imports products with accurate prices (from React state), images, pack sizes.
 * Basic SEO is auto-generated without AI; use Admin panel to regenerate with AI later.
 */

import { extractProductsFromCategory, importProductFromUrl } from '../lib/importers/product-import'
import { prisma } from '../lib/prisma'
import { slugify } from '../lib/slugify'

const CATEGORY_URL = 'https://chaldal.com/condensed-milk-cream'
const CATEGORY_NAME = 'Condensed Milk & Cream'

function buildBasicSeo(name: string, brand: string | null, packSize: string | null, category: string) {
  const titleParts = [brand, name, packSize].filter(Boolean)
  const seoTitle = titleParts.join(' ').substring(0, 60)

  const brandStr = brand ? `by ${brand} ` : ''
  const packStr = packSize ? `(${packSize}) ` : ''
  const seoDescription = `Buy ${name} ${packStr}${brandStr}online at Halalzi. Fast delivery across Bangladesh. Authentic ${category} at best prices. Order now and get it delivered to your doorstep.`
    .substring(0, 160)

  const keywords = [
    name.toLowerCase(),
    brand?.toLowerCase(),
    `${name.toLowerCase()} price`,
    `${name.toLowerCase()} buy online`,
    `${category.toLowerCase()} online`,
    'halalzi',
    'bangladesh grocery',
    brand ? `${brand.toLowerCase()} ${category.toLowerCase()}` : null,
  ]
    .filter(Boolean)
    .join(', ')

  const description = `${name} ${packSize ? `(${packSize}) ` : ''}is a premium quality ${category.toLowerCase()} product${brand ? ` from ${brand}` : ''}. Available for home delivery across Bangladesh at the best price. Order from Halalzi for fast, reliable delivery.`

  const keyFeatures = [
    `Premium quality ${category.toLowerCase()}`,
    brand ? `Trusted brand: ${brand}` : 'Quality assured product',
    packSize ? `Pack size: ${packSize}` : 'Convenient packaging',
    'Fast delivery across Bangladesh',
    'Authentic product guaranteed',
    'Competitive pricing',
  ].join('\n')

  const specSummary = `${name}${packSize ? ` - ${packSize}` : ''}${brand ? ` | Brand: ${brand}` : ''} | Category: ${category}. Suitable for home and professional use.`

  return { seoTitle, seoDescription, seoKeywords: keywords, description, keyFeatures, specSummary }
}

async function main() {
  console.log(`\nFetching products from: ${CATEGORY_URL}`)
  const categoryProducts = await extractProductsFromCategory(CATEGORY_URL)
  console.log(`Found ${categoryProducts.length} products in category.\n`)

  // Ensure category exists
  const categorySlug = slugify(CATEGORY_NAME)
  let dbCategory = await prisma.category.findUnique({ where: { slug: categorySlug } })
  if (!dbCategory) {
    dbCategory = await prisma.category.create({
      data: {
        name: CATEGORY_NAME,
        slug: categorySlug,
        isActive: true,
        isMedicineCategory: false,
      },
    })
    console.log(`✅ Created new category: "${CATEGORY_NAME}" (slug: ${categorySlug})`)
  } else {
    console.log(`ℹ️  Category already exists: "${CATEGORY_NAME}" (id: ${dbCategory.id})`)
  }

  let created = 0
  let updated = 0
  let skipped = 0

  for (const cp of categoryProducts) {
    console.log(`\n→ Processing: ${cp.name}`)
    try {
      // Fetch detailed product info from individual product page
      const details = await importProductFromUrl(cp.url)

      // Prefer detail-page price over category-page price
      const sellingPrice = details.sellingPrice ?? cp.price ?? 0
      if (!sellingPrice || sellingPrice <= 0) {
        console.log(`  ⚠️  Skipping (price is 0): ${details.name}`)
        skipped++
        continue
      }

      // Ensure manufacturer exists
      let manufacturerId: string | null = null
      if (details.brandName) {
        const mSlug = slugify(details.brandName)
        let mfr = await prisma.manufacturer.findUnique({ where: { slug: mSlug } })
        if (!mfr) {
          mfr = await prisma.manufacturer.create({
            data: { name: details.brandName, slug: mSlug },
          })
          console.log(`  ✅ Created manufacturer: ${details.brandName}`)
        }
        manufacturerId = mfr.id
      }

      const seo = buildBasicSeo(details.name, details.brandName, details.packSize, CATEGORY_NAME)

      // Build a unique slug: name + packSize to avoid collisions
      const productSlug = slugify(
        details.name + (details.packSize ? ` ${details.packSize}` : '')
      )

      const existing = await prisma.product.findUnique({ where: { slug: productSlug } })

      if (existing) {
        await prisma.product.update({
          where: { slug: productSlug },
          data: {
            sellingPrice,
            mrp: details.mrp,
            imageUrl: details.imageUrl,
            brandName: details.brandName,
            sizeLabel: details.packSize,
            categoryId: dbCategory.id,
            manufacturerId,
            description: seo.description,
            keyFeatures: seo.keyFeatures,
            specSummary: seo.specSummary,
            seoTitle: seo.seoTitle,
            seoDescription: seo.seoDescription,
            seoKeywords: seo.seoKeywords,
            isActive: true,
          },
        })
        console.log(`  🔄 Updated: ${details.name} — ৳${sellingPrice}`)
        updated++
      } else {
        await prisma.product.create({
          data: {
            name: details.name,
            slug: productSlug,
            type: 'GENERAL',
            isActive: true,
            sellingPrice,
            mrp: details.mrp,
            imageUrl: details.imageUrl,
            brandName: details.brandName,
            sizeLabel: details.packSize,
            stockQuantity: 100,
            categoryId: dbCategory.id,
            manufacturerId,
            description: seo.description,
            keyFeatures: seo.keyFeatures,
            specSummary: seo.specSummary,
            seoTitle: seo.seoTitle,
            seoDescription: seo.seoDescription,
            seoKeywords: seo.seoKeywords,
            aiTags: [CATEGORY_NAME.toLowerCase(), 'grocery', 'dairy'],
          },
        })
        console.log(`  ✅ Created: ${details.name} — ৳${sellingPrice}`)
        created++
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      console.error(`  ❌ Failed: ${cp.name} — ${message}`)
      skipped++
    }
  }

  console.log(`\n${'─'.repeat(50)}`)
  console.log(`Import complete!`)
  console.log(`  ✅ Created : ${created}`)
  console.log(`  🔄 Updated : ${updated}`)
  console.log(`  ⚠️  Skipped : ${skipped}`)
  console.log(`${'─'.repeat(50)}`)
  console.log(`\n💡 Tip: Go to Admin → Products → filter by "${CATEGORY_NAME}" → use "Generate AI Content" to upgrade SEO.`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
