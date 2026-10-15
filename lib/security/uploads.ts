import path from 'node:path'
import sharp from 'sharp'

const IMAGE_FORMATS: Record<string, { format: 'jpeg' | 'png' | 'webp'; extensions: ReadonlySet<string> }> = {
  'image/jpeg': { format: 'jpeg', extensions: new Set(['.jpg', '.jpeg']) },
  'image/jpg': { format: 'jpeg', extensions: new Set(['.jpg', '.jpeg']) },
  'image/png': { format: 'png', extensions: new Set(['.png']) },
  'image/webp': { format: 'webp', extensions: new Set(['.webp']) },
} as const

export type UploadValidation = { valid: true } | { valid: false; error: string }

export async function validateUploadedImage(file: File, maxBytes: number): Promise<UploadValidation> {
  if (file.size === 0) return { valid: false, error: 'Image file is empty' }
  if (file.size > maxBytes) return { valid: false, error: `Image size must be less than ${Math.floor(maxBytes / 1024 / 1024)}MB` }

  const expected = IMAGE_FORMATS[file.type]
  if (!expected) return { valid: false, error: 'Only JPG, PNG, and WebP images are allowed' }

  const extension = path.extname(file.name).toLowerCase()
  if (!expected.extensions.has(extension)) {
    return { valid: false, error: 'Image extension does not match its content type' }
  }

  try {
    const metadata = await sharp(Buffer.from(await file.arrayBuffer()), {
      failOn: 'warning',
      limitInputPixels: 40_000_000,
    }).metadata()

    if (metadata.format !== expected.format || !metadata.width || !metadata.height) {
      return { valid: false, error: 'Image content does not match its declared type' }
    }
  } catch {
    return { valid: false, error: 'Image content is invalid or unsafe' }
  }

  return { valid: true }
}

export function imageExtensionForMime(mimeType: string): string {
  const expected = IMAGE_FORMATS[mimeType]
  if (!expected) throw new Error('Unsupported image content type')
  return expected.format === 'jpeg' ? 'jpg' : expected.format
}

export function validateCsvUpload(file: File, maxBytes = 5 * 1024 * 1024): UploadValidation {
  if (file.size === 0) return { valid: false, error: 'CSV file is empty' }
  if (file.size > maxBytes) return { valid: false, error: 'File size must be less than 5MB' }
  if (path.extname(file.name).toLowerCase() !== '.csv') {
    return { valid: false, error: 'File must be a CSV' }
  }

  const allowedTypes = new Set(['', 'text/csv', 'application/csv', 'application/vnd.ms-excel', 'text/plain'])
  if (!allowedTypes.has(file.type.toLowerCase())) {
    return { valid: false, error: 'File content type must be CSV' }
  }
  return { valid: true }
}
