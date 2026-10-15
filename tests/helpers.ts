import { NextRequest } from 'next/server'

type Row = Record<string, unknown>
type Where = Record<string, unknown>

let idCounter = 0
const nextId = (prefix: string) => `${prefix}_${++idCounter}`

function matchesCondition(value: unknown, condition: unknown): boolean {
  if (condition === null) return value === null || value === undefined
  if (condition instanceof Date) return value instanceof Date && value.getTime() === condition.getTime()
  if (typeof condition === 'object' && condition !== null) {
    const c = condition as Record<string, unknown>
    if ('not' in c) return !matchesCondition(value, c.not)
    if ('gt' in c) return (value instanceof Date && value > (c.gt as Date)) || (typeof value === 'number' && value > (c.gt as number))
    if ('lt' in c) return (value instanceof Date && value < (c.lt as Date)) || (typeof value === 'number' && value < (c.lt as number))
    if ('gte' in c) return (value instanceof Date && value >= (c.gte as Date)) || (typeof value === 'number' && value >= (c.gte as number))
    if ('in' in c) return (c.in as unknown[]).includes(value)
  }
  return value === condition
}

function matches(row: Row, where: Where = {}): boolean {
  return Object.entries(where).every(([key, condition]) => {
    if (key === 'OR') return (condition as Where[]).some((w) => matches(row, w))
    if (key === 'AND') return (condition as Where[]).every((w) => matches(row, w))
    return matchesCondition(row[key], condition)
  })
}

function project(row: Row | undefined, select?: Record<string, boolean>): Row | null {
  if (!row) return null
  if (!select) return { ...row }
  return Object.fromEntries(Object.keys(select).filter((k) => select[k]).map((k) => [k, row[k]]))
}

function applyData(row: Row, data: Row) {
  for (const [key, value] of Object.entries(data)) {
    if (value && typeof value === 'object' && 'increment' in (value as Row)) {
      row[key] = ((row[key] as number) ?? 0) + ((value as { increment: number }).increment)
    } else {
      row[key] = value
    }
  }
  row.updatedAt = new Date()
}

function createTable(prefix: string, defaults: () => Row) {
  const rows: Row[] = []
  return {
    rows,
    async findUnique({ where, select }: { where: Where; select?: Record<string, boolean> }) {
      return project(rows.find((r) => matches(r, where)), select)
    },
    async findFirst({ where, orderBy, select }: { where?: Where; orderBy?: Record<string, 'asc' | 'desc'>; select?: Record<string, boolean> }) {
      let found = rows.filter((r) => matches(r, where))
      if (orderBy) {
        const [key, dir] = Object.entries(orderBy)[0]
        found = [...found].sort((a, b) => {
          const av = a[key] as number | Date
          const bv = b[key] as number | Date
          return dir === 'desc' ? Number(bv) - Number(av) : Number(av) - Number(bv)
        })
      }
      return project(found[0], select)
    },
    async count({ where }: { where?: Where }) {
      return rows.filter((r) => matches(r, where)).length
    },
    async create({ data, select }: { data: Row; select?: Record<string, boolean> }) {
      const now = new Date()
      const row: Row = { id: nextId(prefix), createdAt: now, updatedAt: now, ...defaults(), ...data }
      rows.push(row)
      return project(row, select)
    },
    async update({ where, data, select }: { where: Where; data: Row; select?: Record<string, boolean> }) {
      const row = rows.find((r) => matches(r, where))
      if (!row) throw new Error(`${prefix} not found`)
      applyData(row, data)
      return project(row, select)
    },
    async updateMany({ where, data }: { where?: Where; data: Row }) {
      const found = rows.filter((r) => matches(r, where))
      found.forEach((row) => applyData(row, data))
      return { count: found.length }
    },
    async delete({ where }: { where: Where }) {
      const index = rows.findIndex((r) => matches(r, where))
      if (index < 0) throw new Error(`${prefix} not found`)
      return rows.splice(index, 1)[0]
    },
    async deleteMany({ where }: { where?: Where }) {
      const keep = rows.filter((r) => !matches(r, where))
      const count = rows.length - keep.length
      rows.splice(0, rows.length, ...keep)
      return { count }
    },
  }
}

/** In-memory stand-in for the Prisma models used by OTP and signup. */
export function createFakePrisma() {
  return {
    otpSession: createTable('otp', () => ({ attempts: 0, verifiedAt: null })),
    user: createTable('user', () => ({ email: null, role: 'USER' })),
  }
}

/** Prisma stand-in that records and rejects every access, proving a handler never reached the DB. */
export function createForbiddenPrisma() {
  const accessed: string[] = []
  const prisma: unknown = new Proxy(
    {},
    {
      get(_target, prop) {
        if (prop === 'then') return undefined
        accessed.push(String(prop))
        throw new Error(`Database access to "${String(prop)}" is not allowed in this test`)
      },
    }
  )
  return { prisma, accessed }
}

export function jsonRequest(url: string, method: string, body?: unknown, headers: Record<string, string> = {}) {
  return new NextRequest(`http://localhost${url}`, {
    method,
    headers: { 'content-type': 'application/json', ...headers },
    body: body === undefined || method === 'GET' || method === 'HEAD' ? undefined : JSON.stringify(body),
  })
}

export function collectKeys(value: unknown, keys = new Set<string>()): Set<string> {
  if (Array.isArray(value)) value.forEach((v) => collectKeys(v, keys))
  else if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) {
      keys.add(k)
      collectKeys(v, keys)
    }
  }
  return keys
}

export const customerSession = { user: { id: 'customer_1', role: 'USER', phone: '+8801711111111', name: 'Customer' } }
export const adminSession = { user: { id: 'admin_1', role: 'ADMIN', phone: '+8801722222222', name: 'Admin' } }
