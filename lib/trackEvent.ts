/**
 * Unified Event Tracking Helper
 * 
 * This module provides a centralized way to track events across the application.
 * All events are pushed to the dataLayer for Google Tag Manager to process.
 * 
 * GTM will then distribute events to:
 * - Google Analytics 4 (GA4)
 * - Meta Pixel (Facebook/Instagram)
 * - TikTok Pixel
 * - Other marketing platforms
 * 
 * @see https://developers.google.com/analytics/devguides/collection/ga4/ecommerce
 * @see https://developers.google.com/tag-manager/ecommerce-ga4
 */

import { marketingConfig } from './marketingConfig';

/**
 * GA4 E-commerce Item
 * Follows the GA4 e-commerce schema
 */
export interface GA4Item {
  item_id: string;           // Product ID (e.g., "MED123")
  item_name: string;         // Product name (e.g., "Paracetamol 500mg")
  item_category?: string;    // Product category (e.g., "Pain Relief")
  item_category2?: string;   // Sub-category
  item_category3?: string;   // Sub-sub-category
  item_variant?: string;     // Product variant (e.g., "500mg")
  item_brand?: string;       // Brand name
  price?: number;            // Price per unit
  quantity?: number;         // Quantity
  currency?: string;         // Currency code (default: "BDT")
  discount?: number;         // Discount amount
  coupon?: string;           // Coupon code
  index?: number;            // Position in list
}

/**
 * Event names supported by the tracking system
 */
export type EventName =
  | 'page_view'
  
  | 'view_item'
  | 'view_item_list'
  | 'add_to_cart'
  | 'remove_from_cart'
  | 'view_cart'
  | 'begin_checkout'
  | 'add_payment_info'
  | 'add_shipping_info'
  | 'purchase'
  
  | 'subscribe_click'
  | 'subscribe_started'
  | 'subscribe_success'
  
  | 'prescription_upload'
  | 'prescription_view'
  
  | 'order_completed'
  | 'order_view'
  
  | 'whatsapp_click'
  | 'search'
  | 'filter_applied'
  | 'share';

/**
 * Event parameters interface
 */
export interface EventParams {
  page_path?: string;
  page_title?: string;
  page_location?: string;
  
  currency?: string;
  value?: number;
  items?: GA4Item[];
  transaction_id?: string;
  tax?: number;
  shipping?: number;
  coupon?: string;
  payment_type?: string;
  shipping_tier?: string;
  
  plan?: string;
  plan_id?: string;
  price?: number;
  duration?: string;
  subscription_id?: string;
  
  order_id?: string;
  order_total?: number;
  
  prescription_id?: string;
  
  location?: string;
  search_term?: string;
  filter_type?: string;
  filter_value?: string;
  
  [key: string]: string | number | boolean | GA4Item[] | undefined;
}

/**
 * DataLayer event type
 */
interface DataLayerEvent {
  event: EventName;
  [key: string]: string | number | boolean | GA4Item[] | undefined | EventName;
}

/**
 * Declare global dataLayer type
 */
declare global {
  interface Window {
    dataLayer: DataLayerEvent[];
  }
}

/**
 * Initialize dataLayer if it doesn't exist
 */
function initDataLayer(): void {
  if (typeof window === 'undefined') return;
  
  window.dataLayer = window.dataLayer || [];
}

/**
 * Track an event by pushing it to the dataLayer
 * 
 * @param event - Event name
 * @param params - Event parameters
 * 
 * @example
 * // Track a page view
 * trackEvent('page_view', {
 *   page_path: '/medicines',
 *   page_title: 'Browse Medicines'
 * });
 * 
 * @example
 * // Track add to cart with GA4 e-commerce schema
 * trackEvent('add_to_cart', {
 *   currency: 'BDT',
 *   value: 150,
 *   items: [{
 *     item_id: 'MED123',
 *     item_name: 'Paracetamol 500mg',
 *     item_category: 'Pain Relief',
 *     price: 150,
 *     quantity: 1
 *   }]
 * });
 * 
 * @example
 * // Track purchase
 * trackEvent('purchase', {
 *   transaction_id: 'ORD123',
 *   value: 500,
 *   currency: 'BDT',
 *   tax: 0,
 *   shipping: 50,
 *   items: [
 *     {
 *       item_id: 'MED123',
 *       item_name: 'Paracetamol 500mg',
 *       price: 150,
 *       quantity: 2
 *     },
 *     {
 *       item_id: 'MED456',
 *       item_name: 'Vitamin C 1000mg',
 *       price: 200,
 *       quantity: 1
 *     }
 *   ]
 * });
 */
