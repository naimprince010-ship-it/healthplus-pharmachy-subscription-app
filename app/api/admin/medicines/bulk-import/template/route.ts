import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

export async function GET() {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const headers = [
      'medicine_name',
      'generic_name',
      'brand_name',
      'manufacturer',
      'category_name',
      'dosage_form',
      'strength',
      'pack_size',
      'description',
      'unit_price',
      'tablets_per_strip',
      'selling_price',
      'mrp',
      'stock_quantity',
      'low_stock_alert_threshold',
      'seo_title',
      'seo_description',
      'seo_keywords',
      'canonical_url',
      'uses',
      'side_effects',
      'contraindications',
      'storage_instructions',
      'expiry_date',
      'requires_prescription',
      'featured_medicine',
    ]

    const csvContent = headers.join(',') + '\n'

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="medicines_template.csv"',
      },
    })
  } catch (error) {
    console.error('Error generating CSV template:', error)
    return NextResponse.json(
      { error: 'Failed to generate template' },
      { status: 500 }
    )
  }
}
