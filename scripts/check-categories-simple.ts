import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkCategories() {
    const categories = await prisma.category.findMany({
        select: { id: true, name: true }
    })
    console.log('Categories in DB:', JSON.stringify(categories, null, 2))
}

checkCategories()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
