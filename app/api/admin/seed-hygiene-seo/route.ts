import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  // Simple auth check just to prevent random public hits if needed
  // For demo/admin seeding purposes, we'll allow it or you can protect it with auth logic

  try {
    // 1. Create the localized BlogTopic
    const topic = await prisma.blogTopic.create({
      data: {
        title: 'শরীয়তপুরে ঘরে বসে অরিজিনাল ঔষধ এবং স্যানিটারি ন্যাপকিন পাওয়ার উপায়',
        description: 'A local SEO guide for Shariatpur residents on how to order authentic Senora, Joya, Freedom sanitary napkins online with 100% discreet packaging using Halalzi.',
        type: 'BEAUTY',
        block: 'BEAUTY',
      }
    })

    // 2. Create the initial blog draft entry in TOPIC_ONLY state
    const blog = await prisma.blog.create({
      data: {
        topicId: topic.id,
        title: topic.title,
        type: topic.type,
        block: topic.block,
        status: 'TOPIC_ONLY',
        slug: 'shariatpur-online-shopping-sanitary-napkins-' + Date.now(),
        internalLinkSlugs: [],
      },
    })

    // 3. Ensure Women's Care category exists with proper SEO
    let category = await prisma.category.findFirst({
      where: {
        name: { contains: 'Women', mode: 'insensitive' }
      }
    })

    if (!category) {
      category = await prisma.category.create({
        data: {
          name: "Women's Care",
          slug: "womens-care",
          description: "Premium sanitary napkins and female hygiene products",
          seoTitle: "Women's Care & Hygiene Products - Halalzi",
          seoDescription: "Buy authentic sanitary napkins, Senora, Joya, Freedom online with 100% discreet home delivery.",
          seoKeywords: "sanitary napkin, senora pad, joya pad, women hygiene, discreet packaging"
        }
      })
    } else {
      // Update SEO if exists
      category = await prisma.category.update({
        where: { id: category.id },
        data: {
          seoKeywords: `${category.seoKeywords ? category.seoKeywords + ', ' : ''}sanitary napkin, senora pad, joya pad, discreet packaging`
        }
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Successfully seeded localized SEO hygiene blog topic and category.',
      blogTopicId: topic.id,
      blogId: blog.id,
      categoryName: category.name
    })

  } catch (error: any) {
    console.error('Seeding error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
