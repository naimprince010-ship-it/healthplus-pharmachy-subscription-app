'use client'

import Script from 'next/script'
import { usePathname } from 'next/navigation'
import { useEffect } from 'react'
import { marketingConfig } from '@/lib/marketingConfig'
import { trackPageView } from '@/lib/trackEvent'

/**
 * Tracking Component
 * 
 * Installs Google Tag Manager and tracks page views.
 * All other tracking pixels (GA4, Meta, TikTok) should be managed via GTM.
 * 
 * Note: We only install GTM here. GA4, Meta Pixel, and TikTok Pixel should be
 * configured as tags inside GTM, not directly in the code.
 */
export function Tracking() {
  const pathname = usePathname()

  useEffect(() => {
    if (marketingConfig.isGTMEnabled()) {
      trackPageView(pathname)
    }
  }, [pathname])

  if (!marketingConfig.gtmId) {
    return null
  }

  return (
    <>
      {/* Google Tag Manager - Head Script */}
      <Script
        id="gtm-script"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','${marketingConfig.gtmId}');
          `,
        }}
      />

      {/* Google Tag Manager - NoScript Fallback */}
      <noscript>
        <iframe
          src={`https://www.googletagmanager.com/ns.html?id=${marketingConfig.gtmId}`}
          height="0"
          width="0"
          style={{ display: 'none', visibility: 'hidden' }}
        />
      </noscript>
    </>
  )
}
