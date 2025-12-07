import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { extractProductsFromCategory } from '@/lib/importers/product-import'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    const body = await request.json()
    const { url } = body
    
    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { error: 'Category URL is required' },
        { status: 400 }
      )
    }
    
    const products = await extractProductsFromCategory(url)
    
    return NextResponse.json({
      success: true,
      products,
      count: products.length,
    })
  } catch (error) {
    console.error('Category extraction error:', error)
    
    const message = error instanceof Error ? error.message : 'Failed to extract products from category'
    
    return NextResponse.json(
      { error: message },
      { status: 400 }
    )
  }
}
