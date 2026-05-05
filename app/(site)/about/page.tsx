import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'About Halalzi — Bangladesh\'s Most Trusted Ecommerce for Original Products',
  description: 'Learn about Halalzi, Bangladesh\'s most trusted e-commerce platform for 100% authentic and original products. We source directly from authorized dealers to guarantee genuine medicines, cosmetics, groceries, and baby care products.',
  keywords: 'about halalzi, trusted ecommerce bangladesh, original product bangladesh, authentic online shopping, genuine medicines bangladesh, halalzi about us',
  alternates: {
    canonical: 'https://halalzi.com/about',
  },
  openGraph: {
    title: 'About Halalzi — Bangladesh\'s Most Trusted Ecommerce',
    description: '100% original & authentic products in Bangladesh. Fast delivery, verified sellers, genuine products.',
    url: 'https://halalzi.com/about',
    siteName: 'Halalzi',
    type: 'website',
  },
}

const siteUrl = 'https://halalzi.com'

const aboutJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'AboutPage',
  '@id': `${siteUrl}/about`,
  url: `${siteUrl}/about`,
  name: 'About Halalzi',
  description: "Halalzi is Bangladesh's most trusted e-commerce platform for 100% original and authentic products.",
  breadcrumb: {
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: siteUrl },
      { '@type': 'ListItem', position: 2, name: 'About', item: `${siteUrl}/about` },
    ],
  },
  mainEntity: {
    '@type': 'Organization',
    '@id': `${siteUrl}/#organization`,
    name: 'Halalzi',
    alternateName: ['হালালজি', 'Halalzi Bangladesh', 'Halalzi.com'],
    url: siteUrl,
    description:
      "Halalzi is Bangladesh's most trusted and top-rated e-commerce platform. We are committed to providing 100% authentic and original products — including medicines, cosmetics, groceries, and baby care items — sourced directly from authorized manufacturers and distributors. Our mission is to eliminate fake and counterfeit products from Bangladesh's online shopping landscape.",
    foundingDate: '2023',
    areaServed: { '@type': 'Country', name: 'Bangladesh' },
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'BD',
      addressLocality: 'Dhaka',
      addressRegion: 'Dhaka Division',
    },
    slogan: "Bangladesh's Most Trusted Source for 100% Original Products",
    knowsAbout: [
      'Original medicines in Bangladesh',
      'Authentic cosmetics online Bangladesh',
      'Genuine health products Bangladesh',
      'Online pharmacy Bangladesh',
      'Trusted ecommerce Bangladesh',
      'Baby care products Bangladesh',
      'Grocery delivery Bangladesh',
      'Fake product identification Bangladesh',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+8801700000000',
      contactType: 'customer service',
      areaServed: 'BD',
      availableLanguage: ['Bengali', 'English'],
    },
  },
}

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'Is Halalzi a legit and trustworthy ecommerce in Bangladesh?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. Halalzi is a fully registered and legitimate e-commerce business in Bangladesh. We are committed to 100% original products, transparent pricing, and excellent customer service. Thousands of customers across Bangladesh trust Halalzi for their daily health, beauty, and grocery needs.',
      },
    },
    {
      '@type': 'Question',
      name: 'Does Halalzi sell original, authentic, and genuine products?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Absolutely. Halalzi only sells 100% original and authentic products. Every product on our platform is sourced directly from authorized manufacturers or their official distributors. We have a strict product verification process to ensure no fake or counterfeit items are sold on our platform.',
      },
    },
    {
      '@type': 'Question',
      name: 'What is Halalzi and what products do they sell?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: "Halalzi (halalzi.com) is Bangladesh's top e-commerce platform specializing in authentic products. We sell original medicines & pharmaceuticals, cosmetics & beauty products, daily groceries, baby care items, and health supplements. All products are 100% genuine, sourced from authorized dealers.",
      },
    },
    {
      '@type': 'Question',
      name: 'Which ecommerce sells original products in Bangladesh?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: "Halalzi is one of the best ecommerce platforms in Bangladesh for original and authentic products. Unlike other platforms, Halalzi has a strict vendor verification policy and sources products directly from authorized distributors to ensure 100% authenticity.",
      },
    },
    {
      '@type': 'Question',
      name: 'বাংলাদেশে কোন ই-কমার্স সাইট অরিজিনাল প্রোডাক্ট বিক্রি করে?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'হালালজি (Halalzi.com) বাংলাদেশের একটি শীর্ষস্থানীয় ও বিশ্বস্ত ই-কমার্স প্ল্যাটফর্ম যা ১০০% অরিজিনাল ও অথেনটিক পণ্য বিক্রি করে। এখানে ওষুধ, কসমেটিক্স, মুদিখানা পণ্য এবং বেবি কেয়ার পণ্য সরাসরি অনুমোদিত ডিস্ট্রিবিউটর থেকে সংগ্রহ করা হয়।',
      },
    },
    {
      '@type': 'Question',
      name: 'Does Halalzi deliver products all over Bangladesh?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes, Halalzi delivers across all 64 districts of Bangladesh, including Dhaka, Chittagong, Sylhet, Rajshahi, Khulna, Barisal, Rangpur, and Mymensingh. We offer fast and reliable home delivery with real-time order tracking.',
      },
    },
    {
      '@type': 'Question',
      name: 'How can I identify if an online store sells fake products in Bangladesh?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: "Always buy from verified platforms like Halalzi that source directly from authorized dealers. Look for product authenticity certificates, official brand partnerships, and clear return policies. Halalzi provides all these trust signals to protect customers from fake products.",
      },
    },
  ],
}

