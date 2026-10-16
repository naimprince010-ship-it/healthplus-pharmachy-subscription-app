'use client'

/**
 * Halalzi storefront category icon set.
 * 2D outline, 1.75px stroke at any size, rounded caps/joins,
 * soft pastel gradient fills (blue / teal / rose) inside some shapes.
 */
import { useId, type ReactNode } from 'react'
import { resolveCategoryIconKey, type CategoryIconKey } from '@/lib/category-icon-key'

export interface CategoryIconProps {
  /** Rendered size in px (square). Default 24. */
  size?: number
  className?: string
  /** Stroke color. Default dark slate. */
  color?: string
  /** Accessible label; when omitted the icon is decorative (aria-hidden). */
  title?: string
}

type Fills = { blue: string; teal: string; rose: string; white: string }

function IconBase({
  size = 24,
  className,
  color = '#23415A',
  title,
  children,
}: CategoryIconProps & { children: (f: Fills) => ReactNode }) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '')
  const ids = { blue: `${uid}-b`, teal: `${uid}-t`, rose: `${uid}-r` }
  // Keep the visual stroke at 1.75px regardless of rendered size.
  const strokeWidth = (1.75 * 24) / size
  const fills: Fills = {
    blue: `url(#${ids.blue})`,
    teal: `url(#${ids.teal})`,
    rose: `url(#${ids.rose})`,
    white: '#FFFFFF',
  }

  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      focusable="false"
      style={{ overflow: 'visible', flexShrink: 0 }}
    >
      {title ? <title>{title}</title> : null}
      <defs>
        <linearGradient id={ids.blue} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#EAF3FF" />
          <stop offset="1" stopColor="#B9D5F8" />
        </linearGradient>
        <linearGradient id={ids.teal} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#E3F8F3" />
          <stop offset="1" stopColor="#A6E3D6" />
        </linearGradient>
        <linearGradient id={ids.rose} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FFEBE8" />
          <stop offset="1" stopColor="#F9BFB8" />
        </linearGradient>
      </defs>
      {children(fills)}
    </svg>
  )
}

export function AllCategoriesIcon(props: CategoryIconProps) {
  return (
    <IconBase {...props}>
      {(f) => (
        <>
          <rect fill={f.blue} x="3" y="3" width="7.5" height="7.5" rx="2" />
          <rect x="13.5" y="3" width="7.5" height="7.5" rx="2" />
          <rect x="3" y="13.5" width="7.5" height="7.5" rx="2" />
          <rect fill={f.teal} x="13.5" y="13.5" width="7.5" height="7.5" rx="2" />
        </>
      )}
    </IconBase>
  )
}

export function CosmeticsIcon(props: CategoryIconProps) {
  return (
    <IconBase {...props}>
      {(f) => (
        <>
          <rect fill={f.rose} x="3" y="13" width="6" height="8" rx="1.3" />
          <rect x="3.8" y="10" width="4.4" height="3" rx="0.6" />
          <path fill={f.rose} d="M4.6 10V6.6L7.4 4.6V10Z" />
          <rect fill={f.blue} x="11.5" y="10" width="9" height="11" rx="2.6" />
          <rect x="14.5" y="7.6" width="3" height="2.4" />
          <rect fill={f.white} x="14" y="5" width="4" height="2.6" rx="0.7" />
          <path d="M14.5 14.5h3" />
          <path d="M20.8 1.8v2.6M19.5 3.1h2.6" />
          <path d="M11 3.2v1.8M10.1 4.1h1.8" />
        </>
      )}
    </IconBase>
  )
}

export function SkincareIcon(props: CategoryIconProps) {
  return (
    <IconBase {...props}>
      {(f) => (
        <>
          <rect fill={f.teal} x="4" y="11" width="10" height="10" rx="2.6" />
          <rect x="6.5" y="8.6" width="5" height="2.4" rx="0.5" />
          <path fill={f.white} d="M7.5 8.6V4.6a1.5 1.5 0 0 1 3 0v4Z" />
          <path d="M7 15.5h4" />
          <path fill={f.blue} d="M17.6 4.5s-1.7 2-1.7 3.2a1.7 1.7 0 0 0 3.4 0c0-1.2-1.7-3.2-1.7-3.2Z" />
          <path fill={f.blue} d="M20.6 10.5s-1 1.2-1 1.9a1 1 0 0 0 2 0c0-.7-1-1.9-1-1.9Z" />
          <path fill={f.teal} d="M16 21c0-3 2.1-5.1 5.2-5.3 0 3.1-2.1 5.2-5.2 5.3Z" />
          <path d="M16 21l2.8-2.8" />
        </>
      )}
    </IconBase>
  )
}

export function MedicineIcon(props: CategoryIconProps) {
  return (
    <IconBase {...props}>
      {(f) => (
        <>
          <g transform="rotate(-45 8.5 10.5)">
            <path fill={f.rose} d="M8.5 7.5H5.5a3 3 0 0 0 0 6h3Z" />
            <path fill={f.white} d="M8.5 7.5h3a3 3 0 0 1 0 6h-3Z" />
          </g>
          <circle fill={f.blue} cx="17" cy="16.5" r="4.5" />
          <path d="M17 14.8v3.4M15.3 16.5h3.4" />
        </>
      )}
    </IconBase>
  )
}

