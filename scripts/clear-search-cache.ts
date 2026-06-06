/**
 * Clears search-related Redis cache keys so newly imported products appear in search immediately.
 * Run: npx tsx --env-file=.env scripts/clear-search-cache.ts
 */
import { invalidateCache } from '../lib/cache'

const CACHE_KEYS = [
  'search:top-products',
  'search:dictionary',
]

async function main() {
  console.log('Clearing search cache keys...')
  for (const key of CACHE_KEYS) {
    try {
      await invalidateCache(key)
      console.log(`  ✅ Cleared: ${key}`)
    } catch (err) {
      console.error(`  ❌ Failed: ${key}`, err)
    }
  }
  console.log('\nDone! Search will now query the DB fresh for next request.')
  console.log('Note: Per-query caches (search:query:*) will expire naturally within 1 hour.')
}

main().catch(console.error)
