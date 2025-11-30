/**
 * Master Table Matching Utility - Phase 2
 * 
 * Provides fuzzy matching for generics, manufacturers, and categories
 * Used by AI batch processing and admin search APIs
 */

import { prisma } from '@/lib/prisma'

// Types for matching results
export interface MatchResult<T> {
  matchId: string | null
  confidence: number
  match: T | null
  candidates: Array<{ item: T; score: number }>
  suggestedNew: string | null // If no good match, suggest creating new
}

export interface GenericMatch {
  id: string
  name: string
  synonyms: string[] | null
  slug: string
}

export interface ManufacturerMatch {
  id: string
  name: string
  aliasList: string[] | null
  slug: string
  requiresQcVerification: boolean
}

export interface CategoryMatch {
  id: string
  name: string
  slug: string
  parentCategoryId: string | null
}

/**
 * Calculate string similarity using Levenshtein distance
 * Returns a score between 0 (no match) and 1 (exact match)
 */
function levenshteinSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().trim()
  const s2 = str2.toLowerCase().trim()
  
  if (s1 === s2) return 1
  if (s1.length === 0 || s2.length === 0) return 0
  
  const matrix: number[][] = []
  
  for (let i = 0; i <= s1.length; i++) {
    matrix[i] = [i]
  }
  for (let j = 0; j <= s2.length; j++) {
    matrix[0][j] = j
  }
  
  for (let i = 1; i <= s1.length; i++) {
    for (let j = 1; j <= s2.length; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,      // deletion
        matrix[i][j - 1] + 1,      // insertion
        matrix[i - 1][j - 1] + cost // substitution
      )
    }
  }
  
  const distance = matrix[s1.length][s2.length]
  const maxLength = Math.max(s1.length, s2.length)
  return 1 - distance / maxLength
}

/**
 * Normalize string for comparison
 * - Lowercase
 * - Remove extra whitespace
 * - Remove common suffixes (Ltd., Inc., etc.)
 */
function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/\b(ltd\.?|limited|inc\.?|incorporated|pvt\.?|private|co\.?|company|pharmaceuticals?|pharma)\b/gi, '')
    .trim()
}

/**
 * Calculate match score between input and a candidate
 * Considers exact match, normalized match, and fuzzy similarity
 */
function calculateMatchScore(input: string, candidateName: string, aliases: string[] = []): number {
  const normalizedInput = normalizeString(input)
  const normalizedCandidate = normalizeString(candidateName)
  
  // Exact match (case-insensitive)
  if (input.toLowerCase() === candidateName.toLowerCase()) {
    return 1.0
  }
  
  // Normalized exact match
  if (normalizedInput === normalizedCandidate) {
    return 0.98
  }
  
  // Check aliases for exact match
  for (const alias of aliases) {
    if (input.toLowerCase() === alias.toLowerCase()) {
      return 0.97
    }
    if (normalizeString(input) === normalizeString(alias)) {
      return 0.95
    }
  }
  
  // Fuzzy matching on main name
  let bestScore = levenshteinSimilarity(normalizedInput, normalizedCandidate)
  
  // Fuzzy matching on aliases
  for (const alias of aliases) {
    const aliasScore = levenshteinSimilarity(normalizedInput, normalizeString(alias))
    bestScore = Math.max(bestScore, aliasScore * 0.95) // Slight penalty for alias match
  }
  
  // Contains check (partial match)
  if (normalizedCandidate.includes(normalizedInput) || normalizedInput.includes(normalizedCandidate)) {
    bestScore = Math.max(bestScore, 0.7)
  }
  
  return bestScore
}

/**
 * Match input string against Generic master table
 */
export async function matchGeneric(input: string): Promise<MatchResult<GenericMatch>> {
  if (!input || input.trim().length === 0) {
    return {
      matchId: null,
      confidence: 0,
      match: null,
      candidates: [],
      suggestedNew: null,
    }
  }
  
  const generics = await prisma.generic.findMany({
    select: {
      id: true,
      name: true,
      synonyms: true,
      slug: true,
    },
  })
  
  const scoredCandidates = generics.map(generic => {
    const synonyms = (generic.synonyms as string[] | null) || []
    const score = calculateMatchScore(input, generic.name, synonyms)
    return {
      item: {
        id: generic.id,
        name: generic.name,
        synonyms,
        slug: generic.slug,
      },
      score,
    }
  })
  
  // Sort by score descending
  scoredCandidates.sort((a, b) => b.score - a.score)
  
  // Get top candidates (score > 0.5)
  const topCandidates = scoredCandidates.filter(c => c.score > 0.5).slice(0, 5)
  
  // Best match
  const bestMatch = scoredCandidates[0]
  
  // Threshold for accepting a match
  const MATCH_THRESHOLD = 0.75
  
  if (bestMatch && bestMatch.score >= MATCH_THRESHOLD) {
    return {
      matchId: bestMatch.item.id,
      confidence: bestMatch.score,
      match: bestMatch.item,
      candidates: topCandidates,
      suggestedNew: null,
    }
  }
  
  // No good match found - suggest creating new
  return {
    matchId: null,
    confidence: bestMatch?.score || 0,
    match: null,
    candidates: topCandidates,
    suggestedNew: input.trim(),
  }
}

/**
 * Match input string against Manufacturer master table
 */