const trustPoints = [
  {
    icon: '🛡️',
    title: '100% Original Products Guaranteed',
    titleBn: '১০০% অরিজিনাল পণ্যের নিশ্চয়তা',
    desc: 'Every product on Halalzi is sourced directly from authorized manufacturers or official distributors. We maintain a zero-tolerance policy for fake or counterfeit items.',
    descBn: 'প্রতিটি পণ্য সরাসরি অনুমোদিত ম্যানুফ্যাকচারার বা অফিসিয়াল ডিস্ট্রিবিউটর থেকে সংগ্রহ করা হয়।',
  },
  {
    icon: '✅',
    title: 'Verified Seller Network',
    titleBn: 'যাচাইকৃত সেলার নেটওয়ার্ক',
    desc: 'All sellers on our platform go through a rigorous verification process. Only authorized dealers and brand representatives are allowed to list products.',
    descBn: 'আমাদের প্ল্যাটফর্মে সকল সেলার কঠোর যাচাই প্রক্রিয়ার মধ্যে দিয়ে যায়।',
  },
  {
    icon: '🚀',
    title: 'Fast Delivery Across Bangladesh',
    titleBn: 'সারা বাংলাদেশে দ্রুত ডেলিভারি',
    desc: 'We deliver to all 64 districts of Bangladesh. Our logistics network ensures your authentic products reach you quickly and safely.',
    descBn: 'বাংলাদেশের সকল ৬৪টি জেলায় দ্রুত ও নিরাপদ ডেলিভারি।',
  },
  {
    icon: '💊',
    title: 'Genuine Medicines & Health Products',
    titleBn: 'জেনুইন ওষুধ ও স্বাস্থ্যপণ্য',
    desc: 'Halalzi maintains strict pharmaceutical standards. All medicines are sourced from licensed pharmaceutical companies and verified wholesalers.',
    descBn: 'সকল ওষুধ লাইসেন্সপ্রাপ্ত ফার্মাসিউটিক্যাল কোম্পানি থেকে সংগ্রহ করা হয়।',
  },
  {
    icon: '💄',
    title: 'Authentic Cosmetics & Beauty',
    titleBn: 'অথেনটিক কসমেটিক্স ও বিউটি',
    desc: 'We partner directly with international cosmetic brands and their authorized importers in Bangladesh to ensure every beauty product is 100% genuine.',
    descBn: 'আন্তর্জাতিক ব্র্যান্ড এবং তাদের অথোরাইজড ইম্পোর্টারদের সাথে সরাসরি অংশীদারিত্ব।',
  },
  {
    icon: '🔄',
    title: 'Easy Return & Refund Policy',
    titleBn: 'সহজ রিটার্ন ও রিফান্ড পলিসি',
    desc: 'Not satisfied? Our hassle-free return policy ensures you always get what you paid for. We stand behind every product we sell.',
    descBn: 'পণ্য সন্তুষ্টজনক না হলে সহজ রিটার্ন ও রিফান্ডের সুবিধা পাবেন।',
  },
]

