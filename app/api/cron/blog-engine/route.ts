import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { TopicBlock, BlogStatus } from '@prisma/client'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 300

const CRON_SECRET = process.env.BLOG_ENGINE_SECRET || process.env.CRON_SECRET

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const cronSecret = authHeader?.replace('Bearer ', '')

    if (!CRON_SECRET || cronSecret !== CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const dryRun = request.nextUrl.searchParams.get('dryRun') === 'true'
    const forceBlock = request.nextUrl.searchParams.get('block') as TopicBlock | null

    const today = new Date()
    const dayOfWeek = today.getDay()
    const block = forceBlock || (dayOfWeek % 2 === 0 ? 'BEAUTY' : 'GROCERY')

    const sixtyDaysAgo = new Date()
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60)

    const availableTopics = await prisma.blogTopic.findMany({
      where: {
        block: block as TopicBlock,
        isActive: true,
        OR: [
          { lastUsedAt: null },
          { lastUsedAt: { lt: sixtyDaysAgo } },
        ],
      },
      orderBy: [
        { timesUsed: 'asc' },
        { lastUsedAt: 'asc' },
      ],
      take: 10,
    })

    if (availableTopics.length === 0) {
      return NextResponse.json({
        success: false,
        message: `No available topics for ${block} block (all used within 60 days)`,
        block,
        dryRun,
      })
    }

    const selectedTopic = availableTopics[Math.floor(Math.random() * Math.min(3, availableTopics.length))]

    if (dryRun) {
      return NextResponse.json({
        success: true,
        dryRun: true,
        block,
        selectedTopic: {
          id: selectedTopic.id,
          title: selectedTopic.title,
          type: selectedTopic.type,
          lastUsedAt: selectedTopic.lastUsedAt,
          timesUsed: selectedTopic.timesUsed,
        },
        availableTopicsCount: availableTopics.length,
        message: 'Dry run - no changes made',
      })
    }

    const slug = generateSlug(selectedTopic.title)

    const existingBlog = await prisma.blog.findUnique({
      where: { slug },
    })

    if (existingBlog) {
      return NextResponse.json({
        success: false,
        message: `Blog with slug "${slug}" already exists`,
        block,
        selectedTopic: selectedTopic.title,
      })
    }

    const blog = await prisma.blog.create({
      data: {
        slug,
        type: selectedTopic.type,
        block: selectedTopic.block,
        title: selectedTopic.title,
        status: BlogStatus.TOPIC_ONLY,
        topicId: selectedTopic.id,
        scheduledAt: new Date(),
      },
    })

    await prisma.blogTopic.update({
      where: { id: selectedTopic.id },
      data: {
        lastUsedAt: new Date(),
        timesUsed: { increment: 1 },
      },
    })

    return NextResponse.json({
      success: true,
      block,
      blog: {
        id: blog.id,
        slug: blog.slug,
        title: blog.title,
        type: blog.type,
        status: blog.status,
      },
      message: `Created blog entry for topic: ${selectedTopic.title}`,
      nextStep: 'AI content generation pending',
    })
  } catch (error) {
    console.error('Blog engine cron error:', error)
    return NextResponse.json(
      { error: 'Blog engine cron failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const cronSecret = authHeader?.replace('Bearer ', '')

    if (!CRON_SECRET || cronSecret !== CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { blogId, action } = body

    if (action === 'generate') {
      const blog = await prisma.blog.findUnique({
        where: { id: blogId },
        include: { topic: true },
      })

      if (!blog) {
        return NextResponse.json({ error: 'Blog not found' }, { status: 404 })
      }

      if (blog.status !== BlogStatus.TOPIC_ONLY) {
        return NextResponse.json({
          error: 'Blog already has content or is not in TOPIC_ONLY status',
          currentStatus: blog.status,
        }, { status: 400 })
      }

      // Initialize Gemini API
      const { GoogleGenAI } = await import('@google/genai')
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })

      const prompt = `
        You are an expert copywriter for "Halalzi", a premium pharmacy and health/grocery e-commerce platform in Bangladesh.
        Write a highly engaging, SEO-optimized blog post in complete Markdown format.

        Topic Context:
        - Title Idea: "${blog.title}"
        - Category/Type: "${blog.type}"
        - Block: "${blog.block}"

        Instructions:
        1. Write a catchy, SEO-friendly H1 title at the very beginning (you can improve the raw title idea).
        2. Write a comprehensive, well-structured article (at least 600 words). Use H2 and H3 tags for readability.
        3. Include practical tips, advice, and facts.
        4. The tone should be helpful, authoritative, friendly, and trustworthy.
        5. At the end of the markdown content, provide exactly 3-4 specific product keywords or generic names (e.g., "Paracetamol", "Face Wash", "Basmati Rice") that naturally relate to this article. 
        
        CRITICAL FORMAT REQUIREMENT:
        You must return ONLY a JSON object with this exact structure (no markdown code blocks, no other text):
        {
          "title": "Improved Catchy Blog Title",
          "summary": "A 2-sentence engaging summary for the blog card.",
          "contentMd": "# The Full Markdown Content Here...",
          "suggestedProductKeywords": ["keyword1", "keyword2", "keyword3"]
        }
      `

      let aiResponse
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: {
            responseMimeType: "application/json",
          }
        })
        aiResponse = JSON.parse(response.text || '{}')
      } catch (e) {
        console.error('Gemini API Error:', e)
        return NextResponse.json({ error: 'Failed to generate content from AI' }, { status: 500 })
      }

      if (!aiResponse || !aiResponse.contentMd) {
        return NextResponse.json({ error: 'AI returned malformed response' }, { status: 500 })
      }

      // Find matching products
      const matchedProducts: any[] = []
      if (Array.isArray(aiResponse.suggestedProductKeywords)) {
        for (const keyword of aiResponse.suggestedProductKeywords) {
          const products = await prisma.product.findMany({
            where: {
              isActive: true,
              inStock: true,
              deletedAt: null,
              OR: [
                { name: { contains: keyword, mode: 'insensitive' } },
                { description: { contains: keyword, mode: 'insensitive' } },
                { aiTags: { has: keyword.toLowerCase() } }
              ]
            },
            take: 1
          })
          if (products.length > 0) {
            matchedProducts.push(products[0])
          }
        }
      }

      // Update the blog with content and link products
      const updatedBlog = await prisma.$transaction(async (tx) => {
        const blg = await tx.blog.update({
          where: { id: blogId },
          data: {
            title: aiResponse.title || blog.title,
            summary: aiResponse.summary,
            contentMd: aiResponse.contentMd,
            status: BlogStatus.PUBLISHED,
            publishedAt: new Date(),
          }
        })

        // Link products
        for (let i = 0; i < matchedProducts.length; i++) {
          await tx.blogProduct.create({
            data: {
              blogId: blg.id,
              productId: matchedProducts[i].id,
              role: 'recommended',
              stepOrder: i + 1
            }
          })
        }
        return blg
      })

      return NextResponse.json({
        success: true,
        message: 'Blog generated and published successfully',
        blog: {
          id: updatedBlog.id,
          title: updatedBlog.title,
          status: updatedBlog.status,
        },
        productsMatched: matchedProducts.length
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Blog engine POST error:', error)
    return NextResponse.json(
      { error: 'Request failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

function generateSlug(title: string): string {
  const date = new Date()
  const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

  const slug = title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
    .substring(0, 50)

  return `${slug}-${dateStr}`
}
