/**
 * Backfill inline markdown product links in existing blogs.
 *
 * Usage:
 *   npx tsx scripts/backfill-blog-inline-product-links.ts
 *   npx tsx scripts/backfill-blog-inline-product-links.ts --blogId=<blogId>
 */
import { prisma } from '../lib/prisma'

function replaceFirstPlainMentionInLine(line: string, name: string, slug: string): string {
  const lowerLine = line.toLowerCase()
  const lowerName = name.toLowerCase()
  let fromIdx = 0

  while (true) {
    const idx = lowerLine.indexOf(lowerName, fromIdx)
    if (idx === -1) return line

    const linkMatches = [...line.matchAll(/\[[^\]]+\]\([^)]+\)/g)]
    const insideLink = linkMatches.some((m) => {
      const start = m.index ?? -1
      const end = start + m[0].length
      return idx >= start && idx < end
    })
    if (insideLink) {
      fromIdx = idx + lowerName.length
      continue
    }

    const raw = line.slice(idx, idx + name.length)
    const linked = `[${raw}](/products/${slug})`
    return `${line.slice(0, idx)}${linked}${line.slice(idx + name.length)}`
  }
}

function linkProductMentionsInMarkdown(
  contentMd: string,
  products: Array<{ name: string; slug: string }>
): string {
  if (!contentMd || products.length === 0) return contentMd

  const sortedProducts = [...products]
    .filter((p) => !!p.name && !!p.slug)
    .sort((a, b) => b.name.length - a.name.length)

  const lines = contentMd.split('\n')
  const linkedNames = new Set<string>()
  let insideCodeFence = false

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (line.trimStart().startsWith('```')) {
      insideCodeFence = !insideCodeFence
      continue
    }
    if (insideCodeFence || !line.trim()) continue

    let nextLine = line
    for (const p of sortedProducts) {
      if (linkedNames.has(p.name)) continue
      if (!nextLine.toLowerCase().includes(p.name.toLowerCase())) continue

      const replaced = replaceFirstPlainMentionInLine(nextLine, p.name, p.slug)
      if (replaced !== nextLine) {
        nextLine = replaced
        linkedNames.add(p.name)
      }
    }
    lines[i] = nextLine
  }

  return lines.join('\n')
}

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

