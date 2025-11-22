# HealthPlus Pharmacy Subscription System - Tracking Plan

**Version:** 1.0  
**Last Updated:** November 22, 2025  
**Status:** Specification Only (Implementation Pending)  
**Related Documentation:**
- [System Requirements Document](./HEALTHPLUS_SRD.md)
- [Architecture & Folder Structure](./ARCHITECTURE.md)

---

## Table of Contents

1. [Overview](#overview)
2. [Tracking Platforms](#tracking-platforms)
3. [Event Naming Conventions](#event-naming-conventions)
4. [Core Events](#core-events)
5. [User Journey Events](#user-journey-events)
6. [E-commerce Events](#e-commerce-events)
7. [Membership & Subscription Events](#membership--subscription-events)
8. [Admin Events](#admin-events)
9. [Implementation Guidelines](#implementation-guidelines)
10. [Privacy & Compliance](#privacy--compliance)
11. [Testing & Validation](#testing--validation)

---

## Overview

This document defines the event tracking specification for HealthPlus. These events will be implemented in a future phase to enable:

- **Marketing Analytics:** Understand user acquisition, conversion, and retention
- **Product Analytics:** Track feature usage and user behavior
- **Business Intelligence:** Measure revenue, orders, and growth metrics
- **Optimization:** A/B testing and conversion rate optimization

**Current Status:** Specification only. No tracking implemented yet.

**Future Implementation:** Phase D (Advanced Reporting & Admin Tools)

**Platforms to Integrate:**
- Google Analytics 4 (GA4)
- Facebook Pixel
- Google Tag Manager (GTM)
- TikTok Pixel (optional)
- Google Ads Conversion Tracking

---

## Tracking Platforms

### Google Analytics 4 (GA4)

**Purpose:** Primary analytics platform for user behavior and conversion tracking

**Implementation:**
- Install GA4 via Google Tag Manager
- Use `gtag.js` or `dataLayer` for event tracking
- Configure enhanced e-commerce tracking
- Set up custom dimensions for user role, membership status

**Environment Variable:** `NEXT_PUBLIC_GA_ID`

**Key Metrics:**
- Page views and sessions
- User engagement (time on site, pages per session)
- Conversion events (signup, purchase, membership)
- E-commerce metrics (revenue, average order value)

---

### Facebook Pixel

**Purpose:** Track conversions for Facebook/Instagram ads

**Implementation:**
- Install Facebook Pixel via Google Tag Manager
- Track standard events (PageView, AddToCart, Purchase)
- Use custom events for membership and subscriptions
- Configure conversion API for server-side tracking (future)

**Environment Variable:** `NEXT_PUBLIC_FB_PIXEL_ID`

**Key Events:**
- PageView (automatic)
- ViewContent (medicine detail page)
- AddToCart
- InitiateCheckout
- Purchase
- CompleteRegistration (signup)

---

### Google Tag Manager (GTM)

**Purpose:** Centralized tag management for all tracking platforms

**Implementation:**
- Install GTM container on all pages
- Configure tags for GA4, Facebook Pixel, Google Ads
- Use dataLayer for event tracking
- Set up triggers and variables

**Environment Variable:** `NEXT_PUBLIC_GTM_ID`

**Benefits:**
- Single implementation for multiple platforms
- Easy to add/remove tracking without code changes
- Version control for tracking changes
- Built-in debugging tools

---

### TikTok Pixel (Optional)

**Purpose:** Track conversions for TikTok ads (if running TikTok campaigns)

**Environment Variable:** `NEXT_PUBLIC_TIKTOK_PIXEL_ID`

---

### Google Ads Conversion Tracking

**Purpose:** Track conversions from Google Ads campaigns

**Environment Variable:** `NEXT_PUBLIC_GOOGLE_ADS_ID`

**Key Conversions:**
- Signup
- First purchase
- Membership purchase
- Subscription signup

---

## Event Naming Conventions

### General Rules

**Format:** `snake_case` (lowercase with underscores)

**Structure:** `action_object` or `object_action`

**Examples:**
- `page_view` (action_object)
- `add_to_cart` (action_object)
- `membership_purchase` (object_action)

**Consistency:**
- Use consistent naming across all platforms
- Avoid abbreviations unless standard (e.g., `id` for identifier)
- Use singular nouns (e.g., `item` not `items`)

### Property Naming

**Format:** `snake_case` (lowercase with underscores)

**Common Properties:**
- `user_id` - User identifier (hashed for privacy)
- `session_id` - Session identifier
- `timestamp` - Event timestamp (ISO 8601)
- `page_url` - Current page URL
- `referrer` - Referrer URL

**E-commerce Properties:**
- `order_id` - Order identifier
- `product_id` - Medicine identifier
- `product_name` - Medicine name
- `category` - Medicine category
- `price` - Item price
- `quantity` - Item quantity
- `currency` - Currency code (BDT)

---

## Core Events

### page_view

**Description:** User views a page

**When:** On every page load (automatic with GA4)

**Properties:**
```typescript
{
  page_title: string        // Page title
  page_url: string          // Full page URL
  page_path: string         // URL path
  referrer: string          // Referrer URL
  user_role?: 'GUEST' | 'USER' | 'ADMIN'  // User role if logged in
  membership_status?: 'active' | 'expired' | 'none'  // Membership status
}
```

**Implementation Location:** Root layout or GTM

**Platforms:** GA4, Facebook Pixel (automatic)

---

### session_start

**Description:** User starts a new session

**When:** First page view in a session (automatic with GA4)

**Properties:**
```typescript
{
  session_id: string        // Session identifier
  user_role?: 'GUEST' | 'USER' | 'ADMIN'
  device_type: 'mobile' | 'tablet' | 'desktop'
  browser: string           // Browser name
  os: string                // Operating system
}
```

**Implementation Location:** Automatic with GA4

**Platforms:** GA4

---

## User Journey Events

### signup_start

**Description:** User begins signup process

**When:** User clicks "Sign Up" button or lands on signup page

**Properties:**
```typescript
{
  source: 'navbar' | 'homepage' | 'checkout' | 'other'  // Where signup was initiated
  page_url: string          // Current page URL
}
```

**Implementation Location:** Signup page, signup buttons

**Platforms:** GA4, Facebook Pixel (CompleteRegistration)

---

### signup_success

**Description:** User successfully completes signup

**When:** After successful account creation

**Properties:**
```typescript
{
  user_id: string           // Hashed user ID
  signup_method: 'email' | 'phone'  // Signup method used
  user_role: 'USER'         // Always USER for new signups
  timestamp: string         // ISO 8601 timestamp
}
```

**Implementation Location:** Signup API success response

**Platforms:** GA4, Facebook Pixel (CompleteRegistration), Google Ads

**Privacy Note:** Hash user_id before sending to analytics platforms

---

### login_success

**Description:** User successfully logs in

**When:** After successful authentication

**Properties:**
```typescript
{
  user_id: string           // Hashed user ID
  login_method: 'email' | 'phone'  // Login method used
  user_role: 'USER' | 'ADMIN'  // User role
  timestamp: string         // ISO 8601 timestamp
}
```

**Implementation Location:** Signin page after successful login

**Platforms:** GA4

**Privacy Note:** Hash user_id before sending to analytics platforms

---

### logout

**Description:** User logs out

**When:** User clicks logout button

**Properties:**
```typescript
{
  user_id: string           // Hashed user ID
  session_duration: number  // Session duration in seconds
}
```

**Implementation Location:** Logout button/handler

**Platforms:** GA4

---

## E-commerce Events

### view_item_list

**Description:** User views a list of medicines (catalog page)

**When:** User lands on medicines page or category page

**Properties:**
```typescript
{
  item_list_name: string    // "All Medicines" or category name
  items: Array<{
    item_id: string         // Medicine ID
    item_name: string       // Medicine name
    item_category: string   // Category name
    price: number           // Medicine price
    index: number           // Position in list
  }>
}
```

**Implementation Location:** Medicines page, category pages

**Platforms:** GA4, Facebook Pixel (ViewContent)

---

### view_item

**Description:** User views medicine detail page

**When:** User clicks on a medicine to view details

**Properties:**
```typescript
{
  item_id: string           // Medicine ID
  item_name: string         // Medicine name
  item_category: string     // Category name
  price: number             // Medicine price
  discount_price?: number   // Discount price if available
  in_stock: boolean         // Stock availability
  requires_prescription: boolean  // Prescription requirement
}
```

**Implementation Location:** Medicine detail page

**Platforms:** GA4, Facebook Pixel (ViewContent)

---

### add_to_cart

**Description:** User adds medicine to cart

**When:** User clicks "Add to Cart" button

**Properties:**
```typescript
{
  item_id: string           // Medicine ID
  item_name: string         // Medicine name
  item_category: string     // Category name
  price: number             // Medicine price
  quantity: number          // Quantity added
  currency: 'BDT'           // Currency code
  value: number             // Total value (price × quantity)
}
```

**Implementation Location:** Add to cart button handler

**Platforms:** GA4, Facebook Pixel (AddToCart)

---

### remove_from_cart

**Description:** User removes medicine from cart

**When:** User clicks "Remove" in cart

**Properties:**
```typescript
{
  item_id: string           // Medicine ID
  item_name: string         // Medicine name
  quantity: number          // Quantity removed
  value: number             // Value removed
}
```

**Implementation Location:** Cart page remove button

**Platforms:** GA4

---

### view_cart

**Description:** User views shopping cart

**When:** User navigates to cart page

**Properties:**
```typescript
{
  cart_value: number        // Total cart value
  item_count: number        // Number of items in cart
  items: Array<{
    item_id: string
    item_name: string
    price: number
    quantity: number
  }>
}
```

**Implementation Location:** Cart page

**Platforms:** GA4

---

### begin_checkout

**Description:** User begins checkout process

**When:** User clicks "Proceed to Checkout" from cart

**Properties:**
```typescript
{
  cart_value: number        // Total cart value before discount
  item_count: number        // Number of items
  membership_active: boolean  // Whether user has active membership
  estimated_discount: number  // Expected membership discount
  currency: 'BDT'
  items: Array<{
    item_id: string
    item_name: string
    item_category: string
    price: number
    quantity: number
  }>
}
```

**Implementation Location:** Checkout page load

**Platforms:** GA4, Facebook Pixel (InitiateCheckout)

---

### add_shipping_info

**Description:** User adds/selects shipping address

**When:** User selects or creates delivery address in checkout

**Properties:**
```typescript
{
  zone_id: string           // Zone ID
  zone_name: string         // Zone name
  delivery_charge: number   // Delivery charge
  estimated_days: string    // Estimated delivery days
}
```

**Implementation Location:** Checkout address selection

**Platforms:** GA4

---

### purchase

**Description:** User completes order (most important event!)

**When:** Order successfully created

**Properties:**
```typescript
{
  transaction_id: string    // Order ID
  order_number: string      // Human-readable order number
  value: number             // Total order value
  currency: 'BDT'
  subtotal: number          // Subtotal before discount
  discount: number          // Membership discount applied
  delivery_charge: number   // Delivery charge
  payment_method: 'COD' | 'ONLINE'
  membership_active: boolean  // Whether membership discount was applied
  item_count: number        // Number of items
  items: Array<{
    item_id: string
    item_name: string
    item_category: string
    price: number
    quantity: number
  }>
}
```

**Implementation Location:** Order confirmation page / API success

**Platforms:** GA4, Facebook Pixel (Purchase), Google Ads

**Revenue Tracking:** This is the primary revenue event for all platforms

---

## Membership & Subscription Events

### membership_view

**Description:** User views membership page

**When:** User lands on membership page

**Properties:**
```typescript
{
  current_status: 'active' | 'expired' | 'none'  // Current membership status
  plan_price: number        // Membership plan price
  plan_discount: number     // Discount percentage
  plan_duration: number     // Duration in days
}
```

**Implementation Location:** Membership page

**Platforms:** GA4

---

### membership_purchase

**Description:** User purchases membership

**When:** Membership successfully purchased

**Properties:**
```typescript
{
  transaction_id: string    // Membership transaction ID
  plan_id: string           // Membership plan ID
  plan_name: string         // Plan name
  value: number             // Membership price (100 BDT)
  currency: 'BDT'
  duration_days: number     // Duration (30 days)
  discount_percent: number  // Discount percentage (10%)
  start_date: string        // Start date (ISO 8601)
  end_date: string          // End date (ISO 8601)
}
```

**Implementation Location:** Membership purchase success

**Platforms:** GA4, Facebook Pixel (custom event), Google Ads

**Revenue Tracking:** Track as separate revenue stream from medicine purchases

---

### membership_expired

**Description:** User's membership expires

**When:** Membership end date passes (detected on next login/visit)

**Properties:**
```typescript
{
  user_id: string           // Hashed user ID
  plan_id: string           // Expired plan ID
  expired_date: string      // Expiry date
  days_active: number       // Total days membership was active
}
```

**Implementation Location:** Middleware or dashboard load

**Platforms:** GA4

**Use Case:** Trigger re-engagement campaigns

---

### subscription_view

**Description:** User views subscription plans page

**When:** User lands on subscriptions page

**Properties:**
```typescript
{
  has_active_subscription: boolean  // Whether user has active subscription
  active_subscription_count: number  // Number of active subscriptions
}
```

**Implementation Location:** Subscriptions page

**Platforms:** GA4

---

### subscription_start

**Description:** User creates a new subscription

**When:** Subscription successfully created

**Properties:**
```typescript
{
  subscription_id: string   // Subscription ID
  plan_id: string           // Subscription plan ID
  plan_name: string         // Plan name (e.g., "Diabetes Care Pack")
  value: number             // Monthly subscription price
  currency: 'BDT'
  duration_days: number     // Billing cycle (30 days)
  item_count: number        // Number of medicines in pack
  start_date: string        // Start date (ISO 8601)
  next_delivery_date: string  // Next delivery date
  items: Array<{
    item_id: string
    item_name: string
    quantity: number
  }>
}
```

**Implementation Location:** Subscription creation success

**Platforms:** GA4, Facebook Pixel (custom event)

**Revenue Tracking:** Track as recurring revenue

---

### subscription_cancel

**Description:** User cancels subscription

**When:** User cancels active subscription

**Properties:**
```typescript
{
  subscription_id: string   // Subscription ID
  plan_id: string           // Plan ID
  plan_name: string         // Plan name
  days_active: number       // Days subscription was active
  cancellation_reason?: string  // Reason for cancellation (if provided)
}
```

**Implementation Location:** Subscription cancellation handler

**Platforms:** GA4

**Use Case:** Analyze churn reasons and retention

---

### prescription_upload

**Description:** User uploads prescription

**When:** Prescription successfully uploaded

**Properties:**
```typescript
{
  prescription_id: string   // Prescription ID
  file_type: string         // File type (image/jpeg, application/pdf)
  file_size: number         // File size in bytes
  zone_id?: string          // Zone ID if provided
}
```

**Implementation Location:** Prescription upload success

**Platforms:** GA4

**Privacy Note:** Do NOT send file content or patient details

---

### prescription_approved

**Description:** Admin approves prescription

**When:** Admin approves prescription

**Properties:**
```typescript
{
  prescription_id: string   // Prescription ID
  review_time: number       // Time from upload to approval (seconds)
}
```

**Implementation Location:** Admin prescription approval

**Platforms:** GA4

**Use Case:** Track prescription processing efficiency

---

### prescription_rejected

**Description:** Admin rejects prescription

**When:** Admin rejects prescription

**Properties:**
```typescript
{
  prescription_id: string   // Prescription ID
  rejection_reason?: string  // Reason category (not full text)
}
```

**Implementation Location:** Admin prescription rejection

**Platforms:** GA4

**Privacy Note:** Do NOT send detailed rejection notes (may contain PII)

---

## Admin Events

### admin_login

**Description:** Admin user logs in

**When:** Admin successfully authenticates

**Properties:**
```typescript
{
  admin_id: string          // Hashed admin ID
  timestamp: string         // ISO 8601 timestamp
}
```

**Implementation Location:** Admin login success

**Platforms:** GA4 (internal analytics only)

---

### order_status_change

**Description:** Admin changes order status

**When:** Admin updates order status

**Properties:**
```typescript
{
  order_id: string          // Order ID
  old_status: string        // Previous status
  new_status: string        // New status
  admin_id: string          // Hashed admin ID
}
```

**Implementation Location:** Admin order status update

**Platforms:** GA4 (internal analytics only)

**Use Case:** Track order processing efficiency

---

### medicine_created

**Description:** Admin creates new medicine

**When:** Admin adds new medicine to catalog

**Properties:**
```typescript
{
  medicine_id: string       // Medicine ID
  category_id: string       // Category ID
  price: number             // Medicine price
  requires_prescription: boolean
}
```

**Implementation Location:** Admin medicine creation

**Platforms:** GA4 (internal analytics only)

---

## Implementation Guidelines

### Where to Fire Events

**Client-Side (Browser):**
- Page views (automatic)
- User interactions (clicks, form submissions)
- Navigation events
- UI events (modal open, tab switch)

**Server-Side (API):**
- Purchase events (more reliable)
- Signup/login success
- Order status changes
- Prescription approvals

**Recommendation:** Use both client-side and server-side tracking for critical events (purchase, signup) for redundancy.

---

### Implementation Pattern

**Using Google Tag Manager dataLayer:**

```typescript
// Client-side event tracking
function trackEvent(eventName: string, properties: Record<string, any>) {
  if (typeof window !== 'undefined' && window.dataLayer) {
    window.dataLayer.push({
      event: eventName,
      ...properties,
    })
  }
}

// Example: Track add to cart
trackEvent('add_to_cart', {
  item_id: medicine.id,
  item_name: medicine.name,
  item_category: medicine.category.name,
  price: medicine.price,
  quantity: 1,
  currency: 'BDT',
  value: medicine.price,
})
```

**Server-Side Tracking (Future):**

```typescript
// Server-side event tracking via Measurement Protocol
async function trackServerEvent(eventName: string, properties: Record<string, any>) {
  // Send to GA4 Measurement Protocol
  // Send to Facebook Conversion API
  // Send to other platforms
}
```

---

### Event Validation

**Before Implementation:**
1. Define event name and properties
2. Document when event should fire
3. Specify which platforms receive event
4. Review privacy implications

**During Implementation:**
1. Use GTM Preview mode to test events
2. Verify events appear in GA4 DebugView
3. Check Facebook Pixel Helper extension
4. Test on multiple devices/browsers

**After Implementation:**
1. Monitor event volume in GA4
2. Verify revenue tracking accuracy
3. Check for duplicate events
4. Validate property values

---

### Naming Stability

**Important:** Once events are deployed to production, event names should NOT change. Changing event names breaks historical data and reporting.

**If Changes Needed:**
1. Create new event with new name
2. Fire both old and new events for transition period
3. Update reports to use new event
4. Deprecate old event after transition period

---

## Privacy & Compliance

### PII (Personally Identifiable Information)

**Never Track:**
- Full names
- Email addresses
- Phone numbers
- Physical addresses
- Passwords
- Prescription content
- Medical information

**Hash Before Tracking:**
- User IDs (use SHA-256 hash)
- Admin IDs

**Safe to Track:**
- Order IDs (non-PII)
- Medicine IDs and names
- Categories
- Prices and quantities
- Timestamps
- Aggregate metrics

---

### User Consent

**GDPR/Privacy Compliance:**
1. Implement cookie consent banner
2. Allow users to opt-out of tracking
3. Respect Do Not Track (DNT) browser setting
4. Provide privacy policy with tracking disclosure

**Implementation:**
- Use cookie consent library (e.g., CookieBot, OneTrust)
- Store consent preferences
- Only fire tracking events if consent given
- Provide opt-out mechanism

---

### Data Retention

**Google Analytics 4:**
- Default: 14 months
- Can be set to 2 months or 14 months
- Recommendation: 14 months for seasonal analysis

**Facebook Pixel:**
- Data retained per Facebook's policy
- User can delete data via Facebook settings

**Internal Logs:**
- Retain tracking logs for 90 days
- No PII in tracking logs

---

## Testing & Validation

### Testing Tools

**Google Tag Manager:**
- Preview mode for testing tags
- Debug console for event inspection

**Google Analytics 4:**
- DebugView for real-time event testing
- Realtime report for live event monitoring

**Facebook Pixel:**
- Facebook Pixel Helper Chrome extension
- Events Manager Test Events tool

**Browser DevTools:**
- Network tab to inspect tracking requests
- Console for dataLayer inspection

---

### Testing Checklist

**Before Launch:**
- [ ] All events fire correctly in GTM Preview
- [ ] Events appear in GA4 DebugView
- [ ] Facebook Pixel events tracked correctly
- [ ] Revenue values accurate for purchase events
- [ ] No PII in event properties
- [ ] Events fire on correct triggers
- [ ] No duplicate events
- [ ] Mobile and desktop tested

**After Launch:**
- [ ] Monitor event volume in GA4
- [ ] Verify revenue tracking matches order data
- [ ] Check for errors in GTM
- [ ] Review event properties for accuracy
- [ ] Validate conversion tracking in Google Ads

---

### Common Issues

**Events Not Firing:**
- Check GTM container is loaded
- Verify trigger conditions
- Check for JavaScript errors
- Ensure dataLayer is defined

**Duplicate Events:**
- Check for multiple GTM containers
- Verify event firing logic (should fire once)
- Check for conflicting triggers

**Incorrect Revenue:**
- Verify currency code (BDT)
- Check value calculation (subtotal vs total)
- Ensure discount applied correctly

---

## Future Enhancements

### Advanced Tracking

**User Segmentation:**
- Track user cohorts (signup month)
- Track user lifetime value (LTV)
- Track customer acquisition cost (CAC)

**Funnel Analysis:**
- Signup funnel (view → start → complete)
- Checkout funnel (cart → checkout → purchase)
- Membership funnel (view → purchase)

**Attribution:**
- Multi-touch attribution
- Campaign tracking (UTM parameters)
- Referral source tracking

**Engagement:**
- Scroll depth tracking
- Time on page tracking
- Video engagement (if videos added)

---

## Document Maintenance

**Update This Document When:**
- New events are added
- Event properties change
- New tracking platforms added
- Privacy requirements change

**Review Schedule:**
- Before implementing tracking (Phase D)
- After each new feature launch
- Quarterly review for accuracy

**Document Owner:** Marketing Lead / Product Manager

---

**End of Tracking Plan Document**
