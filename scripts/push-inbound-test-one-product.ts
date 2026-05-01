/**
 * Local: one product "push" into Halalzi (same as /api/update-product + kind=product).
 * Run: npx tsx scripts/push-inbound-test-one-product.ts
 */
import './load-local-env'
import { applyAzanInboundProductUpdate } from '@/lib/integrations/azan-inbound-update'
import { prisma } from '@/lib/prisma'

async function main() {
  const p = await prisma.product.findFirst({
    where: { deletedAt: null, supplierSku: { not: null } },
    orderBy: { updatedAt: 'desc' },
    select: { id: true, name: true, supplierSku: true },
  })
  if (!p || !p.supplierSku) {
    console.log('No product with supplierSku found.')
    await prisma.$disconnect()
    return
  }

  const r = await applyAzanInboundProductUpdate('product', {
    supplier: 'AzanWholeSale',
    sku: p.supplierSku,
  })

  console.log('SKU', p.supplierSku, p.name)
  console.log(JSON.stringify(r, null, 2))
  await prisma.$disconnect()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