export function PrescriptionIcon(props: CategoryIconProps) {
  return (
    <IconBase {...props}>
      {(f) => (
        <>
          <rect fill={f.blue} x="4.5" y="4" width="15" height="17.5" rx="2.2" />
          <rect fill={f.white} x="8.5" y="2.5" width="7" height="3.4" rx="1.2" />
          <path d="M8.5 9.5v7" />
          <path d="M8.5 9.5h2.6a2 2 0 0 1 0 4H8.5" />
          <path d="M10.6 13.5l4.6 5" />
          <path d="M15.4 14.4l-3.6 4.2" />
        </>
      )}
    </IconBase>
  )
}

export function GroceryIcon(props: CategoryIconProps) {
  return (
    <IconBase {...props}>
      {(f) => (
        <>
          <path fill={f.rose} d="M6.6 10.5l3.1-5.6a1.3 1.3 0 0 1 2.3 1.2l-2.1 4.4" />
          <path fill={f.teal} d="M14 10.5c-.3-2.1.6-3.8 2.4-4.6.4 1.9-.2 3.5-1.5 4.6" />
          <path d="M17.6 10.5c.4-1.7 1.6-2.7 3.1-2.9" />
          <path fill={f.teal} d="M3 10.5h18l-1.8 8.9a2 2 0 0 1-2 1.6H6.8a2 2 0 0 1-2-1.6Z" />
          <path d="M9 14v3.5M12 14v3.5M15 14v3.5" />
        </>
      )}
    </IconBase>
  )
}

export function FreshFruitsIcon(props: CategoryIconProps) {
  return (
    <IconBase {...props}>
      {(f) => (
        <>
          <path
            fill={f.rose}
            d="M8 8.6c-1-.7-2.3-.9-3.3-.5C2.8 8.8 2.2 11.3 2.9 13.8c.7 2.6 2.4 4.8 4 4.8.6 0 .9-.3 1.1-.3s.5.3 1.1.3c1.6 0 3.3-2.2 4-4.8.7-2.5.1-5-1.8-5.7-1-.4-2.3-.2-3.3.5Z"
          />
          <path d="M8 8.6V6.2" />
          <path fill={f.teal} d="M8 6.6c.5-1.8 2-2.6 3.5-2.5-.3 1.6-1.7 2.5-3.5 2.5Z" />
          <path fill={f.rose} d="M15 21l3.4-10.2a2.2 2.2 0 0 1 3.9 1.5Z" />
          <path d="M17.2 15.4l1.4.6M16.2 18.2l1.2.5" />
          <path d="M20 10.4c-.3-1.8.2-3.2 1.4-4M20 10.4c1-1 2.2-1.3 3.1-1.1" />
        </>
      )}
    </IconBase>
  )
}

export function BabyCareIcon(props: CategoryIconProps) {
  return (
    <IconBase {...props}>
      {(f) => (
        <>
          <path fill={f.white} d="M6.5 6V4.6a2 2 0 0 1 4 0V6" />
          <rect x="5" y="6" width="7" height="2.5" rx="0.8" />
          <path fill={f.blue} d="M5.5 8.5h6v11a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2Z" />
          <path d="M5.5 12.5h2M5.5 15.5h2" />
          <path
            fill={f.rose}
            d="M17.5 20.5s-4.5-2.8-4.5-5.8a2.4 2.4 0 0 1 4.5-1.2 2.4 2.4 0 0 1 4.5 1.2c0 3-4.5 5.8-4.5 5.8Z"
          />
        </>
      )}
    </IconBase>
  )
}

export function DealsIcon(props: CategoryIconProps) {
  return (
    <IconBase {...props}>
      {(f) => (
        <>
          <path
            fill={f.rose}
            d="M3 12.2V4.5A1.5 1.5 0 0 1 4.5 3h7.7a1.5 1.5 0 0 1 1.1.4l7.4 7.4a1.5 1.5 0 0 1 0 2.1l-7.7 7.7a1.5 1.5 0 0 1-2.1 0l-7.5-7.5a1.5 1.5 0 0 1-.4-.9Z"
          />
          <circle fill={f.white} cx="7.5" cy="7.5" r="1.3" />
          <path d="M10.4 16.4l5-5" />
          <circle cx="11" cy="12" r="1" />
          <circle cx="14.8" cy="15.8" r="1" />
        </>
      )}
    </IconBase>
  )
}

export const CATEGORY_ICONS: Record<CategoryIconKey, (props: CategoryIconProps) => ReactNode> = {
  all: AllCategoriesIcon,
  medicine: MedicineIcon,
  prescription: PrescriptionIcon,
  baby: BabyCareIcon,
  skincare: SkincareIcon,
  cosmetics: CosmeticsIcon,
  fresh: FreshFruitsIcon,
  grocery: GroceryIcon,
  deals: DealsIcon,
}

/** Render the icon for an explicit key. */
export function CategoryIconByKey({ iconKey, ...props }: CategoryIconProps & { iconKey: CategoryIconKey }) {
  const Icon = CATEGORY_ICONS[iconKey] ?? AllCategoriesIcon
  return <Icon {...props} />
}

/** Render the icon that best matches a category's slug / name. */
export function CategoryIcon({
  slug,
  name,
  ...props
}: CategoryIconProps & { slug?: string | null; name?: string | null }) {
  return <CategoryIconByKey iconKey={resolveCategoryIconKey(slug, name)} {...props} />
}
