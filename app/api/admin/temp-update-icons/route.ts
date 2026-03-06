import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
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

    const results = []
    for (const [slug, iconUrl] of Object.entries(iconMapping)) {
        try {
            const category = await prisma.category.findUnique({ where: { slug } })
            if (category) {
                await prisma.category.update({
                    where: { slug },
                    data: { sidebarIconUrl: iconUrl }
                })
                results.push(`Updated ${slug}`)
            } else {
                results.push(`Category ${slug} not found`)
            }
        } catch (err: any) {
            results.push(`Error updating ${slug}: ${err.message}`)
        }
    }

    return NextResponse.json({ results })
}
