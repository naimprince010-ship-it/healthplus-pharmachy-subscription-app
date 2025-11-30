import sharp from 'sharp'
import AdmZip from 'adm-zip'
import path from 'path'
import { createClient } from '@supabase/supabase-js'

const MAX_WIDTH = 800
const WATERMARK_OPACITY = 0.3
const OUTPUT_FORMAT = 'webp'
const OUTPUT_QUALITY = 85

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

function getSupabaseClient() {
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase credentials not configured')
  }
  return createClient(supabaseUrl, supabaseKey)
}

export function canonicalizeFilename(filename: string): string {
  const nameWithoutExt = path.parse(filename).name
  return nameWithoutExt
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
}

export function canonicalizeProductName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
}

export interface ZipIndexEntry {
  filename: string
  canonicalKey: string
  size: number
}

export async function indexZipFile(zipBuffer: Buffer): Promise<ZipIndexEntry[]> {
  const zip = new AdmZip(zipBuffer)
  const entries = zip.getEntries()
  
  const imageEntries: ZipIndexEntry[] = []
  
  for (const entry of entries) {
    if (entry.isDirectory) continue
    
    const ext = path.extname(entry.entryName).toLowerCase()
    if (!['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext)) continue
    
    const filename = path.basename(entry.entryName)
    imageEntries.push({
      filename,
      canonicalKey: canonicalizeFilename(filename),
      size: entry.header.size,
    })
  }
  
  return imageEntries
}

export interface MatchResult {
  filename: string | null
  confidence: number
  matched: boolean
}

export function matchImageToProduct(
  productName: string,
  imageIndex: ZipIndexEntry[]
): MatchResult {
  const productKey = canonicalizeProductName(productName)
  
  const exactMatch = imageIndex.find(img => img.canonicalKey === productKey)
  if (exactMatch) {
    return {
      filename: exactMatch.filename,
      confidence: 1.0,
      matched: true,
    }
  }
  
  let bestMatch: ZipIndexEntry | null = null
  let bestScore = 0
  
  for (const img of imageIndex) {
    if (img.canonicalKey.includes(productKey) || productKey.includes(img.canonicalKey)) {
      const score = Math.min(img.canonicalKey.length, productKey.length) / 
                    Math.max(img.canonicalKey.length, productKey.length)
      if (score > bestScore && score >= 0.7) {
        bestScore = score
        bestMatch = img
      }
    }
  }
  
  if (bestMatch) {
    return {
      filename: bestMatch.filename,
      confidence: bestScore,
      matched: true,
    }
  }
  
  return {
    filename: null,
    confidence: 0,
    matched: false,
  }
}

export async function extractImageFromZip(
  zipBuffer: Buffer,
  filename: string
): Promise<Buffer | null> {
  const zip = new AdmZip(zipBuffer)
  const entries = zip.getEntries()
  
  for (const entry of entries) {
    if (path.basename(entry.entryName) === filename) {
      return entry.getData()
    }
  }
  
  return null
}

export async function processImage(
  imageBuffer: Buffer,
  watermarkPath?: string
): Promise<Buffer> {
  let image = sharp(imageBuffer)
  
  const metadata = await image.metadata()
  
  if (metadata.width && metadata.width > MAX_WIDTH) {
    image = image.resize(MAX_WIDTH, null, {
      withoutEnlargement: true,
      fit: 'inside',
    })
  }
  
  if (watermarkPath) {
    try {
      const watermarkBuffer = await sharp(watermarkPath)
        .resize(150, null, { withoutEnlargement: true })
        .composite([{
          input: Buffer.from([255, 255, 255, Math.round(255 * WATERMARK_OPACITY)]),
          raw: { width: 1, height: 1, channels: 4 },
          tile: true,
          blend: 'dest-in',
        }])
        .toBuffer()
      
      image = image.composite([{
        input: watermarkBuffer,
        gravity: 'southeast',
        blend: 'over',
      }])
    } catch {
      console.warn('Failed to apply watermark, continuing without it')
    }
  }
  
  return image
    .webp({ quality: OUTPUT_QUALITY })
    .toBuffer()
}

export async function uploadProcessedImage(
  imageBuffer: Buffer,
  storagePath: string
): Promise<string> {
  const supabase = getSupabaseClient()
  
  const { error } = await supabase.storage
    .from('products')
    .upload(storagePath, imageBuffer, {
      contentType: 'image/webp',
      upsert: true,
    })
  
  if (error) {
    throw new Error(`Failed to upload image: ${error.message}`)
  }
  
  const { data: urlData } = supabase.storage
    .from('products')
    .getPublicUrl(storagePath)
  
  return urlData.publicUrl
}

export async function downloadZipFromStorage(zipPath: string): Promise<Buffer> {
  const supabase = getSupabaseClient()
  
  const { data, error } = await supabase.storage
    .from('ai-import')
    .download(zipPath)
  
  if (error || !data) {
    throw new Error(`Failed to download ZIP: ${error?.message || 'Unknown error'}`)
  }
  
  return Buffer.from(await data.arrayBuffer())
}

export function generateImageStoragePath(jobId: string, slug: string): string {
  return `ai-import/${jobId}/${slug}.webp`
}
