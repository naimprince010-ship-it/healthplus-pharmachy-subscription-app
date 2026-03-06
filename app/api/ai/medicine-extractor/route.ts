import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getOpenAIClient, defaultModel, isOpenAIConfigured } from '@/lib/openai'
import { requireAdmin } from '@/lib/requireAdmin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const requestSchema = z.object({
    productName: z.string().min(1).max(500),
})

const responseSchema = z.object({
    genericName: z.string().nullable(),
    strength: z.string().nullable(),
    dosageForm: z.string().nullable(),
    brandName: z.string().nullable(),
    packSize: z.string().nullable(),
})

export async function POST(request: NextRequest) {
    try {
        const authResult = await requireAdmin()
        if (!authResult.authorized) {
            return authResult.response
        }

        if (!isOpenAIConfigured()) {
            return NextResponse.json(
                { error: 'AI is not configured.' },
                { status: 500 }
            )
        }

        const body = await request.json()
        const validationResult = requestSchema.safeParse(body)

        if (!validationResult.success) {
            return NextResponse.json(
                { error: 'Invalid request', details: validationResult.error.flatten().fieldErrors },
                { status: 400 }
            )
        }

        const { productName } = validationResult.data

        const systemPrompt = `You are a medical data extraction expert. 
Your task is to extract pharmaceutical fields from a product name.
Fields to extract:
1. genericName: The scientific name of the medicine (e.g., Paracetamol, Omeprazole).
2. strength: The concentration (e.g., 500mg, 20mg, 10ml).
3. dosageForm: The form of the medicine (e.g., Tablet, Capsule, Syrup, Injection, Cream).
4. brandName: The commercial name (e.g., Napa, Losec).
5. packSize: The packaging information if present in the name (e.g., 10's, 100ml).

Reply with ONLY valid JSON matching this structure:
{
  "genericName": "string or null",
  "strength": "string or null",
  "dosageForm": "string or null",
  "brandName": "string or null",
  "packSize": "string or null"
}`

        const userPrompt = `Extract fields from this product name: "${productName}"`

        const openai = getOpenAIClient()
        const completion = await openai.chat.completions.create({
            model: defaultModel,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt },
            ],
            response_format: { type: 'json_object' },
            temperature: 0.3,
        })

        const content = completion.choices[0]?.message?.content
        if (!content) {
            throw new Error('Empty AI response')
        }

        const parsed = JSON.parse(content)
        const validated = responseSchema.parse(parsed)

        return NextResponse.json(validated)
    } catch (error) {
        console.error('Medicine extractor API error:', error)
        return NextResponse.json(
            { error: 'Failed to extract fields' },
            { status: 500 }
        )
    }
}
