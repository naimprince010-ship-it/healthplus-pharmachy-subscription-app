import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
async function main() {
    const cats = await prisma.category.findMany({
        select: { id: true, name: true, isMedicineCategory: true }
    })
    console.log(JSON.stringify(cats, null, 2))
}
main().finally(() => prisma.$disconnect())
