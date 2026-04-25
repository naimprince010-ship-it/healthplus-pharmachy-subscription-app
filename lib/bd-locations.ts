import { divisions_en, districts_en, upazilas_en } from 'bangladesh-location-data'

type RawLocationItem = {
  value: number | string
  title: string
}

type RawLocationMap = Record<string, RawLocationItem[]>

export type LocationOption = {
  id: string
  name: string
}

function toOption(item: RawLocationItem): LocationOption {
  return {
    id: String(item.value),
    name: item.title,
  }
}

export function getDivisions(): LocationOption[] {
  return (divisions_en as RawLocationItem[]).map(toOption)
}

export function getDistrictsByDivisionId(divisionId: string): LocationOption[] {
  const byDivision = districts_en as RawLocationMap
  return (byDivision[divisionId] || []).map(toOption)
}

export function getUpazilasByDistrictId(districtId: string): LocationOption[] {
  const byDistrict = upazilas_en as RawLocationMap
  return (byDistrict[districtId] || []).map(toOption)
}

export function getAllDistricts(): Array<LocationOption & { divisionId: string }> {
  const byDivision = districts_en as RawLocationMap
  const rows: Array<LocationOption & { divisionId: string }> = []
  for (const [divisionId, districts] of Object.entries(byDivision)) {
    for (const district of districts) {
      rows.push({
        divisionId,
        ...toOption(district),
      })
    }
  }
  return rows
}
