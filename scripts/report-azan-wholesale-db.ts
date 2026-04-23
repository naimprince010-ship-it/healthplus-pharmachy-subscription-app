/**
 * Read-only snapshot: Azan Wholesale category products (pricing + counts).
 * Loads DATABASE_URL from .env.local — run: npx tsx scripts/report-azan-wholesale-db.ts
 */
import fs from 'fs'
import path from 'path'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'

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
      if (!(key in process.env)) process.env[key] = value
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
    console.error('Missing DATABASE_URL in .env.local')
    process.exit(1)
  }

  const categoryName = process.env.AZAN_WHOLESALE_CATEGORY || 'Azan Wholesale'
  const pool = new Pool({
    connectionString: buildPoolConnectionString(process.env.DATABASE_URL),
    ssl: { rejectUnauthorized: false },
  })
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) })

  const category = await prisma.category.findFirst({
    where: { name: categoryName },
    select: { id: true, name: true, slug: true },
  })

  if (!category) {
    console.log(JSON.stringify({ error: `Category not found: ${categoryName}` }, null, 2))
    await prisma.$disconnect()
    return
  }

  const whereBase = {
    deletedAt: null,
    categoryId: category.id,
  }

  const [total, published, draft, withPurchase, missingPurchase, recent] = await Promise.all([
    prisma.product.count({ where: whereBase }),
    prisma.product.count({ where: { ...whereBase, isActive: true } }),
    prisma.product.count({ where: { ...whereBase, isActive: false } }),
    prisma.product.count({
      where: {
        ...whereBase,
        purchasePrice: { not: null, gt: 0 },
      },
    }),
    prisma.product.count({
      where: {
        ...whereBase,
        OR: [{ purchasePrice: null }, { purchasePrice: { lte: 0 } }],
      },
    }),
    prisma.product.findMany({
      where: whereBase,
      orderBy: { updatedAt: 'desc' },
      take: 8,
      select: {
        id: true,
        name: true,
        slug: true,
        purchasePrice: true,
        sellingPrice: true,
        mrp: true,
        stockQuantity: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
  ])

  console.log(
    JSON.stringify(
      {
        category,
        counts: {
          total,
          published,
          draft,
          withPurchasePrice: withPurchase,
          missingOrZeroPurchasePrice: missingPurchase,
        },
        sampleLatestByUpdatedAt: recent,
      },
      null,
      2
    )
  )

  await prisma.$disconnect()
  await pool.end()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
