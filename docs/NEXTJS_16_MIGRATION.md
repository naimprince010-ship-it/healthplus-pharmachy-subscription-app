# Next.js 16 App Router Migration Guide

This document explains the breaking changes in Next.js 16 App Router and how to handle them correctly in this codebase.

## Breaking Changes

### 1. `params` is now a Promise

In Next.js 16, the `params` prop in page components and route handlers is now a `Promise` instead of a plain object.

#### ❌ Old Way (Next.js 15 and earlier)

```tsx
// app/admin/categories/[id]/edit/page.tsx
export default async function EditPage({
  params,
}: {
  params: { id: string }  // ❌ Wrong in Next.js 16
}) {
  const id = params.id  // ❌ params.id is undefined
  // ...
}
```

#### ✅ New Way (Next.js 16)

```tsx
// app/admin/categories/[id]/edit/page.tsx
import { PageParams } from '@/types/page'

export default async function EditPage({
  params,
}: PageParams<{ id: string }>) {  // ✅ Correct
  const { id } = await params  // ✅ Await the Promise
  // ...
}
```

### 2. `searchParams` is now a Promise

Similarly, `searchParams` in page components is now a `Promise`.

#### ❌ Old Way (Next.js 15 and earlier)

```tsx
// app/admin/orders/page.tsx
export default async function OrdersPage({
  searchParams,
}: {
  searchParams: { status?: string }  // ❌ Wrong in Next.js 16
}) {
  const status = searchParams.status  // ❌ searchParams.status is undefined
  // ...
}
```

#### ✅ New Way (Next.js 16)

```tsx
// app/admin/orders/page.tsx
import { PageSearchParams } from '@/types/page'

export default async function OrdersPage({
  searchParams,
}: PageSearchParams<{ status?: string }>) {  // ✅ Correct
  const { status } = await searchParams  // ✅ Await the Promise
  // ...
}
```

### 3. Route Handlers also use Promise-based params

API route handlers in `app/api/**/route.ts` also receive Promise-based params.

#### ❌ Old Way

```tsx
// app/api/admin/categories/[id]/route.ts
export async function GET(
  request: Request,
  { params }: { params: { id: string } }  // ❌ Wrong
) {
  const id = params.id  // ❌ undefined
  // ...
}
```

#### ✅ New Way

```tsx
// app/api/admin/categories/[id]/route.ts
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }  // ✅ Correct
) {
  const { id } = await params  // ✅ Await the Promise
  // ...
}
```

### 4. `generateMetadata` also uses Promise-based params

```tsx
import type { Metadata } from 'next'
import { PageParams } from '@/types/page'

export async function generateMetadata({
  params,
}: PageParams<{ slug: string }>): Promise<Metadata> {
  const { slug } = await params  // ✅ Await the Promise
  
  // Fetch data for metadata
  const item = await prisma.item.findUnique({ where: { slug } })
  
  return {
    title: item?.name || 'Not Found',
    description: item?.description,
  }
}
```

## Using Shared Types

We've created shared types in `types/page.ts` to make this easier:

```tsx
import { PageParams, PageSearchParams, PageParamsAndSearchParams } from '@/types/page'

// For pages with only searchParams (list pages with filters)
export default async function ListPage({
  searchParams,
}: PageSearchParams<{ search?: string; status?: string }>) {
  const params = await searchParams
  // ...
}

// For pages with only params (detail pages)
export default async function DetailPage({
  params,
}: PageParams<{ id: string }>) {
  const { id } = await params
  // ...
}

// For pages with both params and searchParams
export default async function UserOrdersPage({
  params,
  searchParams,
}: PageParamsAndSearchParams<{ userId: string }, { status?: string }>) {
  const { userId } = await params
  const { status } = await searchParams
  // ...
}
```

## Templates

Use the templates in the `templates/` directory when creating new pages:

- **`templates/page-with-filters.tsx`** - For list pages with query parameter filters
- **`templates/page-with-dynamic-route.tsx`** - For detail pages with dynamic route segments

## Client Components

**Important:** Client components using `useParams()` and `useSearchParams()` hooks are NOT affected by this change. These hooks still return plain objects, not Promises.

```tsx
'use client'

import { useSearchParams } from 'next/navigation'

export function FilterComponent() {
  const searchParams = useSearchParams()
  const status = searchParams.get('status')  // ✅ Still works the same
  // ...
}
```

## CI Check

We have a pre-commit check that prevents committing pages with incorrect param types. If you see an error like:

```
Error: Found non-Promise params or searchParams in page components
```

This means you need to update your page component to use Promise-based types.

## Common Mistakes

### Mistake 1: Forgetting to await

```tsx
// ❌ Wrong
const { id } = params  // params is a Promise, not an object

// ✅ Correct
const { id } = await params
```

### Mistake 2: Using plain object types

```tsx
// ❌ Wrong
params: { id: string }

// ✅ Correct
params: Promise<{ id: string }>
```

### Mistake 3: Confusing server and client components

```tsx
// ❌ Wrong - trying to await in client component
'use client'
export default async function ClientPage({ params }: PageParams<{ id: string }>) {
  // Client components can't be async!
}

// ✅ Correct - use useParams hook in client components
'use client'
import { useParams } from 'next/navigation'
export default function ClientPage() {
  const params = useParams()
  const id = params.id  // No await needed
}
```

## References

- [Next.js 16 Upgrade Guide](https://nextjs.org/docs/app/building-your-application/upgrading/version-16)
- [App Router API Reference](https://nextjs.org/docs/app/api-reference/file-conventions/page)

## Fixed Issues

- **PR #38**: Fixed category edit page crash by awaiting params
- **PR #40**: Fixed status filter buttons by awaiting searchParams on orders, categories, and medicines pages

These issues occurred because the pages were treating Promise-based params/searchParams as plain objects, causing the values to be `undefined` and filters to silently fail.
