/**
 * Auto-tag beauty/skincare products for blog AI matching.
 *
 * Usage:
 *   npx tsx scripts/autotag-beauty-products.ts
 *   npx tsx scripts/autotag-beauty-products.ts --dry-run
 *   npx tsx scripts/autotag-beauty-products.ts --only-empty
 *   npx tsx scripts/autotag-beauty-products.ts --limit=200
 */
import { ProductType } from '@prisma/client'
import { prisma } from '../lib/prisma'

const STEP_KEYWORDS: Array<{ tag: string; keys: string[] }> = [
  { tag: 'cleanser', keys: ['cleanser', 'face wash', 'facewash', 'foam wash', 'cleansing', 'ক্লিনজার'] },
  { tag: 'toner', keys: ['toner', 'toning', 'টোনার'] },
  { tag: 'serum', keys: ['serum', 'essence', 'ampoule', 'booster', 'সিরাম'] },
  { tag: 'moisturizer', keys: ['moisturizer', 'moisturiser', 'cream', 'gel cream', 'lotion', 'ময়েশ্চারাইজার'] },
  { tag: 'sunscreen', keys: ['sunscreen', 'sun screen', 'sunblock', 'spf', 'uv', 'সানস্ক্রিন'] },
]

const CONCERN_KEYWORDS: Array<{ tag: string; keys: string[] }> = [
  { tag: 'acne', keys: ['acne', 'pimple', 'breakout', 'brono', 'ব্রণ'] },
  { tag: 'brightening', keys: ['brightening', 'glow', 'radiance', 'উজ্জ্বল'] },
  { tag: 'hydration', keys: ['hydrating', 'hydration', 'moist', 'deep moisture'] },
  { tag: 'anti-aging', keys: ['anti aging', 'anti-aging', 'wrinkle', 'fine line', 'firming'] },
  { tag: 'sensitive-skin', keys: ['sensitive', 'soothing', 'calming', 'barrier'] },
  { tag: 'pigmentation', keys: ['pigmentation', 'dark spot', 'melasma', 'spot corrector'] },
]

const INGREDIENT_KEYWORDS: Array<{ tag: string; keys: string[] }> = [
  { tag: 'vitamin-c', keys: ['vitamin c', 'ascorbic'] },
  { tag: 'niacinamide', keys: ['niacinamide'] },
  { tag: 'hyaluronic-acid', keys: ['hyaluronic', 'ha serum'] },
  { tag: 'salicylic-acid', keys: ['salicylic', 'bha'] },
  { tag: 'retinol', keys: ['retinol', 'retinal'] },
  { tag: 'ceramide', keys: ['ceramide'] },
]

const SKIN_TYPE_KEYWORDS: Array<{ tag: string; keys: string[] }> = [
  { tag: 'oily-skin', keys: ['oily', 'oil control', 'oil free'] },
  { tag: 'dry-skin', keys: ['dry skin', 'very dry', 'intense moisture'] },
  { tag: 'combination-skin', keys: ['combination skin', 'combo skin'] },
]

function includesAny(text: string, keys: string[]): boolean {
  return keys.some((k) => text.includes(k))
}

function inferTags(input: {
  name: string
  description: string | null
  categoryName: string | null
  budgetLevel: string | null
}): string[] {
  const text = `${input.name} ${input.description || ''} ${input.categoryName || ''}`.toLowerCase()
  const tags = new Set<string>(['beauty', 'skincare'])

  for (const item of STEP_KEYWORDS) {
    if (includesAny(text, item.keys)) tags.add(item.tag)
  }
  for (const item of CONCERN_KEYWORDS) {
    if (includesAny(text, item.keys)) tags.add(item.tag)
  }
  for (const item of INGREDIENT_KEYWORDS) {
    if (includesAny(text, item.keys)) tags.add(item.tag)
  }
  for (const item of SKIN_TYPE_KEYWORDS) {
    if (includesAny(text, item.keys)) tags.add(item.tag)
  }

  if (input.budgetLevel) tags.add(input.budgetLevel.toLowerCase())
  if (includesAny(text, ['face wash', 'cleanser', 'ক্লিনজার'])) tags.add('daily-use')
  if (includesAny(text, ['spf', 'sunscreen', 'sunblock'])) tags.add('daytime')
  if (includesAny(text, ['retinol'])) tags.add('night-routine')

  return Array.from(tags)
}

async function main() {
  const dryRun = process.argv.includes('--dry-run')
  const onlyEmpty = process.argv.includes('--only-empty')
  const limitArg = process.argv.find((a) => a.startsWith('--limit='))?.split('=')[1]
  const limit = limitArg ? Number(limitArg) : undefined

  const products = await prisma.product.findMany({
    where: {
      type: ProductType.GENERAL,
      isActive: true,
      ...(onlyEmpty ? { aiTags: { isEmpty: true } } : {}),
      OR: [
        { category: { name: { contains: 'beauty', mode: 'insensitive' } } },
        { category: { name: { contains: 'skin', mode: 'insensitive' } } },
        { name: { contains: 'cleanser', mode: 'insensitive' } },
        { name: { contains: 'toner', mode: 'insensitive' } },
        { name: { contains: 'serum', mode: 'insensitive' } },
        { name: { contains: 'moisturizer', mode: 'insensitive' } },
        { name: { contains: 'sunscreen', mode: 'insensitive' } },
      ],
    },
    select: {
      id: true,
      name: true,
      aiTags: true,
      description: true,
      budgetLevel: true,
      category: { select: { name: true } },
    },
    take: limit,
    orderBy: { updatedAt: 'desc' },
  })

  let changed = 0
  for (const product of products) {
    const inferred = inferTags({
      name: product.name,
      description: product.description,
      categoryName: product.category?.name ?? null,
      budgetLevel: product.budgetLevel,
    })
    const merged = Array.from(new Set([...(product.aiTags || []), ...inferred]))
    const shouldUpdate = merged.length !== (product.aiTags || []).length
    if (!shouldUpdate) continue

    changed++
    console.log(`- ${product.name}`)
    console.log(`  before: ${(product.aiTags || []).join(', ') || '(empty)'}`)
    console.log(`  after : ${merged.join(', ')}`)

    if (!dryRun) {
      await prisma.product.update({
        where: { id: product.id },
        data: { aiTags: merged },
      })
    }
  }

  console.log(`\nScanned: ${products.length}, Updated: ${changed}, Mode: ${dryRun ? 'DRY RUN' : 'LIVE'}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

