import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

/**
 * Short product link for social sharing:
 * `/p/[id]` redirects to `/products/[slug]` (stable id; shorter than many SEO slugs).
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const product = await prisma.product.findFirst({
    where: { id, deletedAt: null, isActive: true },
    select: { slug: true },
  })

  if (!product) {
    return NextResponse.redirect(new URL('/products', _request.url), 302)
  }

  const target = new URL(`/products/${product.slug}`, _request.url)
  return NextResponse.redirect(target, 307)
}
