import AdmZip from 'adm-zip'
import sharp from 'sharp'
import { describe, expect, it } from 'vitest'
import { indexZipFile, MAX_ZIP_ARCHIVE_BYTES } from '@/lib/imageProcessing'
import {
  imageExtensionForMime,
  validateCsvUpload,
  validateUploadedImage,
} from '@/lib/security/uploads'

describe('image upload validation', () => {
  it('accepts a real image whose bytes, MIME, and extension agree', async () => {
    const png = await sharp({
      create: { width: 2, height: 2, channels: 3, background: '#ffffff' },
    }).png().toBuffer()
    const file = new File([Uint8Array.from(png).buffer], 'product.png', { type: 'image/png' })

    await expect(validateUploadedImage(file, 1024 * 1024)).resolves.toEqual({ valid: true })
  })

  it('rejects non-image bytes disguised with an image MIME and extension', async () => {
    const file = new File(['not an image'], 'product.jpg', { type: 'image/jpeg' })
    const result = await validateUploadedImage(file, 1024 * 1024)
    expect(result.valid).toBe(false)
  })

  it('rejects an extension that disagrees with the declared MIME', async () => {
    const png = await sharp({
      create: { width: 1, height: 1, channels: 3, background: '#ffffff' },
    }).png().toBuffer()
    const file = new File([Uint8Array.from(png).buffer], 'product.jpg', { type: 'image/png' })

    await expect(validateUploadedImage(file, 1024 * 1024)).resolves.toMatchObject({ valid: false })
  })

  it('derives storage extensions from trusted MIME types', () => {
    expect(imageExtensionForMime('image/jpeg')).toBe('jpg')
    expect(imageExtensionForMime('image/png')).toBe('png')
    expect(() => imageExtensionForMime('image/svg+xml')).toThrow('Unsupported')
  })
})

describe('CSV upload validation', () => {
  it('accepts a CSV extension and MIME type case-insensitively', () => {
    const file = new File(['name\nNapa'], 'medicines.CSV', { type: 'text/csv' })
    expect(validateCsvUpload(file)).toEqual({ valid: true })
  })

  it('rejects oversized files before reading their contents', () => {
    const file = new File([new Uint8Array(5 * 1024 * 1024 + 1)], 'medicines.csv', { type: 'text/csv' })
    expect(validateCsvUpload(file)).toMatchObject({ valid: false })
  })
})

describe('ZIP image indexing limits', () => {
  it('indexes a small safe image archive', async () => {
    const zip = new AdmZip()
    zip.addFile('products/napa.png', Buffer.from('small-image-placeholder'))
    const result = await indexZipFile(zip.toBuffer())
    expect(result).toEqual([
      expect.objectContaining({ filename: 'napa.png', canonicalKey: 'napa' }),
    ])
  })

  it('rejects an oversized archive before parsing it', async () => {
    await expect(indexZipFile(Buffer.alloc(MAX_ZIP_ARCHIVE_BYTES + 1))).rejects.toThrow('25MB')
  })

  it('rejects suspicious compression ratios', async () => {
    const zip = new AdmZip()
    zip.addFile('bomb.jpg', Buffer.alloc(1024 * 1024))
    await expect(indexZipFile(zip.toBuffer())).rejects.toThrow('compression ratio')
  })
})
