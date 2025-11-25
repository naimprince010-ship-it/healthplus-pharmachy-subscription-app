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

  if (section.filterType === 'category' && section.categoryId) {
    return {
      ...baseWhere,
      categoryId: section.categoryId,
    }
  }

  if (section.filterType === 'brand' && section.brandName) {
    return {
      ...baseWhere,
      brandName: section.brandName,
    }
  }

  if (section.filterType === 'manual' && section.productIds) {
    const ids = Array.isArray(section.productIds) ? section.productIds : []
    return {
      ...baseWhere,
      id: { in: ids },
    }
  }

  return baseWhere
}
