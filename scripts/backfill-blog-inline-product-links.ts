/**
 * Backfill inline markdown product links in existing blogs.
 *
 * Usage:
 *   npx tsx scripts/backfill-blog-inline-product-links.ts
 *   npx tsx scripts/backfill-blog-inline-product-links.ts --blogId=<blogId>
 */
import { prisma } from '../lib/prisma'
import { linkProductMentionsInMarkdown } from '../lib/blog-engine/linkProductMentionsInMarkdown'

async function main() {
  const blogIdArg = process.argv.find((a) => a.startsWith('--blogId='))?.split('=')[1]?.trim()

  const blogs = await prisma.blog.findMany({
    where: blogIdArg ? { id: blogIdArg } : { contentMd: { not: null } },
    select: {
      id: true,
      title: true,
      contentMd: true,
      blogProducts: {
        include: {
          product: { select: { id: true, name: true, slug: true } },
        },
      },
    },
  })

  let updatedCount = 0
  for (const blog of blogs) {
    if (!blog.contentMd) continue

    const products = blog.blogProducts
      .map((bp) => bp.product)
      .filter((p): p is NonNullable<typeof p> => !!p)
      .map((p) => ({ name: p.name, slug: p.slug }))

    if (products.length === 0) continue

    const nextContent = linkProductMentionsInMarkdown(blog.contentMd, products)
    if (nextContent === blog.contentMd) continue

    await prisma.blog.update({
      where: { id: blog.id },
      data: { contentMd: nextContent },
    })
    updatedCount++
    console.log(`Updated: ${blog.title}`)
  }

  console.log(`Done. Blogs updated: ${updatedCount}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

