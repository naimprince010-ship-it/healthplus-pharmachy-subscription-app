import { prisma } from './lib/prisma';

async function main() {
  const product = await prisma.product.findUnique({
    where: { slug: 'meril-baby-gel-toothpaste-strawberry' },
    include: { variants: true, category: true }
  });
  console.log(JSON.stringify(product, null, 2));
}

main().catch(console.error).finally(() => process.exit(0));
