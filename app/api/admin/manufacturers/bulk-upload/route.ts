import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface CSVRow {
  name: string
  slug?: string
  phoneNumber?: string
  logoUrl?: string
  websiteUrl?: string
  description?: string
}

interface UploadResult {
  totalRows: number
  createdCount: number
  updatedCount: number
  errorCount: number
  errors: Array<{ line: number; reason: string }>
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function parseCSV(csvText: string): { headers: string[]; rows: string[][] } {
  const lines = csvText.split(/\r?\n/).filter(line => line.trim())
  if (lines.length === 0) {
    return { headers: [], rows: [] }
  }

  const parseCSVLine = (line: string): string[] => {
    const result: string[] = []
    let current = ''
    let inQuotes = false

    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      const nextChar = line[i + 1]

      if (char === '"' && !inQuotes) {
        inQuotes = true
      } else if (char === '"' && inQuotes) {
        if (nextChar === '"') {
          current += '"'
          i++
        } else {
          inQuotes = false
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
    result.push(current.trim())
    return result
  }

  const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase().trim())
  const rows = lines.slice(1).map(line => parseCSVLine(line))

  return { headers, rows }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!file.name.endsWith('.csv')) {
      return NextResponse.json({ error: 'File must be a CSV file' }, { status: 400 })
    }

    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File size must be less than 5MB' }, { status: 400 })
    }

    const csvText = await file.text()
    const { headers, rows } = parseCSV(csvText)

    if (headers.length === 0) {
      return NextResponse.json({ error: 'CSV file is empty or invalid' }, { status: 400 })
    }

    const nameIndex = headers.indexOf('name')
    if (nameIndex === -1) {
      return NextResponse.json({ error: 'CSV must have a "name" column' }, { status: 400 })
    }

    const slugIndex = headers.indexOf('slug')
    const phoneNumberIndex = headers.indexOf('phonenumber')
    const logoUrlIndex = headers.indexOf('logourl')
    const websiteUrlIndex = headers.indexOf('websiteurl')
    const descriptionIndex = headers.indexOf('description')

    const result: UploadResult = {
      totalRows: rows.length,
      createdCount: 0,
      updatedCount: 0,
      errorCount: 0,
      errors: [],
    }

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const lineNumber = i + 2

      try {
        const name = row[nameIndex]?.trim()
        if (!name) {
          result.errorCount++
          result.errors.push({ line: lineNumber, reason: 'Name is required' })
          continue
        }

        if (name.length > 200) {
          result.errorCount++
          result.errors.push({ line: lineNumber, reason: 'Name must be less than 200 characters' })
          continue
        }

        let slug = slugIndex !== -1 ? row[slugIndex]?.trim() : ''
        if (!slug) {
          slug = generateSlug(name)
        }

        if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
          result.errorCount++
          result.errors.push({ line: lineNumber, reason: `Invalid slug format: "${slug}"` })
          continue
        }

        const phoneNumber = phoneNumberIndex !== -1 ? row[phoneNumberIndex]?.trim() || null : null
        const logoUrl = logoUrlIndex !== -1 ? row[logoUrlIndex]?.trim() || null : null
        const websiteUrl = websiteUrlIndex !== -1 ? row[websiteUrlIndex]?.trim() || null : null
        const description = descriptionIndex !== -1 ? row[descriptionIndex]?.trim() || null : null

        if (phoneNumber && phoneNumber.length > 20) {
          result.errorCount++
          result.errors.push({ line: lineNumber, reason: 'Phone number must be less than 20 characters' })
          continue
        }

        const existingBySlug = await prisma.manufacturer.findUnique({
          where: { slug },
        })

        if (existingBySlug) {
          await prisma.manufacturer.update({
            where: { slug },
            data: {
              name,
              phoneNumber,
              logoUrl,
              websiteUrl,
              description,
            },
          })
          result.updatedCount++
        } else {
          const existingByName = await prisma.manufacturer.findUnique({
            where: { name },
          })

          if (existingByName) {
            await prisma.manufacturer.update({
              where: { name },
              data: {
                slug,
                phoneNumber,
                logoUrl,
                websiteUrl,
                description,
              },
            })
            result.updatedCount++
          } else {
            await prisma.manufacturer.create({
              data: {
                name,
                slug,
                phoneNumber,
                logoUrl,
                websiteUrl,
                description,
                aliasList: Prisma.JsonNull,
              },
            })
            result.createdCount++
          }
        }
      } catch (error) {
        result.errorCount++
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        result.errors.push({ line: lineNumber, reason: errorMessage })
      }
    }

    return NextResponse.json({
      message: `Import finished: ${result.createdCount} created, ${result.updatedCount} updated, ${result.errorCount} errors`,
      result,
    })
  } catch (error) {
    console.error('Bulk upload error:', error)
    return NextResponse.json(
      { error: 'Failed to process CSV file' },
      { status: 500 }
    )
  }
}
