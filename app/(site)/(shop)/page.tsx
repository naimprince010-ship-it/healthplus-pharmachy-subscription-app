import { buildProductWhereClause } from '@/lib/homeSections'
import { DesktopHome } from '@/components/DesktopHome'
import { MobileHome } from '@/components/MobileHome'

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
          include: {
            category: true,
            medicine: {
              select: {
                discountPercentage: true,
              },
            },
          },
          take: section.maxProducts,
        })

        // Map products to flatten medicine.discountPercentage into product.discountPercentage
        const mappedProducts = products.map((product) => {
          const rawDiscount = product.discountPercentage ?? product.medicine?.discountPercentage
          return {
            ...product,
            discountPercentage: rawDiscount ? Number(rawDiscount) : null,
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
