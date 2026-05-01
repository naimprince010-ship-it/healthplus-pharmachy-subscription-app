import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getOpenAIClient } from '@/lib/blog-engine/openaiClient'
import { uploadToSupabase } from '@/lib/supabase'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 300 // Image generation can take time

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const blog = await prisma.blog.findUnique({
      where: { id },
    })

    if (!blog) {
      return NextResponse.json({ error: 'Blog not found' }, { status: 404 })
    }

    if (!blog.title) {
      return NextResponse.json({ error: 'Blog must have a title to generate an image' }, { status: 400 })
    }

    // 1. Construct prompt for DALL-E 3
    // We want high quality, vibrant, editorial style images suitable for a blog cover.
    const prompt = `Create a professional, vibrant, and high-quality editorial blog cover image for a blog titled: "${blog.title}". 
The image should be visually appealing, modern, and without any text/typography. 
Context: ${blog.summary || blog.type + ' related content for a Bangladeshi e-commerce pharmacy/grocery platform.'}
Style: Photorealistic, bright lighting, premium aesthetic.`

    const openai = getOpenAIClient()

    // 2. Generate image
    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt: prompt,
      n: 1,
      size: '1024x1024',
      quality: 'standard', // or 'hd' but standard is usually enough and cheaper
      response_format: 'url',
    })

    const imageUrl = response?.data?.[0]?.url

    if (!imageUrl) {
      throw new Error('No image URL returned from OpenAI')
    }

    // 3. Download the image from OpenAI's temporary URL
    const imageResponse = await fetch(imageUrl)
    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch generated image: ${imageResponse.statusText}`)
    }

    const arrayBuffer = await imageResponse.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    
    // Create a File object-like structure for the uploadToSupabase function
    const file = new File([buffer], `blog-cover-${id}.png`, { type: 'image/png' })

    // 4. Upload to Supabase Storage
    // We use the existing 'uploadToSupabase' function which uses the medicine-images or banners bucket
    const uploadResult = await uploadToSupabase(file, 'blogs', id)

    // 5. Update Blog record with the permanent URL
    const updatedBlog = await prisma.blog.update({
      where: { id },
      data: {
        imageUrl: uploadResult.url,
      },
    })

    return NextResponse.json({
      success: true,
      imageUrl: updatedBlog.imageUrl,
      message: 'Image generated and saved successfully',
    })

  } catch (error) {
    console.error('Blog image generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate image', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
