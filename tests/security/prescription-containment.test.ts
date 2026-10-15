import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { adminSession, collectKeys, customerSession } from '../helpers'

const LEGACY_PUBLIC_URL =
  'https://project.supabase.co/storage/v1/object/public/healthplus/prescriptions/1700000000000-abc123.pdf'

const h = vi.hoisted(() => ({
  session: null as unknown,
  userWrites: [] as string[],
  uploads: [] as string[],
  created: [] as Record<string, unknown>[],
  signed: [] as { path: string; ttl: number }[],
  stored: [] as Record<string, unknown>[],
}))

vi.mock('@/lib/auth', () => ({ auth: vi.fn(async () => h.session) }))

vi.mock('@/lib/prisma', () => {
  const userWrite = (op: string) =>
    vi.fn(async () => {
      h.userWrites.push(op)
      throw new Error('user must not be written by prescription upload')
    })
  return {
    prisma: {
      user: { upsert: userWrite('upsert'), create: userWrite('create'), update: userWrite('update') },
      prescription: {
        create: vi.fn(async ({ data, select }: { data: Record<string, unknown>; select?: Record<string, boolean> }) => {
          const row = { id: 'rx_1', createdAt: new Date(), ...data }
          h.created.push(row)
          return select ? Object.fromEntries(Object.keys(select).map((k) => [k, (row as Record<string, unknown>)[k]])) : row
        }),
        findMany: vi.fn(async () => h.stored),
        findUnique: vi.fn(async () => h.stored[0] ?? null),
      },
    },
  }
})

vi.mock('@/lib/supabase', () => ({
  validatePrescriptionFile: vi.fn(() => ({ valid: true })),
  uploadPrescriptionFile: vi.fn(async (file: File) => {
    h.uploads.push(file.name)
    return { path: 'prescriptions/0b5c9a1e-uuid.pdf', mimeType: 'application/pdf', size: file.size }
  }),
  deletePrescriptionFile: vi.fn(async () => undefined),
  supabaseAdmin: {
    storage: {
      from: () => ({
        createSignedUrl: vi.fn(async (path: string, ttl: number) => {
          h.signed.push({ path, ttl })
          return { data: { signedUrl: `https://project.supabase.co/storage/v1/object/sign/healthplus/${path}?token=t` }, error: null }
        }),
      }),
    },
  },
}))

vi.mock('@/lib/notifications', () => ({
  sendSMS: vi.fn(async () => true),
  sendEmail: vi.fn(async () => true),
  notifyAdmin: vi.fn(async () => true),
}))

function uploadRequest(phone: string) {
  const form = new FormData()
  form.set('name', 'Rx Customer')
  form.set('phone', phone)
  form.set('zoneId', 'zone_1')
  form.set('file', new File([new Uint8Array([0x25, 0x50, 0x44, 0x46])], 'rx.pdf', { type: 'application/pdf' }))
  return new NextRequest('http://localhost/api/prescriptions', { method: 'POST', body: form })
}

async function upload(phone: string) {
  const { POST } = await import('@/app/api/prescriptions/route')
  return POST(uploadRequest(phone))
}

beforeEach(() => {
  h.session = null
  h.userWrites.length = 0
  h.uploads.length = 0
  h.created.length = 0
  h.signed.length = 0
  h.stored = []
})

describe('guest prescription uploads', () => {
  it('cannot attach to an existing account by phone (rejected before upload or any user write)', async () => {
    const res = await upload('01799999999')
    expect(res.status).toBe(401)
    expect((await res.json()).code).toBe('LOGIN_REQUIRED')
    expect(h.userWrites).toEqual([])
    expect(h.uploads).toEqual([])
    expect(h.created).toEqual([])
  })
})

describe('authenticated prescription uploads', () => {
  it("are owned by the session user even when another person's phone is submitted", async () => {
    h.session = customerSession
    const res = await upload('01799999999')
    expect(res.status).toBe(200)
    expect(h.userWrites).toEqual([])
    expect(h.created).toHaveLength(1)
    expect(h.created[0].userId).toBe(customerSession.user.id)
  })

  it('response is a receipt only: no file URL, path or personal data', async () => {
    h.session = customerSession
    const res = await upload('01711111111')
    const body = await res.json()

    expect(body).toEqual({ success: true, receiptId: 'rx_1', status: 'NEW' })
    const keys = collectKeys(body)
    for (const forbidden of ['fileUrl', 'url', 'path', 'phone', 'name', 'userId', 'prescription']) {
      expect(keys.has(forbidden), forbidden).toBe(false)
    }
    expect(JSON.stringify(body)).not.toMatch(/https?:\/\/|prescriptions\//)
  })

  it('stores a private object path, never a public URL', async () => {
    h.session = customerSession
    await upload('01711111111')
    expect(h.created[0].fileUrl).toBe('prescriptions/0b5c9a1e-uuid.pdf')
    expect(String(h.created[0].fileUrl)).not.toMatch(/^https?:/)
  })
})

describe('prescription file access uses short-lived signed URLs', () => {
  it('normalizes legacy public URLs and new object paths; rejects traversal', async () => {
    const { toPrescriptionObjectPath } = await import('@/lib/prescription-files')
    expect(toPrescriptionObjectPath(LEGACY_PUBLIC_URL)).toBe('prescriptions/1700000000000-abc123.pdf')
    expect(toPrescriptionObjectPath('prescriptions/x.pdf')).toBe('prescriptions/x.pdf')
    expect(toPrescriptionObjectPath('prescriptions/../secrets.txt')).toBeNull()
    expect(toPrescriptionObjectPath('https://evil.example/whatever.pdf')).toBeNull()
    expect(toPrescriptionObjectPath('')).toBeNull()
  })

  it('admin list returns signed URLs (<= 10 min), never the stored public URL', async () => {
    h.session = adminSession
    h.stored = [
      { id: 'rx_legacy', fileUrl: LEGACY_PUBLIC_URL, user: { name: 'A', phone: '+8801711111111' } },
      { id: 'rx_new', fileUrl: 'prescriptions/new.pdf', user: { name: 'B', phone: '+8801722222222' } },
    ]
    const { GET } = await import('@/app/api/prescriptions/route')
    const body = await (await GET()).json()

    const urls = body.prescriptions.map((p: { fileUrl: string }) => p.fileUrl)
    expect(urls.every((u: string) => u.includes('/object/sign/'))).toBe(true)
    expect(JSON.stringify(body)).not.toContain('/object/public/')
    expect(h.signed.map((s) => s.path)).toEqual(['prescriptions/1700000000000-abc123.pdf', 'prescriptions/new.pdf'])
    expect(h.signed.every((s) => s.ttl > 0 && s.ttl <= 600)).toBe(true)
  })

  it('admin detail returns a signed URL', async () => {
    h.session = adminSession
    h.stored = [{ id: 'rx_legacy', fileUrl: LEGACY_PUBLIC_URL, user: null, items: [], order: null }]
    const { GET } = await import('@/app/api/admin/prescriptions/[id]/route')
    const res = await GET(new NextRequest('http://localhost/api/admin/prescriptions/rx_legacy'), {
      params: Promise.resolve({ id: 'rx_legacy' }),
    })
    const body = await res.json()
    expect(body.prescription.fileUrl).toContain('/object/sign/')
    expect(JSON.stringify(body)).not.toContain('/object/public/')
  })
})
