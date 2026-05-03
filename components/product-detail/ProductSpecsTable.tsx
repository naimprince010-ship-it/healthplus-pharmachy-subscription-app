import type { ReactNode } from 'react'

interface ProductSpecsTableProps {
  category: string
  brand: string | null
  volumeSize: string | null
  productTypeLabel: string
  manufacturer: ReactNode
  stockLabel: string
  stockClassName: string
}

/** Key-value specs table (Bangla labels). */
export function ProductSpecsTable({
  category,
  brand,
  volumeSize,
  productTypeLabel,
  manufacturer,
  stockLabel,
  stockClassName,
}: ProductSpecsTableProps) {
  const rows: { label: string; value: React.ReactNode }[] = [
    { label: 'বিভাগ', value: category },
    { label: 'ব্র্যান্ড', value: brand || '—' },
    {
      label: 'আয়তন / সাইজ',
      value: volumeSize ? (
        <span className="font-semibold text-teal-700">{volumeSize}</span>
      ) : (
        '—'
      ),
    },
    { label: 'ধরন', value: productTypeLabel },
    { label: 'প্রস্তুতকারক', value: manufacturer },
    { label: 'স্টক অবস্থা', value: <span className={stockClassName}>{stockLabel}</span> },
  ]

  return (
    <div className="mt-4 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50">
            <th className="px-4 py-3 font-semibold text-gray-700">ক্ষেত্র</th>
            <th className="px-4 py-3 font-semibold text-gray-700">বিবরণ</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label} className="border-b border-gray-100 last:border-0">
              <td className="whitespace-nowrap px-4 py-3 text-gray-600">{row.label}</td>
              <td className="px-4 py-3 text-gray-900">{row.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
