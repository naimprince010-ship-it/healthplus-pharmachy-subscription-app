/**
 * One-off: create a new published blog post (Bangla-friendly copy for Halalzi).
 *
 * Usage (env must include DATABASE_URL):
 *   npx tsx scripts/publish-sample-blog.ts
 */
import { prisma } from '../lib/prisma'
import { BlogStatus, BlogType, TopicBlock } from '@prisma/client'

async function main() {
  const day = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const slug = `halalzi-smart-grocery-and-beauty-tips-${day}`

  const title = 'Halalzi টিপস: গ্রোসারি ও কসমেটিক্সে স্মার্ট শপিং'
  const summary =
    'ফেস্টিভেল বা ডেইলি—দুই ক্ষেত্রেই খরচ ও সময় বাঁচাতে কীভাবে কেনাকাটা পরিকল্পনা করবেন।'

  const contentMd = `
## এই পোস্টে কী পাবেন

- বাসায় তারিখ খেয়াল রেখে লিস্ট করে কেনাকাটা করা
- ফ্ল্যাশ ও ক্যাম্পেইনেও যাচাই করে নেওয়া
- কসমেটিক্স কেনার সময় ব্র্যান্ড ও ইনগ্রিডিয়েন্ট চোখে রাখা

## ১) আগে লিস্ট, পরে অর্ডার

অপ্রয়োজনীয় আইটেম কমাতে **কী শেষ হয়েছে** আর **কী এক সপ্তাহের জন্য দরকার**—দুটো আলাদা করে লিখে নিন। এতে আবার কেনার চাপ কমে।

## ২) মেয়াদ ও প্যাক সাইজ

তেল, চাল, ডিটারজেন্ট—এসবে বড় প্যাক অনেক সময় ইউনিট প্রাইজে সুবিধা দেয়, কিন্তু মেয়াদ শেষ হওয়ার আগে শেষ করতে পারবেন কি না সেটা হিসাব করুন।

## ৩) কসমেটিক্স: স্কিন টাইপ মানে

নতুন প্রোডাক্ট ট্রাই করার আগে ছোট সাইজ বা একবার টেস্ট করে নিলে অপচয় কমে। ত্বকের ধরন ও আবহাওয়া মিলিয়ে পছন্দ করুন।

---

*Halalzi থেকে—কসমেটিক্স ও গ্রোসারি এক জায়গায়।*
`.trim()

  const blog = await prisma.blog.upsert({
    where: { slug },
    create: {
      slug,
      type: BlogType.GROCERY,
      block: TopicBlock.GROCERY,
      title,
      summary,
      contentMd,
      status: BlogStatus.PUBLISHED,
      publishedAt: new Date(),
      seoTitle: `${title} | Halalzi`,
      seoDescription: summary,
      seoKeywords: 'halalzi, grocery, cosmetics, online shopping, bangladesh',
      internalLinkSlugs: [],
    },
    update: {
      title,
      summary,
      contentMd,
      status: BlogStatus.PUBLISHED,
      publishedAt: new Date(),
      seoTitle: `${title} | Halalzi`,
      seoDescription: summary,
      seoKeywords: 'halalzi, grocery, cosmetics, online shopping, bangladesh',
    },
  })

  console.log(JSON.stringify({ ok: true, slug: blog.slug, url: `/blog/${blog.slug}` }, null, 2))
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
