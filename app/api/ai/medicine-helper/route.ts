import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getOpenAIClient, defaultModel, isOpenAIConfigured } from '@/lib/openai'
import { requireAdmin } from '@/lib/requireAdmin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const requestSchema = z.object({
  medicineName: z.string().min(1).max(500),
  genericName: z.string().max(200).optional(),
  brandName: z.string().max(200).optional(),
  manufacturer: z.string().max(200).optional(),
  dosageForm: z.string().max(100).optional(),
  strength: z.string().max(100).optional(),
  category: z.string().max(200).optional(),
  language: z.enum(['en', 'bn']).default('en'),
})

const responseSchema = z.object({
  description: z.string(),
  uses: z.string(),
  sideEffects: z.string(),
  contraindications: z.string(),
  storageInstructions: z.string(),
  seoTitle: z.string(),
  seoDescription: z.string(),
  seoKeywords: z.array(z.string()),
})

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAdmin()
    if (!authResult.authorized) {
      return authResult.response
    }

    if (!isOpenAIConfigured()) {
      return NextResponse.json(
        { error: 'AI is not configured. Please set OPENAI_API_KEY in environment variables.' },
        { status: 500 }
      )
    }

    const body = await request.json()
    const validationResult = requestSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid request',
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      )
    }

    const { medicineName, genericName, brandName, manufacturer, dosageForm, strength, category, language } = validationResult.data

    const languageInstruction = language === 'bn' 
      ? 'Use simple Bangla (Bengali) language where appropriate, mixing with English for medical/technical terms.'
      : 'Use English language.'

    const systemPrompt = `You are a pharmaceutical content writer for an online pharmacy in Bangladesh. 
Your task is to generate accurate, helpful, and SEO-friendly medicine content.
${languageInstruction}
Reply with ONLY valid JSON matching this exact structure:
{
  "description": "string (2-3 sentences about the medicine)",
  "uses": "string (common uses and indications, bullet points separated by newlines)",
  "sideEffects": "string (common side effects, bullet points separated by newlines)",
  "contraindications": "string (when not to use, bullet points separated by newlines)",
  "storageInstructions": "string (storage requirements)",
  "seoTitle": "string (60 chars max, include medicine name)",
  "seoDescription": "string (150-160 chars, compelling meta description)",
  "seoKeywords": ["keyword1", "keyword2", "keyword3"]
}`

    const userPrompt = `Generate medicine content for:
Medicine Name: ${medicineName}
Generic Name: ${genericName || 'Not specified'}
Brand: ${brandName || 'Not specified'}
Manufacturer: ${manufacturer || 'Not specified'}
Dosage Form: ${dosageForm || 'Not specified'}
Strength: ${strength || 'Not specified'}
Category: ${category || 'General'}

Requirements:
- Description: 2-3 sentences about what this medicine is and its primary purpose
- Uses: Common medical uses and indications (use bullet points with newlines)
- Side Effects: Common side effects patients should be aware of (use bullet points with newlines)
- Contraindications: When this medicine should NOT be used (use bullet points with newlines)
- Storage Instructions: How to properly store this medicine
- SEO Title: Include medicine name and key benefit (max 60 chars)
- SEO Description: Compelling meta description (150-160 chars)
- SEO Keywords: 5-8 relevant keywords for search optimization

Return ONLY the JSON object, no additional text.`

    let completion
    try {
      const openai = getOpenAIClient()
      completion = await openai.chat.completions.create({
        model: defaultModel,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7,
        max_tokens: 1000,
      })
    } catch (openaiError: unknown) {
      console.error('OpenAI API error:', openaiError)
      return NextResponse.json(
        { error: 'AI generation failed. Please try again.' },
        { status: 500 }
      )
    }

    const content = completion.choices[0]?.message?.content
    if (!content) {
      return NextResponse.json(
        { error: 'AI returned empty response' },
        { status: 500 }
      )
    }

    let parsedContent
    try {
      parsedContent = JSON.parse(content)
    } catch (parseError) {
      console.error('Failed to parse AI response:', content)
      return NextResponse.json(
        { error: 'AI returned invalid JSON' },
        { status: 500 }
      )
    }

    const validatedResponse = responseSchema.safeParse(parsedContent)
    if (!validatedResponse.success) {
      console.error('AI response validation failed:', validatedResponse.error)
      
      try {
        const openai = getOpenAIClient()
        const retryCompletion = await openai.chat.completions.create({
          model: defaultModel,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
            { 
              role: 'assistant', 
              content: content 
            },
            { 
              role: 'user', 
              content: 'The JSON structure is incorrect. Please return ONLY valid JSON with exactly these keys: description, uses, sideEffects, contraindications, storageInstructions, seoTitle, seoDescription, seoKeywords (array). No extra text.' 
            },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.5,
          max_tokens: 1000,
        })

        const retryContent = retryCompletion.choices[0]?.message?.content
        if (retryContent) {
          parsedContent = JSON.parse(retryContent)
          const retryValidation = responseSchema.safeParse(parsedContent)
          if (retryValidation.success) {
            return NextResponse.json(retryValidation.data)
          }
        }
      } catch (retryError) {
        console.error('Retry failed:', retryError)
      }

      return NextResponse.json(
        { error: 'AI generated invalid response format' },
        { status: 500 }
      )
    }

    return NextResponse.json(validatedResponse.data)
  } catch (error) {
    console.error('Medicine helper API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
