'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Clock3 } from 'lucide-react'
import { ProductCard, type ProductCardProps } from '@/components/ProductCard'
import type { CategoryIconKey } from '@/lib/category-icon-key'

export interface CuratedProduct extends ProductCardProps {
  soldPercentage?: number | null
}

export interface CuratedHomeData {
  flashSale: CuratedProduct[]
  bestSellers: Partial<Record<CategoryIconKey, CuratedProduct[]>>
  grocery: CuratedProduct[]
  brands: Array<{ id: string; name: string; slug: string; logoUrl: string | null }>
}

const TABS: Array<{ key: CategoryIconKey; label: string }> = [
  { key: 'skincare', label: 'স্কিন কেয়ার' },
  { key: 'makeup', label: 'মেকআপ' },
  { key: 'hair', label: 'হেয়ার কেয়ার' },
  { key: 'fragrance', label: 'পারফিউম' },
]

function ProductRow({ products, showSold = false }: { products: CuratedProduct[]; showSold?: boolean }) {
  return <div className="scrollbar-hide flex gap-3 overflow-x-auto pb-2 pl-4 pr-8 lg:grid lg:grid-cols-6 lg:gap-4 lg:overflow-visible lg:px-4">
    {products.map((product, index) => <div key={product.id} className="w-40 flex-shrink-0 lg:w-auto">
      <ProductCard product={product} variant="compact" imagePriority={index < 4} />
      {showSold && product.soldPercentage != null && <div className="mt-2 px-1">
        <div className="mb-1 text-[11px] font-semibold text-orange-700">{product.soldPercentage}% বিক্রি হয়ে গেছে</div>
        <div className="h-1.5 overflow-hidden rounded-full bg-orange-100"><div className="h-full rounded-full bg-[#C2410C]" style={{ width: `${product.soldPercentage}%` }} /></div>
      </div>}
    </div>)}
  </div>
}

function SectionTitle({ title, href }: { title: string; href?: string }) {
  return <div className="mb-3 flex items-center justify-between px-4">
    <h2 className="text-lg font-extrabold text-[#0B4F4A] lg:text-2xl">{title}</h2>
    {href && <Link href={href} className="text-sm font-bold text-[#0F766E]">সবগুলো →</Link>}
  </div>
}

function FlashCountdown({ endsAt }: { endsAt: Date | string }) {
  const target = useMemo(() => new Date(endsAt).getTime(), [endsAt])
  const [remaining, setRemaining] = useState(() => Math.max(0, target - Date.now()))
  useEffect(() => {
    const timer = window.setInterval(() => setRemaining(Math.max(0, target - Date.now())), 1000)
    return () => window.clearInterval(timer)
  }, [target])
  const hours = Math.floor(remaining / 3_600_000)
  const minutes = Math.floor((remaining % 3_600_000) / 60_000)
  const seconds = Math.floor((remaining % 60_000) / 1000)
  const pad = (value: number) => String(value).padStart(2, '0')
  return <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-3 py-1 text-xs font-bold text-[#C2410C]"><Clock3 className="h-3.5 w-3.5" />{pad(hours)}:{pad(minutes)}:{pad(seconds)}</span>
}

export function FlashSaleHomeSection({ products }: { products: CuratedProduct[] }) {
  if (!products.length) return null
  const endsAt = products.map((product) => product.flashSaleEnd).filter(Boolean).sort((a, b) => new Date(a!).getTime() - new Date(b!).getTime())[0]
  return <section className="bg-white py-5">
    <div className="mb-3 flex items-center justify-between px-4">
      <div className="flex items-center gap-3"><h2 className="text-lg font-extrabold text-[#C2410C] lg:text-2xl">ফ্লাশ সেল</h2>{endsAt && <FlashCountdown endsAt={endsAt} />}</div>
      <Link href="/flash-sale" className="text-sm font-bold text-[#0F766E]">সবগুলো →</Link>
    </div>
    <ProductRow products={products} showSold />
  </section>
}

export function BestSellerHomeSection({ groups }: { groups: CuratedHomeData['bestSellers'] }) {
  const firstAvailable = TABS.find((tab) => (groups[tab.key]?.length ?? 0) > 0)?.key ?? 'skincare'
  const [active, setActive] = useState<CategoryIconKey>(firstAvailable)
  const products = groups[active] ?? []
  if (!TABS.some((tab) => (groups[tab.key]?.length ?? 0) > 0)) return null
  return <section className="bg-white py-5">
    <SectionTitle title="সবচেয়ে বেশি বিক্রি" />
    <div className="scrollbar-hide mb-4 flex gap-2 overflow-x-auto px-4">
      {TABS.map((tab) => <button key={tab.key} type="button" onClick={() => setActive(tab.key)} disabled={!groups[tab.key]?.length} className={`min-h-11 shrink-0 rounded-full px-4 text-sm font-bold ${active === tab.key ? 'bg-[#0F766E] text-white' : 'border border-teal-100 bg-white text-[#0B4F4A] disabled:opacity-40'}`}>{tab.label}</button>)}
    </div>
    <ProductRow products={products} />
  </section>
}

export function GroceryHomeSection({ products }: { products: CuratedProduct[] }) {
  if (!products.length) return null
  return <section className="bg-white py-5"><SectionTitle title="দৈনন্দিন বাজার" href="/products?category=grocery" /><ProductRow products={products} /></section>
}

export function PopularBrandsSection({ brands }: { brands: CuratedHomeData['brands'] }) {
  if (!brands.length) return null
  return <section className="bg-white px-4 py-6">
    <h2 className="mb-4 text-lg font-extrabold text-[#0B4F4A] lg:text-2xl">জনপ্রিয় ব্র্যান্ড</h2>
    <div className="scrollbar-hide flex gap-3 overflow-x-auto lg:grid lg:grid-cols-8 lg:overflow-visible">
      {brands.map((brand) => <Link key={brand.id} href={`/manufacturer/${brand.slug}`} className="flex min-h-24 w-32 shrink-0 flex-col items-center justify-center gap-2 rounded-2xl border border-gray-100 bg-white p-3 shadow-sm lg:w-auto">
        {brand.logoUrl && <span className="relative h-10 w-full"><Image src={brand.logoUrl} alt={brand.name} fill sizes="130px" className="object-contain" /></span>}
        <span className="line-clamp-1 text-center text-xs font-bold text-gray-700">{brand.name}</span>
      </Link>)}
    </div>
  </section>
}