export function trackEvent(event: EventName, params: EventParams = {}): void {
  if (typeof window === 'undefined') return;
  
  if (!marketingConfig.isGTMEnabled()) {
    if (process.env.NODE_ENV === 'development') {
      console.log('[Tracking] GTM not enabled, skipping event:', event, params);
    }
    return;
  }
  
  initDataLayer();
  
  const hasMoneyParams = params.value !== undefined || params.price !== undefined;
  if (hasMoneyParams && !params.currency) {
    params.currency = 'BDT';
  }
  
  window.dataLayer.push({
    event,
    ...params,
  });
  
  if (process.env.NODE_ENV === 'development') {
    console.log('[Tracking] Event:', event, params);
  }
}

/**
 * Track page view
 * Should be called on route changes
 */
export function trackPageView(path: string, title?: string): void {
  trackEvent('page_view', {
    page_path: path,
    page_title: title || document.title,
    page_location: window.location.href,
  });
}

/**
 * Track product view (view_item)
 * 
 * @example
 * trackProductView({
 *   item_id: 'MED123',
 *   item_name: 'Paracetamol 500mg',
 *   item_category: 'Pain Relief',
 *   price: 150
 * });
 */
export function trackProductView(item: GA4Item): void {
  trackEvent('view_item', {
    currency: item.currency || 'BDT',
    value: item.price,
    items: [item],
  });
}

/**
 * Track add to cart
 * 
 * @example
 * trackAddToCart({
 *   item_id: 'MED123',
 *   item_name: 'Paracetamol 500mg',
 *   price: 150,
 *   quantity: 1
 * });
 */
export function trackAddToCart(item: GA4Item): void {
  trackEvent('add_to_cart', {
    currency: item.currency || 'BDT',
    value: (item.price || 0) * (item.quantity || 1),
    items: [item],
  });
}

/**
 * Track remove from cart
 */
export function trackRemoveFromCart(item: GA4Item): void {
  trackEvent('remove_from_cart', {
    currency: item.currency || 'BDT',
    value: (item.price || 0) * (item.quantity || 1),
    items: [item],
  });
}

/**
 * Track begin checkout
 */
export function trackBeginCheckout(items: GA4Item[], value: number): void {
  trackEvent('begin_checkout', {
    currency: 'BDT',
    value,
    items,
  });
}

/**
 * Track purchase (order completed)
 * 
 * @example
 * trackPurchase({
 *   transaction_id: 'ORD123',
 *   value: 500,
 *   tax: 0,
 *   shipping: 50,
 *   items: [...]
 * });
 */
export function trackPurchase(params: {
  transaction_id: string;
  value: number;
  tax?: number;
  shipping?: number;
  coupon?: string;
  items: GA4Item[];
}): void {
  trackEvent('purchase', {
    currency: 'BDT',
    ...params,
  });
}

/**
 * Track subscription click
 */
export function trackSubscribeClick(plan: string, price: number): void {
  trackEvent('subscribe_click', {
    plan,
    price,
    currency: 'BDT',
  });
}

/**
 * Track subscription started (form opened)
 */
export function trackSubscribeStarted(plan: string, price: number): void {
  trackEvent('subscribe_started', {
    plan,
    price,
    currency: 'BDT',
  });
}

/**
 * Track subscription success
 */
export function trackSubscribeSuccess(
  plan: string,
  price: number,
  subscriptionId: string
): void {
  trackEvent('subscribe_success', {
    plan,
    price,
    currency: 'BDT',
    subscription_id: subscriptionId,
    value: price, // For conversion tracking
  });
}

/**
 * Track prescription upload
 */
export function trackPrescriptionUpload(prescriptionId?: string): void {
  trackEvent('prescription_upload', {
    prescription_id: prescriptionId,
  });
}

/**
 * Track WhatsApp click
 */
export function trackWhatsAppClick(location: string): void {
  trackEvent('whatsapp_click', {
    location,
  });
}

/**
 * Track search
 */
export function trackSearch(searchTerm: string): void {
  trackEvent('search', {
    search_term: searchTerm,
  });
}
