import { prisma } from '@/lib/prisma'
import { Footer } from '@/components/Footer'

export async function SiteFooter() {
  const quickLinksPages = await prisma.page.findMany({
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

  const supportPages = await prisma.page.findMany({
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

  return <Footer quickLinksPages={quickLinksPages} supportPages={supportPages} />
}
