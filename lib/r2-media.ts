import 'server-only'

import { createHash, createHmac, randomUUID } from 'node:crypto'
import sharp from 'sharp'

const MAX_IMAGE_BYTES = 2 * 1024 * 1024
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp'])

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim()
  if (!value) throw new Error(`${name} is not configured`)
  return value
}

function config() {
  const accountId = requiredEnv('R2_ACCOUNT_ID')
  return {
    bucket: process.env.R2_BUCKET_NAME?.trim() || 'halalzi-media',
    endpoint: process.env.R2_ENDPOINT?.trim() || `https://${accountId}.r2.cloudflarestorage.com`,
    accessKeyId: requiredEnv('R2_ACCESS_KEY_ID'),
    secretAccessKey: requiredEnv('R2_SECRET_ACCESS_KEY'),
  }
}

function sha256(value: string | Buffer): string {
  return createHash('sha256').update(value).digest('hex')
}

function hmac(key: string | Buffer, value: string): Buffer {
  return createHmac('sha256', key).update(value).digest()
}

function encodedKey(key: string): string {
  return key.split('/').map(encodeURIComponent).join('/')
}

async function r2Request(method: 'PUT' | 'DELETE', key: string, body?: Buffer): Promise<void> {
  const current = config()
  const endpoint = new URL(current.endpoint)
  const pathname = `/${encodeURIComponent(current.bucket)}/${encodedKey(key)}`
  const now = new Date()
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '')
  const date = amzDate.slice(0, 8)
  const payloadHash = sha256(body || '')
  const headers: Record<string, string> = {
    host: endpoint.host,
    'x-amz-content-sha256': payloadHash,
    'x-amz-date': amzDate,
  }
  if (body) {
    headers['cache-control'] = 'public, max-age=31536000, immutable'
    headers['content-type'] = 'image/webp'
  }
  const signedHeaders = Object.keys(headers).sort()
  const canonicalHeaders = signedHeaders.map((name) => `${name}:${headers[name].trim()}\n`).join('')
  const canonicalRequest = [method, pathname, '', canonicalHeaders, signedHeaders.join(';'), payloadHash].join('\n')
  const scope = `${date}/auto/s3/aws4_request`
  const stringToSign = ['AWS4-HMAC-SHA256', amzDate, scope, sha256(canonicalRequest)].join('\n')
  const signingKey = hmac(hmac(hmac(hmac(`AWS4${current.secretAccessKey}`, date), 'auto'), 's3'), 'aws4_request')
  const signature = createHmac('sha256', signingKey).update(stringToSign).digest('hex')
  const authorization = `AWS4-HMAC-SHA256 Credential=${current.accessKeyId}/${scope}, SignedHeaders=${signedHeaders.join(';')}, Signature=${signature}`
  const response = await fetch(`${endpoint.origin}${pathname}`, {
    method,
    body: body ? new Uint8Array(body) : undefined,
    headers: { ...headers, authorization },
  })
  if (!response.ok) throw new Error(`R2 ${method} failed (${response.status})`)
}

function safeSegment(value: string): string {
  const sanitized = value.trim().replace(/[^a-zA-Z0-9_-]+/g, '-').replace(/^-+|-+$/g, '')
  return sanitized || 'unassigned'
}

export async function uploadPublicImage(
  file: File,
  folder: string,
  itemId?: string,
): Promise<{ path: string; mimeType: 'image/webp'; size: number }> {
  if (file.size === 0) throw new Error('Image file is empty')
  if (file.size > MAX_IMAGE_BYTES) throw new Error('Image size must be less than 2MB')
  if (!ALLOWED_IMAGE_TYPES.has(file.type.toLowerCase())) {
    throw new Error('Only JPG, PNG, and WebP images are allowed')
  }

  const body = await sharp(Buffer.from(await file.arrayBuffer()), {
    failOn: 'warning',
    limitInputPixels: 40_000_000,
  }).rotate().webp({ quality: 85 }).toBuffer()
  if (body.length > MAX_IMAGE_BYTES) throw new Error('Converted image size must be less than 2MB')
  const key = [safeSegment(folder), itemId ? safeSegment(itemId) : null, `${randomUUID()}.webp`]
    .filter(Boolean)
    .join('/')
  await r2Request('PUT', key, body)
  return { path: key, mimeType: 'image/webp', size: body.length }
}

export async function deletePublicImage(path: string): Promise<void> {
  if (!path || /^https?:\/\//i.test(path)) throw new Error('A valid R2 object key is required')
  await r2Request('DELETE', path)
}

export async function uploadPublicWebp(
  body: Buffer,
  keyPrefix: string,
): Promise<{ path: string; mimeType: 'image/webp'; size: number }> {
  if (!body.length) throw new Error('Image file is empty')
  if (body.length > MAX_IMAGE_BYTES) throw new Error('Image size must be less than 2MB')
  const normalizedPrefix = keyPrefix.split('/').map(safeSegment).join('/')
  const key = `${normalizedPrefix}/${randomUUID()}.webp`
  await r2Request('PUT', key, body)
  return { path: key, mimeType: 'image/webp', size: body.length }
}
