type AdvisoryLockTransaction = {
  $executeRaw(
    query: TemplateStringsArray,
    ...values: unknown[]
  ): Promise<number>
}

/** Serializes per-user coupon checks until the surrounding transaction commits. */
export async function lockCouponUsageForUser(
  tx: AdvisoryLockTransaction,
  couponId: string,
  userId: string,
): Promise<void> {
  const lockKey = `coupon:${couponId}:user:${userId}`
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${lockKey}, 0))`
}
