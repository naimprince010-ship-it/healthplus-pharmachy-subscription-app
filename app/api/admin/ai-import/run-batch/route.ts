import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getOpenAIClient, defaultModel, isOpenAIConfigured } from '@/lib/openai'
import { z } from 'zod'
import {
  matchGeneric,
  matchManufacturer,
  matchCategory,
  getGenericsForPrompt,
  getManufacturersForPrompt,
  getCategoriesForPrompt,
} from '@/lib/matching/masterMatching'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Increase timeout for batch processing (Vercel limit is 60s for Pro, 10s for Hobby)
export const maxDuration = 60

const runBatchSchema = z.object({
  jobId: z.string().min(1, 'Job ID is required'),
  batchSize: z.number().int().min(1).max(100).default(100),
})

// Schema for AI-generated product suggestion (Phase 2 enhanced)
const aiSuggestionSchema = z.object({
  // Basic product info
  brand_name: z.string().nullable().optional(),
  strength: z.string().nullable().optional(),
  dosage_form: z.string().nullable().optional(),
  pack_size: z.string().nullable().optional(),
  mrp: z.number().nullable().optional(),
  
  // Phase 2: Generic matching
  generic_detected: z.string().nullable().optional(),
  generic_match_id: z.string().nullable().optional(),
  generic_confidence: z.number().min(0).max(1).nullable().optional(),
  
  // Phase 2: Manufacturer matching
  manufacturer_detected: z.string().nullable().optional(),
  manufacturer_match_id: z.string().nullable().optional(),
  manufacturer_confidence: z.number().min(0).max(1).nullable().optional(),
  
  // Phase 2: Category matching
  category_detected: z.string().nullable().optional(),
  category_match_id: z.string().nullable().optional(),
  category_confidence: z.number().min(0).max(1).nullable().optional(),
  
  // Phase 2: Subcategory matching
  subcategory_detected: z.string().nullable().optional(),
  subcategory_match_id: z.string().nullable().optional(),
  subcategory_confidence: z.number().min(0).max(1).nullable().optional(),
  
  // Content fields
  slug: z.string().nullable().optional(),
  short_description: z.string().nullable().optional(),
  long_description: z.string().nullable().optional(),
  seo_title: z.string().nullable().optional(),
  seo_description: z.string().nullable().optional(),
  seo_keywords: z.array(z.string()).nullable().optional(),
  
  // Overall confidence
  overall_confidence: z.number().min(0).max(1).optional(),
  
  // Legacy fields (backward compatibility with Phase 1)
  generic_name: z.string().nullable().optional(),
  manufacturer: z.string().nullable().optional(),
  category: z.string().nullable().optional(),
  subcategory: z.string().nullable().optional(),
})

/**
 * Build the AI prompt for batch processing (Phase 2 enhanced)
 * Includes master lists for generics, manufacturers, and categories
 */
