import { prisma } from '../lib/prisma'

async function main() {
  console.log('Fetching products...')
  const products = await prisma.product.findMany({
    where: {
      deletedAt: null,
      OR: [
        { category: { is: { name: 'Azan Wholesale' } } },
        { supplierSku: { not: null, not: '' } },
        { sourceCategoryName: { not: null, not: '' } }
      ],
      isActive: false,
      purchasePrice: { gt: 0 }
    },
    select: { id: true, purchasePrice: true }
  })

  console.log('Found ' + products.length + ' draft products with a valid cost price.')
  
  if (products.length === 0) return

  let updated = 0
  const marginMultiplier = 1.60

  const batchSize = 100
  for (let i = 0; i < products.length; i += batchSize) {
    const batch = products.slice(i, i + batchSize)
    await Promise.all(batch.map(p => {
      const sp = Math.ceil((p.purchasePrice || 0) * marginMultiplier)
      return prisma.product.update({
        where: { id: p.id },
        data: { sellingPrice: sp, mrp: sp, isActive: true }
      })
    }))
    updated += batch.length
    console.log('Published ' + updated + ' / ' + products.length)
  }
  
  console.log('All done! Successfully published ' + updated + ' products.')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
