'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
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
  flashSaleEndsAt: string | null
  serverNow: string
  skinTypes: Array<{ label: string; query: string; count: number }>
  bestSellers: Partial<Record<CategoryIconKey, CuratedProduct[]>>
  bestSellerTitle: 'সবচেয়ে বেশি বিক্রি' | 'নতুন এসেছে'
  grocery: CuratedProduct[]
  brands: Array<{ id: string; name: string; slug: string; logoUrl: string | null }>
}

const TABS: Array<{ key: CategoryIconKey; label: string }> = [
  { key: 'skincare', label: 'স্কিন কেয়ার' },
  { key: 'makeup', label: 'মেকআপ' },
  { key: 'hair', label: 'হেয়ার কেয়ার' },
  { key: 'fragrance', label: 'পারফিউম' },
]

export function ProductRow({ products, href, showSold = false, limit = 10 }: { products: CuratedProduct[]; href: string; showSold?: boolean; limit?: number }) {
  return <div className="scrollbar-hide -mx-4 flex snap-x snap-mandatory gap-2.5 overflow-x-auto px-4 pb-2 md:mx-0 md:grid md:grid-cols-4 md:gap-4 md:overflow-visible md:px-0 lg:grid-cols-5">
    {products.slice(0, limit).map((product, index) => <div key={product.id} className="w-[150px] flex-shrink-0 snap-start md:w-auto">
      <ProductCard product={product} variant="compact" className="h-full" imagePriority={index < 5} />
      {showSold && product.soldPercentage != null && <div className="mt-2 px-1">
        <div className="mb-1 text-[11px] font-semibold text-orange-700">{product.soldPercentage}% বিক্রি হয়ে গেছে</div>
        <div className="h-1.5 overflow-hidden rounded-full bg-orange-100"><div className="h-full rounded-full bg-[#C2410C]" style={{ width: `${product.soldPercentage}%` }} /></div>
      </div>}
    </div>)}
    <Link href={href} className="flex min-h-44 w-[120px] shrink-0 snap-start items-center justify-center rounded-2xl border border-teal-100 bg-white px-3 text-center text-sm font-bold text-[#0F766E] md:hidden">সব দেখুন →</Link>
  </div>
}

export function SectionHeader({ title, subtitle, href }: { title: string; subtitle?: string | null; href?: string }) {
  return <div className="mb-[14px] flex min-h-11 items-start justify-between gap-3">
    <div className="min-w-0"><h2 className="font-display text-[22px] font-bold leading-tight text-[#0B4F4A]">{title}</h2>{subtitle && <p className="mt-1 text-[13px] text-slate-500">{subtitle}</p>}</div>
    {href && <Link href={href} className="inline-flex min-h-11 shrink-0 items-center justify-center px-2 text-sm font-bold text-[#0F766E]">সব দেখুন →</Link>}
  </div>
}

