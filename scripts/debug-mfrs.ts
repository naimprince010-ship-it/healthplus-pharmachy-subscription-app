
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const mfrs = await prisma.manufacturer.findMany({
        where: {
            OR: [
                { name: { contains: 'ACME', mode: 'insensitive' } },
                { name: { contains: 'ACI', mode: 'insensitive' } },
                { name: { contains: 'SQUARE', mode: 'insensitive' } }
            ]
        },
        select: {
            id: true,
            name: true,
            slug: true,
            aliasList: true
        }
    })

    console.log('--- FOUND MANUFACTURERS ---')
    console.log(JSON.stringify(mfrs, null, 2))
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect()
    })
