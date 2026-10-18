import { prisma } from '../lib/prisma'

const TARGET_NAMES = [
  'Antibiotics',
  'Allergy & Antihistamine',
  'Antifungal/Antiviral',
  'Opioid Analgesics',
  'Non Opioid Analgesics',
  'Fever & Flu',
  'Gastric Care',
  'Gastro & Liver',
  'Respiratory & Asthma',
  'Neuro & Psychiatric',
  'Kidney & Urology',
  'Diabetes',
  'Diabetes Care',
  'Diabetic Care',
  'Blood Pressure',
  'Heart & Blood Pressure',
  'Heart Health',
  'Eye',
  'Eye & Ear Care',
  'Skin & Dermatology',
  'Oral Rehydration & Saline',
  'General OTC',
  'Baby & Pediatric Medicine',
] as const

const REVIEW_CATEGORY_NAMES = new Set([
  'Diabetes',
  'Blood Pressure',
  'Heart Health',
  'Eye',
])

function normalizeName(value: string) {
  return value.trim().toLocaleLowerCase('en-US').replace(/\s+/g, ' ')
}

function slugCandidates(name: string) {
  const base = normalizeName(name)
  return new Set([
    base.replace(/&/g, 'and').replace(/\//g, '-').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
    base.replace(/&/g, '').replace(/\//g, '-').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
  ])
}

async function main() {
  const apply = process.argv.includes('--apply')
  if (apply && process.env.CONFIRM_MEDICINE_CATEGORY_UPDATE !== 'YES') {
    throw new Error('Refusing to write without CONFIRM_MEDICINE_CATEGORY_UPDATE=YES')
  }

  const categories = await prisma.category.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      isMedicineCategory: true,
      products: {
        select: { name: true, type: true },
        orderBy: { name: 'asc' },
      },
      _count: { select: { products: true } },
    },
    orderBy: { name: 'asc' },
  })

  const results = TARGET_NAMES.map((targetName) => {
    const normalizedTarget = normalizeName(targetName)
    const targetSlugs = slugCandidates(targetName)
    const matches = categories.filter(
      (category) =>
        normalizeName(category.name) === normalizedTarget ||
        targetSlugs.has(normalizeName(category.slug)),
    )

    return {
      targetName,
      status: matches.length === 1 ? 'MATCHED' : matches.length === 0 ? 'NOT_FOUND' : 'AMBIGUOUS',
      matches: matches.map((category) => ({
        id: category.id,
        name: category.name,
        slug: category.slug,
        currentFlag: category.isMedicineCategory,
        productCount: category._count.products,
        ...(REVIEW_CATEGORY_NAMES.has(targetName)
          ? { products: category.products }
          : {}),
      })),
    }
  })

  if (apply) {
    const unsafe = results.filter((result) => result.matches.length !== 1)
    if (unsafe.length > 0) {
      throw new Error(`Refusing to write: ${unsafe.length} target(s) are not uniquely matched`)
    }

    await prisma.$transaction(
      results.map((result) =>
        prisma.category.update({
          where: { id: result.matches[0].id },
          data: { isMedicineCategory: true },
        }),
      ),
    )
  }

  console.log(JSON.stringify({
    mode: apply ? 'APPLY' : 'DRY_RUN',
    summary: {
      targets: results.length,
      matched: results.filter((result) => result.status === 'MATCHED').length,
      notFound: results.filter((result) => result.status === 'NOT_FOUND').length,
      ambiguous: results.filter((result) => result.status === 'AMBIGUOUS').length,
    },
    results,
  }, null, 2))
}

main()
  .then(async () => {
    await prisma.$disconnect()
    process.exit(0)
  })
  .catch(async (error) => {
    console.error(error)
    await prisma.$disconnect()
    process.exit(1)
  })
