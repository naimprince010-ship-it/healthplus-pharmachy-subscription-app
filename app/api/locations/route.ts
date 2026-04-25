import { NextRequest, NextResponse } from 'next/server'
import { getDivisions, getDistrictsByDivisionId, getUpazilasByDistrictId } from '@/lib/bd-locations'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const divisionId = searchParams.get('divisionId')
    const districtId = searchParams.get('districtId')

    const divisions = getDivisions()
    const districts = divisionId ? getDistrictsByDivisionId(divisionId) : []
    const upazilas = districtId ? getUpazilasByDistrictId(districtId) : []

    return NextResponse.json({ divisions, districts, upazilas }, { status: 200 })
  } catch (error) {
    console.error('Get locations error:', error)
    return NextResponse.json({ error: 'Failed to fetch locations' }, { status: 500 })
  }
}
