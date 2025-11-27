import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const q = (searchParams.get('q') || '').trim()

    if (!q || q.length < 2) {
      return NextResponse.json({ products: [], query: q })
    }

    // Search across products with related medicine and category data
    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        deletedAt: null,
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { brandName: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
          { medicine: { genericName: { contains: q, mode: 'insensitive' } } },
          { medicine: { manufacturer: { contains: q, mode: 'insensitive' } } },
          { medicine: { brandName: { contains: q, mode: 'insensitive' } } },
          { category: { name: { contains: q, mode: 'insensitive' } } },
        ],
      },
      include: {
        medicine: true,
        category: true,
      },
      take: 40,
      orderBy: { name: 'asc' },
    })

    // Also search medicines that may not have a linked product
    const standaloneMedicines = await prisma.medicine.findMany({
      where: {
        isActive: true,
        deletedAt: null,
        productId: null, // Only medicines without linked products
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { genericName: { contains: q, mode: 'insensitive' } },
          { brandName: { contains: q, mode: 'insensitive' } },
          { manufacturer: { contains: q, mode: 'insensitive' } },
        ],
      },
      include: {
        category: true,
      },
      take: 20,
      orderBy: { name: 'asc' },
    })

    // Format products for the response
    const formattedProducts = products.map((p) => ({
      id: p.id,
      type: p.type,
      name: p.name,
      slug: p.slug,
      brandName: p.medicine?.manufacturer || p.medicine?.brandName || p.brandName || null,
      description: p.description,
      sellingPrice: p.sellingPrice,
      mrp: p.mrp,
      stockQuantity: p.stockQuantity,
      imageUrl: p.imageUrl,
      category: {
        id: p.category.id,
        name: p.category.name,
        slug: p.category.slug,
      },
      href: `/products/${p.slug}`,
      cartInfo: {
        kind: p.type === 'MEDICINE' ? 'medicine' : 'product',
        productId: p.id,
        medicineId: p.medicine?.id,
      },
      isMedicine: p.type === 'MEDICINE',
    }))

    // Format standalone medicines
    const formattedMedicines = standaloneMedicines.map((m) => ({
      id: m.id,
      type: 'MEDICINE' as const,
      name: m.name,
      slug: m.slug,
      brandName: m.manufacturer || m.brandName || null,
      description: m.description,
      sellingPrice: m.sellingPrice,
      mrp: m.mrp,
      stockQuantity: m.stockQuantity,
      imageUrl: m.imageUrl,
      category: {
        id: m.category.id,
        name: m.category.name,
        slug: m.category.slug,
      },
      href: `/medicines/${m.slug}`,
      cartInfo: {
        kind: 'medicine' as const,
        medicineId: m.id,
      },
      isMedicine: true,
    }))

    // Combine and deduplicate results
    const allResults = [...formattedProducts, ...formattedMedicines]

    return NextResponse.json({
      products: allResults,
      query: q,
      count: allResults.length,
    })
  } catch (error) {
    console.error('Search API error:', error)
    return NextResponse.json(
      { error: 'Search failed', products: [] },
      { status: 500 }
    )
  }
}
