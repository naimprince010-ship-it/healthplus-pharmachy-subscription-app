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

    const result = await applyAzanInboundProductUpdate('stock', parsed.data)
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status })

    return NextResponse.json({
      success: true,
      message: 'Stock updated',
      product: result.product,
    })
  } catch (error) {
    console.error('Inbound Azan update-stock error:', error)
    return NextResponse.json({ error: 'Failed to process stock update' }, { status: 500 })
  }
}
