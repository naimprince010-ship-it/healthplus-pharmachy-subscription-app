import type { Prisma } from '@prisma/client'

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
