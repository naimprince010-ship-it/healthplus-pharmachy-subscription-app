import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const item = await prisma.product.findFirst({
        where: { slug: 'utramal-retard-50-50mg-tablet' },
        include: { medicine: true }
    })
    console.log(JSON.stringify(item, null, 2))
}

main().finally(() => prisma.$disconnect())
