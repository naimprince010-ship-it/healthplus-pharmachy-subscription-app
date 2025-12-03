import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { supabaseAdmin } from '@/lib/supabase'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

/**
 * GET /api/admin/fix-external-images
 * List all products with external (chaldn.com) image URLs
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const products = await prisma.product.findMany({
      where: {
        imageUrl: {
          contains: 'chaldn.com',
        },
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

    // Get products with external images
    const whereClause = productId
      ? { id: productId, imageUrl: { contains: 'chaldn.com' } }
      : { imageUrl: { contains: 'chaldn.com' } }

    const products = await prisma.product.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        slug: true,
        imageUrl: true,
      },
      take: fixAll ? 100 : 1,
    })

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
        if (!product.imageUrl) {
          results.push({
            id: product.id,
            name: product.name,
            status: 'failed',
            oldUrl: '',
            error: 'No image URL',
          })
          continue
        }

        // Download the image from chaldn.com
        const response = await fetch(product.imageUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
        })

        if (!response.ok) {
          results.push({
            id: product.id,
            name: product.name,
            status: 'failed',
            oldUrl: product.imageUrl,
            error: `Failed to download: ${response.status} ${response.statusText}`,
          })
          continue
        }

        const contentType = response.headers.get('content-type') || 'image/webp'
        const arrayBuffer = await response.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        // Determine file extension from content type
        let ext = 'webp'
        if (contentType.includes('jpeg') || contentType.includes('jpg')) ext = 'jpg'
        else if (contentType.includes('png')) ext = 'png'

        // Generate unique filename
        const uuid = `${Date.now()}-${Math.random().toString(36).substring(7)}`
        const fileName = `${uuid}.${ext}`
        const filePath = `products/${product.id}/${fileName}`

        // Upload to Supabase
        const { data, error: uploadError } = await supabaseAdmin.storage
          .from(bucket)
          .upload(filePath, buffer, {
            cacheControl: '3600',
            upsert: false,
            contentType,
          })

        if (uploadError) {
          results.push({
            id: product.id,
            name: product.name,
            status: 'failed',
            oldUrl: product.imageUrl,
            error: `Upload failed: ${uploadError.message}`,
          })
          continue
        }

        // Get public URL
        const { data: urlData } = supabaseAdmin.storage
          .from(bucket)
          .getPublicUrl(data.path)

        const newUrl = urlData.publicUrl

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
        results.push({
          id: product.id,
          name: product.name,
          status: 'failed',
          oldUrl: product.imageUrl || '',
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }

    const fixed = results.filter((r) => r.status === 'success').length
    const failed = results.filter((r) => r.status === 'failed').length

    return NextResponse.json({
      message: `Fixed ${fixed} products, ${failed} failed`,
      fixed,
      failed,
      results,
    })
  } catch (error) {
    console.error('Error fixing external images:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fix images' },
      { status: 500 }
    )
  }
}
