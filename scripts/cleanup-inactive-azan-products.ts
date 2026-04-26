/**
 * Hard-delete inactive Azan-sourced products.
 *
 * Default mode is dry-run (no deletion). To execute, pass --yes:
 *   npx tsx scripts/cleanup-inactive-azan-products.ts --yes
 */
import fs from 'fs'
import path from 'path'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'
import { getAzanResellerCategoryName } from '@/lib/integrations/azan-catalog'
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
      if (!(key in process.env) || isEmpty) process.env[key] = value
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
    throw new Error('Missing DATABASE_URL')
  }

  const shouldDelete = process.argv.includes('--yes')
  const resellerCategoryName = getAzanResellerCategoryName()
  const pool = new Pool({
    connectionString: buildPoolConnectionString(process.env.DATABASE_URL),
    ssl: { rejectUnauthorized: false },
  })
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) })

  const where = {
    OR: [
      { category: { is: { name: resellerCategoryName } } },
      { AND: [{ supplierSku: { not: null } }, { NOT: { supplierSku: '' } }] },
      { AND: [{ sourceCategoryName: { not: null } }, { NOT: { sourceCategoryName: '' } }] },
    ],
    isActive: false,
  }

  const count = await prisma.product.count({ where })
  console.log(`Inactive Azan-sourced products matched: ${count}`)

  if (!shouldDelete) {
    const sample = await prisma.product.findMany({
      where,
      select: { id: true, slug: true, name: true, deletedAt: true },
      take: 10,
      orderBy: { updatedAt: 'desc' },
    })
    console.log('Dry-run mode. No deletion performed. Sample rows:')
    for (const row of sample) {
      console.log(`- ${row.id} | ${row.slug} | ${row.name} | deletedAt=${row.deletedAt ?? 'null'}`)
    }
    console.log('Run with --yes to execute hard delete.')
    await prisma.$disconnect()
    await pool.end()
    return
  }

  const result = await prisma.product.deleteMany({ where })
  invalidateSearchIndex()
  console.log(`Hard deleted Azan inactive products: ${result.count}`)

  await prisma.$disconnect()
  await pool.end()
}

main().catch((error) => {
  const msg = error instanceof Error ? error.message : String(error)
  console.error(`Cleanup failed: ${msg}`)
  process.exit(1)
})
