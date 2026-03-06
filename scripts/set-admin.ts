import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    const adminEmail = 'naimprince010@gmail.com'
    const adminPassword = 'Naim18005'
    const adminPhone = '+8801938264923' // Dummy phone for the unique constraint if not exists
    const adminName = 'Naim Prince'

    const hashedPassword = await hash(adminPassword, 10)

    // Check if user already exists by email
    const existingUser = await prisma.user.findUnique({
        where: { email: adminEmail }
    })

    if (existingUser) {
        console.log(`Updating existing user: ${adminEmail}`)
        await prisma.user.update({
            where: { email: adminEmail },
            data: {
                password: hashedPassword,
                role: 'ADMIN',
            }
        })
    } else {
        console.log(`Creating new admin user: ${adminEmail}`)
        await prisma.user.create({
            data: {
                email: adminEmail,
                phone: adminPhone,
                name: adminName,
                password: hashedPassword,
                role: 'ADMIN',
            }
        })
    }

    console.log('✅ Admin user setup complete!')
}

main()
    .catch((e) => {
        console.error('❌ Error:', e)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
