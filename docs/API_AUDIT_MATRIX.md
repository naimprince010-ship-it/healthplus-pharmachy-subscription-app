# API Audit Matrix - HealthPlus System

## Overview
This document maps all API routes to the database tables they interact with, along with auth requirements and transaction usage.

## API Routes → Database Tables Matrix

| API Route | Method | Auth Required | Role | Tables Read | Tables Write | Uses Transaction | Notes |
|-----------|--------|---------------|------|-------------|--------------|------------------|-------|
| `/api/auth/signup` | POST | No | - | User (check duplicates) | User | No | ⚠️ Should validate phone normalization |
| `/api/auth/[...nextauth]` | GET/POST | No | - | User | - | No | NextAuth handlers |
| `/api/cart` | POST | Yes | USER/ADMIN | Medicine | - | No | ⚠️ Client-side cart, no DB persistence |
| `/api/orders` | POST | Yes | USER/ADMIN | User, Address, Medicine | Order, OrderItem | ❌ **NO TRANSACTION** | 🔴 CRITICAL: Multi-write without transaction |
| `/api/orders` | GET | Yes | USER/ADMIN | Order, OrderItem, Medicine, User, Address | - | No | - |
| `/api/prescriptions` | POST | Yes (optional) | USER/ADMIN | User (if session) | Prescription | No | Uploads to Supabase Storage |
| `/api/prescriptions` | GET | Yes | USER/ADMIN | Prescription | - | No | - |
| `/api/subscriptions` | POST | Yes | USER/ADMIN | User, SubscriptionPlan, SubscriptionItem | Subscription | No | - |
| `/api/subscriptions` | GET | Yes | USER/ADMIN | Subscription, SubscriptionPlan, SubscriptionItem | - | No | - |
| `/api/subscriptions` | DELETE | Yes | USER/ADMIN | Subscription | Subscription | No | - |
| `/api/membership` | POST | Yes | USER/ADMIN | User, MembershipPlan, UserMembership | UserMembership | No | Checks for existing active membership |
| `/api/membership` | GET | Yes | USER/ADMIN | UserMembership, MembershipPlan | - | No | - |
| `/api/zones` | GET | No | - | Zone | - | No | Public endpoint |
| `/api/admin/categories` | GET | Yes | ADMIN | Category | - | No | - |
| `/api/admin/categories` | POST | Yes | ADMIN | Category (check duplicates) | Category | No | - |
| `/api/admin/categories` | PUT | Yes | ADMIN | Category | Category | No | - |
| `/api/admin/categories` | DELETE | Yes | ADMIN | Category | Category | No | ⚠️ Should check for medicines before delete |
| `/api/admin/medicines` | GET | Yes | ADMIN | Medicine, Category | - | No | - |
| `/api/admin/medicines` | POST | Yes | ADMIN | Category, Medicine | Medicine | No | - |
| `/api/admin/medicines` | PUT | Yes | ADMIN | Medicine | Medicine | No | - |
| `/api/admin/medicines` | DELETE | Yes | ADMIN | Medicine | Medicine | No | ⚠️ Should check for order items before delete |
| `/api/admin/orders` | GET | Yes | ADMIN | Order, User, Address, OrderItem, Medicine | - | No | - |
| `/api/admin/orders` | PATCH | Yes | ADMIN | Order | Order | No | Updates order status |
| `/api/admin/sales` | GET | Yes | ADMIN | Order, Subscription, UserMembership | - | No | Aggregates sales data |
| `/api/debug/session` | GET | No | - | - | - | No | Debug endpoint - should be removed in production |

## Critical Issues Found

### 🔴 HIGH PRIORITY

1. **Order Creation Missing Transaction** (`/api/orders` POST)
   - Creates Order and multiple OrderItems in separate operations
   - If OrderItem creation fails, Order is left orphaned
   - **Fix Required:** Wrap in `prisma.$transaction()`

2. **No Cascade Delete Protection**
   - Deleting Category/Medicine doesn't check for existing references
   - Could break OrderItems/SubscriptionItems
   - **Fix Required:** Add validation before delete or use proper cascades

3. **Client-Side Cart** (`/api/cart`)
   - Cart is client-side only, no server persistence
   - Cart data passed directly to order creation
   - **Risk:** Client can manipulate prices
   - **Fix Required:** Recalculate prices server-side in order creation

### ⚠️ MEDIUM PRIORITY

4. **Phone Normalization Inconsistency**
   - Signup normalizes phone to `+8801XXXXXXXXX`
   - Login should use same normalization
   - **Fix Required:** Verify normalization is consistent

5. **Debug Endpoint in Production**
   - `/api/debug/session` exposes environment info
   - **Fix Required:** Remove or protect in production

6. **Missing Input Validation**
   - Some routes don't validate all inputs with Zod
   - **Fix Required:** Add comprehensive validation

### ℹ️ LOW PRIORITY

7. **No Rate Limiting**
   - APIs don't have rate limiting
   - **Recommendation:** Add rate limiting for production

8. **No Pagination**
   - GET endpoints return all records
   - **Recommendation:** Add pagination for large datasets

## Foreign Key Relations

All foreign keys are properly defined in Prisma schema with appropriate `onDelete` cascades:

- ✅ Address → User (Cascade)
- ✅ Address → Zone (No cascade - zones should not be deleted if in use)
- ✅ Order → User (No cascade - preserve order history)
- ✅ Order → Address (No cascade - preserve order history)
- ✅ OrderItem → Order (Cascade)
- ✅ OrderItem → Medicine (No cascade - preserve order history)
- ✅ Prescription → User (Cascade)
- ✅ UserMembership → User (Cascade)
- ✅ UserMembership → MembershipPlan (No cascade)
- ✅ Subscription → User (Cascade)
- ✅ Subscription → SubscriptionPlan (No cascade)
- ✅ SubscriptionItem → SubscriptionPlan (Cascade)
- ✅ SubscriptionItem → Medicine (No cascade)
- ✅ Medicine → Category (No cascade - should prevent category deletion if medicines exist)

## Next Steps

1. Fix order creation transaction issue
2. Add server-side price recalculation
3. Add delete validation for categories/medicines
4. Create automated test scripts
5. Remove debug endpoints
6. Add comprehensive error handling
