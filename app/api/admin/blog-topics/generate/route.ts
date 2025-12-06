import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import OpenAI from 'openai'
import prisma from '@/lib/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured')
  }
  return new OpenAI({ apiKey })
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { block, type, count = 5 } = body

    if (!block || !type) {
      return NextResponse.json(
        { error: 'Block and type are required' },
        { status: 400 }
      )
    }

    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        OR: [
          { aiTags: { isEmpty: false } },
          { isIngredient: true },
        ],
      },
      select: {
        name: true,
        aiTags: true,
        category: { select: { name: true } },
      },
      take: 100,
    })

    const existingTopics = await prisma.blogTopic.findMany({
      where: { block, type },
      select: { title: true },
      take: 50,
    })

    const existingTitles = existingTopics.map(t => t.title)

    const productContext = products.length > 0
      ? `Available products include: ${products.slice(0, 30).map(p => `${p.name} (${p.category?.name || 'General'})`).join(', ')}`
      : 'Focus on general topics for a Bangladeshi e-commerce store selling groceries and beauty products.'

    const existingContext = existingTitles.length > 0
      ? `Avoid these existing topics: ${existingTitles.slice(0, 20).join(', ')}`
      : ''

    const typeDescriptions: Record<string, string> = {
      BEAUTY: 'skincare routines, beauty tips, product recommendations for skin types',
      GROCERY: 'grocery buying guides, product comparisons, storage tips',
      RECIPE: 'recipes using available ingredients, cooking tips, meal planning',
      MONEY_SAVING: 'budget shopping tips, bulk buying guides, price comparisons',
    }

    const prompt = `You are a content strategist for Halalzi.com, a Bangladeshi e-commerce store.

Generate ${count} unique blog topic ideas for the ${type} category in the ${block} block.

Topic type focus: ${typeDescriptions[type] || 'general content'}

${productContext}

${existingContext}

Requirements:
1. Topics should be relevant to Bangladeshi consumers
2. Topics should be SEO-friendly and searchable
3. Each topic should be specific enough to write a detailed blog post
4. Mix evergreen content with seasonal/trending topics
5. Consider local preferences and cultural context

Return a JSON array with exactly ${count} objects, each having:
- "title": A compelling blog title (in English, 50-80 characters)
- "description": A brief description of what the blog will cover (in English, 100-150 characters)

Return ONLY the JSON array, no other text.`

    const openai = getOpenAIClient()

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful content strategist. Always respond with valid JSON arrays only.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.8,
      max_tokens: 2000,
      response_format: { type: 'json_object' },
    })

    const responseText = completion.choices[0]?.message?.content || ''
    
    let topics: { title: string; description: string }[] = []
    
    try {
      const parsed = JSON.parse(responseText)
      if (Array.isArray(parsed)) {
        topics = parsed
      } else if (parsed.topics && Array.isArray(parsed.topics)) {
        topics = parsed.topics
      } else {
        const arrayMatch = responseText.match(/\[[\s\S]*\]/)
        if (arrayMatch) {
          topics = JSON.parse(arrayMatch[0])
        }
      }
    } catch {
      const arrayMatch = responseText.match(/\[[\s\S]*\]/)
      if (arrayMatch) {
        try {
          topics = JSON.parse(arrayMatch[0])
        } catch {
          return NextResponse.json(
            { error: 'Failed to parse AI response' },
            { status: 500 }
          )
        }
      }
    }

    if (!Array.isArray(topics) || topics.length === 0) {
      return NextResponse.json(
        { error: 'No topics generated' },
        { status: 500 }
      )
    }

    const validTopics = topics
      .filter(t => t.title && typeof t.title === 'string')
      .map(t => ({
        title: t.title.trim(),
        description: (t.description || '').trim(),
      }))

    return NextResponse.json({
      success: true,
      topics: validTopics,
      count: validTopics.length,
    })
  } catch (error) {
    console.error('Error generating topics:', error)
    
    if (error instanceof Error && error.message.includes('OPENAI_API_KEY')) {
      return NextResponse.json(
        { error: 'OpenAI API key is not configured. Please add OPENAI_API_KEY to your environment variables.' },
        { status: 500 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to generate topics', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
