const baseUrl = process.argv[2] ?? process.env.SMOKE_BASE_URL

if (!baseUrl) {
  console.error('Usage: npm run smoke:production -- https://example.com')
  process.exit(2)
}

const base = new URL(baseUrl)
const timeoutMs = Number(process.env.SMOKE_TIMEOUT_MS ?? 15_000)

const checks = [
  { path: '/', status: 200, kind: 'html' },
  { path: '/products', status: 200, kind: 'html' },
  { path: '/cart', status: 200, kind: 'html' },
  { path: '/checkout', status: 200, kind: 'html' },
  { path: '/api/db-health', status: 200, kind: 'health' },
  { path: '/api/products', status: 200, kind: 'json' },
  { path: '/api/admin/products', status: 401, kind: 'unauthorized' },
  { path: '/api/prescriptions', status: 401, kind: 'unauthorized' },
]

async function checkRoute(check) {
  const url = new URL(check.path, base)
  const response = await fetch(url, {
    redirect: 'follow',
    signal: AbortSignal.timeout(timeoutMs),
    headers: { 'user-agent': 'halalzi-release-smoke/1.0' },
  })
  const body = await response.text()

  if (response.status !== check.status) {
    throw new Error(`${check.path}: expected ${check.status}, received ${response.status}`)
  }
  if (/Internal Server Error|Application error/i.test(body)) {
    throw new Error(`${check.path}: server error marker found`)
  }
  if (check.kind === 'html' && !/<html/i.test(body)) {
    throw new Error(`${check.path}: expected an HTML document`)
  }

  if (check.kind === 'health') {
    const payload = JSON.parse(body)
    if (payload.status !== 'healthy') {
      throw new Error(`${check.path}: database is not healthy`)
    }
  }

  if (check.kind === 'unauthorized') {
    const payload = JSON.parse(body)
    if (payload.error !== 'Unauthorized') {
      throw new Error(`${check.path}: protected endpoint did not return Unauthorized`)
    }
  }

  return { path: check.path, status: response.status, bytes: Buffer.byteLength(body) }
}

const results = []
for (const check of checks) {
  results.push(await checkRoute(check))
}

console.table(results)
console.log(`Smoke checks passed for ${base.origin}`)
