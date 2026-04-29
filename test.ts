import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const blog = await prisma.blog.findUnique({
    where: { slug: 'festival-ready-beauty-quick-skincare-tips-for-durg-2026-03-08' },
    select: { imageUrl: true, title: true }
  });
  console.log(blog);
}

main().finally(() => prisma.$disconnect());