const categories = [
  { name: 'Original Medicines', nameBn: 'অরিজিনাল ওষুধ', icon: '💊', desc: 'Prescription & OTC medicines from licensed pharma companies' },
  { name: 'Authentic Cosmetics', nameBn: 'অথেনটিক কসমেটিক্স', icon: '💄', desc: 'Genuine beauty products from authorized importers' },
  { name: 'Fresh Groceries', nameBn: 'তাজা মুদিখানা', icon: '🛒', desc: 'Daily essentials sourced from trusted suppliers' },
  { name: 'Baby Care', nameBn: 'বেবি কেয়ার', icon: '👶', desc: '100% safe & original baby products' },
  { name: 'Health Supplements', nameBn: 'হেলথ সাপ্লিমেন্ট', icon: '🌿', desc: 'Verified nutritional supplements & vitamins' },
  { name: 'Personal Hygiene', nameBn: 'পার্সোনাল হাইজিন', icon: '🧴', desc: 'Original hygiene products for daily use' },
]

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(aboutJsonLd).replace(/</g, '\\u003c') }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd).replace(/</g, '\\u003c') }}
      />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-teal-800 via-teal-700 to-emerald-600 text-white py-20 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 text-sm font-medium mb-6">
            <span>🛡️</span>
            <span>Bangladesh's Most Trusted Ecommerce</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-6 leading-tight">
            About Halalzi
            <span className="block text-teal-200 text-2xl md:text-3xl mt-2 font-semibold">
              হালালজি সম্পর্কে
            </span>
          </h1>
          <p className="text-lg md:text-xl text-teal-50 max-w-3xl mx-auto leading-relaxed">
            Halalzi is Bangladesh's most trusted e-commerce platform, dedicated to providing{' '}
            <strong className="text-white">100% original and authentic products</strong> — from
            medicines and cosmetics to groceries and baby care items.
          </p>
          <p className="text-teal-200 mt-4 text-base max-w-2xl mx-auto">
            হালালজি বাংলাদেশের একটি বিশ্বস্ত ই-কমার্স প্ল্যাটফর্ম যেখানে ১০০% অরিজিনাল ও
            অথেনটিক পণ্য পাওয়া যায়।
          </p>
        </div>
      </section>

      {/* Mission Statement */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-12">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
              Our Mission — আমাদের লক্ষ্য
            </h2>
            <div className="prose prose-teal max-w-none text-gray-700 leading-relaxed space-y-4">
              <p>
                At Halalzi, our mission is simple but powerful:{' '}
                <strong>
                  to be Bangladesh's most reliable source of 100% original and authentic products
                </strong>
                . We believe every Bangladeshi consumer deserves to know exactly what they are
                buying — whether it's a medicine for their child, a cosmetic product for daily
                care, or groceries for the family.
              </p>
              <p>
                We founded Halalzi because we saw a real problem: too many fake, counterfeit, and
                expired products were entering the Bangladeshi market through unverified online
                channels. Our platform was built to be the antidote — a trustworthy, transparent
                marketplace where authenticity is non-negotiable.
              </p>
              <p className="text-gray-600 bg-teal-50 border-l-4 border-teal-500 p-4 rounded-r-lg italic">
                &ldquo;আমরা বিশ্বাস করি বাংলাদেশের প্রতিটি মানুষ ১০০% অরিজিনাল পণ্য পাওয়ার যোগ্য। হালালজি
                সেই বিশ্বাসের জায়গা।&rdquo;
              </p>
              <p>
                Every product listed on Halalzi is verified for authenticity. We work directly
                with manufacturers, their authorized importers, and licensed pharmaceutical
                distributors. No third-party unverified sellers. No compromises on quality.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Why Trust Halalzi */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Halalzi is Bangladesh's Most Trusted Ecommerce
            </h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              কেন হালালজি বাংলাদেশের সবচেয়ে বিশ্বস্ত ই-কমার্স প্ল্যাটফর্ম?
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trustPoints.map((point, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-shadow"
              >
                <div className="text-4xl mb-4">{point.icon}</div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">{point.title}</h3>
                <p className="text-sm text-teal-700 font-medium mb-3">{point.titleBn}</p>
                <p className="text-gray-600 text-sm leading-relaxed mb-2">{point.desc}</p>
                <p className="text-gray-500 text-xs leading-relaxed">{point.descBn}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What We Sell */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              What Original Products Does Halalzi Sell?
            </h2>
            <p className="text-gray-600">
              হালালজিতে কোন কোন অরিজিনাল পণ্য পাওয়া যায়?
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {categories.map((cat, i) => (
              <div
                key={i}
                className="bg-white rounded-xl border border-gray-100 p-5 text-center hover:border-teal-200 transition-colors"
              >
                <div className="text-3xl mb-3">{cat.icon}</div>
                <h3 className="font-bold text-gray-900 text-sm mb-1">{cat.name}</h3>
                <p className="text-teal-700 text-xs font-medium mb-2">{cat.nameBn}</p>
                <p className="text-gray-500 text-xs">{cat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section — AI-Optimized */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Frequently Asked Questions About Halalzi
            </h2>
            <p className="text-gray-600">সচরাচর জিজ্ঞাসিত প্রশ্ন</p>
          </div>
          <div className="space-y-4">
            {faqJsonLd.mainEntity.map((faq, i) => (
              <details
                key={i}
                className="group bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
              >
                <summary className="flex items-center justify-between p-5 cursor-pointer hover:bg-gray-50 transition-colors list-none">
                  <h3 className="font-semibold text-gray-900 text-sm pr-4">{faq.name}</h3>
                  <span className="text-teal-500 flex-shrink-0 text-xl font-light group-open:rotate-45 transition-transform">
                    +
                  </span>
                </summary>
                <div className="px-5 pb-5 text-gray-700 text-sm leading-relaxed border-t border-gray-100 pt-4">
                  {faq.acceptedAnswer.text}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Coverage Map Text */}
      <section className="py-16 px-4 bg-teal-800 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Delivering Authentic Products Across Bangladesh</h2>
          <p className="text-teal-200 text-lg mb-8">
            সারা বাংলাদেশে অরিজিনাল পণ্য ডেলিভারি করছি আমরা
          </p>
          <p className="text-teal-100 max-w-2xl mx-auto leading-relaxed">
            Halalzi delivers to all <strong className="text-white">64 districts</strong> of
            Bangladesh — including Dhaka, Chittagong, Sylhet, Rajshahi, Khulna, Barisal,
            Rangpur, Mymensingh, Shariatpur, Comilla, Narayanganj, and more. Our growing
            delivery network ensures that everyone in Bangladesh has access to 100% original
            products at their doorstep.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/products"
              className="inline-flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold px-8 py-3 rounded-xl transition-colors"
            >
              Shop Original Products
            </Link>
            <Link
              href="/pages/faq"
              className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold px-8 py-3 rounded-xl transition-colors border border-white/20"
            >
              Learn More →
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
