/**
 * Remove false-positive MissingProduct rows from beauty blogs.
 *
 * A missing-product row is "false" when the related blog already has a
 * BlogProduct mapped to the same skincare step that the missing row refers to.
 *
 * Usage:
 *   npx tsx scripts/cleanup-false-missing-products.ts
 *   npx tsx scripts/cleanup-false-missing-products.ts --dry-run   (preview only)
 *   npx tsx scripts/cleanup-false-missing-products.ts --blogId=<id>
 */
import { prisma } from '../lib/prisma'

const STEP_ALIASES: Record<number, string[]> = {
  1: ['cleanser', 'face wash', 'facewash', 'foam wash', 'cleansing', 'ক্লিনজার', 'ফেসওয়াশ'],
  2: ['toner', 'toning', 'টোনার'],
  3: ['serum', 'essence', 'ampoule', 'vitamin c', 'niacinamide', 'সিরাম'],
  4: ['moisturizer', 'moisturiser', 'cream', 'lotion', 'ময়েশ্চারাইজার'],
  5: ['sunscreen', 'sun screen', 'sunblock', 'spf', 'সানস্ক্রিন'],
}

function detectStep(name: string, reason: string): number | null {
  const text = `${name} ${reason}`.toLowerCase()

  // Explicit step number in reason: "Needed for step 3"
  const stepMatch = text.match(/\bstep\s*(\d+)\b/)
  if (stepMatch) return Number(stepMatch[1])

  // Alias-based detection
  for (const [step, aliases] of Object.entries(STEP_ALIASES)) {
    if (aliases.some((a) => text.includes(a))) return Number(step)
  }

  return null
}

async function main() {
  const dryRun = process.argv.includes('--dry-run')
  const blogIdArg = process.argv.find((a) => a.startsWith('--blogId='))?.split('=')[1]?.trim()

  console.log(`Mode: ${dryRun ? 'DRY RUN (no changes)' : 'LIVE'}`)

  const blogs = await prisma.blog.findMany({
    where: blogIdArg ? { id: blogIdArg } : {},
    select: {
      id: true,
      title: true,
      missingProducts: {
        where: { isResolved: false },
        select: { id: true, name: true, reason: true },
      },
      blogProducts: {
        select: { stepOrder: true, role: true },
      },
    },
  })

  const mappedStepsPerBlog = new Map<string, Set<number>>()
  for (const blog of blogs) {
    const steps = new Set(
      blog.blogProducts
        .filter((bp) => bp.role === 'step' && typeof bp.stepOrder === 'number')
        .map((bp) => bp.stepOrder as number)
    )
    mappedStepsPerBlog.set(blog.id, steps)
  }

  const toDelete: string[] = []

  for (const blog of blogs) {
    const mappedSteps = mappedStepsPerBlog.get(blog.id) ?? new Set<number>()
    for (const mp of blog.missingProducts) {
      const step = detectStep(mp.name, mp.reason)
      if (step !== null && mappedSteps.has(step)) {
        console.log(
          `  [false-positive] "${mp.name}" (step ${step}) in "${blog.title.slice(0, 50)}" → will delete`
        )
        toDelete.push(mp.id)
      }
    }
  }

  console.log(`\nFalse-positive missing rows found: ${toDelete.length}`)

  if (!dryRun && toDelete.length > 0) {
    await prisma.missingProduct.deleteMany({ where: { id: { in: toDelete } } })
    console.log(`Deleted ${toDelete.length} rows.`)
  } else if (dryRun) {
    console.log('Dry-run: no changes made.')
  } else {
    console.log('Nothing to delete.')
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
