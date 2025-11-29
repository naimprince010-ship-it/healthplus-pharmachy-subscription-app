import { getAllTrackingSettingsServer } from '@/lib/settings/server'
import TrackingScripts from './TrackingScripts'
import CookieBanner from './CookieBanner'

export default async function TrackingProvider() {
  const { fbPixel, tiktokPixel, gtm, ga4, gdpr } = await getAllTrackingSettingsServer()

  return (
    <>
      <TrackingScripts
        fbPixel={fbPixel}
        tiktokPixel={tiktokPixel}
        gtm={gtm}
        ga4={ga4}
        gdpr={gdpr}
      />
      <CookieBanner settings={gdpr} />
    </>
  )
}
