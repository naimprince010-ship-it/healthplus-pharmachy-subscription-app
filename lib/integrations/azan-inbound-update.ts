import { prisma } from '@/lib/prisma'
import { invalidateSearchIndex } from '@/lib/search-index'

type UpdateKind = 'stock' | 'product'

type AzanInboundPayload = {
  sku: string
  supplier?: string | null
  stock?: string | number | null
  status?: string | null
  purchase_price?: string | number | null
  wholesale_price?: string | number | null
  unit_price?: string | number | null
  price?: string | number | null
  selling_price?: string | number | null
  mrp?: string | number | null
}

function parseNumeric(value: string | number | null | undefined): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value !== 'string') return null
  const cleaned = value.replace(/[^\d.-]/g, '').trim()
  if (!cleaned) return null
  const n = Number.parseFloat(cleaned)
  return Number.isFinite(n) ? n : null
}

function parseStock(value: string | number | null | undefined): number | null {
  const n = parseNumeric(value)
  if (n == null) return null
  return Math.max(0, Math.floor(n))
}

function normalizeSupplier(value: string | null | undefined): string {
  return (value || '').trim().toLowerCase()
}

function computeSellingPrice(baseCost: number): number {
  const marginPercent = Number.parseFloat(process.env.AZAN_WHOLESALE_DEFAULT_MARGIN_PERCENT || '30')
  const multiplier = 1 + (Number.isFinite(marginPercent) ? marginPercent : 30) / 100
  return Math.ceil(baseCost * multiplier)
}

function computeInStock(stock: number | null, status: string | null | undefined): boolean | null {
  if (typeof stock === 'number') return stock > 0
  if (!status) return null
  const s = status.trim().toLowerCase()
  if (['available', 'in_stock', 'instock', 'active'].includes(s)) return true
  if (['unavailable', 'out_of_stock', 'outofstock', 'inactive'].includes(s)) return false
  return null
}

export async function applyAzanInboundProductUpdate(kind: UpdateKind, payload: AzanInboundPayload) {
  const sku = payload.sku?.trim()
  if (!sku) return { ok: false as const, status: 400, error: 'sku is required' }

  const supplier = normalizeSupplier(payload.supplier)
  if (supplier && supplier !== 'azanwholesale') {
    return { ok: false as const, status: 400, error: 'supplier must be AzanWholeSale' }
  }

  const existing = await prisma.product.findFirst({
    where: { supplierSku: sku, deletedAt: null },
    select: {
      id: true,
      sellingPrice: true,
      mrp: true,
      purchasePrice: true,
      stockQuantity: true,
      inStock: true,
      medicine: { select: { id: true } },
    },
  })
  if (!existing) {
    return { ok: false as const, status: 404, error: `No product found for sku=${sku}` }
  }

  const stock = parseStock(payload.stock)
  const inStock = computeInStock(stock, payload.status)

  const explicitSelling = parseNumeric(payload.selling_price) ?? parseNumeric(payload.price)
  const incomingMrp = parseNumeric(payload.mrp)
  const baseCost =
    parseNumeric(payload.purchase_price) ??
    parseNumeric(payload.wholesale_price) ??
    parseNumeric(payload.unit_price)

  let nextPurchasePrice = existing.purchasePrice
  if (baseCost != null && baseCost > 0) nextPurchasePrice = baseCost

  let nextSellingPrice = existing.sellingPrice
  if (explicitSelling != null && explicitSelling > 0) {
    nextSellingPrice = explicitSelling
  } else if (baseCost != null && baseCost > 0) {
    nextSellingPrice = computeSellingPrice(baseCost)
  }

  let nextMrp = existing.mrp
  if (incomingMrp != null && incomingMrp > 0) nextMrp = incomingMrp
  else if (nextMrp == null) nextMrp = nextSellingPrice

  const updateData: Record<string, unknown> = {}
  if (typeof stock === 'number') updateData.stockQuantity = stock
  if (typeof inStock === 'boolean') updateData.inStock = inStock

  if (kind === 'product') {
    if (nextPurchasePrice != null) updateData.purchasePrice = nextPurchasePrice
    updateData.sellingPrice = nextSellingPrice
    updateData.mrp = nextMrp
  }

  if (Object.keys(updateData).length === 0) {
    return { ok: false as const, status: 400, error: 'No valid updatable fields in payload' }
  }

  const product = await prisma.$transaction(async (tx) => {
    const updated = await tx.product.update({
      where: { id: existing.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        supplierSku: true,
        stockQuantity: true,
        inStock: true,
        purchasePrice: true,
        sellingPrice: true,
        mrp: true,
      },
    })

    if (existing.medicine?.id) {
      await tx.medicine.update({
        where: { id: existing.medicine.id },
        data: {
          ...(typeof stock === 'number' ? { stockQuantity: stock, inStock: stock > 0 } : {}),
          ...(kind === 'product'
            ? {
                purchasePrice: nextPurchasePrice ?? undefined,
                sellingPrice: nextSellingPrice,
                price: nextSellingPrice,
                mrp: nextMrp ?? undefined,
              }
            : {}),
        },
      })
    }
    return updated
  })

  invalidateSearchIndex()

  return {
    ok: true as const,
    status: 200,
    product,
  }
}

export function isValidAzanInboundRequest(authorizationHeader: string | null): boolean {
  const secret = process.env.AZAN_WHOLESALE_INBOUND_SECRET
  if (!secret) return false
  const token = authorizationHeader?.replace(/^Bearer\s+/i, '').trim()
  return token === secret
}
