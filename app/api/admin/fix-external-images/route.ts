import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { supabaseAdmin } from '@/lib/supabase'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

// External image domains to check (not hosted on Supabase)
const EXTERNAL_IMAGE_DOMAINS = ['chaldn.com', 'arogga.com', 'medeasy.health', 'othoba.com']

/**
 * GET /api/admin/fix-external-images
 * List all products with external image URLs (Chaldal, Arogga, MedEasy, etc.)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const categoryId = searchParams.get('categoryId')?.trim() || undefined
    const q = searchParams.get('q')?.trim() || undefined

    // Find products with external image URLs from any of the known domains
    const products = await prisma.product.findMany({
      where: {
        AND: [
          ...(categoryId ? [{ categoryId }] : []),
          ...(q
            ? [{
              OR: [
                { name: { contains: q, mode: 'insensitive' } },
                { slug: { contains: q, mode: 'insensitive' } },
              ],
            }]
            : []),
          {
            OR: EXTERNAL_IMAGE_DOMAINS.map(domain => ({
              imageUrl: {
                contains: domain,
              },
            })),
          },
        ],
      },
      select: {
        id: true,
        name: true,
        slug: true,
        imageUrl: true,
      },
    })

    return NextResponse.json({
      count: products.length,
      products,
    })
  } catch (error) {
    console.error('Error listing external images:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to list products' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/fix-external-images
 * Download external images and re-upload to Supabase, then update product records
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const body = await request.json().catch(() => ({}))
    const productId = body.productId as string | undefined
    const fixAll = body.fixAll as boolean | undefined

    // Build OR clause for all external domains
    const externalDomainsFilter = EXTERNAL_IMAGE_DOMAINS.map(domain => ({
      imageUrl: { contains: domain },
    }))

    // Get products with external images
    const whereClause = productId
      ? { id: productId, OR: externalDomainsFilter }
      : { OR: externalDomainsFilter }

    const products = await prisma.product.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        slug: true,
        imageUrl: true,
      },
      take: fixAll ? 20 : 1, // Reduced from 100 to 20 to avoid 60s timeout
    })

    console.log(`[FixImages] Found ${products.length} products to fix. Batch size: ${fixAll ? 20 : 1}`)

    if (products.length === 0) {
      return NextResponse.json({
        message: 'No products with external images found',
        fixed: 0,
        failed: 0,
        results: [],
      })
    }

    const bucket = process.env.SUPABASE_MEDICINE_BUCKET || 'medicine-images'
    const results: Array<{
      id: string
      name: string
      status: 'success' | 'failed'
      oldUrl: string
      newUrl?: string
      error?: string
    }> = []

    for (const product of products) {
      try {
        console.log(`[FixImages] Processing product: ${product.name} (${product.id})`)
        if (!product.imageUrl) {
          console.warn(`[FixImages] No imageUrl for product ${product.id}`)
          results.push({
            id: product.id,
            name: product.name,
            status: 'failed',
            oldUrl: '',
            error: 'No image URL',
          })
          continue
        }

        console.log(`[FixImages] Downloading from: ${product.imageUrl}`)
        // Download the image with improved headers
        const response = await fetch(product.imageUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
          },
        })

        if (!response.ok) {
          const errorMsg = `Failed to download: ${response.status} ${response.statusText}`
          console.error(`[FixImages] ${errorMsg} for ${product.imageUrl}`)
          results.push({
            id: product.id,
            name: product.name,
            status: 'failed',
            oldUrl: product.imageUrl,
            error: errorMsg,
          })
          continue
        }

        const contentType = response.headers.get('content-type') || 'image/webp'
        const arrayBuffer = await response.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        console.log(`[FixImages] Downloaded ${buffer.length} bytes. Content-Type: ${contentType}`)

        // Determine file extension from content type
        let ext = 'webp'
        if (contentType.includes('jpeg') || contentType.includes('jpg')) ext = 'jpg'
        else if (contentType.includes('png')) ext = 'png'

        // Generate unique filename
        const uuid = `${Date.now()}-${Math.random().toString(36).substring(7)}`
        const fileName = `${uuid}.${ext}`
        const filePath = `products/${product.id}/${fileName}`

        console.log(`[FixImages] Uploading to Supabase: ${filePath}`)
        // Upload to Supabase
        const { data, error: uploadError } = await supabaseAdmin.storage
          .from(bucket)
          .upload(filePath, buffer, {
            cacheControl: '3600',
            upsert: false,
            contentType,
          })

        if (uploadError) {
          const errorMsg = `Upload failed: ${uploadError.message}`
          console.error(`[FixImages] ${errorMsg}`)
          results.push({
            id: product.id,
            name: product.name,
            status: 'failed',
            oldUrl: product.imageUrl,
            error: errorMsg,
          })
          continue
        }

        // Get public URL
        const { data: urlData } = supabaseAdmin.storage
          .from(bucket)
          .getPublicUrl(data.path)

        const newUrl = urlData.publicUrl
        console.log(`[FixImages] Successfully uploaded. New URL: ${newUrl}`)

        // Update product record
        await prisma.product.update({
          where: { id: product.id },
          data: { imageUrl: newUrl },
        })

        results.push({
          id: product.id,
          name: product.name,
          status: 'success',
          oldUrl: product.imageUrl,
          newUrl,
        })
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error'
        console.error(`[FixImages] Unexpected error for product ${product.id}:`, error)
        results.push({
          id: product.id,
          name: product.name,
          status: 'failed',
          oldUrl: product.imageUrl || '',
          error: errorMsg,
        })
      }
    }

    const fixed = results.filter((r) => r.status === 'success').length
    const failed = results.filter((r) => r.status === 'failed').length
    console.log(`[FixImages] Batch complete. Fixed: ${fixed}, Failed: ${failed}`)

    return NextResponse.json({
      message: `Fixed ${fixed} products, ${failed} failed`,
      fixed,
      failed,
      results,
    })
  } catch (error) {
    console.error('[FixImages] FATAL Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fix images' },
      { status: 500 }
    )
  }
}