function FlashCountdown({ endsAt, serverNow }: { endsAt: Date | string; serverNow: Date | string }) {
  const target = useMemo(() => new Date(endsAt).getTime(), [endsAt])
  const serverTimestamp = useMemo(() => new Date(serverNow).getTime(), [serverNow])
  const [remaining, setRemaining] = useState<number | null>(null)
  useEffect(() => {
    const storageKey = 'halalzi-flash-sale-end'
    const storedTarget = Number(window.sessionStorage.getItem(storageKey))
    const effectiveTarget = storedTarget > Date.now() ? Math.min(target, storedTarget) : target
    window.sessionStorage.setItem(storageKey, String(effectiveTarget))
    const serverRemaining = Math.max(0, target - serverTimestamp)
    const clientRemaining = Math.max(0, effectiveTarget - Date.now())
    const initialRemaining = Math.min(serverRemaining, clientRemaining)
    const startedAt = performance.now()
    const tick = () => {
      const next = Math.max(0, initialRemaining - (performance.now() - startedAt))
      setRemaining((previous) => previous == null ? next : Math.min(previous, next))
    }
    tick()
    const timer = window.setInterval(tick, 1000)
    return () => window.clearInterval(timer)
  }, [serverTimestamp, target])
  if (remaining === 0) return null
  const formatted = remaining == null ? '--:--:--' : [Math.floor(remaining / 3_600_000), Math.floor((remaining % 3_600_000) / 60_000), Math.floor((remaining % 60_000) / 1000)].map((value) => String(value).padStart(2, '0')).join(':')
  return <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-bold tabular-nums text-[#C2410C]"><Clock3 className="h-3.5 w-3.5" aria-hidden /><span className="sr-only">অফার শেষ হবে {new Date(endsAt).toLocaleString('bn-BD')}</span><span aria-hidden>{formatted}</span></span>
}

export function FlashSaleHomeSection({ products, endsAt, serverNow }: { products: CuratedProduct[]; endsAt: string | null; serverNow: string }) {
  if (!products.length) return null
  return <section className="mx-4 my-5 rounded-[20px] bg-orange-50 p-5 md:mx-0">
    <div className="mb-[14px] grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-3 md:flex md:items-center">
      <h2 className="font-display text-[22px] font-bold leading-tight text-[#0B4F4A]">ফ্ল্যাশ সেল</h2>
      {endsAt && <FlashCountdown endsAt={endsAt} serverNow={serverNow} />}
      <Link href="/flash-sale" className="col-span-2 inline-flex min-h-11 items-center justify-center justify-self-end px-2 text-sm font-bold text-[#0F766E] md:ml-auto">সব দেখুন →</Link>
    </div>
    <ProductRow products={products} href="/flash-sale" showSold limit={5} />
  </section>
}

export function SkinTypeHomeSection({ skinTypes }: { skinTypes: CuratedHomeData['skinTypes'] }) {
  if (skinTypes.length < 3) return null
  return <section className="bg-white px-4 py-5 md:px-0"><SectionHeader title="আপনার স্কিন টাইপ অনুযায়ী" subtitle="আপনার ত্বকের ধরন অনুযায়ী পণ্য খুঁজুন" /><div className="scrollbar-hide flex snap-x snap-mandatory gap-2.5 overflow-x-auto pb-1 md:grid md:grid-cols-4 md:gap-4 md:overflow-visible lg:grid-cols-5">{skinTypes.map((skinType) => <Link key={skinType.label} href={`/search?q=${encodeURIComponent(skinType.query)}`} className="flex min-h-16 min-w-[150px] snap-start flex-col items-center justify-center rounded-2xl border border-pink-100 bg-[#FCE8EC] px-3 font-bold text-[#BE185D] md:min-w-0"><span>{skinType.label}</span><span className="mt-1 text-xs font-medium text-slate-600">{skinType.count}টি পণ্য</span></Link>)}</div></section>
}

export function BestSellerHomeSection({ groups, title }: { groups: CuratedHomeData['bestSellers']; title: CuratedHomeData['bestSellerTitle'] }) {
  const availableTabs = TABS.filter((tab) => (groups[tab.key]?.length ?? 0) > 0)
  const [active, setActive] = useState<CategoryIconKey>(availableTabs[0]?.key ?? 'skincare')
  const buttonRefs = useRef<Array<HTMLButtonElement | null>>([])
  if (!availableTabs.length) return null
  const selectedIndex = Math.max(0, availableTabs.findIndex((tab) => tab.key === active))
  const selected = availableTabs[selectedIndex]
  const products = groups[selected.key] ?? []
  const selectTab = (index: number) => {
    const next = (index + availableTabs.length) % availableTabs.length
    setActive(availableTabs[next].key)
    buttonRefs.current[next]?.focus()
  }
  return <section className="bg-white px-4 py-5 md:px-0">
    <SectionHeader title={title} href="/products" />
    <div role="tablist" aria-label={`${title} ক্যাটাগরি`} className="scrollbar-hide mb-[14px] flex snap-x snap-mandatory gap-2 overflow-x-auto">
      {availableTabs.map((tab, index) => <button ref={(node) => { buttonRefs.current[index] = node }} key={tab.key} id={`best-tab-${tab.key}`} type="button" role="tab" aria-selected={active === tab.key} aria-controls={`best-panel-${tab.key}`} tabIndex={active === tab.key ? 0 : -1} onClick={() => setActive(tab.key)} onKeyDown={(event) => {
        if (event.key === 'ArrowRight') { event.preventDefault(); selectTab(index + 1) }
        if (event.key === 'ArrowLeft') { event.preventDefault(); selectTab(index - 1) }
        if (event.key === 'Home') { event.preventDefault(); selectTab(0) }
        if (event.key === 'End') { event.preventDefault(); selectTab(availableTabs.length - 1) }
      }} className={`h-11 shrink-0 snap-start rounded-full px-4 text-sm font-bold ${active === tab.key ? 'bg-[#0F766E] text-white' : 'border border-teal-100 bg-white text-[#0B4F4A]'}`}>{tab.label}</button>)}
    </div>
    <div role="tabpanel" id={`best-panel-${selected.key}`} aria-labelledby={`best-tab-${selected.key}`}><ProductRow products={products} href="/products" /></div>
  </section>
}

export function GroceryHomeSection({ products }: { products: CuratedProduct[] }) {
  if (!products.length) return null
  return <section className="mx-4 my-5 rounded-[20px] bg-teal-50 p-5 md:mx-0"><SectionHeader title="দৈনন্দিন বাজার" href="/products?category=grocery" /><ProductRow products={products} href="/products?category=grocery" /></section>
}

export function PopularBrandsSection({ brands }: { brands: CuratedHomeData['brands'] }) {
  if (brands.length < 4) return null
  return <section className="bg-white px-4 py-6 md:px-0">
    <SectionHeader title="জনপ্রিয় ব্র্যান্ড" />
    <div className="scrollbar-hide flex snap-x snap-mandatory gap-3 overflow-x-auto lg:grid lg:grid-cols-4 xl:grid-cols-8 lg:overflow-visible">
      {brands.map((brand) => <Link key={brand.id} href={`/manufacturer/${brand.slug}`} className="flex h-[72px] w-40 shrink-0 snap-start items-center justify-center rounded-[14px] border border-slate-100 bg-white p-3 text-center shadow-sm lg:w-auto">
        {brand.logoUrl ? <span className="relative h-10 w-full"><Image src={brand.logoUrl} alt={brand.name} fill sizes="160px" className="object-contain" /></span> : <span className="line-clamp-2 font-display text-base font-bold text-[#0B4F4A]">{brand.name}</span>}
      </Link>)}
    </div>
  </section>
}
