# Next.js 16 Prevention Measures

This document explains the prevention measures we've implemented to avoid Next.js 16 Promise-based params/searchParams issues in the future.

## Problem Background

In Next.js 16, `params` and `searchParams` in page components and route handlers changed from plain objects to Promises. This caused silent failures where filters and dynamic routes stopped working because the code was accessing `undefined` values.

**Issues Fixed:**
- **PR #38**: Category edit page crashed because `params.id` was undefined
- **PR #40**: Status filter buttons didn't work because `searchParams.status` was undefined

## Prevention Measures

We've implemented a comprehensive prevention strategy to ensure this issue never happens again:

### 1. Shared Types (`types/page.ts`)

We've created reusable TypeScript types that enforce correct Promise-based typing:

```tsx
import { PageParams, PageSearchParams, PageParamsAndSearchParams } from '@/types/page'

// For list pages with filters
export default async function ListPage({
  searchParams,
}: PageSearchParams<{ status?: string }>) {
  const { status } = await searchParams
  // ...
}

// For detail pages with dynamic routes
export default async function DetailPage({
  params,
}: PageParams<{ id: string }>) {
  const { id } = await params
  // ...
}
```

**Benefits:**
- TypeScript will catch incorrect types at compile time
- Consistent pattern across the codebase
- Self-documenting code

### 2. Page Templates (`templates/`)

We've created copy-paste templates for common page patterns:

- **`templates/page-with-filters.tsx`** - For list pages with query parameter filters (e.g., `/admin/orders?status=PENDING`)
- **`templates/page-with-dynamic-route.tsx`** - For detail pages with dynamic route segments (e.g., `/admin/categories/[id]/edit`)

**Usage:**
1. Copy the appropriate template
2. Rename and move to your desired location
3. Modify the types and logic for your specific use case
4. The template already has correct Promise-based params/searchParams handling

### 3. Documentation (`docs/NEXTJS_16_MIGRATION.md`)

Comprehensive documentation explaining:
- The breaking changes in Next.js 16
- Before/after code examples
- Common mistakes to avoid
- How to use shared types
- Differences between server and client components

**When to read:**
- Before creating new page components
- When encountering params/searchParams issues
- When onboarding new developers

### 4. CI Check Script (`scripts/check-nextjs16-params.js`)

Automated script that scans the codebase for incorrect params/searchParams usage:

```bash
npm run check:nextjs16
```

**What it checks:**
- ❌ Non-Promise params types: `params: { id: string }`
- ❌ Non-Promise searchParams types: `searchParams: { status?: string }`
- ⚠️ Direct property access without await (heuristic warnings)

**When it runs:**
- Manually via `npm run check:nextjs16`
- Can be added to CI/CD pipeline
- Can be added as a pre-commit hook

**Exit codes:**
- `0` - All checks passed
- `1` - Found errors (blocks commit/CI)

### 5. Package.json Script

Added `check:nextjs16` script to package.json for easy access:

```json
{
  "scripts": {
    "check:nextjs16": "node scripts/check-nextjs16-params.js"
  }
}
```

## How to Use These Measures

### When Creating a New Page

1. **Check the templates first:**
   ```bash
   ls templates/
   ```

2. **Copy the appropriate template:**
   ```bash
   cp templates/page-with-filters.tsx app/admin/my-new-page/page.tsx
   ```

3. **Or use the shared types:**
   ```tsx
   import { PageSearchParams } from '@/types/page'
   
   export default async function MyPage({
     searchParams,
   }: PageSearchParams<{ filter?: string }>) {
     const { filter } = await searchParams
     // ...
   }
   ```

4. **Run the CI check:**
   ```bash
   npm run check:nextjs16
   ```

### Before Committing

Always run the CI check to catch any issues:

```bash
npm run check:nextjs16
```

If you see errors, fix them before committing. The error messages will guide you on what needs to be fixed.

### Adding to CI/CD Pipeline

Add this to your GitHub Actions workflow:

```yaml
- name: Check Next.js 16 params usage
  run: npm run check:nextjs16
```

### Adding as Pre-commit Hook

Add to `.husky/pre-commit` or similar:

```bash
#!/bin/sh
npm run check:nextjs16
```

## Quick Reference

| Scenario | Type to Use | Example |
|----------|-------------|---------|
| List page with filters | `PageSearchParams<T>` | Orders page with status filter |
| Detail page with [id] | `PageParams<T>` | Category edit page |
| Page with both | `PageParamsAndSearchParams<P, S>` | User orders page |
| API route handler | Manual `Promise<T>` | GET /api/categories/[id] |
| Client component | Use hooks (no Promise) | `useParams()`, `useSearchParams()` |

## Common Mistakes

### ❌ Wrong: Plain object type
```tsx
export default async function Page({
  params,
}: {
  params: { id: string }  // Wrong!
}) {
  const id = params.id  // undefined!
}
```

### ✅ Correct: Promise type with await
```tsx
import { PageParams } from '@/types/page'

export default async function Page({
  params,
}: PageParams<{ id: string }>) {  // Correct!
  const { id } = await params  // Correct!
}
```

## Resources

- **Shared Types:** `types/page.ts`
- **Templates:** `templates/`
- **Documentation:** `docs/NEXTJS_16_MIGRATION.md`
- **CI Check:** `scripts/check-nextjs16-params.js`
- **Next.js 16 Docs:** https://nextjs.org/docs/app/building-your-application/upgrading/version-16

## Summary

These prevention measures ensure that:
1. ✅ New pages use correct Promise-based types
2. ✅ TypeScript catches type errors at compile time
3. ✅ CI catches incorrect patterns before merge
4. ✅ Developers have clear examples and documentation
5. ✅ The codebase maintains consistency

**Result:** This issue will never happen again when adding new modules or pages.
