import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { GROCERY_CATEGORY_SLUG, isGroceryShopEnabled, isMedicineShopEnabled } from '@/lib/site-features'

export type CartSuggestionProduct = {
  id: string
  name: string
  slug: string
  imageUrl: string | null
  price: number
  mrp: number | null
}

const DEFAULT_LIMIT = 12
const CO_PURCHASE_SAMPLE = 40
/** লগইন ইউজারের পুরনো কেনা পণ্য — co-purchase anchor হিসেবে */
const MAX_HISTORY_ANCHORS = 24

function buildCatalogWhere(extra: Record<string, unknown> = {}): Record<string, unknown> {
  const w: Record<string, unknown> = {
    deletedAt: null,
    isActive: true,
    stockQuantity: { gt: 0 },
    ...extra,
  }
  if (!isMedicineShopEnabled()) {
    w.type = 'GENERAL'
  }
  if (!isGroceryShopEnabled()) {
    w.NOT = { category: { slug: GROCERY_CATEGORY_SLUG } }
  }
  return w
}

/**
 * Cart লাইন আইডি (productId বা medicineId) থেকে কনটেক্সট — ইঞ্জিন সিড ও এক্সক্লুড।
 */
export async function resolveCartContextForSuggestions(rawIds: string[]): Promise<{
  productIdsInCart: string[]
  categoryIdsFromLegacyMedicine: string[]
}> {
  const ids = [...new Set(rawIds.filter(Boolean))]
  if (ids.length === 0) {
    return { productIdsInCart: [], categoryIdsFromLegacyMedicine: [] }
  }

  const [products, medicines] = await Promise.all([
    prisma.product.findMany({
      where: { id: { in: ids }, deletedAt: null },
      select: { id: true },
    }),
    prisma.medicine.findMany({
      where: { id: { in: ids } },
      select: { productId: true, categoryId: true },
    }),
  ])

  const productIdsInCart = new Set<string>()
  const categoryIdsFromLegacyMedicine = new Set<string>()

  for (const p of products) {
    productIdsInCart.add(p.id)
  }
  for (const m of medicines) {
    if (m.productId) {
      productIdsInCart.add(m.productId)
    } else {
      categoryIdsFromLegacyMedicine.add(m.categoryId)
    }
  }

  return {
    productIdsInCart: [...productIdsInCart],
    categoryIdsFromLegacyMedicine: [...categoryIdsFromLegacyMedicine],
  }
}

/** ইউজারের সাম্প্রতিক অর্ডার থেকে Product আইডি — সরাসরি `productId` বা লিগেসি `medicineId` → `Medicine.productId` */
export async function getRecentPurchasedProductIds(
  userId: string,
  take: number
): Promise<string[]> {
  if (!userId || take <= 0) return []

  const rows = await prisma.orderItem.findMany({
    where: {
      order: { userId },
      OR: [{ productId: { not: null } }, { medicineId: { not: null } }],
    },
    select: {
      productId: true,
      medicineId: true,
      order: { select: { createdAt: true } },
    },
    orderBy: { order: { createdAt: 'desc' } },
    take: 400,
  })

  const medicineIdsNeedingResolve = new Set<string>()
  for (const r of rows) {
    if (!r.productId && r.medicineId) {
      medicineIdsNeedingResolve.add(r.medicineId)
    }
  }

  let medicineToProduct = new Map<string, string>()
  if (medicineIdsNeedingResolve.size > 0) {
    const meds = await prisma.medicine.findMany({
      where: {
        id: { in: [...medicineIdsNeedingResolve] },
        productId: { not: null },
      },
      select: { id: true, productId: true },
    })
    medicineToProduct = new Map(
      meds.map((m) => [m.id, m.productId!])
    )
  }

  const seen = new Set<string>()
  const out: string[] = []
  for (const r of rows) {
    const pid =
      r.productId ?? (r.medicineId ? medicineToProduct.get(r.medicineId) : undefined)
    if (!pid || seen.has(pid)) continue
    seen.add(pid)
    out.push(pid)
    if (out.length >= take) break
  }
  return out
}

