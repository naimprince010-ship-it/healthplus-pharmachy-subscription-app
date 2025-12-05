import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { importProductFromUrl } from '@/lib/importers/product-import'

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
        { error: 'URL is required' },
        { status: 400 }
      )
    }
    
    const product = await importProductFromUrl(url)
    
    return NextResponse.json({
      success: true,
      product,
    })
  } catch (error) {
    console.error('Product import error:', error)
    
    const message = error instanceof Error ? error.message : 'Failed to import product'
    
    return NextResponse.json(
      { error: message },
      { status: 400 }
    )
  }
}
