'use client'

import Link from 'next/link'
import { Facebook, Instagram, Youtube, Twitter, Linkedin, MapPin, Phone, Mail } from 'lucide-react'

interface FooterLink {
  label: string
  href: string
}

interface SocialLink {
  platform: string
  url: string
}

interface PaymentMethod {
  name: string
  iconKey: string
}

interface FooterSettings {
  brandName: string
  brandDescription: string
  drugLicense: string | null
  tradeLicense: string | null
  quickLinks: FooterLink[]
  quickLinksTitle: string
  supportLinks: FooterLink[]
  supportLinksTitle: string
  contactTitle: string
  address: string
  phone: string
  email: string | null
  socialLinks: SocialLink[]
  googlePlayUrl: string | null
  appStoreUrl: string | null
  copyrightText: string
  developerCredit: string | null
  paymentMethods: PaymentMethod[]
  bgColor: string
  textColor: string
  headingColor: string
  hoverColor: string
  copyrightBgColor: string
}

interface FooterProps {
  settings: FooterSettings
}

const SocialIcon = ({ platform, className }: { platform: string; className?: string }) => {
  switch (platform) {
    case 'facebook':
      return <Facebook className={className} />
    case 'youtube':
      return <Youtube className={className} />
    case 'instagram':
      return <Instagram className={className} />
    case 'twitter':
      return <Twitter className={className} />
    case 'linkedin':
      return <Linkedin className={className} />
    default:
      return <Facebook className={className} />
  }
}

const PaymentIcon = ({ iconKey }: { iconKey: string }) => {
  const iconStyles = "h-8 px-2 py-1 rounded text-xs font-medium flex items-center justify-center"
  
  switch (iconKey) {
    case 'bkash':
      return <span className={iconStyles} style={{ backgroundColor: '#E2136E', color: 'white' }}>bKash</span>
    case 'nagad':
      return <span className={iconStyles} style={{ backgroundColor: '#F6921E', color: 'white' }}>Nagad</span>
    case 'visa':
      return <span className={iconStyles} style={{ backgroundColor: '#1A1F71', color: 'white' }}>VISA</span>
    case 'mastercard':
      return <span className={iconStyles} style={{ backgroundColor: '#EB001B', color: 'white' }}>MC</span>
    case 'amex':
      return <span className={iconStyles} style={{ backgroundColor: '#006FCF', color: 'white' }}>AMEX</span>
    case 'cod':
      return <span className={iconStyles} style={{ backgroundColor: '#4CAF50', color: 'white' }}>COD</span>
    default:
      return <span className={iconStyles}>{iconKey}</span>
  }
}

