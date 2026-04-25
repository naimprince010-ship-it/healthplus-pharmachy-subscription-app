import fs from 'fs'
import path from 'path'
import { randomUUID } from 'crypto'
import { Pool } from 'pg'
import { getAllDistricts } from '@/lib/bd-locations'
import { resolveDeliveryChargeByZoneName } from '@/lib/delivery-charge'

function loadLocalEnv() {
  const root = process.cwd()
  for (const file of ['.env.local', '.env']) {
    const fullPath = path.join(root, file)
    if (!fs.existsSync(fullPath)) continue
    for (const line of fs.readFileSync(fullPath, 'utf8').split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const i = trimmed.indexOf('=')
      if (i === -1) continue
      const key = trimmed.slice(0, i).trim()
      let value = trimmed.slice(i + 1).trim()
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1)
      }
      if (!(key in process.env)) process.env[key] = value
    }
  }
}

function buildPoolConnectionString(url: string) {
  return url
    .replace(/[?&]pgbouncer=[^&]*/g, '')
    .replace(/[?&]connection_limit=[^&]*/g, '')
    .replace(/[?&]sslmode=[^&]*/g, '')
}

async function main() {
  loadLocalEnv()
  if (!process.env.DATABASE_URL) throw new Error('Missing DATABASE_URL in .env.local/.env')

  const pool = new Pool({
    connectionString: buildPoolConnectionString(process.env.DATABASE_URL),
    ssl: { rejectUnauthorized: false },
  })

  const districts = getAllDistricts().sort((a, b) => a.name.localeCompare(b.name))
  let changed = 0

  for (let i = 0; i < districts.length; i += 1) {
    const district = districts[i]
    const charge = resolveDeliveryChargeByZoneName(district.name)
    const deliveryDays = charge === 70 ? '1-2 days' : '2-4 days'
    const description = `Auto-synced district zone (${district.name})`

    await pool.query(
      `
      INSERT INTO "Zone" ("id", "name", "description", "deliveryCharge", "deliveryFee", "deliveryDays", "isActive", "sortOrder", "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, $5, $6, TRUE, $7, NOW(), NOW())
      ON CONFLICT ("name")
      DO UPDATE SET
        "description" = EXCLUDED."description",
        "deliveryCharge" = EXCLUDED."deliveryCharge",
        "deliveryFee" = EXCLUDED."deliveryFee",
        "deliveryDays" = EXCLUDED."deliveryDays",
        "isActive" = TRUE,
        "sortOrder" = EXCLUDED."sortOrder",
        "updatedAt" = NOW()
      `,
      [`zone_${randomUUID().replace(/-/g, '')}`, district.name, description, charge, charge, deliveryDays, i + 1],
    )
    changed++
  }

  console.log(
    JSON.stringify(
      {
        message: 'District zones synced successfully',
        districtCount: districts.length,
        rowsProcessed: changed,
      },
      null,
      2,
    ),
  )

  await pool.end()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
