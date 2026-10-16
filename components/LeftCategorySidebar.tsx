import Link from 'next/link'
import { ChevronRight, Gift, MessageCircle, ShoppingBag } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import CategorySidebarList from './CategorySidebarList'
import { GROCERY_CATEGORY_SLUG, isGroceryShopEnabled, isMedicineShopEnabled } from '@/lib/site-features'

export default async function LeftCategorySidebar() {
  const categories = await prisma.category.findMany({
    where: { showInSidebar: true, isActive: true },
    orderBy: { sidebarOrder: 'asc' },
    select: { id: true, name: true, slug: true, sidebarLinkUrl: true, isMedicineCategory: true },
  })
  const navCategories = categories.filter((category) => {
    if (!isMedicineShopEnabled() && category.isMedicineCategory) return false
    if (!isGroceryShopEnabled() && category.slug === GROCERY_CATEGORY_SLUG) return false
    return true
  })
  const whatsapp = (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '').replace(/\D/g, '')
  const services = [
    { label: 'অফার ও ডিল', href: '/flash-sale', icon: Gift },
    { label: 'আমার অর্ডার', href: '/orders', icon: ShoppingBag },
  ]
  return <div className="w-full space-y-4">
    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
      <CategorySidebarList categories={navCategories} />
      <div className="border-y border-gray-50 bg-gray-50/70 px-4 py-2 text-[11px] font-bold uppercase tracking-widest text-gray-400">সেবা</div>
      {services.map(({ label, href, icon: Icon }) => <Link key={href} href={href} className="flex items-center justify-between border-b border-gray-50 px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-teal-50">
        <span className="flex items-center gap-2"><Icon className="h-4 w-4 text-teal-700" />{label}</span><ChevronRight className="h-4 w-4 text-gray-300" />
      </Link>)}
    </div>
    {whatsapp && <a href={`https://api.whatsapp.com/send?phone=${whatsapp}`} target="_blank" rel="noreferrer" className="block rounded-2xl bg-[#0F766E] p-4 text-white shadow-sm">
      <MessageCircle className="mb-2 h-6 w-6" /><p className="font-bold">স্কিন টাইপ জানেন না?</p><p className="mt-1 text-sm text-teal-50">WhatsApp-এ ছবি পাঠান</p>
    </a>}
  </div>
}