export async function matchManufacturer(input: string): Promise<MatchResult<ManufacturerMatch>> {
  if (!input || input.trim().length === 0) {
    return {
      matchId: null,
      confidence: 0,
      match: null,
      candidates: [],
      suggestedNew: null,
    }
  }
  
  const manufacturers = await prisma.manufacturer.findMany({
    select: {
      id: true,
      name: true,
      aliasList: true,
      slug: true,
      requiresQcVerification: true,
    },
  })
  
  const scoredCandidates = manufacturers.map(manufacturer => {
    const aliases = (manufacturer.aliasList as string[] | null) || []
    const score = calculateMatchScore(input, manufacturer.name, aliases)
    return {
      item: {
        id: manufacturer.id,
        name: manufacturer.name,
        aliasList: aliases,
        slug: manufacturer.slug,
        requiresQcVerification: manufacturer.requiresQcVerification,
      },
      score,
    }
  })
  
  // Sort by score descending
  scoredCandidates.sort((a, b) => b.score - a.score)
  
  // Get top candidates (score > 0.5)
  const topCandidates = scoredCandidates.filter(c => c.score > 0.5).slice(0, 5)
  
  // Best match
  const bestMatch = scoredCandidates[0]
  
  // Threshold for accepting a match
  const MATCH_THRESHOLD = 0.75
  
  if (bestMatch && bestMatch.score >= MATCH_THRESHOLD) {
    return {
      matchId: bestMatch.item.id,
      confidence: bestMatch.score,
      match: bestMatch.item,
      candidates: topCandidates,
      suggestedNew: null,
    }
  }
  
  // No good match found - suggest creating new
  return {
    matchId: null,
    confidence: bestMatch?.score || 0,
    match: null,
    candidates: topCandidates,
    suggestedNew: input.trim(),
  }
}

/**
 * Match input string against Category table
 */
export async function matchCategory(input: string): Promise<MatchResult<CategoryMatch>> {
  if (!input || input.trim().length === 0) {
    return {
      matchId: null,
      confidence: 0,
      match: null,
      candidates: [],
      suggestedNew: null,
    }
  }
  
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      slug: true,
      parentCategoryId: true,
    },
  })
  
  const scoredCandidates = categories.map(category => {
    const score = calculateMatchScore(input, category.name, [])
    return {
      item: {
        id: category.id,
        name: category.name,
        slug: category.slug,
        parentCategoryId: category.parentCategoryId,
      },
      score,
    }
  })
  
  // Sort by score descending
  scoredCandidates.sort((a, b) => b.score - a.score)
  
  // Get top candidates (score > 0.5)
  const topCandidates = scoredCandidates.filter(c => c.score > 0.5).slice(0, 5)
  
  // Best match
  const bestMatch = scoredCandidates[0]
  
  // Threshold for accepting a match (slightly lower for categories since they're predefined)
  const MATCH_THRESHOLD = 0.70
  
  if (bestMatch && bestMatch.score >= MATCH_THRESHOLD) {
    return {
      matchId: bestMatch.item.id,
      confidence: bestMatch.score,
      match: bestMatch.item,
      candidates: topCandidates,
      suggestedNew: null,
    }
  }
  
  // No good match found
  return {
    matchId: null,
    confidence: bestMatch?.score || 0,
    match: null,
    candidates: topCandidates,
    suggestedNew: null, // Don't suggest creating new categories - admin should select manually
  }
}

/**
 * Generate a URL-friendly slug from a name
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-')     // Replace spaces with hyphens
    .replace(/-+/g, '-')      // Replace multiple hyphens with single
    .replace(/^-|-$/g, '')    // Remove leading/trailing hyphens
}

/**
 * Get all generics for AI prompt (compact format)
 */
export async function getGenericsForPrompt(): Promise<string> {
  const generics = await prisma.generic.findMany({
    select: {
      id: true,
      name: true,
      synonyms: true,
    },
    orderBy: { name: 'asc' },
  })
  
  // Format: id|name|synonyms_csv
  return generics.map(g => {
    const synonyms = (g.synonyms as string[] | null) || []
    const synonymsStr = synonyms.length > 0 ? synonyms.join(';') : ''
    return `${g.id}|${g.name}|${synonymsStr}`
  }).join('\n')
}

/**
 * Get all manufacturers for AI prompt (compact format)
 */
export async function getManufacturersForPrompt(): Promise<string> {
  const manufacturers = await prisma.manufacturer.findMany({
    select: {
      id: true,
      name: true,
      aliasList: true,
    },
    orderBy: { name: 'asc' },
  })
  
  // Format: id|name|aliases_csv
  return manufacturers.map(m => {
    const aliases = (m.aliasList as string[] | null) || []
    const aliasesStr = aliases.length > 0 ? aliases.join(';') : ''
    return `${m.id}|${m.name}|${aliasesStr}`
  }).join('\n')
}

/**
 * Get all categories for AI prompt (compact format)
 */
export async function getCategoriesForPrompt(): Promise<string> {
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      parentCategoryId: true,
    },
    orderBy: { name: 'asc' },
  })
  
  // Format: id|name|parent_id
  return categories.map(c => {
    return `${c.id}|${c.name}|${c.parentCategoryId || ''}`
  }).join('\n')
}
