# Marketing Tracking & Analytics Documentation

This document describes the marketing tracking and analytics implementation for the HealthPlus Pharmacy application.

## Overview

The application uses **Google Tag Manager (GTM)** as the primary tracking container, with a unified event tracking system that pushes events to the `dataLayer`. GTM then distributes these events to various marketing platforms:

- **Google Analytics 4 (GA4)** - Web analytics and e-commerce tracking
- **Meta Pixel (Facebook/Instagram)** - Social media advertising
- **TikTok Pixel** - TikTok advertising
- **Google Ads** - Search and display advertising

## Architecture

### 1. Configuration (`lib/marketingConfig.ts`)

Centralized configuration that reads environment variables:

```typescript
NEXT_PUBLIC_GTM_ID              // Google Tag Manager container ID (required)
NEXT_PUBLIC_GA4_MEASUREMENT_ID  // GA4 measurement ID (optional, managed via GTM)
NEXT_PUBLIC_META_PIXEL_ID       // Meta Pixel ID (optional, managed via GTM)
NEXT_PUBLIC_TIKTOK_PIXEL_ID     // TikTok Pixel ID (optional, managed via GTM)
```

### 2. Tracking Helper (`lib/trackEvent.ts`)

Unified event tracking helper that provides:
- Type-safe event tracking with TypeScript
- GA4 e-commerce schema support
- Automatic currency handling (defaults to BDT)
- Development mode logging
- Helper functions for common events

### 3. GTM Installation (`components/Tracking.tsx`)

- Installs GTM script in the root layout
- Tracks page views on route changes
- Only renders when GTM ID is configured

## Event Tracking

### Page Tracking

**Event:** `page_view`

Automatically tracked on every route change.

```typescript
trackPageView(pathname, title)
```

**Parameters:**
- `page_path` - Current page path
- `page_title` - Page title
- `page_location` - Full URL

### E-commerce Events (GA4 Standard)

#### View Item

**Event:** `view_item`

Tracked when a user views a medicine detail page.

```typescript
trackProductView({
  item_id: 'MED123',
  item_name: 'Paracetamol 500mg',
  item_category: 'Pain Relief',
  price: 150
})
```

**Implementation:** `components/MedicineViewTracker.tsx`

#### Add to Cart

**Event:** `add_to_cart`

Tracked when a user adds a medicine to their cart.

```typescript
trackAddToCart({
  item_id: 'MED123',
  item_name: 'Paracetamol 500mg',
  item_category: 'Pain Relief',
  price: 150,
  quantity: 1
})
```

**Implementation:** `components/AddToCartButton.tsx`

#### Begin Checkout

**Event:** `begin_checkout`

Tracked when a user lands on the checkout page.

```typescript
trackBeginCheckout(items, totalValue)
```

**Implementation:** `app/(site)/checkout/page.tsx`

#### Purchase

**Event:** `purchase`

Tracked when an order is successfully created.

```typescript
trackPurchase({
  transaction_id: 'ORD123',
  value: 500,
  shipping: 50,
  items: [
    {
      item_id: 'MED123',
      item_name: 'Paracetamol 500mg',
      price: 150,
      quantity: 2
    }
  ]
})
```

**Implementation:** `app/(site)/checkout/page.tsx`

**GA4 E-commerce Parameters:**
- `transaction_id` - Order ID
- `value` - Total order value
- `currency` - Currency code (BDT)
- `tax` - Tax amount (optional)
- `shipping` - Shipping cost
- `items` - Array of purchased items

### Subscription Events

#### Subscribe Click

**Event:** `subscribe_click`

Tracked when a user clicks "Subscribe Now" on a subscription plan.

```typescript
trackSubscribeClick(planName, price)
```

**Implementation:** `components/SubscriptionCard.tsx`

#### Subscribe Started

**Event:** `subscribe_started`

Tracked when the subscription form is opened/displayed.

```typescript
trackSubscribeStarted(planName, price)
```

**Implementation:** `app/(site)/subscriptions/[slug]/SubscriptionForm.tsx`

#### Subscribe Success

**Event:** `subscribe_success`

Tracked when a subscription is successfully created.

```typescript
trackSubscribeSuccess(planName, price, subscriptionId)
```

**Implementation:** `app/(site)/subscriptions/[slug]/SubscriptionForm.tsx`

**GTM Mapping:**
- **GA4:** Custom event for conversion tracking
- **Meta Pixel:** Maps to `Lead` or `CompleteRegistration`
- **TikTok Pixel:** Maps to `CompletePayment`

### Prescription Events

#### Prescription Upload

**Event:** `prescription_upload`

Tracked when a user successfully uploads a prescription.

```typescript
trackPrescriptionUpload(prescriptionId)
```

**Implementation:** `components/PrescriptionUploadForm.tsx`

**GTM Mapping:**
- **TikTok Pixel:** Maps to `SubmitForm`

### Engagement Events

#### WhatsApp Click

**Event:** `whatsapp_click`

Tracked when a user clicks a WhatsApp contact button.

```typescript
trackWhatsAppClick(location)
```

**Locations:**
- `floating_button` - Floating WhatsApp button
- `header` - Header WhatsApp link
- `subscription_page` - Subscription page WhatsApp link

