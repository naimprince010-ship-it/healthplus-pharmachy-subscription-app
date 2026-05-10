import { prisma } from '../lib/prisma'

async function main() {
  console.log('Fetching products...')
  const products = await prisma.product.findMany({
    where: {
      deletedAt: null,
      OR: [
        { category: { is: { name: 'Azan Wholesale' } } },
        { AND: [{ supplierSku: { not: null } }, { supplierSku: { not: '' } }] },
        { AND: [{ sourceCategoryName: { not: null } }, { sourceCategoryName: { not: '' } }] }
      ],
      isActive: false,
      purchasePrice: { gt: 0 }
    },
    select: { id: true, purchasePrice: true, mrp: true }
  })

  console.log('Found ' + products.length + ' draft products with a valid cost price.')
  
  if (products.length === 0) return

  let updated = 0
  let skippedMissingMrp = 0

  const batchSize = 100
  for (let i = 0; i < products.length; i += batchSize) {
    const batch = products.slice(i, i + batchSize)
    await Promise.all(batch.map(p => {
      if (!p.mrp || p.mrp <= 0) {
        skippedMissingMrp++
        return null
      }
      const sp = p.mrp
      return prisma.product.update({
        where: { id: p.id },
        data: { sellingPrice: sp, mrp: p.mrp, isActive: true }
      })
    }))
    updated += batch.filter((p) => p.mrp && p.mrp > 0).length
    console.log('Published ' + updated + ' / ' + products.length)
  }
  
  console.log('All done! Successfully published ' + updated + ' products. Skipped missing MRP: ' + skippedMissingMrp)
}

main()
  .catch(e => { console.error(e); process.exit(1) })
