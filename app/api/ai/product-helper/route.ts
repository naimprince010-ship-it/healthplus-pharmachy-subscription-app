import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getOpenAIClient, defaultModel, isOpenAIConfigured } from '@/lib/openai'
import { requireAdmin } from '@/lib/requireAdmin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const requestSchema = z.object({
  productName: z.string().min(1).max(500),
  brandName: z.string().max(200).optional(),
  category: z.string().max(200).optional(),
  language: z.enum(['en', 'bn']).default('en'),
})

const responseSchema = z.object({
  description: z.string(),
  keyFeatures: z.array(z.string()),
  specsSummary: z.string(),
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

    const { productName, brandName, category, language } = validationResult.data

    const languageInstruction = language === 'bn' 
      ? 'Use simple Bangla (Bengali) language where appropriate, mixing with English for technical terms.'
      : 'Use English language.'

    const systemPrompt = `You are a product content writer for an online pharmacy and cosmetics store in Bangladesh. 
Your task is to generate compelling, accurate, and SEO-friendly product content.
${languageInstruction}
Reply with ONLY valid JSON matching this exact structure:
{
  "description": "string (2-3 sentences about the product)",
  "keyFeatures": ["feature1", "feature2", "feature3"],
  "specsSummary": "string (brief specifications)",
  "seoTitle": "string (60 chars max, include product name)",
  "seoDescription": "string (150-160 chars, compelling meta description)",
  "seoKeywords": ["keyword1", "keyword2", "keyword3"]
}`

    const userPrompt = `Generate product content for:
Product Name: ${productName}
Brand: ${brandName || 'Unknown'}
Category: ${category || 'General'}

Requirements:
- Description: 2-3 sentences highlighting benefits and uses
- Key Features: 3-5 bullet points
- Specs Summary: Brief technical specifications or ingredients
- SEO Title: Include product name and key benefit (max 60 chars)
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
        max_tokens: 700,
      })
    } catch (openaiError: any) {
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
              content: 'The JSON structure is incorrect. Please return ONLY valid JSON with exactly these keys: description, keyFeatures (array), specsSummary, seoTitle, seoDescription, seoKeywords (array). No extra text.' 
            },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.5,
          max_tokens: 700,
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
    console.error('Product helper API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
