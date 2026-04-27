import { dbSearchProvider } from './db-search-provider'
import { engineSearchProvider } from './engine-search-provider'
import type { SearchProvider } from './types'

type ProviderKey = 'db' | 'engine'

/**
 * Search provider resolver.
 * Phase 3: `engine` routes to external search engine with DB fallback.
 */
export function getSearchProvider(): SearchProvider {
  const key = ((process.env.SEARCH_PROVIDER || 'db').trim().toLowerCase() as ProviderKey)

  if (key === 'engine') {
    return engineSearchProvider
  }

  return dbSearchProvider
}

