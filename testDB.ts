import { prisma } from './lib/prisma.ts';

async function main() {
  const banners = await prisma.banner.findMany();
  console.log(JSON.stringify(banners, null, 2));
  process.exit(0);
}

main();
