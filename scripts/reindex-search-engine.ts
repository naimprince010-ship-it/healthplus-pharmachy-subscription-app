import { isSearchEngineSyncEnabled, reindexAllProductsToSearchEngine } from '../lib/search/engine-sync'

async function main() {
  const batchSize = Number(process.env.SEARCH_REINDEX_BATCH_SIZE || 500)
  const maxBatches = Number(process.env.SEARCH_REINDEX_MAX_BATCHES || 500)

  if (!isSearchEngineSyncEnabled()) {
    throw new Error('Search engine sync is disabled. Set SEARCH_PROVIDER=engine and SEARCH_ENGINE_ENDPOINT.')
  }

  console.log(`Starting search reindex. batchSize=${batchSize} maxBatches=${maxBatches}`)
  const summary = await reindexAllProductsToSearchEngine({ batchSize, maxBatches })
  console.log(`Done. indexed=${summary.indexed} failed=${summary.failed} batches=${summary.batches}`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})

