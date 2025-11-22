# HealthPlus Pharmacy Subscription System - Architecture & Folder Structure

**Version:** 1.0  
**Last Updated:** November 22, 2025  
**Related Documentation:**
- [System Requirements Document](./HEALTHPLUS_SRD.md)
- [Database Schema & ERD](./DATABASE_SCHEMA.md)
- [Authentication Flow](./AUTH_FLOW.md)
- [API Data Flow](./API_DATA_FLOW.md)
- [API Audit Matrix](./API_AUDIT_MATRIX.md)

---

## Table of Contents

1. [Tech Stack](#tech-stack)
2. [Frontend Structure](#frontend-structure)
3. [Backend/API Structure](#backend-api-structure)
4. [Authentication & Middleware](#authentication--middleware)
5. [Configuration & Environment](#configuration--environment)
6. [Coding Conventions](#coding-conventions)
7. [Performance & Security](#performance--security)
8. [Testing Strategy](#testing-strategy)
9. [Deployment](#deployment)

---

## Tech Stack

### Core Framework

**Next.js 15 (App Router)**
- **Why:** Full-stack React framework with server-side rendering, API routes, and excellent developer experience
- **App Router:** Modern routing system with layouts, loading states, and streaming
- **Server Components:** Default server-side rendering for better performance
- **Client Components:** Interactive components with `'use client'` directive

**TypeScript**
- **Why:** Type safety, better IDE support, fewer runtime errors
- **Version:** Latest stable (5.x)
- **Configuration:** Strict mode enabled in `tsconfig.json`

### Database & ORM

**Prisma 7**
- **Why:** Type-safe database client, excellent migrations, great developer experience
- **Database:** PostgreSQL (Supabase)
- **Schema:** `prisma/schema.prisma`
- **Migrations:** `prisma/migrations/`

**Supabase (PostgreSQL + Storage)**
- **Why:** Managed PostgreSQL with excellent free tier, built-in auth (not used), storage
- **Connection:** Transaction pooler (port 6543) for serverless compatibility
- **Features Used:** 
  - Database (primary)
  - Storage (medicine images, prescription uploads)
  - Two buckets: `healthplus` (prescriptions), `medicine-images` (medicine photos)
- **Storage Configuration:**
  - Server-side uploads using SUPABASE_SERVICE_ROLE_KEY (never exposed to client)
  - Public buckets for direct image access
  - Max file size: 1MB for medicine images, 5MB for prescriptions
  - Allowed types: JPG/PNG for medicines, JPG/PNG/PDF for prescriptions

### Authentication

**NextAuth.js v5 (Auth.js)**
- **Why:** Industry-standard authentication for Next.js, flexible providers
- **Providers:** Credentials (phone/email + password)
- **Session:** JWT-based sessions
- **Configuration:** `lib/auth.ts`

### UI & Styling

**Tailwind CSS**
- **Why:** Utility-first CSS, rapid development, consistent design system
- **Configuration:** `tailwind.config.ts`
- **Custom Theme:** Teal primary color, custom spacing

**Lucide React**
- **Why:** Beautiful, consistent icon library
- **Usage:** Icons throughout the application

### Deployment & Hosting

**Vercel**
- **Why:** Built by Next.js creators, zero-config deployment, excellent performance
- **Features:** Preview deployments, automatic HTTPS, CDN, edge functions
- **Environment Variables:** Managed in Vercel dashboard

---

## Frontend Structure

### Route Groups

Next.js App Router uses **route groups** to organize routes without affecting URL structure.

**Route Group Structure:**

```
app/
├── (site)/              # Public-facing site routes
│   ├── layout.tsx       # Site layout (Navbar + Footer)
│   ├── page.tsx         # Homepage (/)
│   ├── auth/
│   │   ├── signin/
│   │   │   └── page.tsx # Sign in page (/auth/signin)
│   │   └── signup/
│   │       └── page.tsx # Sign up page (/auth/signup)
│   ├── medicines/
│   │   └── page.tsx     # Medicine catalog (/medicines)
│   ├── cart/
│   │   └── page.tsx     # Shopping cart (/cart)
│   ├── checkout/
│   │   └── page.tsx     # Checkout (/checkout)
│   ├── membership/
│   │   └── page.tsx     # Membership info (/membership)
│   ├── subscriptions/
│   │   └── page.tsx     # Subscription plans (/subscriptions)
│   ├── dashboard/
│   │   └── page.tsx     # User dashboard (/dashboard)
│   └── orders/
│       └── [id]/
│           └── page.tsx # Order details (/orders/:id)
│
├── (admin)/             # Admin panel routes
│   ├── layout.tsx       # Admin layout (Sidebar + Header)
│   └── admin/
│       ├── page.tsx     # Admin dashboard (/admin)
│       ├── prescriptions/
│       │   └── page.tsx # Prescription management (/admin/prescriptions)
│       └── sales/
│           └── page.tsx # Sales reports (/admin/sales)
│
├── api/                 # API routes
│   ├── auth/
│   │   ├── [...nextauth]/
│   │   │   └── route.ts # NextAuth handler
│   │   └── signup/
│   │       └── route.ts # Signup API
│   ├── orders/
│   │   └── route.ts     # Orders API
│   ├── prescriptions/
│   │   └── route.ts     # Prescriptions API
│   ├── membership/
│   │   └── route.ts     # Membership API
│   ├── subscriptions/
│   │   └── route.ts     # Subscriptions API
│   ├── cart/
│   │   └── route.ts     # Cart API
│   ├── zones/
│   │   └── route.ts     # Zones API
│   └── admin/
│       ├── medicines/
│       │   └── route.ts # Admin medicine CRUD
│       ├── categories/
│       │   └── route.ts # Admin category CRUD
│       ├── orders/
│       │   └── route.ts # Admin order management
│       └── sales/
│           └── route.ts # Admin sales reports
│
├── layout.tsx           # Root layout (SessionProvider, fonts, metadata)
└── not-found.tsx        # 404 page
```

### Layout Hierarchy

**Root Layout (`app/layout.tsx`):**
- Wraps entire application
- Provides `SessionProvider` for NextAuth
- Sets global fonts and metadata
- Includes Google Tag Manager (future)

**Site Layout (`app/(site)/layout.tsx`):**
- Wraps all public-facing pages
- Includes `Navbar` component (top navigation)
- Includes `Footer` component (site footer)
- Used for: homepage, medicines, cart, checkout, dashboard, etc.

**Admin Layout (`app/(admin)/layout.tsx`):**
- Wraps all admin panel pages
- Includes `AdminLayoutClient` component (sidebar + header)
- No Navbar or Footer (separate admin UI)
- Used for: admin dashboard, prescriptions, sales, etc.

### Component Structure

```
components/
├── Navbar.tsx              # Main site navigation (role-based profile link)
├── Footer.tsx              # Site footer
├── admin/
│   ├── AdminSidebar.tsx    # Admin panel sidebar navigation
│   ├── AdminHeader.tsx     # Admin panel header with "Visit site" button
│   └── AdminLayoutClient.tsx # Admin layout wrapper (client component)
└── ui/                     # Reusable UI components (future)
    ├── Button.tsx
    ├── Input.tsx
    └── Modal.tsx
```

### State Management

**Current Approach:**
- **React State:** `useState` for local component state
- **Server State:** Server Components fetch data directly
- **Session State:** NextAuth `useSession()` hook for authentication

**Future Considerations:**
- **Zustand or Jotai:** For complex client-side state (cart, filters)
- **React Query:** For server state management and caching
- **Context API:** For theme, locale, or global settings

---

## Backend/API Structure

### API Routes Overview

All API routes are located in `app/api/` and follow RESTful conventions.

**Public APIs (No Authentication Required):**

- `GET /api/zones` - List all active delivery zones

**User APIs (Authentication Required):**

- `POST /api/auth/signup` - Create new user account
- `POST /api/orders` - Create new order
- `GET /api/orders` - List user's orders
- `POST /api/prescriptions` - Upload prescription
- `GET /api/prescriptions` - List user's prescriptions
- `POST /api/membership` - Purchase membership
- `GET /api/membership` - Get user's membership status
- `POST /api/subscriptions` - Create subscription
- `GET /api/subscriptions` - List user's subscriptions
- `POST /api/cart` - Manage cart (future: move to client-side)

**Admin APIs (Admin Role Required):**

- `GET /api/admin/medicines` - List all medicines
- `POST /api/admin/medicines` - Create medicine (with auto-pricing logic)
- `PUT /api/admin/medicines/[id]` - Update medicine (with image replacement)
- `DELETE /api/admin/medicines/[id]` - Delete medicine (soft/hard delete with image cleanup)
- `POST /api/admin/uploads/medicine-image` - Upload medicine image to Supabase Storage
- `DELETE /api/admin/uploads/medicine-image` - Delete medicine image from Supabase Storage
- `GET /api/admin/categories` - List all categories
- `POST /api/admin/categories` - Create category
- `PUT /api/admin/categories` - Update category
- `GET /api/admin/orders` - List all orders with filters
- `PUT /api/admin/orders` - Update order status
- `GET /api/admin/sales` - Get sales reports

**Authentication API:**

- `POST /api/auth/[...nextauth]` - NextAuth handler (signin, signout, session)

### API Response Format

**Success Response:**
```typescript
{
  success: true,
  data: { /* response data */ },
  message?: "Optional success message"
}
```

**Error Response:**
```typescript
{
  success: false,
  error: "Error message for user",
  details?: "Technical details (dev only)"
}
```

**HTTP Status Codes:**
- `200 OK` - Successful GET, PUT
- `201 Created` - Successful POST
- `400 Bad Request` - Invalid input
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Not authorized (wrong role)
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

### API Implementation Pattern

**Example API Route Structure:**

```typescript
// app/api/orders/route.ts
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  try {
    // 1. Authenticate user
    const session = await auth()
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // 2. Validate input (query params, body)
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')

    // 3. Query database
    const orders = await prisma.order.findMany({
      where: {
        userId: session.user.id,
        ...(status && { status }),
      },
      include: {
        items: {
          include: { medicine: true },
        },
        address: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    // 4. Return response
    return NextResponse.json({
      success: true,
      data: orders,
    })
  } catch (error) {
    console.error('Error fetching orders:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch orders' },
      { status: 500 }
    )
  }
}
```

**Related Documentation:** See [API_DATA_FLOW.md](./API_DATA_FLOW.md) for detailed API specifications.

---

## Authentication & Middleware

### NextAuth Configuration

**Location:** `lib/auth.ts`

**Provider:** Credentials (phone/email + password)

**Session Strategy:** JWT (stateless)

**Session Object:**
```typescript
{
  user: {
    id: string
    name: string
    email: string | null
    phone: string
    role: 'USER' | 'ADMIN'
  }
  expires: string
}
```

**Authentication Flow:**

1. User submits credentials (phone/email + password)
2. NextAuth calls `authorize()` function in credentials provider
3. System queries database for user by phone or email
4. System verifies password with bcrypt
5. If valid, return user object (id, name, email, phone, role)
6. NextAuth creates JWT session with user data
7. Session stored in HTTP-only cookie
8. Client receives session via `useSession()` hook

**Related Documentation:** See [AUTH_FLOW.md](./AUTH_FLOW.md) for detailed authentication implementation.

### Middleware (Route Protection)

**Location:** `middleware.ts`

**Purpose:** Protect routes based on authentication and role

**Protected Routes:**
- `/admin/*` - Requires ADMIN role
- `/dashboard/*` - Requires authentication (any role)

**Middleware Logic:**

```typescript
export default auth((req) => {
  const session = req.auth
  const path = req.nextUrl.pathname

  // Protect /admin routes (ADMIN only)
  if (path.startsWith('/admin')) {
    if (!session || session.user.role !== 'ADMIN') {
      return redirect to /auth/signin with callbackUrl
    }
  }

  // Protect /dashboard routes (authenticated users)
  if (path.startsWith('/dashboard')) {
    if (!session) {
      return redirect to /auth/signin with callbackUrl
    }
  }

  return next()
})
```

**Callback URL:**
- When redirecting to signin, middleware sets `callbackUrl` query param
- After successful signin, user redirected back to original URL
- If no callback URL, ADMIN → `/admin`, USER → `/dashboard`

**Important Note:**
- Next.js 15 shows deprecation warning: "middleware file convention is deprecated; use proxy"
- **Future Task:** Migrate to new Proxy convention (see Roadmap in SRD)
- Current middleware works but should be updated in future release

---

## Configuration & Environment

### Environment Variables

**Location:** `.env` (local), Vercel dashboard (production)

**Template:** `.env.example`

### Critical Variables

**Database Configuration:**

```bash
# MUST use Transaction pooler (port 6543) for serverless
DATABASE_URL="postgresql://user:pass@host.supabase.co:6543/postgres?pgbouncer=true&connection_limit=1"
```

**⚠️ Production Gotcha:** Using Session pooler (port 5432) causes connection errors in serverless environments. Always use Transaction pooler (port 6543) with `pgbouncer=true` parameter.

**NextAuth Configuration:**

```bash
# MUST match deployed domain exactly
NEXTAUTH_URL="https://your-domain.vercel.app"

# Generate with: openssl rand -base64 32
NEXTAUTH_SECRET="your-secret-key-change-in-production"
```

**⚠️ Production Gotcha:** If `NEXTAUTH_URL` doesn't match deployed domain, login will hang with redirect loops. Ensure this matches exactly, including protocol (https) and no trailing slash.

**Site Configuration:**

```bash
# MUST match deployed domain exactly
NEXT_PUBLIC_SITE_URL="https://your-domain.vercel.app"
```

**⚠️ Production Gotcha:** Used for canonical URLs, sitemaps, and redirects. Mismatch causes broken links and SEO issues.

### Environment-Specific Configuration

**Local Development:**
```bash
DATABASE_URL="postgresql://user:pass@localhost:5432/healthplus"
NEXTAUTH_URL="http://localhost:3000"
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
```

**Preview (Vercel):**
```bash
DATABASE_URL="postgresql://...@host.supabase.co:6543/postgres?pgbouncer=true"
NEXTAUTH_URL="https://healthplus-git-branch-user.vercel.app"
NEXT_PUBLIC_SITE_URL="https://healthplus-git-branch-user.vercel.app"
```

**Production (Vercel):**
```bash
DATABASE_URL="postgresql://...@host.supabase.co:6543/postgres?pgbouncer=true"
NEXTAUTH_URL="https://healthplus-pharmachy-subscription-a.vercel.app"
NEXT_PUBLIC_SITE_URL="https://healthplus-pharmachy-subscription-a.vercel.app"
```

### Optional Variables (Future)

**SMS Provider:**
```bash
SMS_API_KEY="your-sms-api-key"
SMS_API_URL="https://api.sms-provider.com/send"
SMS_SENDER_ID="HealthPlus"
```

**Email Provider:**
```bash
EMAIL_FROM="noreply@healthplus.com"
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"
```

**Tracking & Analytics:**
```bash
NEXT_PUBLIC_GTM_ID="GTM-XXXXXXX"
NEXT_PUBLIC_GA_ID="G-XXXXXXXXXX"
NEXT_PUBLIC_FB_PIXEL_ID="000000000000000"
```

**Payment Gateway (Future):**
```bash
PAYMENT_GATEWAY_API_KEY="your-payment-gateway-key"
PAYMENT_GATEWAY_SECRET="your-payment-gateway-secret"
PAYMENT_GATEWAY_WEBHOOK_SECRET="your-webhook-secret"
```

---

## Coding Conventions

### File Naming

**Pages:** `page.tsx` (Next.js convention)
**Layouts:** `layout.tsx` (Next.js convention)
**Components:** `PascalCase.tsx` (e.g., `Navbar.tsx`, `AdminSidebar.tsx`)
**API Routes:** `route.ts` (Next.js convention)
**Utilities:** `camelCase.ts` (e.g., `auth.ts`, `prisma.ts`)

### Component Structure

**Server Components (Default):**
```typescript
// No 'use client' directive
// Can fetch data directly
// Cannot use hooks or event handlers

export default async function Page() {
  const data = await fetchData()
  return <div>{data}</div>
}
```

**Client Components:**
```typescript
'use client'

import { useState } from 'react'

export function Component() {
  const [state, setState] = useState()
  return <div onClick={() => setState(...)}>...</div>
}
```

### Code Organization

**Where to Put New Code:**

**New Page:**
- Public page: `app/(site)/page-name/page.tsx`
- Admin page: `app/(admin)/admin/page-name/page.tsx`

**New Component:**
- Shared component: `components/ComponentName.tsx`
- Admin component: `components/admin/ComponentName.tsx`
- UI component: `components/ui/ComponentName.tsx`

**New API Route:**
- Public/User API: `app/api/resource-name/route.ts`
- Admin API: `app/api/admin/resource-name/route.ts`

**New Utility:**
- `lib/utilityName.ts`

**New Type/Interface:**
- `types/typeName.ts` or inline in component file

### TypeScript Guidelines

**Use Prisma Types:**
```typescript
import { User, Order, OrderStatus } from '@prisma/client'

// Include relations
type OrderWithItems = Order & {
  items: OrderItem[]
  user: User
}
```

**Avoid `any`:**
```typescript
// Bad
function process(data: any) { ... }

// Good
function process(data: Order) { ... }
```

**Use Type Inference:**
```typescript
// Bad
const count: number = orders.length

// Good
const count = orders.length
```

### Error Handling

**API Routes:**
```typescript
try {
  // Business logic
  return NextResponse.json({ success: true, data })
} catch (error) {
  console.error('Error description:', error)
  return NextResponse.json(
    { success: false, error: 'User-friendly message' },
    { status: 500 }
  )
}
```

**Client Components:**
```typescript
try {
  const response = await fetch('/api/endpoint')
  const data = await response.json()
  
  if (!data.success) {
    throw new Error(data.error)
  }
  
  // Handle success
} catch (error) {
  console.error('Error:', error)
  setError('User-friendly message')
}
```

**Never Log PII:**
```typescript
// Bad
console.log('User data:', user)

// Good
console.log('User ID:', user.id)
```

### Database Queries

**Use Prisma Client:**
```typescript
import { prisma } from '@/lib/prisma'

// Good: Type-safe, prevents SQL injection
const users = await prisma.user.findMany({
  where: { role: 'USER' },
  select: { id: true, name: true, email: true },
})

// Bad: Raw SQL (avoid unless necessary)
const users = await prisma.$queryRaw`SELECT * FROM User`
```

**Always Use Pagination:**
```typescript
const orders = await prisma.order.findMany({
  take: 20,
  skip: page * 20,
  orderBy: { createdAt: 'desc' },
})
```

**Use Transactions for Multi-Step Operations:**
```typescript
await prisma.$transaction(async (tx) => {
  const order = await tx.order.create({ data: orderData })
  await tx.orderItem.createMany({ data: items })
  return order
})
```

### Styling Guidelines

**Use Tailwind Classes:**
```typescript
<div className="flex items-center justify-between p-4 bg-white rounded-lg shadow">
  <h1 className="text-2xl font-bold text-gray-900">Title</h1>
</div>
```

**Responsive Design:**
```typescript
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Content */}
</div>
```

**Custom Colors (Teal Theme):**
```typescript
<button className="bg-teal-600 hover:bg-teal-700 text-white">
  Button
</button>
```

### Comments

**Avoid Unnecessary Comments:**
```typescript
// Bad
// Get user by ID
const user = await prisma.user.findUnique({ where: { id } })

// Good (no comment needed, code is self-explanatory)
const user = await prisma.user.findUnique({ where: { id } })
```

**Use Comments for Complex Logic:**
```typescript
// Calculate membership discount (10% off medicine subtotal only)
const discount = membership?.isActive 
  ? subtotal * (membership.plan.discountPercent / 100)
  : 0
```

**Use JSDoc for Public Functions:**
```typescript
/**
 * Calculate order total with membership discount
 * @param subtotal - Medicine subtotal
 * @param deliveryCharge - Delivery charge from zone
 * @param membership - User's active membership (optional)
 * @returns Total amount to charge
 */
export function calculateOrderTotal(
  subtotal: number,
  deliveryCharge: number,
  membership?: UserMembership
): number {
  // Implementation
}
```

---

## Performance & Security

### Performance Best Practices

**Server Components by Default:**
- Use Server Components for data fetching
- Only use Client Components when needed (interactivity, hooks)

**Image Optimization:**
```typescript
import Image from 'next/image'

<Image
  src="/medicine.jpg"
  alt="Medicine"
  width={300}
  height={300}
  loading="lazy"
/>
```

**Pagination:**
- Always paginate large datasets (orders, medicines, prescriptions)
- Default page size: 20 items
- Use cursor-based pagination for infinite scroll

**Database Indexes:**
- Prisma auto-creates indexes for `@unique` and `@id` fields
- Add custom indexes for frequently queried fields (future)

**Caching:**
- Static pages cached by Vercel CDN
- API responses: Add caching headers (future)
- Database queries: Use React Query for client-side caching (future)

### Security Best Practices

**Authentication:**
- Passwords hashed with bcrypt (10 rounds minimum)
- Session tokens in HTTP-only cookies
- CSRF protection via NextAuth

**Authorization:**
- Check user role in middleware for route protection
- Check user role in API routes for endpoint protection
- Never trust client-side role checks

**Input Validation:**
- Validate all user inputs on server-side
- Use Zod or similar for schema validation (future)
- Sanitize inputs to prevent XSS

**SQL Injection Prevention:**
- Use Prisma ORM (parameterized queries)
- Never use raw SQL with user input
- If raw SQL needed, use parameterized queries

**File Upload Security:**
- Validate file type and size
- Scan for malware (future)
- Store files outside web root or use cloud storage
- Generate unique filenames (prevent overwrite)

**Environment Variables:**
- Never commit `.env` files
- Use Vercel environment variables for production
- Rotate secrets regularly (NEXTAUTH_SECRET every 90 days)

**Rate Limiting:**
- Implement rate limiting for API routes (future)
- Prevent brute-force attacks on login
- Use Vercel Edge Middleware or Upstash Redis

**Logging:**
- Never log PII (phone, email, addresses, passwords)
- Log errors with stack traces (server-side only)
- Use structured logging (future: Winston, Pino)

---

## Testing Strategy

### Current State

**Linting:** ESLint configured
**Type Checking:** TypeScript strict mode
**Build Testing:** `npm run build` before deployment

### Future Testing

**Unit Tests:**
- Test utility functions
- Test business logic (discount calculation, etc.)
- Framework: Jest or Vitest

**Integration Tests:**
- Test API routes
- Test database operations
- Framework: Jest + Supertest

**E2E Tests:**
- Test critical user flows (signup, checkout, admin order processing)
- Framework: Playwright or Cypress

**Test Coverage Target:** 80% for critical paths

---

## Deployment

### Vercel Deployment

**Automatic Deployments:**
- **Production:** Every push to `main` branch
- **Preview:** Every pull request

**Build Command:** `npm run build`
**Output Directory:** `.next`
**Install Command:** `npm install`

**Environment Variables:**
- Set in Vercel dashboard
- Separate variables for Production and Preview
- Never commit secrets to repository

### Deployment Checklist

**Before Deploying:**
- [ ] Run `npm run lint` (no errors)
- [ ] Run `npm run build` (successful build)
- [ ] Test locally with production environment variables
- [ ] Update documentation if needed
- [ ] Create pull request for review

**After Deploying:**
- [ ] Verify deployment URL works
- [ ] Test critical flows (signup, login, checkout)
- [ ] Check error logs in Vercel dashboard
- [ ] Monitor performance metrics

### Rollback Procedure

**If Deployment Fails:**
1. Check Vercel build logs for errors
2. Fix errors locally and push new commit
3. If critical, revert to previous deployment in Vercel dashboard

**Database Migrations:**
- Always test migrations locally first
- Create backup before running migrations in production
- Have rollback migration ready

---

## Architecture Decision Records (ADRs)

For major architectural decisions, create ADR documents in `docs/adr/`:

**Example ADR:**
```
docs/adr/2025-11-22-use-nextauth-for-authentication.md
```

**ADR Template:**
```markdown
# Use NextAuth for Authentication

**Date:** 2025-11-22
**Status:** Accepted

## Context
We need authentication for users and admins with phone/email login.

## Decision
Use NextAuth.js v5 with Credentials provider.

## Consequences
**Positive:**
- Industry-standard solution
- Flexible and extensible
- Good documentation

**Negative:**
- Learning curve for team
- Requires custom provider for phone login

## Alternatives Considered
- Custom JWT implementation
- Supabase Auth
- Clerk
```

---

## Document Maintenance

**This document should be updated when:**
- New routes or API endpoints are added
- Tech stack changes (new libraries, frameworks)
- Coding conventions change
- Deployment process changes
- Major architectural decisions are made

**Review Schedule:**
- Quarterly review for accuracy
- Update after each major release
- Update when architecture changes

**Document Owner:** Technical Lead

---

**End of Architecture Document**
