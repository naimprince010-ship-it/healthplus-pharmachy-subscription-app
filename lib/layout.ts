/**
 * Shared layout constants for consistent container styling across all pages.
 * 
 * MAIN_CONTAINER provides:
 * - Centered layout with max-width 1480px for normal desktops
 * - Full-width stretch with 32px padding on large screens (2xl breakpoint, ≥1536px)
 * - Responsive horizontal padding: 8px (mobile) → 16px (sm) → 24px (lg) → 32px (2xl)
 */

// Main container class for pages without sidebar
// Use this for cart, checkout, search, flash-sale, membership, etc.
export const MAIN_CONTAINER = 'mx-auto w-full max-w-[1480px] 2xl:max-w-none px-2 sm:px-4 lg:px-6 2xl:px-8'

// Main container with sidebar grid for shop pages
// Use this in ShopLayout for pages that need the category sidebar
export const MAIN_CONTAINER_WITH_SIDEBAR = `${MAIN_CONTAINER} lg:grid lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-4`
