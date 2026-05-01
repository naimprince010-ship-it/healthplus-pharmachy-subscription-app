/**
 * One-off: find a recent order with Azan product lines and call forwardOrderToAzanById.
 * Run: npx tsx scripts/push-test-order-azan.ts
 */
import './load-local-env'
import { forwardOrderToAzanById } from '@/lib/integrations/forward-order-to-azan'
import { getAzanResellerCategoryName, isProductLinkedToAzanCatalog } from '@/lib/integrations/azan-catalog'
import { prisma } from '@/lib/prisma'

async function main() {
  const categoryName = getAzanResellerCategoryName()
  const orders = await prisma.order.findMany({
    take: 50,
    orderBy: { createdAt: 'desc' },
    include: {
      items: {
        include: {
          product: { include: { category: { select: { name: true } } } },
          medicine: true,
        },
      },
    },
  })

  for (const order of orders) {
    let hasAzan = false
    for (const line of order.items) {
      if (line.medicineId || !line.product) continue
      if (!isProductLinkedToAzanCatalog(line.product, categoryName)) continue
      if (line.product.deletedAt) continue
      const sku = line.product.supplierSku || null
      if (sku?.trim() || /^\d{4,20}$/.test(line.product.slug.split('-').pop() || '')) {
        hasAzan = true
        break
      }
    }
    if (hasAzan) {
      console.log('Forwarding', order.orderNumber, order.id)
      const r = await forwardOrderToAzanById(order.id)
      const snap = await prisma.order.findUnique({
        where: { id: order.id },
        select: { orderNumber: true, azanPushedAt: true, azanPushError: true, azanOrderId: true },
      })
      console.log(JSON.stringify({ result: r, order: snap }, null, 2))
      await prisma.$disconnect()
      return
    }
  }

  console.log('No recent order with Azan-linked product lines (supplierSku / Azan category).')
  await prisma.$disconnect()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
