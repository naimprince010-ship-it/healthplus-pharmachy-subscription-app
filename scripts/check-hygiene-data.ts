import { prisma } from '../lib/prisma'

async function main() {
  const categories = await prisma.category.findMany({
    where: {
      OR: [
        { name: { contains: 'Hygiene', mode: 'insensitive' } },
        { name: { contains: 'Women', mode: 'insensitive' } },
        { name: { contains: 'Sanitary', mode: 'insensitive' } },
        { name: { contains: 'Pad', mode: 'insensitive' } }
      ]
    }
  })
  
  console.log('Found Categories:', categories)

  const products = await prisma.product.findMany({
    where: {
      OR: [
        { name: { contains: 'Senora', mode: 'insensitive' } },
        { name: { contains: 'Joya', mode: 'insensitive' } },
        { name: { contains: 'Freedom', mode: 'insensitive' } },
        { name: { contains: 'Napkin', mode: 'insensitive' } },
        { name: { contains: 'Pad', mode: 'insensitive' } }
      ]
    },
    select: { id: true, name: true, category: { select: { name: true } } },
    take: 10
  })

  console.log('Found Products:', products)
}

main().catch(console.error).finally(() => prisma.$disconnect())
