import type { Prisma } from '@prisma/client'

/** Azan product list: numeric catalog id (POST /api/orders/store `supplier_product_id`). */
export function parseAzanWholesaleProductNumericId(item: Record<string, unknown>): number | null {
  for (const k of ['id', 'product_id', 'supplier_product_id'] as const) {
    const c = item[k]
    if (typeof c === 'number' && Number.isInteger(c) && c > 0) {
      return c
    }
    if (typeof c === 'string' && /^\d+$/.test(c.trim())) {
      const n = parseInt(c.trim(), 10)
      if (n > 0) return n
    }
  }
  return null
}

/**
 * Reseller "bucket" category name (env or default). Products without a mapping
 * land here; mapped products use other local categories but stay Azan-sourced.
 */
export function getAzanResellerCategoryName() {
  return (process.env.AZAN_WHOLESALE_CATEGORY || 'Azan Wholesale').trim()
}

/**
 * In-memory: product came from Azan sync (default category, supplier line id, or
 * source category text). Used for order forwarding and UI logic.
 */
export function isProductLinkedToAzanCatalog(
  p: {
    supplierSku: string | null
    sourceCategoryName: string | null
    category: { name: string }
  },
  resellerCategory: string = getAzanResellerCategoryName()
): boolean {
  if (p.category.name === resellerCategory) return true
  if (p.supplierSku?.trim()) return true
  if (p.sourceCategoryName?.trim()) return true
  return false
}

const nonEmpty = (field: 'supplierSku' | 'sourceCategoryName'): Prisma.ProductWhereInput => ({
  AND: [{ [field]: { not: null } }, { NOT: { [field]: { equals: '' } } }],
})

/**
 * All rows that belong to the Azan catalog: default reseller category and/or
 * supplier fields set by sync (mapped products may sit in any local category).
 */
export function prismaWhereAzanCatalogProducts(): Prisma.ProductWhereInput {
  const name = getAzanResellerCategoryName()
  return {
    deletedAt: null,
    OR: [{ category: { is: { name } } }, nonEmpty('supplierSku'), nonEmpty('sourceCategoryName')],
  }
}
