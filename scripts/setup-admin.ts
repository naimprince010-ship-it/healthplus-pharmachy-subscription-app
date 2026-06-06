import { hash } from 'bcryptjs'
import { prisma } from '@/lib/prisma'

function requireEnv(name: string): string {
  const value = process.env[name]?.trim()
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

async function main() {
  const adminEmail = requireEnv('ADMIN_SETUP_EMAIL')
  const adminPassword = requireEnv('ADMIN_SETUP_PASSWORD')
  const adminPhone = requireEnv('ADMIN_SETUP_PHONE')
  const adminName = process.env.ADMIN_SETUP_NAME?.trim() || 'Admin'

  const hashedPassword = await hash(adminPassword, 10)

  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [{ email: adminEmail }, { phone: adminPhone }],
    },
    select: { id: true },
  })

  if (existingUser) {
    await prisma.user.update({
      where: { id: existingUser.id },
      data: {
        role: 'ADMIN',
        password: hashedPassword,
        email: adminEmail,
        phone: adminPhone,
        name: adminName,
      },
    })
    console.log(`Updated admin account: ${adminEmail}`)
  } else {
    await prisma.user.create({
      data: {
        role: 'ADMIN',
        password: hashedPassword,
        email: adminEmail,
        phone: adminPhone,
        name: adminName,
      },
    })
    console.log(`Created admin account: ${adminEmail}`)
  }
}

main()
  .catch((error) => {
    console.error('Failed to set up admin account:', error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
