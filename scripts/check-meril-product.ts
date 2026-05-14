import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const product = await prisma.product.findUnique({
    where: { slug: 'meril-baby-gel-toothpaste-strawberry' },
    include: { inventory: true, ProductBrand: true }
  });
  console.log(JSON.stringify(product, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
