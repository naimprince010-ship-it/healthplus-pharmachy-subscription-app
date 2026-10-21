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
    select: { imageUrl: true },
  })
  const bySource: Record<Source, number> = {
    supabase: 0,
    eurasiasupplies: 0,
    chaldal: 0,
    arogga: 0,
    other: 0,
  }
  for (const product of products) {
    if (product.imageUrl?.trim()) bySource[classify(product.imageUrl)] += 1
  }
  console.log(JSON.stringify({ dryRun: true, databaseWrites: 0, total: products.length, bySource }, null, 2))
}

main().finally(() => prisma.$disconnect())
