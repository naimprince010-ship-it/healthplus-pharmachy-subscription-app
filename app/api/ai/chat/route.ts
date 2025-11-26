import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getOpenAIClient, defaultModel, isOpenAIConfigured } from '@/lib/openai'
import { requireAdmin } from '@/lib/requireAdmin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const messageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string().min(1).max(10000),
})

const requestSchema = z.object({
  messages: z.array(messageSchema).min(1).max(50),
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

    const { messages } = validationResult.data

    const systemMessage = {
      role: 'system' as const,
      content: `You are an AI assistant for HealthPlus Pharmacy, an online pharmacy and cosmetics store in Bangladesh.

Business Context:
- We sell medicines, healthcare products, cosmetics, baby care items, and general wellness products
- We serve customers in Bangladesh, primarily in Shariatpur and surrounding areas
- We offer prescription services, subscriptions, and home delivery
- Our platform supports both English and Bangla (Bengali) languages

Your role:
- Help admin users with content creation, product descriptions, SEO optimization, and general business queries
- Provide helpful, accurate information about e-commerce, healthcare products, and digital marketing
- Be concise but thorough in your responses
- Use simple Bangla mixed with English when the user writes in Bangla
- Always maintain a professional and helpful tone

You can assist with:
- Generating product descriptions and marketing copy
- SEO optimization (titles, descriptions, keywords)
- Banner and promotional content
- Business strategy and e-commerce best practices
- Technical questions about the platform`,
    }

    const recentMessages = messages.slice(-15)
    const allMessages = [systemMessage, ...recentMessages]

    let completion
    try {
      const openai = getOpenAIClient()
      completion = await openai.chat.completions.create({
        model: defaultModel,
        messages: allMessages,
        temperature: 0.7,
        max_tokens: 500,
      })
    } catch (openaiError: any) {
      console.error('OpenAI API error:', openaiError)
      
      if (openaiError.status === 429) {
        return NextResponse.json(
          { error: 'Rate limit reached. Please try again in a moment.' },
          { status: 429 }
        )
      }
      
      return NextResponse.json(
        { error: 'AI chat failed. Please try again.' },
        { status: 500 }
      )
    }

    const reply = completion.choices[0]?.message?.content
    if (!reply) {
      return NextResponse.json(
        { error: 'AI returned empty response' },
        { status: 500 }
      )
    }

    return NextResponse.json({ reply })
  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
