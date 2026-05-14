import { prisma } from '../lib/prisma'

async function main() {
  console.log('Running DB Fix for SEO and Typos...')

  // Fix Hero Banner
  const banners = await prisma.banner.findMany({
    where: { title: { contains: 'Welcome to HealthPlus' } }
  })
  
  if (banners.length > 0) {
    for (const banner of banners) {
      await prisma.banner.update({
        where: { id: banner.id },
        data: { title: '১০০% আসল ঔষধ ও কসমেটিক্স - Halalzi' }
      })
      console.log(`Updated banner ID: ${banner.id}`)
    }
  } else {
    console.log('No "Welcome to HealthPlus" banners found.')
  }

  // Fix Typo in HomeSections
  const sections = await prisma.homeSection.findMany({
    where: { title: { contains: 'Baby CareNew Arrivel' } }
  })

  if (sections.length > 0) {
    for (const section of sections) {
      await prisma.homeSection.update({
        where: { id: section.id },
        data: { title: 'Baby Care New Arrival' }
      })
      console.log(`Updated HomeSection ID: ${section.id}`)
    }
  } else {
    console.log('No "Baby CareNew Arrivel" sections found.')
  }

  console.log('DB Fix completed.')
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