export function Footer({ settings }: FooterProps) {
  return (
    <footer style={{ backgroundColor: settings.bgColor, color: settings.textColor }}>
      {/* Main Footer Content */}
      <div className="mx-auto w-full max-w-[1400px] px-4 py-10 lg:py-16">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Column 1: Brand Info */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full" style={{ backgroundColor: settings.hoverColor }}>
                <span className="text-xl font-bold text-white">H</span>
              </div>
              <span className="text-xl font-bold" style={{ color: settings.headingColor }}>
                {settings.brandName}
              </span>
            </div>
            <p className="text-sm leading-relaxed mb-4" style={{ color: settings.textColor }}>
              {settings.brandDescription}
            </p>
            {(settings.drugLicense || settings.tradeLicense) && (
              <div className="text-xs space-y-1 opacity-80">
                {settings.drugLicense && <p>Drug License: {settings.drugLicense}</p>}
                {settings.tradeLicense && <p>Trade License: {settings.tradeLicense}</p>}
              </div>
            )}
            {/* Social Links */}
            <div className="mt-4 flex space-x-3">
              {settings.socialLinks.map((social, index) => (
                <a
                  key={index}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-colors"
                  style={{ color: settings.textColor }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = settings.hoverColor)}
                  onMouseLeave={(e) => (e.currentTarget.style.color = settings.textColor)}
                >
                  <SocialIcon platform={social.platform} className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div>
            <h3
              className="text-sm font-semibold uppercase tracking-wider mb-4"
              style={{ color: settings.headingColor }}
            >
              {settings.quickLinksTitle}
            </h3>
            <ul className="space-y-2">
              {settings.quickLinks.map((link, index) => (
                <li key={index}>
                  <Link
                    href={link.href}
                    className="text-sm transition-colors"
                    style={{ color: settings.textColor }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = settings.hoverColor)}
                    onMouseLeave={(e) => (e.currentTarget.style.color = settings.textColor)}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Support Links */}
          <div>
            <h3
              className="text-sm font-semibold uppercase tracking-wider mb-4"
              style={{ color: settings.headingColor }}
            >
              {settings.supportLinksTitle}
            </h3>
            <ul className="space-y-2">
              {settings.supportLinks.map((link, index) => (
                <li key={index}>
                  <Link
                    href={link.href}
                    className="text-sm transition-colors"
                    style={{ color: settings.textColor }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = settings.hoverColor)}
                    onMouseLeave={(e) => (e.currentTarget.style.color = settings.textColor)}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Contact Info */}
          <div>
            <h3
              className="text-sm font-semibold uppercase tracking-wider mb-4"
              style={{ color: settings.headingColor }}
            >
              {settings.contactTitle}
            </h3>
            <ul className="space-y-3">
              <li className="flex items-start space-x-2 text-sm">
                <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <span>{settings.address}</span>
              </li>
              <li className="flex items-center space-x-2 text-sm">
                <Phone className="h-4 w-4 flex-shrink-0" />
                <a
                  href={`tel:${settings.phone}`}
                  className="transition-colors font-semibold text-base"
                  style={{ color: settings.headingColor }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = settings.hoverColor)}
                  onMouseLeave={(e) => (e.currentTarget.style.color = settings.headingColor)}
                >
                  {settings.phone}
                </a>
              </li>
              {settings.email && (
                <li className="flex items-center space-x-2 text-sm">
                  <Mail className="h-4 w-4 flex-shrink-0" />
                  <a
                    href={`mailto:${settings.email}`}
                    className="transition-colors"
                    style={{ color: settings.textColor }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = settings.hoverColor)}
                    onMouseLeave={(e) => (e.currentTarget.style.color = settings.textColor)}
                  >
                    {settings.email}
                  </a>
                </li>
              )}
            </ul>

            {/* App Download Buttons */}
            {(settings.googlePlayUrl || settings.appStoreUrl) && (
              <div className="mt-4 space-y-2">
                {settings.googlePlayUrl && (
                  <a
                    href={settings.googlePlayUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg bg-black px-3 py-2 text-white text-xs hover:bg-gray-800 transition-colors"
                  >
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 0 1-.61-.92V2.734a1 1 0 0 1 .609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.198l2.807 1.626a1 1 0 0 1 0 1.73l-2.808 1.626L15.206 12l2.492-2.491zM5.864 2.658L16.8 8.99l-2.302 2.302-8.634-8.634z"/>
                    </svg>
                    <div className="text-left">
                      <div className="text-[10px] opacity-80">GET IT ON</div>
                      <div className="font-semibold">Google Play</div>
                    </div>
                  </a>
                )}
                {settings.appStoreUrl && (
                  <a
                    href={settings.appStoreUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg bg-black px-3 py-2 text-white text-xs hover:bg-gray-800 transition-colors"
                  >
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                    </svg>
                    <div className="text-left">
                      <div className="text-[10px] opacity-80">Download on the</div>
                      <div className="font-semibold">App Store</div>
                    </div>
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Copyright Bar */}
      <div style={{ backgroundColor: settings.copyrightBgColor }}>
        <div className="mx-auto w-full max-w-[1400px] px-4 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-center sm:text-left">
              <span>{settings.copyrightText}</span>
              {settings.developerCredit && (
                <span className="ml-2 opacity-80">| {settings.developerCredit}</span>
              )}
            </div>
            {/* Payment Methods */}
            {settings.paymentMethods.length > 0 && (
              <div className="flex items-center gap-2">
                {settings.paymentMethods.map((method, index) => (
                  <PaymentIcon key={index} iconKey={method.iconKey} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </footer>
  )
}
