'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronRight, Baby, Cross, Droplets, Flame, Heart, Shield, Sparkles, Star } from 'lucide-react'

export function getCategoryIcon(name: string) {
  const n = name.toLowerCase()
  if (n.includes('face') || n.includes('skin') || n.includes('beauty')) return Sparkles
  if (n.includes('hair')) return Droplets
  if (n.includes('baby') || n.includes('kid') || n.includes('mom')) return Baby
  if (n.includes('fragrance') || n.includes('perfume')) return Flame
  if (n.includes('lip')) return Heart
  if (n.includes('oral') || n.includes('দাঁত')) return Cross
  if (n.includes('wellness') || n.includes('health') || n.includes('ঔষধ') || n.includes('medicine')) return Shield
  return Star
}

interface Category {
  id: string
  name: string
  slug: string
  sidebarLinkUrl: string | null
}

export default function CategorySidebarList({ categories }: { categories: Category[] }) {
  const pathname = usePathname()

  return (
    <div className="divide-y divide-gray-50/80">
      {categories.map((category) => {
        const href = category.sidebarLinkUrl || `/category/${category.slug}`
        const isActive = pathname === href || pathname.startsWith(`${href}/`)
        const Icon = getCategoryIcon(category.name)

        return (
          <Link
            prefetch
            key={category.id}
            href={href}
            className={`group relative flex items-center justify-between px-3 py-2.5 transition-colors duration-300 ${
              isActive ? 'bg-primary/5' : 'hover:bg-primary/5'
            }`}
          >
            {/* Left accent */}
            <span
              className={`absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-primary transition-all duration-300 ${
                isActive ? 'opacity-100 h-7' : 'opacity-0 group-hover:opacity-100 group-hover:h-7'
              }`}
            />
            <div className="flex items-center gap-3">
              <div
                className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl transition-all duration-300 ${
                  isActive
                    ? 'bg-primary/20 text-primary-dark scale-110'
                    : 'bg-primary/10 text-primary group-hover:bg-primary/20 group-hover:scale-110'
                }`}
              >
                <Icon className="h-4 w-4" />
              </div>
              <span
                className={`text-[13.5px] font-medium transition-colors duration-300 ${
                  isActive ? 'text-primary-dark' : 'text-gray-700 group-hover:text-primary-dark'
                }`}
              >
                {category.name}
              </span>
            </div>
            <ChevronRight
              className={`h-3.5 w-3.5 transition-all duration-300 ${
                isActive ? 'text-primary-light translate-x-1' : 'text-gray-300 group-hover:translate-x-1 group-hover:text-primary-light'
              }`}
            />
          </Link>
        )
      })}
    </div>
  )
}
