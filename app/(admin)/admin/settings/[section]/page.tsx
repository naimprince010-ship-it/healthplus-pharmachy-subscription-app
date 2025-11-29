'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Construction } from 'lucide-react'
import { getSettingsSectionByKey } from '@/lib/settings-config'
import BasicSettingsForm from '@/components/admin/settings/BasicSettingsForm'
import BrandingSettingsForm from '@/components/admin/settings/BrandingSettingsForm'
import ChargesSettingsForm from '@/components/admin/settings/ChargesSettingsForm'
import CheckoutSettingsForm from '@/components/admin/settings/CheckoutSettingsForm'
import LoginSettingsForm from '@/components/admin/settings/LoginSettingsForm'
import OrderOtpSettingsForm from '@/components/admin/settings/OrderOtpSettingsForm'

// Map of section keys to their form components
const SECTION_FORMS: Record<string, React.ComponentType> = {
  basic: BasicSettingsForm,
  branding: BrandingSettingsForm,
  charges: ChargesSettingsForm,
  checkout: CheckoutSettingsForm,
  login: LoginSettingsForm,
  'order-otp': OrderOtpSettingsForm,
}

export default function SettingsSectionPage() {
  const params = useParams()
  const sectionKey = params.section as string

  const section = getSettingsSectionByKey(sectionKey)

  if (!section) {
    return (
      <div className="space-y-6">
        <Link
          href="/admin/settings"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Settings
        </Link>

        <div className="rounded-lg border border-red-200 bg-red-50 p-8 text-center">
          <h1 className="text-xl font-semibold text-red-800">
            Unknown Settings Section
          </h1>
          <p className="mt-2 text-sm text-red-600">
            The settings section &quot;{sectionKey}&quot; does not exist.
          </p>
        </div>
      </div>
    )
  }

  const Icon = section.icon
  const FormComponent = SECTION_FORMS[sectionKey]

  return (
    <div className="space-y-6">
      <Link
        href="/admin/settings"
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Settings
      </Link>

      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-teal-50 text-teal-600">
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{section.title}</h1>
          <p className="text-sm text-gray-500">{section.description}</p>
        </div>
      </div>

      {FormComponent ? (
        <FormComponent />
      ) : (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-8">
          <div className="flex flex-col items-center text-center">
            <Construction className="h-12 w-12 text-amber-500" />
            <h2 className="mt-4 text-lg font-semibold text-amber-800">
              Coming Soon
            </h2>
            <p className="mt-2 max-w-md text-sm text-amber-700">
              The {section.title.toLowerCase()} form is under development and will
              be available in a future update. Check back soon!
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
