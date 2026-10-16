'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronRight } from 'lucide-react'
import { CATEGORY_ICONS, CategoryIcon } from '@/components/icons/CategoryIcons'
import { resolveCategoryIconKey } from '@/lib/category-icon-key'

/**
 * Kept for backwards compatibility with any caller that still does
 * `const Icon = getCategoryIcon(name); <Icon className="…" />`.
 */
export function getCategoryIcon(name: string, slug?: string) {
  return CATEGORY_ICONS[resolveCategoryIconKey(slug, name)]
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
                className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl transition-all duration-300 ${
                  isActive
                    ? 'bg-white ring-1 ring-primary/30 scale-105'
                    : 'bg-slate-50 ring-1 ring-slate-100 group-hover:bg-white group-hover:ring-primary/20 group-hover:scale-105'
                }`}
              >
                <CategoryIcon slug={category.slug} name={category.name} size={22} />
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
