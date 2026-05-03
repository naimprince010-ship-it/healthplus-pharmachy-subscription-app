import { parseIngredientsList } from '@/lib/product-detail-display'

interface ProductIngredientsSectionProps {
  ingredientsRaw: string | null | undefined
}

export function ProductIngredientsSection({ ingredientsRaw }: ProductIngredientsSectionProps) {
  const items = parseIngredientsList(ingredientsRaw)
  if (items.length === 0) return null

  return (
    <div className="mt-8 rounded-xl border border-emerald-100 bg-emerald-50/40 p-6">
      <h2 className="text-xl font-bold text-gray-900">উপাদানসমূহ</h2>
      <div className="mt-4 flex flex-wrap gap-2">
        {items.map((name, i) => (
          <span
            key={`${name}-${i}`}
            className="inline-flex rounded-full bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm"
          >
            {name}
          </span>
        ))}
      </div>
      <p className="mt-4 text-sm text-emerald-900/90">
        ক্ষতিকারক রাসায়নিক ছাড়াই — ১০০% প্রাকৃতিক ভেষজ উপাদান।
      </p>
    </div>
  )
}
