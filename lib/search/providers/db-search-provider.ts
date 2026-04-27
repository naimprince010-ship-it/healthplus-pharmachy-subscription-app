import { getTopProducts, searchProducts, searchProductsByPrefix } from '@/lib/search-index'
import type { SearchProvider } from './types'

/**
 * Phase 2 default provider: current Prisma/DB-backed search implementation.
 */
export const dbSearchProvider: SearchProvider = {
  async getTopProducts(limit) {
    return getTopProducts(limit)
  },

  async searchProducts(query, limit) {
    return searchProducts(query, limit)
  },

  async searchProductsByPrefix(query, limit) {
    return searchProductsByPrefix(query, limit)
  },
}

