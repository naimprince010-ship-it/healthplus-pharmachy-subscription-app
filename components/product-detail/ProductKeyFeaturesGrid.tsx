import {
  Leaf,
  Shield,
  Sparkles,
  Droplets,
  Heart,
  CheckCircle,
  Star,
  Award,
  type LucideIcon,
} from 'lucide-react'
import { parseKeyFeatureLine } from '@/lib/product-detail-display'

const ICONS: LucideIcon[] = [Leaf, Shield, Sparkles, Droplets, Heart, CheckCircle, Star, Award]

interface ProductKeyFeaturesGridProps {
  keyFeaturesRaw: string | null | undefined
}

export function ProductKeyFeaturesGrid({ keyFeaturesRaw }: ProductKeyFeaturesGridProps) {
  const lines = (keyFeaturesRaw?.split('\n') ?? []).map((l) => l.trim()).filter(Boolean)
  if (lines.length === 0) return null

  return (
    <div className="mt-8">
      <h2 className="text-xl font-bold text-gray-900">মূল বৈশিষ্ট্য</h2>
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {lines.map((line, index) => {
          const { title, detail } = parseKeyFeatureLine(line)
          const Icon = ICONS[index % ICONS.length]
          return (
            <div
              key={index}
              className="flex gap-3 rounded-xl border border-teal-100 bg-gradient-to-br from-white to-teal-50/40 p-4 shadow-sm"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-100 text-teal-700">
                <Icon className="h-5 w-5" aria-hidden />
              </div>
              <div className="min-w-0">
                <p className="font-bold text-gray-900">{title}</p>
                {detail ? <p className="mt-1 line-clamp-2 text-sm text-gray-600">{detail}</p> : null}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
