/**
 * Prints recommended AZAN_WHOLESALE_MIN_PAGES = ceil(apiTotal / perPage) for full catalog in one run.
 * Usage: node scripts/azan-coverage-hint.mjs
 */
import fs from 'fs'
import path from 'path'

function loadEnv() {
  for (const file of ['.env.local', '.env']) {
    const fullPath = path.join(process.cwd(), file)
    if (!fs.existsSync(fullPath)) continue
    for (const line of fs.readFileSync(fullPath, 'utf8').split('\n')) {
      const t = line.trim()
      if (!t || t.startsWith('#')) continue
      const i = t.indexOf('=')
      if (i === -1) continue
      const k = t.slice(0, i).trim()
      let v = t.slice(i + 1).trim()
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1)
      if (!(k in process.env) || !String(process.env[k]).trim()) process.env[k] = v
    }
  }
}

loadEnv()
const base = (process.env.AZAN_WHOLESALE_BASE_URL || 'https://api.azanwholesale.com').replace(/\/$/, '')
const appId = process.env.AZAN_WHOLESALE_APP_ID
const sec = process.env.AZAN_WHOLESALE_SECRET_KEY
if (!appId || !sec) {
  console.log('Set AZAN_WHOLESALE_APP_ID and AZAN_WHOLESALE_SECRET_KEY in .env.local')
  process.exit(1)
}

const p = process.env.AZAN_WHOLESALE_PRODUCTS_PATH?.trim() || '/api/en/products/by-api?per_page=300&selected_product=0'
const u = new URL(p, base)
u.searchParams.set('page', '1')
u.searchParams.set('app_id', appId)
u.searchParams.set('secret_key', sec)
const r = await fetch(u.toString(), { headers: { Accept: 'application/json', 'App-Id': appId, 'Secret-Key': sec } })
const j = await r.json()
const meta = j?.meta
if (!meta || typeof meta.total !== 'number') {
  console.log('No meta from API. Response:', r.status, JSON.stringify(j).slice(0, 500))
  process.exit(1)
}
const { total, last_page, per_page } = meta
const rec = last_page && per_page ? `AZAN_WHOLESALE_MAX_PAGES should be >= ${last_page} (or >= ${Math.ceil(total / (per_page || 1))})` : `ceil(total/per_page) for one full pull`
console.log('Azan API meta:')
console.log('  total:', total)
console.log('  per_page:', per_page)
console.log('  last_page:', last_page)
console.log('\n' + rec)
console.log(`\nCurrent env: AZAN_WHOLESALE_MAX_PAGES = ${process.env.AZAN_WHOLESALE_MAX_PAGES || '(unset, code default 300)'}`)
