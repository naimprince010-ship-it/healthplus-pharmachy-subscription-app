import { NextRequest, NextResponse } from 'next/server'
import { searchProducts, getSearchIndex } from '@/lib/search-index'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const q = (searchParams.get('q') || '').trim()
    const limitParam = Number(searchParams.get('limit') ?? '40')
    const limit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 40) : 40
    const mode = searchParams.get('mode') || 'full'

    if (!q || q.length < 2) {
      if (mode === 'suggestions') {
        return NextResponse.json({ items: [], query: q })
      }
      const { products } = await getSearchIndex()
      const topProducts = products.slice(0, limit)
      return NextResponse.json({
        products: topProducts.map(formatProduct),
        items: topProducts.slice(0, 10).map(formatSuggestion),
        query: q,
        count: topProducts.length,
      })
    }

    const results = await searchProducts(q, limit)

    if (mode === 'suggestions') {
      const items = results.slice(0, Math.min(limit, 10)).map((r) => formatSuggestion(r.item))
      return NextResponse.json({
        items,
        query: q,
        count: items.length,
      })
    }

    const products = results.map((r) => formatProduct(r.item))
    const items = results.slice(0, 10).map((r) => formatSuggestion(r.item))

    return NextResponse.json({
      products,
      items,
      query: q,
      count: products.length,
    })
  } catch (error) {
    console.error('Search API error:', error)
    return NextResponse.json(
      { error: 'Search failed', products: [], items: [] },
      { status: 500 }
    )
  }
}

interface SearchableItem {
  id: string
  type: string
  name: string
  slug: string
  brandName: string | null
  categoryName: string
  categorySlug: string
  description: string | null
  sellingPrice: number
  mrp: number | null
  stockQuantity: number
  imageUrl: string | null
  discountPercentage: number | null
  isMedicine: boolean
  medicineId: string | null
  href: string
  sizeLabel: string | null
}

function formatProduct(p: SearchableItem) {
  return {
    id: p.id,
    type: p.type,
    name: p.name,
    slug: p.slug,
    brandName: p.brandName,
    description: p.description,
    sellingPrice: p.sellingPrice,
    mrp: p.mrp,
    stockQuantity: p.stockQuantity,
    imageUrl: p.imageUrl,
    discountPercentage: p.discountPercentage,
    category: {
      name: p.categoryName,
      slug: p.categorySlug,
    },
    href: p.href,
    cartInfo: {
      kind: p.isMedicine ? 'medicine' : 'product',
      productId: p.id,
      medicineId: p.medicineId,
    },
    isMedicine: p.isMedicine,
  }
}

function formatSuggestion(p: SearchableItem) {
  return {
    id: p.id,
    name: p.name,
    imageUrl: p.imageUrl,
    price: p.sellingPrice,
    manufacturer: p.brandName,
    slug: p.slug,
    href: p.href,
    sizeLabel: p.sizeLabel,
  }
}
