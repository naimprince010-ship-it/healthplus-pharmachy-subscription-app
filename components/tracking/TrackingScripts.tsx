'use client'

import { useEffect, useState } from 'react'
import Script from 'next/script'
import type {
  FacebookPixelSettings,
  TikTokPixelSettings,
  GTMSettings,
  GA4Settings,
  GdprSettings,
} from '@/lib/admin/settings'

interface TrackingScriptsProps {
  fbPixel: FacebookPixelSettings
  tiktokPixel: TikTokPixelSettings
  gtm: GTMSettings
  ga4: GA4Settings
  gdpr: GdprSettings
}

const COOKIE_CONSENT_KEY = 'cookieConsent'

function getCookieConsent(): boolean {
  if (typeof window === 'undefined') return false
  const consent = document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${COOKIE_CONSENT_KEY}=`))
  return consent?.split('=')[1] === 'accepted'
}

export default function TrackingScripts({
  fbPixel,
  tiktokPixel,
  gtm,
  ga4,
  gdpr,
}: TrackingScriptsProps) {
  const [hasConsent, setHasConsent] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    setHasConsent(getCookieConsent())

    // Listen for consent changes
    const handleConsentChange = () => {
      setHasConsent(getCookieConsent())
    }

    window.addEventListener('cookieConsentChanged', handleConsentChange)
    return () => {
      window.removeEventListener('cookieConsentChanged', handleConsentChange)
    }
  }, [])

  // Don't render anything on server or before mount
  if (!mounted) return null

  // Check if we should load tracking scripts
  const shouldLoadTracking = gdpr.requireConsentForTracking ? hasConsent : true

  // Only load in production or if explicitly enabled
  const isProduction = process.env.NODE_ENV === 'production'
  const enableTracking = process.env.NEXT_PUBLIC_ENABLE_TRACKING === 'true'
  const shouldInject = isProduction || enableTracking

  if (!shouldInject) {
    return null
  }

  return (
    <>
      {/* Google Tag Manager */}
      {shouldLoadTracking && gtm.enabled && gtm.containerId && (
        <>
          <Script
            id="gtm-script"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
                new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
                j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
                'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
                })(window,document,'script','dataLayer','${gtm.containerId}');
              `,
            }}
          />
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${gtm.containerId}`}
              height="0"
              width="0"
              style={{ display: 'none', visibility: 'hidden' }}
            />
          </noscript>
        </>
      )}

      {/* Google Analytics 4 */}
      {shouldLoadTracking && ga4.enabled && ga4.measurementId && (
        <>
          <Script
            id="ga4-script"
            strategy="afterInteractive"
            src={`https://www.googletagmanager.com/gtag/js?id=${ga4.measurementId}`}
          />
          <Script
            id="ga4-config"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${ga4.measurementId}');
              `,
            }}
          />
        </>
      )}

      {/* Facebook Pixel */}
      {shouldLoadTracking && fbPixel.enabled && fbPixel.pixelId && (
        <Script
          id="fb-pixel"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '${fbPixel.pixelId}');
              fbq('track', 'PageView');
            `,
          }}
        />
      )}

      {/* TikTok Pixel */}
      {shouldLoadTracking && tiktokPixel.enabled && tiktokPixel.pixelId && (
        <Script
          id="tiktok-pixel"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              !function (w, d, t) {
                w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var o=document.createElement("script");o.type="text/javascript",o.async=!0,o.src=i+"?sdkid="+e+"&lib="+t;var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};
                ttq.load('${tiktokPixel.pixelId}');
                ttq.page();
              }(window, document, 'ttq');
            `,
          }}
        />
      )}
    </>
  )
}
