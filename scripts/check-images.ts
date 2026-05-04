import { prisma } from '../lib/prisma';

async function run() {
  const blogs = await prisma.blog.findMany({ select: { id: true, title: true, imageUrl: true }, take: 10, orderBy: { createdAt: 'desc' } });
  for (const b of blogs) {
    console.log(`Blog: ${b.title} -> ${b.imageUrl}`);
  }
}
run().catch(console.error).finally(() => process.exit(0));
