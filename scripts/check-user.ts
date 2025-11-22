import { prisma } from '../lib/prisma'

async function checkUser() {
  try {
    const phone = '+8801681354066'
    console.log(`[CHECK] Looking for user with phone: ${phone}`)
    
    const user = await prisma.user.findUnique({
      where: { phone },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        createdAt: true,
      },
    })
    
    if (user) {
      console.log('[FOUND] User exists:')
      console.log(JSON.stringify(user, null, 2))
    } else {
      console.log('[NOT FOUND] User does not exist')
    }
    
    await prisma.$disconnect()
  } catch (error) {
    console.error('[ERROR]', error)
    await prisma.$disconnect()
  }
}

checkUser()
