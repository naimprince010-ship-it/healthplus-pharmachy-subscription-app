import Link from 'next/link'
import { CategoryIcon, CategoryIconByKey } from '@/components/icons/CategoryIcons'
import { prisma } from '@/lib/prisma'
import { isGroceryShopEnabled, isHomeCategoryVisible, isMedicineShopEnabled } from '@/lib/site-features'
import { displayCategoryName } from '@/lib/display-category-name'

export default async function CategoryIconNav() {
  let categories

  try {
    categories = await prisma.category.findMany({
      where: { isActive: true, showInSidebar: true },
      orderBy: [{ sidebarOrder: 'asc' }, { name: 'asc' }],
      select: { id: true, name: true, slug: true, sidebarLinkUrl: true, isMedicineCategory: true },
      take: 16,
    })
  } catch (error) {
    console.error('[CategoryIconNav] Unable to load categories:', error)
    return null
  }

  const visible = categories
    .filter((category) => isHomeCategoryVisible(category.slug))
    .filter((category) => isMedicineShopEnabled() || !category.isMedicineCategory)
    .filter((category) => isGroceryShopEnabled() || !/grocery|fresh|bazaar|bazar/i.test(category.slug))
    .slice(0, 11)

  if (!visible.length) return null

  return (
    <nav aria-label="পণ্যের ক্যাটাগরি" className="hidden border-b border-[#EEE9E5] bg-white lg:block">
      <div className="scrollbar-hide mx-auto flex h-[104px] max-w-[1320px] items-center gap-3 overflow-x-auto px-6">
        <Link href="/products" className="group flex w-[84px] shrink-0 flex-col items-center gap-1.5 text-center">
          <span className="flex h-[58px] w-[58px] items-center justify-center rounded-full border-2 border-[#F9735B] bg-[#FFF7F5] transition group-hover:-translate-y-0.5 group-hover:shadow-sm">
            <CategoryIconByKey iconKey="all" size={30} />
          </span>
          <span className="max-w-[88px] truncate text-[12.5px] font-semibold text-[#314A47]" title="সব ক্যাটাগরি">সব ক্যাটাগরি</span>
        </Link>
        {visible.map((category) => (
          <Link key={category.id} href={category.sidebarLinkUrl || `/category/${category.slug}`} className="group flex w-[84px] shrink-0 flex-col items-center gap-1.5 text-center">
            <span className="flex h-[58px] w-[58px] items-center justify-center rounded-full border border-[#DDD8D4] bg-[#FAF8F7] transition group-hover:-translate-y-0.5 group-hover:border-[#F9735B] group-hover:shadow-sm">
              <CategoryIcon slug={category.slug} name={category.name} size={30} />
            </span>
            <span className="max-w-[88px] truncate text-[12.5px] font-semibold text-[#314A47]" title={category.name}>{displayCategoryName(category.name)}</span>
          </Link>
        ))}
      </div>
    </nav>
  )
}
