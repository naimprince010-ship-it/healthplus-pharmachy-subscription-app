/**
 * Marketing & Analytics Configuration
 * 
 * Centralized configuration for all marketing tracking pixels and analytics tools.
 * All IDs are read from environment variables and can be managed via GTM.
 */

export const marketingConfig = {
  /**
   * Google Tag Manager ID
   * Primary container for managing all tracking tags
   */
  gtmId: process.env.NEXT_PUBLIC_GTM_ID || '',

  /**
   * Google Analytics 4 Measurement ID
   * Optional - can be managed via GTM
   */
  ga4MeasurementId: process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID || '',

  /**
   * Meta (Facebook/Instagram) Pixel ID
   * Optional - can be managed via GTM
   */
  metaPixelId: process.env.NEXT_PUBLIC_META_PIXEL_ID || '',

  /**
   * TikTok Pixel ID
   * Optional - can be managed via GTM
   */
  tiktokPixelId: process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID || '',

  /**
   * Google Ads Conversion ID
   * Optional - for conversion tracking
   */
  googleAdsId: process.env.NEXT_PUBLIC_GOOGLE_ADS_ID || '',

  /**
   * Check if GTM is enabled
   */
  isGTMEnabled(): boolean {
    return !!this.gtmId && typeof window !== 'undefined';
  },

  /**
   * Check if any tracking is enabled
   */
  isTrackingEnabled(): boolean {
    return this.isGTMEnabled();
  },
} as const;
