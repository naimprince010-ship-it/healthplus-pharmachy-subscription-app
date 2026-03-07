import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const item = await prisma.product.findUnique({
        where: { slug: 'utramal-retard-50-50mg-tablet' },
        include: { category: true, medicine: true }
    })
    console.log(JSON.stringify(item, null, 2))
}

main().finally(() => prisma.$disconnect())
