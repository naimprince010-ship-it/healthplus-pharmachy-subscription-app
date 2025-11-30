import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getOpenAIClient, defaultModel, isOpenAIConfigured } from '@/lib/openai'
import { z } from 'zod'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Increase timeout for batch processing (Vercel limit is 60s for Pro, 10s for Hobby)
export const maxDuration = 60

const runBatchSchema = z.object({
  jobId: z.string().min(1, 'Job ID is required'),
  batchSize: z.number().int().min(1).max(100).default(100),
})

// Schema for AI-generated product suggestion
const aiSuggestionSchema = z.object({
  brand_name: z.string().nullable().optional(),
  generic_name: z.string().nullable().optional(),
  strength: z.string().nullable().optional(),
  dosage_form: z.string().nullable().optional(),
  pack_size: z.string().nullable().optional(),
  manufacturer: z.string().nullable().optional(),
  short_description: z.string().nullable().optional(),
  long_description: z.string().nullable().optional(),
  seo_title: z.string().nullable().optional(),
  seo_description: z.string().nullable().optional(),
  seo_keywords: z.array(z.string()).nullable().optional(),
  category: z.string().nullable().optional(),
  subcategory: z.string().nullable().optional(),
  slug: z.string().nullable().optional(),
  overall_confidence: z.number().min(0).max(1).optional(),
})

/**
 * Build the AI prompt for batch processing
 */
function buildAIPrompt(products: Array<{ rowIndex: number; rawData: Record<string, unknown> }>, categories: string[]): { system: string; user: string } {
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
   - Category mapping
   - Slug generation
4. If you cannot confidently infer a field, leave it null and lower the confidence score
5. Confidence score (0-1) should reflect how certain you are about the enrichment

Available categories: ${categories.join(', ')}

Return ONLY valid JSON array with one object per product.`

  const userPrompt = `Enrich the following ${products.length} products. For each product, generate:

Required fields:
- brand_name: Extracted/normalized brand name
- generic_name: Generic/scientific name if identifiable
- strength: Dosage strength (e.g., "500mg", "10ml")
- dosage_form: Form (e.g., "Tablet", "Syrup", "Capsule")
- pack_size: Package size (e.g., "10 tablets", "100ml bottle")
- manufacturer: Manufacturer name if identifiable
- short_description: 1-2 sentence Bangla description (non-clinical, just what the product is)
- long_description: 3-4 sentence Bangla description (non-clinical, product details only)
- seo_title: SEO-optimized title in Bangla (max 60 chars)
- seo_description: SEO meta description in Bangla (max 160 chars)
- seo_keywords: Array of 5-8 relevant keywords (mix of Bangla and English)
- category: Best matching category from the available list
- subcategory: Subcategory if applicable
- slug: URL-friendly slug (lowercase, hyphens, no special chars)
- overall_confidence: Confidence score 0-1

Products to process:
${JSON.stringify(products.map(p => ({ row: p.rowIndex, data: p.rawData })), null, 2)}

Return a JSON array with exactly ${products.length} objects, one for each product in the same order.
Each object must have all the fields listed above.
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

    // Get available categories for the AI prompt
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      select: { name: true },
    })
    const categoryNames = categories.map(c => c.name)

    // Prepare products for AI processing
    const productsForAI = unprocessedDrafts.map(draft => ({
      rowIndex: draft.rowIndex,
      rawData: draft.rawData as Record<string, unknown>,
    }))

    // Build AI prompt
    const { system: systemPrompt, user: userPrompt } = buildAIPrompt(productsForAI, categoryNames)

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

    // Update drafts with AI suggestions or errors
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
          // Update with AI suggestion
          await prisma.aiProductDraft.update({
            where: { id: draft.id },
            data: {
              aiSuggestion: suggestion as object,
              aiConfidence: suggestion.overall_confidence || 0.5,
              status: 'PENDING_REVIEW',
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
      { error: 'Failed to process batch' },
      { status: 500 }
    )
  }
}
