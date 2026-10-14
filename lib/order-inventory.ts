export type InventoryLine = {
  medicineId?: string | null
  productId?: string | null
  quantity: number
}

type StockDelegate = {
  updateMany(args: {
    where: Record<string, unknown>
    data: Record<string, unknown>
  }): Promise<{ count: number }>
}

export type InventoryTransaction = {
  medicine: StockDelegate
  product: StockDelegate
}

export class InventoryUnavailableError extends Error {
  constructor() {
    super('INVENTORY_UNAVAILABLE')
    this.name = 'InventoryUnavailableError'
  }
}

/**
 * Atomically claims stock inside the caller's database transaction.
 * Every line uses UPDATE ... WHERE stockQuantity >= quantity, so concurrent
 * checkouts cannot both consume the same final unit.
 */
export async function reserveOrderInventory(
  tx: InventoryTransaction,
  lines: InventoryLine[],
): Promise<void> {
  for (const line of lines) {
    const id = line.medicineId ?? line.productId
    if (!id) continue

    const delegate = line.medicineId ? tx.medicine : tx.product
    const claimed = await delegate.updateMany({
      where: {
        id,
        isActive: true,
        inStock: true,
        stockQuantity: { gte: line.quantity },
      },
      data: {
        stockQuantity: { decrement: line.quantity },
      },
    })

    if (claimed.count !== 1) {
      throw new InventoryUnavailableError()
    }

    await delegate.updateMany({
      where: { id, stockQuantity: 0 },
      data: { inStock: false },
    })
  }
}

/** Restores a previously claimed order exactly once when the status transition wins. */
export async function restoreOrderInventory(
  tx: InventoryTransaction,
  lines: InventoryLine[],
): Promise<void> {
  for (const line of lines) {
    const id = line.medicineId ?? line.productId
    if (!id) continue

    const delegate = line.medicineId ? tx.medicine : tx.product
    await delegate.updateMany({
      where: { id },
      data: {
        stockQuantity: { increment: line.quantity },
        inStock: true,
      },
    })
  }
}