function buildAIPromptPhase2(
  products: Array<{ rowIndex: number; rawData: Record<string, unknown> }>,
  genericsPrompt: string,
  manufacturersPrompt: string,
  categoriesPrompt: string
): { system: string; user: string } {
  const systemPrompt = `You are a product data enrichment assistant for a Bangladeshi pharmacy/grocery e-commerce platform.
Your task is to normalize, enrich, and generate SEO content for product data.

IMPORTANT RULES:
1. Generate descriptions in Bangla (Bengali) language, mixing with English for brand names and technical terms
2. DO NOT generate any clinical/medical information like:
   - Indications or uses
   - Dosage instructions
   - Side effects
   - Contraindications
   - Medical advice
3. Focus ONLY on:
   - Product formatting and normalization
   - SEO-friendly content (titles, descriptions, keywords)
   - Matching to master tables (generics, manufacturers, categories)
   - Slug generation
4. For matching fields (generic, manufacturer, category):
   - You MUST choose from the provided master lists when possible
   - If you find a match, set the *_match_id field to the ID from the list
   - If no match found, set *_match_id to null and put your best guess in *_detected
   - Set *_confidence (0-1) based on how certain you are of the match
5. Overall confidence score (0-1) should reflect how certain you are about the entire enrichment

MASTER DATA LISTS (format: id|name|synonyms_or_aliases):

=== GENERICS (active ingredients) ===
${genericsPrompt || '(No generics in database yet)'}

=== MANUFACTURERS ===
${manufacturersPrompt || '(No manufacturers in database yet)'}

=== CATEGORIES (id|name|parent_id) ===
${categoriesPrompt || '(No categories in database yet)'}

Return ONLY valid JSON object with "products" array.`

  const userPrompt = `Enrich the following ${products.length} products. For each product, generate:

Required fields:
- brand_name: Extracted/normalized brand name
- strength: Dosage strength (e.g., "500mg", "10ml")
- dosage_form: Form (e.g., "Tablet", "Syrup", "Capsule")
- pack_size: Package size (e.g., "10 tablets", "100ml bottle")
- mrp: Maximum retail price if found in data (number or null)

Generic matching:
- generic_detected: The generic/active ingredient name you identified
- generic_match_id: ID from the generics list if matched, null otherwise
- generic_confidence: Confidence score 0-1 for the generic match

Manufacturer matching:
- manufacturer_detected: The manufacturer name you identified
- manufacturer_match_id: ID from the manufacturers list if matched, null otherwise
- manufacturer_confidence: Confidence score 0-1 for the manufacturer match

Category matching:
- category_detected: The category name you identified
- category_match_id: ID from the categories list if matched, null otherwise
- category_confidence: Confidence score 0-1 for the category match
- subcategory_detected: Subcategory if applicable
- subcategory_match_id: ID from the categories list if matched, null otherwise
- subcategory_confidence: Confidence score 0-1 for the subcategory match

Content fields:
- slug: URL-friendly slug (lowercase, hyphens, no special chars)
- short_description: 1-2 sentence Bangla description (non-clinical, just what the product is)
- long_description: 3-4 sentence Bangla description (non-clinical, product details only)
- seo_title: SEO-optimized title in Bangla (max 60 chars)
- seo_description: SEO meta description in Bangla (max 160 chars)
- seo_keywords: Array of 5-8 relevant keywords (mix of Bangla and English)

Overall:
- overall_confidence: Overall confidence score 0-1

Products to process:
${JSON.stringify(products.map(p => ({ row: p.rowIndex, data: p.rawData })), null, 2)}

Return a JSON object with "products" array containing exactly ${products.length} objects, one for each product in the same order.
If a field cannot be determined, set it to null.`

  return { system: systemPrompt, user: userPrompt }
}

