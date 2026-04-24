/**
 * Set isActive: true for all products in the Azan Wholesale category (storefront visibility).
 * Loads .env.local then .env — run: npx tsx scripts/activate-azan-products.ts
 */
import fs from 'fs'
import path from 'path'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'
import { invalidateSearchIndex } from '@/lib/search-index'

function loadLocalEnv() {
  const root = process.cwd()
  for (const file of ['.env.local', '.env']) {
    const fullPath = path.join(root, file)
    if (!fs.existsSync(fullPath)) continue
    for (const line of fs.readFileSync(fullPath, 'utf8').split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const i = trimmed.indexOf('=')
      if (i === -1) continue
      const key = trimmed.slice(0, i).trim()
      let value = trimmed.slice(i + 1).trim()
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1)
      }
      const existing = process.env[key]
      const isEmpty = existing === undefined || String(existing).trim() === ''
      if (!(key in process.env) || isEmpty) {
        process.env[key] = value
      }
    }
  }
}

function buildPoolConnectionString(url: string) {
  return url
    .replace(/[?&]pgbouncer=[^&]*/g, '')
    .replace(/[?&]connection_limit=[^&]*/g, '')
    .replace(/[?&]sslmode=[^&]*/g, '')
}

async function main() {
  loadLocalEnv()
  if (!process.env.DATABASE_URL) {
    console.error('Missing DATABASE_URL')
    process.exit(1)
  }

  const categoryName = process.env.AZAN_WHOLESALE_CATEGORY || 'Azan Wholesale'
  const pool = new Pool({
    connectionString: buildPoolConnectionString(process.env.DATABASE_URL),
    ssl: { rejectUnauthorized: false },
  })
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) })

  const category = await prisma.category.findUnique({ where: { name: categoryName } })
  if (!category) {
    console.log(`Category not found: ${categoryName}. Run sync first.`)
    await prisma.$disconnect()
    await pool.end()
    return
  }

  const result = await prisma.product.updateMany({
    where: {
      categoryId: category.id,
      deletedAt: null,
      isActive: false,
    },
    data: { isActive: true },
  })

  invalidateSearchIndex()

  console.log(`Activated (isActive: true): ${result.count} products in "${categoryName}".`)

  await prisma.$disconnect()
  await pool.end()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
