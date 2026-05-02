import { prisma } from '@/lib/prisma'

const BATCH = 500

/**
 * অর্ডার আইটেম থেকে anchor→related কো-অকারেন্স গণনা করে টেবিল পুনর্নির্মাণ।
 * Item–item সিগন্যাল (ক্লাসিক CF-স্টাইল) — ক্রনে চালান।
 */
export async function rebuildProductCooccurrence(): Promise<{
  success: boolean
  pairCount: number
  error?: string
}> {
  try {
    const pairs = await prisma.$queryRaw<
      Array<{ anchor: string; related: string; cnt: bigint }>
    >`
      SELECT oi1."productId" AS anchor,
             oi2."productId" AS related,
             COUNT(*)::bigint AS cnt
      FROM "OrderItem" oi1
      INNER JOIN "OrderItem" oi2
        ON oi1."orderId" = oi2."orderId"
      WHERE oi1."productId" IS NOT NULL
        AND oi2."productId" IS NOT NULL
        AND oi1."productId" <> oi2."productId"
      GROUP BY oi1."productId", oi2."productId"
    `

    await prisma.$transaction(async (tx) => {
      await tx.productCooccurrence.deleteMany({})
      for (let i = 0; i < pairs.length; i += BATCH) {
        const chunk = pairs.slice(i, i + BATCH)
        await tx.productCooccurrence.createMany({
          data: chunk.map((p) => ({
            anchorProductId: p.anchor,
            relatedProductId: p.related,
            coOrderCount: Number(p.cnt),
          })),
        })
      }
    })

    return { success: true, pairCount: pairs.length }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    console.error('[rebuildProductCooccurrence]', e)
    return { success: false, pairCount: 0, error: msg }
  }
}
