import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
  pool: Pool | undefined
}

if (!globalForPrisma.pool) {
  const connectionString = process.env.DATABASE_URL
    ?.replace(/[?&]pgbouncer=[^&]*/g, '')
    ?.replace(/[?&]connection_limit=[^&]*/g, '')
    ?.replace(/[?&]sslmode=[^&]*/g, '')

  // Cap pooled connections per Node process — builds can spawn multiple workers each
  // importing this module; default pg Pool(max=10) × many workers hits Supabase (EMAXCONN ~200).
  const parsed = Number(process.env.DATABASE_POOL_MAX)
  const max = Number.isFinite(parsed) && parsed > 0 ? Math.min(parsed, 20) : 5

  globalForPrisma.pool = new Pool({
    connectionString,
    max,
    ssl: { rejectUnauthorized: false },
    idleTimeoutMillis: 20_000,
    connectionTimeoutMillis: 20_000,
  })
}

const adapter = new PrismaPg(globalForPrisma.pool)

if (!globalForPrisma.prisma) {
  globalForPrisma.prisma = new PrismaClient({ adapter })
}

export const prisma = globalForPrisma.prisma
