import { prisma } from '../lib/prisma'

async function main() {
  console.log('Seeding localized SEO blog topics for Shariatpur based on Search Trends...')

  // Insert a localized blog topic targeting top keywords
  const topic = await prisma.blogTopic.create({
    data: {
      title: 'শরীয়তপুরে ঘরে বসে অরিজিনাল ঔষধ এবং কসমেটিকস পাওয়ার উপায়',
      description: 'A local SEO guide for Shariatpur residents on how to order authentic medicine, cosmetics, and groceries online using Halalzi. Targeting keywords: Shariatpur online shopping, buy medicine online Shariatpur.',
      type: 'BEAUTY',
      block: 'BEAUTY',
    }
  })

  // Create the initial blog draft entry in TOPIC_ONLY state
  await prisma.blog.create({
    data: {
      topicId: topic.id,
      title: topic.title,
      type: topic.type,
      block: topic.block,
      status: 'TOPIC_ONLY',
      slug: 'shariatpur-online-shopping-medicine-cosmetics-' + Date.now(),
      internalLinkSlugs: [],
    },
  })

  console.log('Successfully created Shariatpur local SEO Blog Topic! The AI Blog Engine will automatically pick this up and generate a full article with internal product links.')
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
