/**
 * Debug: print the exact payload we'd send to Azan without submitting.
 * Run: npx tsx scripts/debug-azan-payload.ts
 */
import './load-local-env'
import { prisma } from '@/lib/prisma'
import { getAzanResellerCategoryName, isProductLinkedToAzanCatalog } from '@/lib/integrations/azan-catalog'
import { getAzanPlatformSource, isAzanOrderForwardingEnabled, getAzanWholesaleApiBaseUrl } from '@/lib/integrations/azan-wholesale'
import { format } from 'date-fns'

console.log('Forward enabled:', isAzanOrderForwardingEnabled())
console.log('API base URL:', getAzanWholesaleApiBaseUrl())
console.log('APP_ID:', process.env.AZAN_WHOLESALE_APP_ID)
console.log('')

async function main() {
  const categoryName = getAzanResellerCategoryName()
  const order = await prisma.order.findFirst({
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { id: true, name: true, phone: true } },
      address: { include: { zone: { select: { name: true } } } },
      items: {
        include: {
          product: { include: { category: { select: { name: true } } } },
          medicine: true,
        },
      },
    },
    where: {
      items: {
        some: {
          product: {
            category: { name: categoryName },
            deletedAt: null,
          },
          medicineId: null,
        },
      },
    },
  })

  if (!order) {
    console.log('No order with Azan products found.')
    await prisma.$disconnect()
    return
  }

  console.log('Order:', order.orderNumber, '|', order.id)
  console.log('User:', order.user.name, '| phone:', order.user.phone)
  console.log('azanPushedAt:', order.azanPushedAt)
  console.log('')

  for (const line of order.items) {
    if (line.medicineId || !line.product) continue
    const p = line.product
    const inCategory = isProductLinkedToAzanCatalog(p, categoryName)
    const sku = p.supplierSku || null
    console.log(`Product: ${p.name}`)
    console.log(`  category: ${p.category?.name} | linked: ${inCategory}`)
    console.log(`  supplierSku: ${p.supplierSku} | supplierProductId: ${p.supplierProductId}`)
    console.log(`  mrp: ${p.mrp} | sellingPrice: ${p.sellingPrice} | purchasePrice: ${p.purchasePrice}`)
    console.log(`  line.price (charged): ${line.price} | qty: ${line.quantity}`)
    console.log(`  sku to use: ${sku}`)
    console.log('')
  }

  // Simulate the exact payload
  const lines = order.items.filter(l => !l.medicineId && l.product && isProductLinkedToAzanCatalog(l.product, categoryName) && !l.product.deletedAt)
  
  const payload = {
    date: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
    platform_source: getAzanPlatformSource(),
    platform_order_id: parseInt(order.orderNumber.replace(/\D/g, ''), 10),
    platform_user_id: parseInt((order.user.phone || '').replace(/\D/g, ''), 10),
    order_source: 'website',
    grand_total: lines.reduce((s, l) => s + l.price * l.quantity, 0),
    shipping_address: {
      name: order.address.fullName,
      phone: order.address.phone,
      address: [order.address.addressLine1, order.address.city, order.address.zone.name].filter(Boolean).join(', '),
    },
    order_details: lines.map(line => {
      const p = line.product!
      const sku = p.supplierSku || p.slug.split('-').filter(Boolean).pop()
      return {
        name: p.name,
        sku: sku,
        supplier_product_id: p.supplierProductId ?? undefined,
        quantity: line.quantity,
        unit_price: line.price,
        sales_price: Math.max(p.sellingPrice, line.price),
        mrp_price: (p.mrp != null && p.mrp > 0) ? p.mrp : Math.max(p.sellingPrice, line.price),
        total_price: line.price * line.quantity,
        wholesale_price: p.purchasePrice ?? Math.round(line.price * 0.5),
        discount: Math.max(0, Math.max(p.sellingPrice, line.price) - line.price),
        supplier: process.env.AZAN_WHOLESALE_SUPPLIER_NAME || 'AzanWholeSale',
        reward_point_used: 0,
      }
    }),
  }

  console.log('=== EXACT PAYLOAD TO SEND ===')
  console.log(JSON.stringify(payload, null, 2))

  await prisma.$disconnect()
}

main().catch(e => { console.error(e); process.exit(1) })