async function fetchProductsByIdsOrdered(ids: string[]): Promise<CartSuggestionProduct[]> {
  if (ids.length === 0) return []
  const rows = await prisma.product.findMany({
    where: {
      ...buildCatalogWhere(),
      id: { in: ids },
    },
    select: {
      id: true,
      name: true,
      slug: true,
      imageUrl: true,
      sellingPrice: true,
      mrp: true,
    },
  })
  const map = new Map(rows.map((r) => [r.id, r]))
  const out: CartSuggestionProduct[] = []
  for (const id of ids) {
    const r = map.get(id)
    if (!r) continue
    out.push({
      id: r.id,
      name: r.name,
      slug: r.slug,
      imageUrl: r.imageUrl,
      price: r.sellingPrice,
      mrp: r.mrp,
    })
  }
  return out
}

/**
 * ক্রনে বিল্ড করা ProductCooccurrence টেবিল থেকে item–item র্যাঙ্ক
 * (একাধিক anchor থেকে related স্কোর যোগ)।
 */
async function coPurchaseFromMaterialized(
  seedProductIds: string[],
  exclude: Set<string>,
  take: number
): Promise<string[]> {
  if (seedProductIds.length === 0 || take <= 0) return []

  const rows = await prisma.productCooccurrence.findMany({
    where: {
      anchorProductId: { in: seedProductIds },
      ...(exclude.size > 0
        ? { relatedProductId: { notIn: [...exclude] } }
        : {}),
    },
    select: { relatedProductId: true, coOrderCount: true },
  })

  const score = new Map<string, number>()
  for (const r of rows) {
    if (exclude.has(r.relatedProductId)) continue
    score.set(
      r.relatedProductId,
      (score.get(r.relatedProductId) || 0) + r.coOrderCount
    )
  }

  return [...score.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([id]) => id)
    .slice(0, take)
}

/** একই অর্ডারে একসাথে কেনা পণ্য — লাইভ SQL (টপ-আপ / টেবিল খালি হলে) */
async function coPurchaseProductIds(
  seedProductIds: string[],
  exclude: Set<string>
): Promise<string[]> {
  if (seedProductIds.length === 0) return []

  const rows = await prisma.$queryRaw<Array<{ productId: string; cnt: bigint }>>`
    SELECT oi2."productId", COUNT(*)::bigint AS cnt
    FROM "OrderItem" oi1
    INNER JOIN "OrderItem" oi2
      ON oi1."orderId" = oi2."orderId"
      AND oi2."productId" IS NOT NULL
    WHERE oi1."productId" IN (${Prisma.join(seedProductIds)})
      AND oi2."productId" IS NOT NULL
      AND oi2."productId" <> oi1."productId"
    GROUP BY oi2."productId"
    ORDER BY cnt DESC
    LIMIT ${CO_PURCHASE_SAMPLE}
  `

  const ordered: string[] = []
  for (const r of rows) {
    if (exclude.has(r.productId)) continue
    ordered.push(r.productId)
  }
  return ordered
}

async function categoryNeighborIds(
  productIdsInCart: string[],
  extraCategoryIds: string[],
  exclude: Set<string>,
  take: number
): Promise<string[]> {
  const seeds = await prisma.product.findMany({
    where: { id: { in: productIdsInCart } },
    select: { categoryId: true },
  })
  const catIds = new Set<string>()
  for (const s of seeds) {
    catIds.add(s.categoryId)
  }
  for (const c of extraCategoryIds) {
    catIds.add(c)
  }
  if (catIds.size === 0) return []

  const excludeList = [...exclude]
  const rows = await prisma.product.findMany({
    where: {
      ...buildCatalogWhere(),
      categoryId: { in: [...catIds] },
      ...(excludeList.length > 0 ? { id: { notIn: excludeList } } : {}),
    },
    select: { id: true },
    orderBy: [{ popularityScore: 'desc' }, { stockQuantity: 'desc' }],
    take,
  })
  return rows.map((r) => r.id)
}

