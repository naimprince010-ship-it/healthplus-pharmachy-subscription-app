import { prisma } from '../lib/prisma'

async function listAdmins() {
  try {
    console.log('[LIST] Fetching all ADMIN users from production database...')
    
    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        createdAt: true,
      },
    })
    
    console.log(`[FOUND] ${admins.length} admin user(s):`)
    admins.forEach((admin, index) => {
      console.log(`\n[${index + 1}] Admin:`)
      console.log(JSON.stringify(admin, null, 2))
    })
    
    await prisma.$disconnect()
  } catch (error) {
    console.error('[ERROR]', error)
    await prisma.$disconnect()
  }
}

listAdmins()