**Implementation:** `components/WhatsAppButton.tsx`

**GTM Mapping:**
- **Meta Pixel:** Maps to `Contact`

## GA4 E-commerce Schema

All e-commerce events follow the GA4 e-commerce schema for proper reporting:

```typescript
interface GA4Item {
  item_id: string           // Product ID
  item_name: string         // Product name
  item_category?: string    // Category
  item_category2?: string   // Sub-category
  item_category3?: string   // Sub-sub-category
  item_variant?: string     // Variant (e.g., "500mg")
  item_brand?: string       // Brand name
  price?: number            // Price per unit
  quantity?: number         // Quantity
  currency?: string         // Currency (default: "BDT")
  discount?: number         // Discount amount
  coupon?: string           // Coupon code
  index?: number            // Position in list
}
```

## GTM Configuration

### Setting Up GTM

1. **Create GTM Container**
   - Go to https://tagmanager.google.com
   - Create a new container for your website
   - Copy the GTM ID (format: `GTM-XXXXXXX`)

2. **Add GTM ID to Environment**
   ```bash
   NEXT_PUBLIC_GTM_ID="GTM-XXXXXXX"
   ```

3. **Configure Tags in GTM**

   The application pushes events to `dataLayer`. Configure GTM tags to listen for these events:

   **GA4 Configuration Tag:**
   - Tag Type: Google Analytics: GA4 Configuration
   - Measurement ID: Your GA4 ID
   - Trigger: All Pages

   **GA4 Event Tags:**
   - Tag Type: Google Analytics: GA4 Event
   - Event Name: `{{ Event }}` (use dataLayer variable)
   - Trigger: Custom Event (for each event type)

   **Meta Pixel Tag:**
   - Tag Type: Custom HTML
   - Trigger: Custom Event
   - Map events:
     - `subscribe_success` → `Lead`
     - `purchase` → `Purchase`
     - `whatsapp_click` → `Contact`

   **TikTok Pixel Tag:**
   - Tag Type: Custom HTML
   - Trigger: Custom Event
   - Map events:
     - `subscribe_success` → `CompletePayment`
     - `prescription_upload` → `SubmitForm`

### GA4 E-commerce Setup

1. **Enable E-commerce in GA4**
   - Go to Admin → Data Streams → Web → Enhanced Measurement
   - Enable "E-commerce purchases"

2. **Create Custom Events (if needed)**
   - Go to Configure → Events
   - Create events for subscription tracking

3. **Set Up Conversions**
   - Mark `purchase` as a conversion
   - Mark `subscribe_success` as a conversion

## Adding New Events

To add a new tracking event:

1. **Add Event Type** (`lib/trackEvent.ts`)
   ```typescript
   export type EventName =
     | 'existing_events'
     | 'your_new_event'  // Add here
   ```

2. **Create Helper Function** (optional)
   ```typescript
   export function trackYourNewEvent(param1: string, param2: number): void {
     trackEvent('your_new_event', {
       param1,
       param2,
     })
   }
   ```

3. **Use in Component**
   ```typescript
   import { trackYourNewEvent } from '@/lib/trackEvent'
   
   function MyComponent() {
     const handleAction = () => {
       trackYourNewEvent('value1', 123)
     }
   }
   ```

4. **Configure in GTM**
   - Create a trigger for the new event
   - Create tags to send the event to GA4, Meta, TikTok, etc.

## Testing

### Development Mode

In development, all tracking events are logged to the console:

```
[Tracking] Event: add_to_cart { item_id: 'MED123', item_name: 'Paracetamol', ... }
```

### GTM Preview Mode

1. Go to GTM → Preview
2. Enter your website URL
3. Navigate through your site
4. Verify events are firing in the GTM debugger

### GA4 DebugView

1. Go to GA4 → Configure → DebugView
2. Enable debug mode in your browser
3. Verify events are being received

## Best Practices

1. **Always use the tracking helpers** - Don't push directly to dataLayer
2. **Follow GA4 e-commerce schema** - Use the provided `GA4Item` interface
3. **Test in development** - Check console logs before deploying
4. **Use GTM for pixel management** - Don't install pixels directly in code
5. **Document new events** - Update this file when adding new events
6. **Use descriptive event names** - Follow the naming convention
7. **Include relevant parameters** - More data = better insights

## Troubleshooting

### Events Not Firing

1. Check if GTM ID is configured: `NEXT_PUBLIC_GTM_ID`
2. Check browser console for tracking logs (development mode)
3. Verify GTM container is published
4. Check GTM Preview mode

### GA4 Not Receiving Events

1. Verify GA4 tag is configured in GTM
2. Check GA4 DebugView
3. Verify measurement ID is correct
4. Check if events are marked as conversions

### Meta/TikTok Pixels Not Working

1. Verify pixel IDs are configured in GTM
2. Check pixel tags are triggered correctly
3. Use browser extensions (Meta Pixel Helper, TikTok Pixel Helper)
4. Verify event mapping in GTM

## Support

For questions or issues:
- Check GTM documentation: https://developers.google.com/tag-manager
- Check GA4 documentation: https://developers.google.com/analytics/devguides/collection/ga4
- Review this documentation
- Contact the development team
