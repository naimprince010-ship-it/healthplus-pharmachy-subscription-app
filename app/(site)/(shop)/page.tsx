import { buildProductWhereClause } from '@/lib/homeSections'
import { DesktopHome } from '@/components/DesktopHome'
import { MobileHome } from '@/components/MobileHome'
import { getEffectivePrices } from '@/lib/pricing'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

async function getSubscriptionPlans() {
  try {
    const { prisma } = await import('@/lib/prisma')
    return await prisma.subscriptionPlan.findMany({
      where: { isActive: true },
      take: 4,
    })
  } catch {
    return []
  }
}

async function getMembershipPlan() {
  try {
    const { prisma } = await import('@/lib/prisma')
    return await prisma.membershipPlan.findFirst({
      where: { isActive: true },
    })
  } catch {
    return null
  }
}

async function getHomeSections() {
  try {
    const { prisma } = await import('@/lib/prisma')
    const sections = await prisma.homeSection.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    })

    const sectionsWithProducts = await Promise.all(
      sections.map(async (section) => {
        const whereClause = buildProductWhereClause(section)
        const products = await prisma.product.findMany({
          where: whereClause,
          select: {
            id: true,
            name: true,
            slug: true,
            imageUrl: true,
            sellingPrice: true,
            mrp: true,
            stockQuantity: true,
            brandName: true,
            description: true,
            type: true,
            discountPercentage: true,
            flashSalePrice: true,
            flashSaleStart: true,
            flashSaleEnd: true,
            isFlashSale: true,
            category: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
            medicine: {
              select: {
                discountPercentage: true,
              },
            },
          },
          take: section.maxProducts,
        })

        // Map products to flatten medicine.discountPercentage and pre-compute effective prices
        // Pre-computing on server prevents hydration mismatch from Date() differences
        const mappedProducts = products.map((product) => {
          const rawDiscount = product.discountPercentage ?? product.medicine?.discountPercentage
          const discountPercentage = rawDiscount ? Number(rawDiscount) : null
          
          // Pre-compute effective prices on server to avoid hydration mismatch
          const effectivePrices = getEffectivePrices({
            sellingPrice: Number(product.sellingPrice),
            mrp: product.mrp ? Number(product.mrp) : null,
            discountPercentage,
            flashSalePrice: product.flashSalePrice ? Number(product.flashSalePrice) : null,
            flashSaleStart: product.flashSaleStart,
            flashSaleEnd: product.flashSaleEnd,
            isFlashSale: product.isFlashSale,
          })
          
          return {
            ...product,
            discountPercentage,
            // Pre-computed values for client to use directly (avoids hydration mismatch)
            effectivePrice: effectivePrices.price,
            effectiveMrp: effectivePrices.mrp,
            effectiveDiscountPercent: effectivePrices.discountPercent,
            isFlashSaleActive: effectivePrices.isFlashSale,
          }
        })

        return {
          section: {
            id: section.id,
            title: section.title,
            slug: section.slug,
            badgeText: section.badgeText,
            bgColor: section.bgColor,
          },
          products: mappedProducts,
        }
      })
    )

    return sectionsWithProducts.filter((s) => s.products.length > 0)
  } catch {
    return []
  }
}

export default async function HomePage() {
  const subscriptionPlans = await getSubscriptionPlans()
  const membershipPlan = await getMembershipPlan()
  const homeSections = await getHomeSections()

  return (
    <>
      {/* Desktop View - lg and above */}
      <div className="hidden lg:block">
        <DesktopHome 
          subscriptionPlans={subscriptionPlans}
          membershipPlan={membershipPlan}
          homeSections={homeSections}
        />
      </div>

      {/* Mobile View - below lg */}
      <div className="block lg:hidden">
        <MobileHome 
          subscriptionPlans={subscriptionPlans}
          membershipPlan={membershipPlan}
          homeSections={homeSections}
        />
      </div>
    </>
  )
}
