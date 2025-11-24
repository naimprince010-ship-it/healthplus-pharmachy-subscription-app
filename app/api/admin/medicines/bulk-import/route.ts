import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { parse } from 'csv-parse/sync'
import { generateUniqueSlug } from '@/lib/slugify'

const MAX_ROWS = 2000

const CSV_FIELD_MAPPING: Record<string, string> = {
  medicine_name: 'name',
  generic_name: 'genericName',
  brand_name: 'brandName',
  manufacturer: 'manufacturer',
  category_name: 'categoryName',
  dosage_form: 'dosageForm',
  strength: 'strength',
  pack_size: 'packSize',
  description: 'description',
  unit_price: 'unitPrice',
  tablets_per_strip: 'tabletsPerStrip',
  selling_price: 'sellingPrice',
  mrp: 'mrp',
  stock_quantity: 'stockQuantity',
  low_stock_alert_threshold: 'minStockAlert',
  seo_title: 'seoTitle',
  seo_description: 'seoDescription',
  seo_keywords: 'seoKeywords',
  canonical_url: 'canonicalUrl',
  uses: 'uses',
  side_effects: 'sideEffects',
  contraindications: 'contraindications',
  storage_instructions: 'storageInstructions',
  expiry_date: 'expiryDate',
  requires_prescription: 'requiresPrescription',
  featured_medicine: 'isFeatured',
}

function normalizeBoolean(value: string | undefined): boolean {
  if (!value) return false
  const normalized = value.toString().toLowerCase().trim()
  return ['true', '1', 'yes', 'y'].includes(normalized)
}

function normalizeNumber(value: string | undefined): number | null {
  if (!value) return null
  const cleaned = value.toString().replace(/,/g, '').trim()
  const num = parseFloat(cleaned)
  return isNaN(num) ? null : num
}

function normalizeDate(value: string | undefined): Date | null {
  if (!value) return null
  const date = new Date(`${value}T00:00:00Z`)
  return isNaN(date.getTime()) ? null : date
}

interface ParsedRow {
  rowNumber: number
  data: Record<string, unknown>
  categoryName: string
}

interface ImportError {
  row: number
  reason: string
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!file.name.endsWith('.csv')) {
      return NextResponse.json({ error: 'File must be a CSV' }, { status: 400 })
    }

    const text = await file.text()
    
    let records: Record<string, string>[]
    try {
      records = parse(text, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        relax_column_count: true,
      })
    } catch {
      return NextResponse.json(
        { error: 'Invalid CSV format' },
        { status: 400 }
      )
    }

    if (records.length === 0) {
      return NextResponse.json(
        { error: 'CSV file is empty' },
        { status: 400 }
      )
    }

    if (records.length > MAX_ROWS) {
      return NextResponse.json(
        { error: `Maximum ${MAX_ROWS} rows allowed per upload` },
        { status: 400 }
      )
    }

    const parsedRows: ParsedRow[] = []
    const errors: ImportError[] = []

    for (let i = 0; i < records.length; i++) {
      const record = records[i]
      const rowNumber = i + 2

      const normalizedRecord: Record<string, string> = {}
      for (const [key, value] of Object.entries(record)) {
        normalizedRecord[key.toLowerCase().trim()] = value
      }

      const medicineName = normalizedRecord.medicine_name?.trim()
      const manufacturer = normalizedRecord.manufacturer?.trim()
      const categoryName = normalizedRecord.category_name?.trim()

      if (!medicineName) {
        errors.push({ row: rowNumber, reason: 'Missing medicine_name' })
        continue
      }

      if (!manufacturer) {
        errors.push({ row: rowNumber, reason: 'Missing manufacturer' })
        continue
      }

      if (!categoryName) {
        errors.push({ row: rowNumber, reason: 'Missing category_name' })
        continue
      }

      const data: Record<string, unknown> = {
        name: medicineName,
        manufacturer,
      }

      for (const [csvField, modelField] of Object.entries(CSV_FIELD_MAPPING)) {
        if (csvField === 'medicine_name' || csvField === 'manufacturer' || csvField === 'category_name') {
          continue
        }

        const value = normalizedRecord[csvField]

        if (modelField === 'requiresPrescription' || modelField === 'isFeatured') {
          data[modelField] = normalizeBoolean(value)
        } else if (
          modelField === 'unitPrice' ||
          modelField === 'tabletsPerStrip' ||
          modelField === 'sellingPrice' ||
          modelField === 'mrp' ||
          modelField === 'stockQuantity' ||
          modelField === 'minStockAlert'
        ) {
          data[modelField] = normalizeNumber(value)
        } else if (modelField === 'expiryDate') {
          data[modelField] = normalizeDate(value)
        } else if (value) {
          data[modelField] = value.trim()
        }
      }

      parsedRows.push({ rowNumber, data, categoryName })
    }

    const categoryCache = new Map<string, string>()
    const categories = await prisma.category.findMany({
      select: { id: true, name: true },
    })

    for (const cat of categories) {
      categoryCache.set(cat.name.toLowerCase(), cat.id)
    }

    let imported = 0
    const importErrors: ImportError[] = [...errors]

    for (const { rowNumber, data, categoryName } of parsedRows) {
      const categoryId = categoryCache.get(categoryName.toLowerCase())

      if (!categoryId) {
        importErrors.push({
          row: rowNumber,
          reason: `Category '${categoryName}' not found`,
        })
        continue
      }

      try {
        const slug = await generateUniqueSlug(data.name as string, async (s) => {
          const existing = await prisma.medicine.findUnique({
            where: { slug: s },
          })
          return !!existing
        })

        const sellingPrice = (data.sellingPrice as number) || 0
        const stockQuantity = (data.stockQuantity as number) || 0

        await prisma.medicine.create({
          data: {
            name: data.name as string,
            slug,
            genericName: (data.genericName as string) || null,
            brandName: (data.brandName as string) || null,
            manufacturer: data.manufacturer as string,
            dosageForm: (data.dosageForm as string) || null,
            strength: (data.strength as string) || null,
            packSize: (data.packSize as string) || null,
            description: (data.description as string) || null,
            unit: 'pcs',
            unitPrice: (data.unitPrice as number) || null,
            tabletsPerStrip: (data.tabletsPerStrip as number) || null,
            sellingPrice,
            price: sellingPrice,
            mrp: (data.mrp as number) || null,
            stockQuantity,
            minStockAlert: (data.minStockAlert as number) || null,
            inStock: stockQuantity > 0,
            seoTitle: (data.seoTitle as string) || null,
            seoDescription: (data.seoDescription as string) || null,
            seoKeywords: (data.seoKeywords as string) || null,
            canonicalUrl: (data.canonicalUrl as string) || null,
            uses: (data.uses as string) || null,
            sideEffects: (data.sideEffects as string) || null,
            contraindications: (data.contraindications as string) || null,
            storageInstructions: (data.storageInstructions as string) || null,
            expiryDate: (data.expiryDate as Date) || null,
            requiresPrescription: (data.requiresPrescription as boolean) || false,
            isFeatured: (data.isFeatured as boolean) || false,
            isActive: false,
            categoryId,
          },
        })

        imported++
      } catch (error) {
        console.error(`Error importing row ${rowNumber}:`, error)
        importErrors.push({
          row: rowNumber,
          reason: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }

    return NextResponse.json({
      success: true,
      summary: {
        total: records.length,
        imported,
        skipped: importErrors.length,
        errors: importErrors,
      },
    })
  } catch (error) {
    console.error('Bulk import error:', error)
    return NextResponse.json(
      { error: 'Failed to process import' },
      { status: 500 }
    )
  }
}
