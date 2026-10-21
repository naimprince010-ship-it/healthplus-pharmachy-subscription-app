import { prisma } from '../lib/prisma'

type Source = 'supabase' | 'eurasiasupplies' | 'chaldal' | 'arogga' | 'other'

function classify(value: string): Source {
  try {
    const host = new URL(value).hostname.toLowerCase()
    if (host.endsWith('supabase.co')) return 'supabase'
    if (host.endsWith('eurasiasupplies.com')) return 'eurasiasupplies'
    if (host === 'chaldn.com' || host.endsWith('.chaldn.com')) return 'chaldal'
    if (host === 'arogga.com' || host.endsWith('.arogga.com')) return 'arogga'
  } catch {
    // Object keys and malformed legacy values are reported as other.
  }
  return 'other'
}

async function main() {
  const products = await prisma.product.findMany({
    where: { imageUrl: { not: null } },
    select: { imageUrl: true, isActive: true, deletedAt: true },
  })
  const emptyCounts = (): Record<Source, number> => ({
    supabase: 0,
    eurasiasupplies: 0,
    chaldal: 0,
    arogga: 0,
    other: 0,
  })
  const active = emptyCounts()
  const inactive = emptyCounts()
  const deleted = emptyCounts()

  for (const product of products) {
    if (!product.imageUrl?.trim()) continue
    const source = classify(product.imageUrl)
    if (product.deletedAt) {
      deleted[source] += 1
    } else if (!product.isActive) {
      inactive[source] += 1
    } else {
      active[source] += 1
    }
  }

  const total = (counts: Record<Source, number>) =>
    Object.values(counts).reduce((sum, count) => sum + count, 0)

  console.log(
    JSON.stringify(
      {
        dryRun: true,
        databaseWrites: 0,
        active: { total: total(active), bySource: active },
        inactive: { total: total(inactive), bySource: inactive },
        deleted: { total: total(deleted), bySource: deleted },
      },
      null,
      2,
    ),
  )
}

main().finally(() => prisma.$disconnect())
