import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { Footer } from '@/components/Footer'

export async function SiteFooter() {
  let quickLinksPages
  let supportPages

  try {
    quickLinksPages = await prisma.page.findMany({
      where: {
        group: 'QUICK_LINKS',
        isPublished: true,
      },
      orderBy: { sortOrder: 'asc' },
      select: {
        id: true,
        title: true,
        slug: true,
      },
    })

    supportPages = await prisma.page.findMany({
      where: {
        group: 'SUPPORT',
        isPublished: true,
      },
      orderBy: { sortOrder: 'asc' },
      select: {
        id: true,
        title: true,
        slug: true,
      },
    })
  } catch (err) {
    // Handle case where Page table doesn't exist yet (before migration)
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === 'P2021'
    ) {
      console.warn(
        'Page table does not exist yet; skipping dynamic footer pages.',
      )
      // Leave quickLinksPages/supportPages undefined so Footer falls back to static links
    } else {
      throw err
    }
  }

  return <Footer quickLinksPages={quickLinksPages} supportPages={supportPages} />
}
