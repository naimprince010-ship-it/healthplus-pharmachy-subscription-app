import 'server-only'

import type { BlogSponsorAd } from '@prisma/client'
import { BlogSponsorPlacement } from '@prisma/client'
import { prisma } from '@/lib/prisma'

/** One active sponsor per placement: highest priority, then freshest. */
export async function getActiveBlogSponsorAd(
  placement: BlogSponsorPlacement
): Promise<BlogSponsorAd | null> {
  const now = new Date()

  const rows = await prisma.blogSponsorAd.findMany({
    where: {
      isActive: true,
      placement,
      AND: [
        { OR: [{ startAt: null }, { startAt: { lte: now } }] },
        { OR: [{ endAt: null }, { endAt: { gte: now } }] },
      ],
    },
    orderBy: [{ priority: 'desc' }, { updatedAt: 'desc' }],
    take: 1,
  })

  return rows[0] ?? null
}
