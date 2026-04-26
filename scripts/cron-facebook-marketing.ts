/**
 * Local / VM cron: run the same job as the API route (no HTTP).
 *
 * Examples:
 *   npx tsx scripts/cron-facebook-marketing.ts
 *   npx tsx scripts/cron-facebook-marketing.ts random
 *   npx tsx scripts/cron-facebook-marketing.ts newest --dry-run
 *
 * Load env: set DATABASE_URL, OPENAI_API_KEY, CRON_*, etc. in the shell
 * or use your existing .env.local (e.g. dotenv-cli: dotenv -e .env.local -- npx tsx ...)
 */

import { runFacebookMarketingJob, type FacebookMarketingMode } from '../lib/facebook-marketing'

function parseArgs(): { mode: FacebookMarketingMode; dryRun: boolean } {
  const argv = process.argv.slice(2)
  const dryRun = argv.includes('--dry-run') || argv.includes('--dry')
  const modeArg = argv.find((a) => a === 'newest' || a === 'random')
  return {
    mode: modeArg === 'random' ? 'random' : 'newest',
    dryRun,
  }
}

async function main() {
  const { mode, dryRun } = parseArgs()
  const out = await runFacebookMarketingJob({ mode, dryRun })
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(out, null, 2))
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e)
  process.exit(1)
})
