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
  
  globalForPrisma.pool = new Pool({
    connectionString,
    ssl: {
      rejectUnauthorized: false
    }
  })
}

const adapter = new PrismaPg(globalForPrisma.pool)

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