async function popularityFallbackIds(exclude: Set<string>, take: number): Promise<string[]> {
  const excludeList = [...exclude]
  const rows = await prisma.product.findMany({
    where: {
      ...buildCatalogWhere(),
      ...(excludeList.length > 0 ? { id: { notIn: excludeList } } : {}),
    },
    select: { id: true },
    orderBy: [{ popularityScore: 'desc' }, { stockQuantity: 'desc' }],
    take,
  })
  return rows.map((r) => r.id)
}

/**
 * ম্যানুয়াল সাজেশন না থাকলে: ম্যাটেরিয়ালাইজড co-purchase → লাইভ co-purchase → ক্যাটাগরি → পপুলারিটি।
 * `userId` থাকলে সাম্প্রতিক কেনা পণ্যগুলোও co-purchase সিড (ব্যক্তিগতকরণ)।
 */
export async function getEngineCartSuggestions(options: {
  cartLineIds: string[]
  limit?: number
  userId?: string | null
}): Promise<CartSuggestionProduct[]> {
  const limit = options.limit ?? DEFAULT_LIMIT
  const { productIdsInCart, categoryIdsFromLegacyMedicine } =
    await resolveCartContextForSuggestions(options.cartLineIds)

  let historyAnchors: string[] = []
  if (options.userId) {
    historyAnchors = await getRecentPurchasedProductIds(
      options.userId,
      MAX_HISTORY_ANCHORS
    )
  }

  const seedForCoPurchase = [
    ...new Set([...productIdsInCart, ...historyAnchors]),
  ]
  const categorySeedProducts = [
    ...new Set([...productIdsInCart, ...historyAnchors]),
  ]

  const exclude = new Set(productIdsInCart)
  const orderedIds: string[] = []

  const pushUnique = (ids: string[]) => {
    for (const id of ids) {
      if (exclude.has(id) || orderedIds.includes(id)) continue
      orderedIds.push(id)
      if (orderedIds.length >= limit) return
    }
  }

  // 1) ম্যাটেরিয়ালাইজড co-purchase (ক্রন: /api/cron/rebuild-product-cooccurrence)
  const coMat = await coPurchaseFromMaterialized(
    seedForCoPurchase,
    exclude,
    CO_PURCHASE_SAMPLE
  )
  pushUnique(coMat)

  // 2) লাইভ অর্ডার জয়েন (টেবিল খালি / নতুন পণ্য টপ-আপ)
  if (orderedIds.length < limit && seedForCoPurchase.length > 0) {
    const coLive = await coPurchaseProductIds(
      seedForCoPurchase,
      new Set([...exclude, ...orderedIds])
    )
    pushUnique(coLive)
  }

  if (orderedIds.length < limit) {
    // 3) কার্ট + (লগইন হলে) ইতিহাসের ক্যাটাগরি / লিগেসি মেডিসিন ক্যাটাগরি
    const need = limit - orderedIds.length
    const neighbor = await categoryNeighborIds(
      categorySeedProducts,
      categoryIdsFromLegacyMedicine,
      new Set([...exclude, ...orderedIds]),
      need + 8
    )
    pushUnique(neighbor)
  }

  if (orderedIds.length < limit) {
    const need = limit - orderedIds.length
    const pop = await popularityFallbackIds(
      new Set([...exclude, ...orderedIds]),
      need + 8
    )
    pushUnique(pop)
  }

  const slice = orderedIds.slice(0, limit)
  const products = await fetchProductsByIdsOrdered(slice)
  const byId = new Map(products.map((p) => [p.id, p]))
  const result: CartSuggestionProduct[] = []
  for (const id of slice) {
    const p = byId.get(id)
    if (p) result.push(p)
  }
  return result
}
