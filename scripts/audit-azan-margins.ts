/**
 * Report margin on Azan-catalog products: expected ~60% markup on cost (×1.6) unless env overrides.
 * Run: npx tsx scripts/audit-azan-margins.ts
 */
import { prisma } from '@/lib/prisma'
import {
  getAzanRetailMultiplierFromEnv,
  grossMarginOnRetailPercent,
  markupOnCostPercent,
  maxListDiscountPercentForMinGrossMargin,
  suggestFlashDiscountPercentOffList,
} from '@/lib/azan-pricing'
import { prismaWhereAzanCatalogProducts } from '@/lib/integrations/azan-catalog'

async function main() {
  const mult = getAzanRetailMultiplierFromEnv()
  const rows = await prisma.product.findMany({
    where: {
      ...prismaWhereAzanCatalogProducts(),
      purchasePrice: { not: null, gt: 0 },
    },
    select: {
      id: true,
      name: true,
      sellingPrice: true,
      purchasePrice: true,
      supplierSku: true,
    },
    take: 5000,
  })

  let ok = 0
  let thin = 0
  const drift: { name: string; markupOnCost: number; grossRetail: number }[] = []

  for (const p of rows) {
    const cost = p.purchasePrice!
    const list = p.sellingPrice
    const mCost = markupOnCostPercent(list, cost)
    const gRet = grossMarginOnRetailPercent(list, cost)
    const expectedMarkup = (mult - 1) * 100
    if (Math.abs(mCost - expectedMarkup) <= 2) ok++
    else {
      thin++
      if (drift.length < 15) {
        drift.push({ name: p.name, markupOnCost: mCost, grossRetail: gRet })
      }
    }
  }

  const sample = rows[0]
  let flashHint = null as null | ReturnType<typeof suggestFlashDiscountPercentOffList>
  if (sample && sample.purchasePrice) {
    flashHint = suggestFlashDiscountPercentOffList({
      listPrice: sample.sellingPrice,
      cost: sample.purchasePrice,
      minGrossPercent: 20,
      targetDiscountPercent: 12,
    })
  }

  const maxOffAt20Gross = maxListDiscountPercentForMinGrossMargin(mult, 1, 20)

  console.log(
    JSON.stringify(
      {
        envRetailMultiplier: mult,
        expectedMarkupOnCostPercent: (mult - 1) * 100,
        expectedGrossMarginOnRetailPercent: ((mult - 1) / mult) * 100,
        note:
          '60% "profit" here = markup on cost (sell at cost×1.6). Retail gross margin is lower (~37.5% at 1.6×).',
        counts: { totalSample: rows.length, within2ppOfPolicy: ok, drifted: thin },
        driftSamples: drift,
        flashPolicyExample: {
          minGrossPercent: 20,
          targetOffListPercent: 12,
          maxOffListAt1_6xCostToKeep20GrossRetail: maxOffAt20Gross,
          oneProductSample: flashHint,
        },
      },
      null,
      2,
    ),
  )

  await prisma.$disconnect()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
