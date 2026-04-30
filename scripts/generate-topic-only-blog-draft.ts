/**
 * Same pipeline as Admin → Blog Queue → Generate (TOPIC_ONLY → DRAFT).
 *
 * Env: DATABASE_URL, OPENAI_API_KEY
 *
 *   npx tsx scripts/generate-topic-only-blog-draft.ts
 *   npx tsx scripts/generate-topic-only-blog-draft.ts --blogId=<cuid>
 */
import { prisma } from '../lib/prisma'
import { BlogStatus } from '@prisma/client'
import { runBlogDraftGeneration } from '../lib/blog-engine/runGeneration'

async function main() {
  const arg = process.argv.find((a) => a.startsWith('--blogId='))
  const blogIdArg = arg?.split('=')[1]?.trim()

  let blogId = blogIdArg
  if (!blogId) {
    const row = await prisma.blog.findFirst({
      where: { status: BlogStatus.TOPIC_ONLY },
      orderBy: { createdAt: 'desc' },
      select: { id: true, title: true, slug: true },
    })
    if (!row) {
      console.error('No TOPIC_ONLY blog found. Create one from Admin → Blog Topics → Create Blog, or pass --blogId=')
      process.exit(1)
    }
    blogId = row.id
    console.log('Using latest TOPIC_ONLY:', row.title, '|', row.slug)
  }

  console.log('Running runBlogDraftGeneration…')
  const result = await runBlogDraftGeneration(blogId!)
  if (!result.ok) {
    console.error('Failed:', result.error, result.details ?? '')
    process.exit(1)
  }

  console.log('OK → DRAFT')
  console.log('  Title:', result.title)
  console.log('  productsLinked (AI rows):', result.productsLinked)
  console.log('  missingProducts:', result.missingProductsReported)
  console.log('Next: Admin → Blog Queue → Review → Publish, or PUT status.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
