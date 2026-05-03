'use client'

import { useSession } from 'next-auth/react'
import Link from 'next/link'
import type { SubscriptionPlan, Zone } from '@prisma/client'
import { SubscriptionForm } from './SubscriptionForm'
import { Loader2 } from 'lucide-react'

type SerializablePlan = Omit<SubscriptionPlan, 'createdAt' | 'updatedAt'> & {
  createdAt?: string | Date | null
  updatedAt?: string | Date | null
}

interface SubscriptionSubscribeSectionProps {
  slug: string
  plan: SerializablePlan
  zones: Zone[]
}

function displayBdPhone(raw: string | null | undefined): string {
  if (!raw) return ''
  const s = raw.replace(/\s+/g, '')
  if (s.startsWith('+880')) return `0${s.slice(4)}`
  if (s.startsWith('880')) return `0${s.slice(3)}`
  return s
}

export function SubscriptionSubscribeSection({ slug, plan, zones }: SubscriptionSubscribeSectionProps) {
  const { data: session, status } = useSession()
  const callbackPath = `/subscriptions/${slug}`

  if (status === 'loading') {
    return (
      <div className="mt-8 flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 px-4 py-6 text-gray-600">
        <Loader2 className="h-6 w-6 shrink-0 animate-spin text-teal-600" />
        <span>লোড হচ্ছে…</span>
      </div>
    )
  }

  if (!session?.user?.id) {
    return (
      <div className="mt-6 space-y-4 rounded-xl border-2 border-amber-200 bg-amber-50/90 p-6">
        <p className="text-base font-medium text-amber-950">
          এই প্ল্যানে সাবস্ক্রাইব করতে অনুগ্রহ করে <strong>লগ ইন করুন</strong>। ফর্মটি শুধু লগ ইন ব্যবহারকারীর জন্য উপলব্ধ।
        </p>
        <Link
          href={`/auth/signin?callbackUrl=${encodeURIComponent(callbackPath)}`}
          className="inline-flex rounded-xl bg-teal-600 px-6 py-3 text-center text-sm font-semibold text-white transition hover:bg-teal-700"
        >
          লগ ইন করে চালিয়ে যান
        </Link>
        <p className="text-xs text-amber-900/90">
          অ্যাকাউন্ট নেই? লগইন পাতায় রেজিস্ট্রেশন/OTP অপশন ব্যবহার করুন।
        </p>
      </div>
    )
  }

  return (
    <SubscriptionForm
      plan={plan as SubscriptionPlan}
      zones={zones}
      initialName={session.user.name ?? ''}
      initialPhone={displayBdPhone(session.user.phone)}
    />
  )
}
