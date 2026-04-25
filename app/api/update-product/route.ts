import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { applyAzanInboundProductUpdate, isValidAzanInboundRequest } from '@/lib/integrations/azan-inbound-update'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const payloadSchema = z.object({
  sku: z.string().min(1),
  supplier: z.string().optional(),
  stock: z.union([z.string(), z.number()]).optional(),
  status: z.string().optional(),
  purchase_price: z.union([z.string(), z.number()]).optional(),
  wholesale_price: z.union([z.string(), z.number()]).optional(),
  unit_price: z.union([z.string(), z.number()]).optional(),
  price: z.union([z.string(), z.number()]).optional(),
  selling_price: z.union([z.string(), z.number()]).optional(),
  mrp: z.union([z.string(), z.number()]).optional(),
})

export async function POST(request: NextRequest) {
  try {
    if (!isValidAzanInboundRequest(request.headers.get('authorization'))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const parsed = payloadSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const result = await applyAzanInboundProductUpdate('product', parsed.data)
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status })

    return NextResponse.json({
      success: true,
      message: 'Product data updated',
      product: result.product,
    })
  } catch (error) {
    console.error('Inbound Azan update-product error:', error)
    return NextResponse.json({ error: 'Failed to process product update' }, { status: 500 })
  }
}
