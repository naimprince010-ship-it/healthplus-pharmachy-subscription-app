import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import OpenAI from 'openai'
import { prisma } from '@/lib/prisma'
import { BlogType, ProductType, TopicBlock } from '@prisma/client'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured')
  }
  return new OpenAI({ apiKey })
}

function getTypeKeywords(type: BlogType): string[] {
  switch (type) {
    case 'BEAUTY':
      return [
        'beauty',
        'skincare',
        'skin',
        'cleanser',
        'toner',
        'serum',
        'moisturizer',
        'sunscreen',
        'face wash',
      ]
    case 'GROCERY':
      return ['grocery', 'rice', 'oil', 'dal', 'flour', 'spice', 'snack', 'beverage', 'food']
    case 'RECIPE':
      return ['recipe', 'ingredient', 'cooking', 'rice', 'oil', 'spice', 'vegetable', 'meat', 'fish']
    case 'MONEY_SAVING':
      return ['budget', 'offer', 'combo', 'save', 'family', 'value', 'discount']
    default:
      return []
  }
}

function scoreProductForTopicGeneration(
  type: BlogType,
  block: TopicBlock,
  p: { name: string; aiTags: string[]; category: { name: string } | null; isIngredient: boolean }
): number {
  const keywords = getTypeKeywords(type)
  const hay = `${p.name} ${p.category?.name || ''} ${(p.aiTags || []).join(' ')}`.toLowerCase()
  let score = 0

  if (keywords.some((k) => hay.includes(k))) score += 8
  if (block === 'BEAUTY' && ['beauty', 'skin', 'cosmetic', 'skincare'].some((k) => hay.includes(k))) score += 4
  if (block === 'GROCERY' && ['grocery', 'food', 'ingredient', 'cooking'].some((k) => hay.includes(k))) score += 4
  if (type === 'RECIPE' && p.isIngredient) score += 6
  if (p.aiTags.length > 0) score += 1

  return score
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
        type: ProductType.GENERAL,
        OR: [
          { aiTags: { isEmpty: false } },
          { isIngredient: true },
        ],
      },
      select: {
        id: true,
        name: true,
        aiTags: true,
        isIngredient: true,
        category: { select: { name: true } },
      },
      take: 300,
    })

    const typedProducts = products
      .map((p) => ({ p, score: scoreProductForTopicGeneration(type as BlogType, block as TopicBlock, p) }))
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((x) => x.p)
      .slice(0, 60)

    const existingTopics = await prisma.blogTopic.findMany({
      where: { block, type },
      select: { title: true },
      take: 50,
    })

    const existingTitles = existingTopics.map(t => t.title)

    const productContext = typedProducts.length > 0
      ? `Use these catalog-backed products/categories as grounding: ${typedProducts
          .slice(0, 35)
          .map((p) => `${p.name} (${p.category?.name || 'General'})`)
          .join(', ')}`
      : 'Focus on general topics for a Bangladeshi e-commerce store selling groceries and beauty products.'

    const existingContext = existingTitles.length > 0
      ? `Avoid these existing topics: ${existingTitles.slice(0, 20).join(', ')}`
      : ''

    const typeDescriptions: Record<string, string> = {
      BEAUTY:
        'বিউটি/স্কিনকেয়ার — রুটিন, টিপস, ত্বকের ধরন, ফেসওয়াশ·সিরাম·সানস্ক্রিন ইত্যাদি রিলেটেড টপিক',
      GROCERY:
        'গ্রোসারি — কেনাকাটা গাইড, তুলনা, সংরক্ষণ, ব্র্যান্ড টিপস, বাংলাদেশি রান্নাবান্নার উপযোগী পণ্য',
      RECIPE:
        'রেসিপি ও রান্না — উপলব্ধ উপকরণ, মील প্ল্যান, সহজ বাংলা রান্না, স্বাস্থ্যকর বিকল্প',
      MONEY_SAVING:
        'টাকা বাঁচানো ও স্মার্ট শপিং — অফার ও বাজেট, বাল্ক কেনা, মেয়াদ/প্যাক সাইজ, পরিবার খরচ',
    }

    const typeFocus = typeDescriptions[type] || typeDescriptions.GROCERY

    const prompt = `You plan blog topics for Halalzi.com — pharmacy, grocery, cosmetics e-commerce for Bangladesh (${block} site section).

Generate exactly ${count} unique blog TOPIC suggestions.

Content angle (BlogType=${type}) — explain topics in this vein:
${typeFocus}

LANGUAGE (mandatory): Write BOTH "title" and "description" in **Bangla (Bengali)** using natural, readable Bengali prose. Occasional English product/category words are OK when shoppers search that way (e.g. Serum, SPF, cleanser names).

SEO: Titles should be clear and clickable for Bangla search; avoid stuffing.

${productContext}

${existingContext}

Rules:
1. Topics must resonate with shoppers in Bangladesh (climate, festivals, habits)
2. Each topic specific enough for an 800+ word article later
3. Mix evergreen + seasonal/festival angles where natural
4. Do not duplicate or closely echo the "avoid" list titles
5. Ground topics in the available catalog context above (avoid topics that likely need unavailable product classes)

Respond with ONLY valid JSON in this shape (no markdown fences):
{"topics":[{"title":"...Bangla title...","description":"...Bangla 1-2 sentences..."}]}

Exactly ${count} items in "topics".`

    const openai = getOpenAIClient()

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content:
            'You are a Bangladesh-focused content strategist. Reply with ONLY valid JSON matching the user schema (object with key "topics" = array of {title, description}). Title and description must be in Bengali (Bangla). No markdown fences.',
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
      productGroundingCount: typedProducts.length,
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
