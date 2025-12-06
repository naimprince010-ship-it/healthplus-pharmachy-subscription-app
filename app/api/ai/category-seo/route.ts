import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getOpenAIClient, defaultModel, isOpenAIConfigured } from '@/lib/openai'
import { requireAdmin } from '@/lib/requireAdmin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const requestSchema = z.object({
  categoryName: z.string().min(1).max(500),
  parentCategory: z.string().max(200).optional(),
  description: z.string().max(2000).optional(),
  language: z.enum(['en', 'bn']).default('bn'),
})

const responseSchema = z.object({
  description: z.string(),
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

    const { categoryName, parentCategory, description, language } = validationResult.data

    const languageInstruction = language === 'bn' 
      ? 'Use simple Bangla (Bengali) language. Mix with English for technical/brand terms.'
      : 'Use English language.'

    const systemPrompt = `You are an SEO content writer for an online pharmacy and health products store in Bangladesh called Halalzi.
Your task is to generate compelling, accurate, and SEO-friendly category page content.
${languageInstruction}
Reply with ONLY valid JSON matching this exact structure:
{
  "description": "string (2-4 sentences describing the category, its products, and benefits for customers)",
  "seoTitle": "string (50-60 chars max, include category name and store name)",
  "seoDescription": "string (150-160 chars, compelling meta description for search results)",
  "seoKeywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"]
}`

    const userPrompt = `Generate SEO content for this product category page:
Category Name: ${categoryName}
${parentCategory ? `Parent Category: ${parentCategory}` : ''}
${description ? `Current Description: ${description}` : ''}

Requirements:
- Description: 2-4 sentences explaining what products are in this category, their benefits, and why customers should buy from Halalzi
- SEO Title: Include category name, mention "Halalzi" or "হালালজি", max 60 chars
- SEO Description: Compelling meta description for Google search results, 150-160 chars, include call-to-action
- SEO Keywords: 5-8 relevant keywords for search optimization (include both English and Bangla terms if language is bn)

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
    } catch {
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
              content: 'The JSON structure is incorrect. Please return ONLY valid JSON with exactly these keys: description, seoTitle, seoDescription, seoKeywords (array). No extra text.' 
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
    console.error('Category SEO helper API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
