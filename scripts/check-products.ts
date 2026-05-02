import { prisma } from '../lib/prisma'

const names = ['Neutrogena', 'SkinO', 'Ordinary', 'Freyias', 'Caplino', 'cream', 'toner']

async function run() {
  for (const name of names) {
    const products = await prisma.product.findMany({
      where: { name: { contains: name, mode: 'insensitive' }, isActive: true },
      select: { id: true, name: true, slug: true },
      take: 3,
    })
    console.log(`"${name}":`, products.length ? products.map((p: {name: string}) => p.name) : '❌ NOT FOUND IN DB')
  }
}

run().catch(console.error).finally(() => prisma.$disconnect())
