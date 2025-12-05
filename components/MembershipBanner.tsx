'use client'

import Link from 'next/link'
import { Shield, Truck, Percent, Stethoscope, Check } from 'lucide-react'

interface Feature {
  iconKey: string
  text: string
}

type ImageSize = 'small' | 'medium' | 'large'

export interface MembershipBannerSettings {
  isEnabled: boolean
  badge: string
  headline: string
  subheadline: string
  priceText: string
  ctaLabel: string
  ctaHref: string
  features: Feature[]
  bgColor: string
  textColor: string
  imageUrl?: string | null
  imageAlt?: string
  imageSize?: ImageSize
}

interface MembershipBannerProps {
  settings: MembershipBannerSettings
  variant?: 'desktop' | 'mobile'
}

function FeatureIcon({ iconKey, className }: { iconKey: string; className?: string }) {
  switch (iconKey) {
    case 'delivery':
      return <Truck className={className} />
    case 'discount':
      return <Percent className={className} />
    case 'doctor':
      return <Stethoscope className={className} />
    case 'check':
    default:
      return <Check className={className} />
  }
}

export function MembershipBanner({ settings, variant = 'desktop' }: MembershipBannerProps) {
  if (!settings.isEnabled) {
    return null
  }

  // Mobile variant - more compact design
  if (variant === 'mobile') {
    return (
      <section className="px-4 py-4">
        <div
          className="overflow-hidden rounded-2xl p-5 shadow-lg"
          style={{ backgroundColor: settings.bgColor, color: settings.textColor }}
        >
          {/* Badge */}
          <div className="mb-2 inline-flex items-center rounded-full bg-white/20 px-2.5 py-1 text-xs font-semibold">
            <Shield className="mr-1.5 h-3 w-3" />
            {settings.badge}
          </div>

          {/* Headline */}
          <h2 className="text-xl font-bold">{settings.headline}</h2>

          {/* Subheadline */}
          <p className="mt-2 text-sm opacity-90 line-clamp-2">{settings.subheadline}</p>

          {/* Price Text */}
          <div className="mt-3 inline-block rounded-lg bg-white/20 px-3 py-1.5 text-base font-bold">
            {settings.priceText}
          </div>

          {/* Features - horizontal on mobile */}
          <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
            {settings.features.slice(0, 3).map((feature, index) => (
              <li key={index} className="flex items-center text-xs">
                <FeatureIcon iconKey={feature.iconKey} className="mr-1 h-3 w-3" />
                {feature.text}
              </li>
            ))}
          </ul>

          {/* CTA Button */}
          <Link
            href={settings.ctaHref}
            className="mt-4 block w-full rounded-lg bg-white py-2.5 text-center text-sm font-semibold text-teal-700 transition-transform hover:scale-[1.02]"
          >
            {settings.ctaLabel}
          </Link>
        </div>
      </section>
    )
  }

  // Desktop variant - full width with grid layout
  return (
    <section className="w-full py-8 lg:py-12">
      <div className="w-full px-2 sm:px-4">
        <div
          className="rounded-2xl p-6 shadow-xl sm:p-8 lg:p-12"
          style={{ backgroundColor: settings.bgColor, color: settings.textColor }}
        >
          <div className="grid gap-6 lg:grid-cols-2 lg:gap-8">
            <div>
              {/* Badge */}
              <div className="mb-3 inline-flex items-center rounded-full bg-white/20 px-3 py-1.5 text-sm font-semibold lg:mb-4 lg:px-4 lg:py-2">
                <Shield className="mr-2 h-4 w-4" />
                {settings.badge}
              </div>

              {/* Headline */}
              <h2 className="text-2xl font-bold sm:text-3xl lg:text-4xl">{settings.headline}</h2>

              {/* Subheadline */}
              <p className="mt-3 text-base opacity-90 lg:mt-4 lg:text-lg">{settings.subheadline}</p>

              {/* Price Text */}
              <div className="mt-4 inline-block rounded-lg bg-white/20 px-4 py-2 text-xl font-bold lg:mt-6 lg:text-2xl">
                {settings.priceText}
              </div>

              {/* Features */}
              <ul className="mt-4 space-y-2 lg:mt-6 lg:space-y-3">
                {settings.features.map((feature, index) => (
                  <li key={index} className="flex items-center text-sm lg:text-base">
                    <FeatureIcon iconKey={feature.iconKey} className="mr-2 h-4 w-4 lg:mr-3 lg:h-5 lg:w-5" />
                    {feature.text}
                  </li>
                ))}
              </ul>

              {/* CTA Button - centered below features */}
              <div className="mt-6 flex justify-center lg:mt-8">
                <Link
                  href={settings.ctaHref}
                  className="rounded-lg bg-white px-6 py-3 text-base font-semibold text-teal-600 transition-transform hover:scale-105 lg:px-8 lg:py-4 lg:text-lg"
                >
                  {settings.ctaLabel}
                </Link>
              </div>
            </div>

            {/* Right side - Image */}
            {settings.imageUrl && (
              <div className="flex items-center justify-center">
                <div className={`relative ${
                  settings.imageSize === 'small' ? 'w-1/2' : 
                  settings.imageSize === 'large' ? 'w-full' : 
                  'w-3/4'
                }`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={settings.imageUrl}
                    alt={settings.imageAlt || 'Membership banner'}
                    className="h-auto w-full object-contain"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
