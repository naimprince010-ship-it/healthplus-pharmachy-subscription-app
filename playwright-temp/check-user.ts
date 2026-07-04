import { prisma } from '../lib/prisma'

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: 'naimprince010@gmail.com' },
    select: { id: true, email: true, role: true, phone: true },
  })
  console.log(JSON.stringify(user))
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
