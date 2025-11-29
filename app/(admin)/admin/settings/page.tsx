'use client'

import Link from 'next/link'
import {
  SETTINGS_GROUPS,
  getSettingsSectionsByGroup,
  type SettingsGroup,
} from '@/lib/settings-config'

export default function SettingsOverviewPage() {
  const sectionsByGroup = getSettingsSectionsByGroup()

  const sortedGroups = (Object.keys(SETTINGS_GROUPS) as SettingsGroup[]).sort(
    (a, b) => SETTINGS_GROUPS[a].order - SETTINGS_GROUPS[b].order
  )

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage your store settings and integrations
        </p>
      </div>

      {sortedGroups.map((group) => {
        const sections = sectionsByGroup[group]
        if (sections.length === 0) return null

        return (
          <div key={group} className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">
              {SETTINGS_GROUPS[group].title}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {sections.map((section) => {
                const Icon = section.icon
                return (
                  <Link
                    key={section.key}
                    href={section.path}
                    className="group flex items-start gap-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-all hover:border-teal-300 hover:shadow-md"
                  >
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-600 group-hover:bg-teal-100">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-medium text-gray-900 group-hover:text-teal-600">
                        {section.title}
                      </h3>
                      <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                        {section.description}
                      </p>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
