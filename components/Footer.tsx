import Link from 'next/link'
import { Facebook, Instagram, Twitter, Mail, Phone, MapPin } from 'lucide-react'

interface FooterPage {
  id: string
  title: string
  slug: string
}

interface FooterProps {
  quickLinksPages?: FooterPage[]
  supportPages?: FooterPage[]
}

export function Footer({ quickLinksPages = [], supportPages = [] }: FooterProps) {
  return (
    <footer className="border-t border-gray-200 bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div>
            <div className="flex items-center space-x-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-600">
                <span className="text-xl font-bold text-white">H+</span>
              </div>
              <span className="text-xl font-bold text-teal-600">HealthPlus</span>
            </div>
            <p className="mt-4 text-sm text-gray-600">
              Your trusted partner for affordable medicine subscriptions and healthcare needs.
            </p>
            <div className="mt-4 flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-teal-600">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-teal-600">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-teal-600">
                <Twitter className="h-5 w-5" />
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-900">
              Quick Links
            </h3>
            <ul className="mt-4 space-y-2">
              <li>
                <Link href="/medicines" className="text-sm text-gray-600 hover:text-teal-600">
                  Browse Medicines
                </Link>
              </li>
              <li>
                <Link href="/subscriptions" className="text-sm text-gray-600 hover:text-teal-600">
                  Subscription Plans
                </Link>
              </li>
              <li>
                <Link href="/membership" className="text-sm text-gray-600 hover:text-teal-600">
                  Membership
                </Link>
              </li>
              {quickLinksPages.map((page) => (
                <li key={page.id}>
                  <Link href={`/pages/${page.slug}`} className="text-sm text-gray-600 hover:text-teal-600">
                    {page.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-900">
              Support
            </h3>
            <ul className="mt-4 space-y-2">
              {supportPages.length > 0 ? (
                supportPages.map((page) => (
                  <li key={page.id}>
                    <Link href={`/pages/${page.slug}`} className="text-sm text-gray-600 hover:text-teal-600">
                      {page.title}
                    </Link>
                  </li>
                ))
              ) : (
                <>
                  <li>
                    <Link href="/pages/faq" className="text-sm text-gray-600 hover:text-teal-600">
                      FAQ
                    </Link>
                  </li>
                  <li>
                    <Link href="/pages/contact" className="text-sm text-gray-600 hover:text-teal-600">
                      Contact Us
                    </Link>
                  </li>
                  <li>
                    <Link href="/pages/terms" className="text-sm text-gray-600 hover:text-teal-600">
                      Terms & Conditions
                    </Link>
                  </li>
                  <li>
                    <Link href="/pages/privacy" className="text-sm text-gray-600 hover:text-teal-600">
                      Privacy Policy
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-900">
              Contact Info
            </h3>
            <ul className="mt-4 space-y-3">
              <li className="flex items-start space-x-2 text-sm text-gray-600">
                <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <span>123 Health Street, Dhaka, Bangladesh</span>
              </li>
              <li className="flex items-center space-x-2 text-sm text-gray-600">
                <Phone className="h-4 w-4 flex-shrink-0" />
                <span>+880 1XXX-XXXXXX</span>
              </li>
              <li className="flex items-center space-x-2 text-sm text-gray-600">
                <Mail className="h-4 w-4 flex-shrink-0" />
                <span>info@healthplus.com</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-gray-200 pt-8">
          <p className="text-center text-sm text-gray-600">
            &copy; {new Date().getFullYear()} HealthPlus. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
