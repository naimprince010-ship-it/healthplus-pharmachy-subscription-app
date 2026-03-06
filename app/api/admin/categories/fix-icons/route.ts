import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
    try {
        const session = await auth()

        if (!session || session.user?.role !== 'ADMIN') {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const iconMapping = {
            'womens-choice': '/images/category-icons/womens-choice.png',
            'sexual-wellness': '/images/category-icons/sexual-wellness.png',
            'cream-and-moisturizer': '/images/category-icons/cream-and-moisturizer.png',
            'personal-care': '/images/category-icons/personal-care.png',
            'skin-care': '/images/category-icons/skin-care.png',
            'diabetic-care': '/images/category-icons/diabetic-care.png',
            'devices': '/images/category-icons/devices.png',
            'hair-care': '/images/category-icons/hair-care.png',
            'baby-care': '/images/category-icons/baby-care.png'
        }

        let updatedCount = 0
        const results = []

        for (const [slug, iconUrl] of Object.entries(iconMapping)) {
            const category = await prisma.category.findUnique({ where: { slug } })
            if (category) {
                await prisma.category.update({
                    where: { slug },
                    data: {
                        sidebarIconUrl: iconUrl,
                        showInSidebar: true // Ensure they are shown in sidebar
                    }
                })
                updatedCount++
                results.push(`Updated ${slug}`)
            }
        }

        return NextResponse.json({
            success: true,
            message: `Successfully updated icons for ${updatedCount} categories.`,
            updatedCount
        })
    } catch (error: any) {
        console.error('Category icon fix error:', error)
        return NextResponse.json(
            { error: `Fix failed: ${error.message || 'Unknown error'}` },
            { status: 500 }
        )
    }
}
