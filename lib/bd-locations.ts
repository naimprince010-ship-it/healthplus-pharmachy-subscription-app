import { divisions_en, districts_en, upazilas_en, unions_en } from 'bangladesh-location-data'

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

export function getAllThanasWithDistrictSlug(): Array<{
  id: string
  name: string
  slug: string
  districtId: string
  districtName: string
  districtSlug: string
}> {
  const { slugify } = require('./slugify')
  const byDivision = districts_en as RawLocationMap
  const byDistrict = upazilas_en as RawLocationMap
  const result: Array<{
    id: string
    name: string
    slug: string
    districtId: string
    districtName: string
    districtSlug: string
  }> = []

  for (const districts of Object.values(byDivision)) {
    for (const district of districts) {
      const districtId = String(district.value)
      const districtName = district.title
      const districtSlug = slugify(districtName)

      const thanas = byDistrict[districtId] || []
      for (const thana of thanas) {
        result.push({
          id: String(thana.value),
          name: thana.title,
          slug: slugify(thana.title),
          districtId,
          districtName,
          districtSlug,
        })
      }
    }
  }

  return result
}

export function getAllUnionsWithUpazilaSlug(): Array<{
  id: string
  name: string
  slug: string
  upazilaId: string
  upazilaName: string
  upazilaSlug: string
  districtId: string
  districtName: string
  districtSlug: string
}> {
  const { slugify } = require('./slugify')
  const byDivision = districts_en as RawLocationMap
  const byDistrict = upazilas_en as RawLocationMap
  const byUpazila = unions_en as RawLocationMap
  const result: Array<{
    id: string
    name: string
    slug: string
    upazilaId: string
    upazilaName: string
    upazilaSlug: string
    districtId: string
    districtName: string
    districtSlug: string
  }> = []

  for (const districts of Object.values(byDivision)) {
    for (const district of districts) {
      const districtId = String(district.value)
      const districtName = district.title
      const districtSlug = slugify(districtName)

      const upazilas = byDistrict[districtId] || []
      for (const upazila of upazilas) {
        const upazilaId = String(upazila.value)
        const upazilaName = upazila.title
        const upazilaSlug = slugify(upazilaName)

        const unions = byUpazila[upazilaId] || []
        for (const union of unions) {
          result.push({
            id: String(union.value),
            name: union.title,
            slug: slugify(union.title),
            upazilaId,
            upazilaName,
            upazilaSlug,
            districtId,
            districtName,
            districtSlug,
          })
        }
      }
    }
  }

  return result
}

export function getUnionsByUpazilaSlug(districtSlug: string, upazilaSlug: string): Array<{
  id: string
  name: string
  slug: string
  upazilaId: string
  upazilaName: string
  upazilaSlug: string
  districtId: string
  districtName: string
  districtSlug: string
}> | null {
  const { slugify } = require('./slugify')
  const byDivision = districts_en as RawLocationMap
  const byDistrict = upazilas_en as RawLocationMap
  const byUpazila = unions_en as RawLocationMap

  for (const districts of Object.values(byDivision)) {
    for (const district of districts) {
      if (slugify(district.title) !== districtSlug) continue
      const districtId = String(district.value)
      const districtName = district.title

      const upazilas = byDistrict[districtId] || []
      for (const upazila of upazilas) {
        if (slugify(upazila.title) !== upazilaSlug) continue
        const upazilaId = String(upazila.value)
        const upazilaName = upazila.title

        const unions = byUpazila[upazilaId] || []
        return unions.map((union: RawLocationItem) => ({
          id: String(union.value),
          name: union.title,
          slug: slugify(union.title),
          upazilaId,
          upazilaName,
          upazilaSlug,
          districtId,
          districtName,
          districtSlug,
        }))
      }
    }
  }
  return null
}
