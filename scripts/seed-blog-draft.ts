import { config } from 'dotenv'
config({ path: '.env.local' })
import { prisma } from '../lib/prisma'
import { BlogStatus, BlogType, TopicBlock } from '@prisma/client'

async function main() {
  const title = 'রাত ১২টাতেও ইমার্জেন্সি ওষুধ? Halalzi এর ২৪ ঘণ্টা ডেলিভারি সার্ভিস!'
  const slug = '24-hour-emergency-medicine-delivery-dhaka'
  const summary = 'মাঝরাতে হঠাৎ জ্বর বা ইমার্জেন্সি ওষুধের প্রয়োজন? চিন্তার কোনো কারণ নেই! ঢাকার যেকোনো জায়গায় রাত ১২টাতেও দ্রুততম সময়ে আপনার দোরগোড়ায় ওষুধ পৌঁছে দেবে Halalzi।'
  
  const contentMd = `
মাঝরাতে হঠাৎ কেউ অসুস্থ হলে ফার্মেসি খোঁজার ঝামেলা পোহাতে হয় অনেককেই। বিশেষ করে ঢাকা শহরের মতো ব্যস্ত জায়গায় রাত ১২টার পর ফার্মেসি খোলা পাওয়া বেশ কষ্টকর। এই সমস্যার চিরস্থায়ী সমাধান নিয়ে এসেছে **Halalzi**!

## কেন Halalzi এর ইমার্জেন্সি সার্ভিস?
মাঝরাতে হঠাৎ জ্বর বা প্রেসারের ওষুধের প্রয়োজন হলে এখন আর আপনাকে রাস্তায় বের হতে হবে না। আমাদের রয়েছে একটি ডেডিকেটেড টিম যারা আপনার ইমার্জেন্সি মুহূর্তে দ্রুততম সময়ে ওষুধ পৌঁছে দিতে প্রস্তুত। 

## আমাদের সেবাসমূহ:
- **২৪ ঘণ্টা সার্ভিস:** দিন বা রাত, যেকোনো সময় ওষুধ অর্ডার করা যাবে।
- **দ্রুত ডেলিভারি:** ঢাকার যেকোনো জায়গায় আমরা সবচেয়ে দ্রুত ডেলিভারি দিচ্ছি।
- **সহজ অর্ডার প্রক্রিয়া:** মাত্র কয়েক ক্লিকে প্রেসক্রিপশন আপলোড করে ওষুধ অর্ডার করুন।

আপনার পরিবারের যেকোনো ইমার্জেন্সিতে Halalzi সবসময় আপনার পাশে। আজই আমাদের অ্যাপ বা ওয়েবসাইট থেকে অর্ডার করুন!
  `

  const existing = await prisma.blog.findUnique({ where: { slug } })
  if (existing) {
    console.log('Blog already exists! View it at: http://localhost:3000/blog/' + slug)
    return
  }

  const blog = await prisma.blog.create({
    data: {
      title,
      slug,
      summary,
      contentMd,
      status: BlogStatus.PUBLISHED,
      type: BlogType.GENERAL,
      block: TopicBlock.GENERAL,
      seoTitle: title,
      seoDescription: summary,
      seoKeywords: 'ইমার্জেন্সি ওষুধ ডেলিভারি ঢাকা, ২৪ ঘণ্টা ফার্মেসি, 24/7 medicine delivery dhaka, online pharmacy bd',
    }
  })

  console.log('Created blog:', blog.id)
  console.log('View it at: http://localhost:3000/blog/' + slug)
}

main().catch(console.error).finally(() => prisma.$disconnect())
