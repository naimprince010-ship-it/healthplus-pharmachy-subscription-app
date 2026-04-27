import type { SearchResult, SearchableProduct } from '@/lib/search-index'

export interface SearchProvider {
  /**
   * Get top products for empty query states.
   */
  getTopProducts(limit: number): Promise<{ products: SearchableProduct[] }>

  /**
   * Full query search (>= 2 chars and fuzzy logic).
   */
  searchProducts(query: string, limit: number): Promise<SearchResult[]>

  /**
   * Lightweight prefix search for one-character queries.
   */
  searchProductsByPrefix(query: string, limit: number): Promise<SearchResult[]>
}

