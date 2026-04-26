import { Prisma } from '@prisma/client'

export interface HomeSection {
  id: string
  title: string
  slug: string
  filterType: string
  categoryId: string | null
  brandName: string | null
  productIds: any
  maxProducts: number
  bgColor: string | null
  badgeText: string | null
  sortOrder: number
  isActive: boolean
}

/**
 * Build Prisma where clause for products based on HomeSection filter type
 */
export function buildProductWhereClause(section: HomeSection): Prisma.ProductWhereInput {
  const baseWhere: Prisma.ProductWhereInput = {
    isActive: true,
    stockQuantity: { gt: 0 },
  }

  if (section.filterType === 'category') {
    // Guardrail: if category filter is selected but categoryId is missing,
    // return no products instead of leaking products from other categories.
    if (!section.categoryId) {
      return {
        ...baseWhere,
        id: { in: [] },
      }
    }
    return {
      ...baseWhere,
      categoryId: section.categoryId,
    }
  }

  if (section.filterType === 'brand') {
    // Guardrail: missing brand should not fallback to all products.
    if (!section.brandName?.trim()) {
      return {
        ...baseWhere,
        id: { in: [] },
      }
    }
    return {
      ...baseWhere,
      brandName: section.brandName,
    }
  }

  if (section.filterType === 'manual') {
    // For manual sections, always filter by productIds
    // If productIds is empty/null, return no products (not all products)
    const ids = Array.isArray(section.productIds) ? section.productIds : []
    return {
      ...baseWhere,
      id: { in: ids },
    }
  }

  return baseWhere
}