/**
 * POST /api/admin/ai-import/run-batch
 * Process a batch of products with AI enrichment
 * 
 * Request body:
 * - jobId: The import job ID
 * - batchSize: Number of rows to process (default 100, max 100)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    if (!isOpenAIConfigured()) {
      return NextResponse.json(
        { error: 'AI is not configured. Please set OPENAI_API_KEY in environment variables.' },
        { status: 500 }
      )
    }

    const body = await request.json()
    const validationResult = runBatchSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      )
    }

    const { jobId, batchSize } = validationResult.data

    // Get the job
    const job = await prisma.aiImportJob.findUnique({
      where: { id: jobId },
    })

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    if (job.status === 'COMPLETED') {
      return NextResponse.json({ 
        error: 'Job already completed',
        job: {
          id: job.id,
          status: job.status,
          totalRows: job.totalRows,
          processedRows: job.processedRows,
          failedRows: job.failedRows,
        }
      }, { status: 400 })
    }

    if (job.status === 'CANCELLED' || job.status === 'FAILED') {
      return NextResponse.json({ 
        error: `Job is ${job.status.toLowerCase()}`,
        job: {
          id: job.id,
          status: job.status,
          errorSummary: job.errorSummary,
        }
      }, { status: 400 })
    }

    // Update job status to PROCESSING
    if (job.status === 'PENDING') {
      await prisma.aiImportJob.update({
        where: { id: jobId },
        data: { status: 'PROCESSING' },
      })
    }

    // Get unprocessed drafts (those without AI suggestions)
    const unprocessedDrafts = await prisma.aiProductDraft.findMany({
      where: {
        importJobId: jobId,
        aiSuggestion: { equals: Prisma.DbNull },
        status: 'PENDING_REVIEW',
      },
      orderBy: { rowIndex: 'asc' },
      take: batchSize,
    })

    if (unprocessedDrafts.length === 0) {
      // All drafts processed, mark job as completed
      await prisma.aiImportJob.update({
        where: { id: jobId },
        data: { status: 'COMPLETED' },
      })

      return NextResponse.json({
        success: true,
        message: 'All rows have been processed',
        job: {
          id: job.id,
          status: 'COMPLETED',
          totalRows: job.totalRows,
          processedRows: job.processedRows,
          failedRows: job.failedRows,
        },
        processed: 0,
        remaining: 0,
      })
    }

    // Phase 2: Get master lists for AI prompt
    const [genericsPrompt, manufacturersPrompt, categoriesPrompt] = await Promise.all([
      getGenericsForPrompt(),
      getManufacturersForPrompt(),
      getCategoriesForPrompt(),
    ])

    // Prepare products for AI processing
    const productsForAI = unprocessedDrafts.map(draft => ({
      rowIndex: draft.rowIndex,
      rawData: draft.rawData as Record<string, unknown>,
    }))

    // Build AI prompt (Phase 2 with master lists)
    const { system: systemPrompt, user: userPrompt } = buildAIPromptPhase2(
      productsForAI,
      genericsPrompt,
      manufacturersPrompt,
      categoriesPrompt
    )

    let aiResponse: string | null = null
    let parsedSuggestions: Array<z.infer<typeof aiSuggestionSchema>> = []
    let aiError: string | null = null

    try {
      const openai = getOpenAIClient()
      const completion = await openai.chat.completions.create({
        model: defaultModel,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3,
        max_tokens: 4000,
      })

      aiResponse = completion.choices[0]?.message?.content
      
      if (!aiResponse) {
        throw new Error('AI returned empty response')
      }

      // Parse the JSON response
      const parsed = JSON.parse(aiResponse)
      
      // Handle both array and object with array property
      const suggestionsArray = Array.isArray(parsed) ? parsed : (parsed.products || parsed.items || parsed.results || [])
      
      if (!Array.isArray(suggestionsArray)) {
        throw new Error('AI response is not an array')
      }

      // Validate each suggestion
      parsedSuggestions = suggestionsArray.map((item: unknown) => {
        const result = aiSuggestionSchema.safeParse(item)
        if (result.success) {
          return result.data
        }
        // Return partial data with low confidence if validation fails
        return {
          ...(item as Record<string, unknown>),
          overall_confidence: 0.1,
        } as z.infer<typeof aiSuggestionSchema>
      })

    } catch (error) {
      console.error('AI processing error:', error)
      aiError = error instanceof Error ? error.message : 'Unknown AI error'
    }

    // Update drafts with AI suggestions or errors (Phase 2 enhanced)
    let processedCount = 0
    let failedCount = 0

    for (let i = 0; i < unprocessedDrafts.length; i++) {
      const draft = unprocessedDrafts[i]
      const suggestion = parsedSuggestions[i]

      try {
        if (aiError || !suggestion) {
          // Mark as AI_ERROR if AI failed
          await prisma.aiProductDraft.update({
            where: { id: draft.id },
            data: {
              status: 'AI_ERROR',
              notes: aiError || 'No AI suggestion generated',
            },
          })
          failedCount++
        } else {
          // Phase 2: Apply fuzzy matching if AI didn't provide match IDs
          // This validates AI's match IDs and fills in missing ones
          
          // Generic matching
          let genericMatchId = suggestion.generic_match_id || null
          let genericConfidence = suggestion.generic_confidence || 0
          let newGenericSuggested: string | null = null
          
          const genericInput = suggestion.generic_detected || suggestion.generic_name
          if (genericInput && !genericMatchId) {
            const genericMatch = await matchGeneric(genericInput)
            genericMatchId = genericMatch.matchId
            genericConfidence = genericMatch.confidence
            newGenericSuggested = genericMatch.suggestedNew
          }
          
          // Manufacturer matching
          let manufacturerMatchId = suggestion.manufacturer_match_id || null
          let manufacturerConfidence = suggestion.manufacturer_confidence || 0
          let newManufacturerSuggested: string | null = null
          
          const manufacturerInput = suggestion.manufacturer_detected || suggestion.manufacturer
          if (manufacturerInput && !manufacturerMatchId) {
            const manufacturerMatch = await matchManufacturer(manufacturerInput)
            manufacturerMatchId = manufacturerMatch.matchId
            manufacturerConfidence = manufacturerMatch.confidence
            newManufacturerSuggested = manufacturerMatch.suggestedNew
          }
          
          // Category matching
          let categoryMatchId = suggestion.category_match_id || null
          let categoryConfidence = suggestion.category_confidence || 0
          
          const categoryInput = suggestion.category_detected || suggestion.category
          if (categoryInput && !categoryMatchId) {
            const categoryMatch = await matchCategory(categoryInput)
            categoryMatchId = categoryMatch.matchId
            categoryConfidence = categoryMatch.confidence
          }
          
          // Subcategory matching
          let subcategoryMatchId = suggestion.subcategory_match_id || null
          // Note: subcategoryConfidence is available but not stored in DB yet (future enhancement)
          
          const subcategoryInput = suggestion.subcategory_detected || suggestion.subcategory
          if (subcategoryInput && !subcategoryMatchId) {
            const subcategoryMatch = await matchCategory(subcategoryInput)
            subcategoryMatchId = subcategoryMatch.matchId
          }
          
          // Update with AI suggestion and Phase 2 match data
          await prisma.aiProductDraft.update({
            where: { id: draft.id },
            data: {
              aiSuggestion: suggestion as object,
              aiConfidence: suggestion.overall_confidence || 0.5,
              status: 'PENDING_REVIEW',
              // Phase 2 fields
              genericMatchId,
              genericConfidence,
              manufacturerMatchId,
              manufacturerConfidence,
              categoryMatchId,
              categoryConfidence,
              subcategoryMatchId,
              newGenericSuggested,
              newManufacturerSuggested,
              // QC verification flags default to false (admin must verify)
              genericVerified: false,
              manufacturerVerified: false,
              categoryVerified: false,
            },
          })
          processedCount++
        }
      } catch (updateError) {
        console.error(`Failed to update draft ${draft.id}:`, updateError)
        failedCount++
      }
    }

    // Update job progress
    const updatedJob = await prisma.aiImportJob.update({
      where: { id: jobId },
      data: {
        processedRows: { increment: processedCount },
        failedRows: { increment: failedCount },
        errorSummary: aiError ? `Batch error: ${aiError}` : job.errorSummary,
      },
    })

    // Check if all rows are processed
    const remainingDrafts = await prisma.aiProductDraft.count({
      where: {
        importJobId: jobId,
        aiSuggestion: { equals: Prisma.DbNull },
        status: 'PENDING_REVIEW',
      },
    })

    if (remainingDrafts === 0) {
      await prisma.aiImportJob.update({
        where: { id: jobId },
        data: { status: 'COMPLETED' },
      })
    }

    return NextResponse.json({
      success: true,
      job: {
        id: updatedJob.id,
        status: remainingDrafts === 0 ? 'COMPLETED' : updatedJob.status,
        totalRows: updatedJob.totalRows,
        processedRows: updatedJob.processedRows,
        failedRows: updatedJob.failedRows,
      },
      batch: {
        processed: processedCount,
        failed: failedCount,
        total: unprocessedDrafts.length,
      },
      remaining: remainingDrafts,
    })
  } catch (error) {
    console.error('Run batch error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to process batch',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}
