import { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import { BlogSponsorPlacement, BlogStatus, BlogType } from '@prisma/client'
import { BlogCard } from '@/components/blog/BlogCard'
import { BlogSponsorBlock } from '@/components/blog/BlogSponsorBlock'
import { getActiveBlogSponsorAd } from '@/lib/blog-sponsor-ads'
import Link from 'next/link'
import { serializeJsonLd } from '@/lib/serialize-json-ld'

export const metadata: Metadata = {
    title: 'Health & Beauty Blog — Tips, Recipes & Wellness | Halalzi',
    description: 'বাংলাদেশের সেরা হেলথ ব্লগ। স্বাস্থ্য, সৌন্দর্য, রেসিপি ও স্মার্ট শপিং টিপস পড়ুন বিশেষজ্ঞদের কাছ থেকে। Halalzi Blog — আপনার সুস্বাস্থ্যের গাইড।',
    keywords: ['health blog bangladesh', 'beauty tips bangla', 'স্বাস্থ্য টিপস', 'সৌন্দর্য চর্চা', 'হালালজি ব্লগ', 'medicine tips bangladesh', 'grocery tips bangla'],
    alternates: {
        canonical: 'https://halalzi.com/blog',
    },
    openGraph: {
        title: 'Halalzi Blog — স্বাস্থ্য, সৌন্দর্য ও রেসিপি',
        description: 'বাংলাদেশের সেরা হেলথ ও বিউটি ব্লগ। বিশেষজ্ঞদের পরামর্শ, রেসিপি ও স্মার্ট শপিং টিপস পড়ুন।',
        url: 'https://halalzi.com/blog',
        siteName: 'Halalzi',
        type: 'website',
        images: [{ url: 'https://halalzi.com/images/default-product.png', width: 1200, height: 630 }],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Halalzi Blog — স্বাস্থ্য, সৌন্দর্য ও রেসিপি',
        description: 'বাংলাদেশের সেরা হেলথ ব্লগ। স্বাস্থ্য, সৌন্দর্য, রেসিপি ও স্মার্ট শপিং টিপস।',
    },
}

export const revalidate = 60 // Revalidate every minute

interface BlogPageProps {
    searchParams: { [key: string]: string | string[] | undefined }
}

export default async function BlogPage({ searchParams }: BlogPageProps) {
    const typeFilter = typeof searchParams.type === 'string' ? searchParams.type as BlogType : undefined

    const [blogs, listSponsor] = await Promise.all([
        prisma.blog.findMany({
            where: {
                status: BlogStatus.PUBLISHED, // Only show published blogs
                ...(typeFilter ? { type: typeFilter } : {}),
            },
            include: {
                topic: {
                    select: { title: true }
                }
            },
            orderBy: {
                publishedAt: 'desc',
            },
        }),
        getActiveBlogSponsorAd(BlogSponsorPlacement.BLOG_LIST_TOP),
    ])

    const types: { value: BlogType | 'ALL'; label: string }[] = [
        { value: 'ALL', label: 'All Articles' },
        { value: 'BEAUTY', label: 'Beauty & Care' },
        { value: 'GROCERY', label: 'Grocery' },
        { value: 'RECIPE', label: 'Recipe' },
        { value: 'MONEY_SAVING', label: 'Money Saving' },
    ]

    const websiteJsonLd = {
        '@context': 'https://schema.org',
        '@type': 'Blog',
        name: 'Halalzi Blog',
        description: 'বাংলাদেশের সেরা হেলথ ও বিউটি ব্লগ — স্বাস্থ্য, সৌন্দর্য, রেসিপি ও স্মার্ট শপিং টিপস',
        url: 'https://halalzi.com/blog',
        publisher: {
            '@type': 'Organization',
            name: 'Halalzi',
            url: 'https://halalzi.com',
            logo: {
                '@type': 'ImageObject',
                url: 'https://halalzi.com/images/default-product.png',
            },
        },
        inLanguage: 'bn-BD',
    }

    return (
        <div className="bg-slate-50 min-h-screen pb-20">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: serializeJsonLd(websiteJsonLd) }}
            />
            {/* Header Banner */}
            <div className="bg-emerald-800 text-white py-16 px-4">
                <div className="max-w-7xl mx-auto text-center">
                    <h1 className="text-4xl md:text-5xl font-bold mb-4">Halalzi Blog</h1>
                    <p className="text-emerald-100 text-lg max-w-2xl mx-auto">
                        Discover articles on health, wellness, beauty, and smart shopping delivered straight from our experts.
                    </p>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8">

                {/* Category Filter */}
                <div className="bg-white rounded-xl shadow-sm p-4 mb-8 flex flex-wrap gap-2 justify-center sticky top-20 z-10 border border-emerald-100">
                    {types.map((type) => {
                        const isActive = typeFilter ? type.value === typeFilter : type.value === 'ALL'
                        const href = type.value === 'ALL' ? '/blog' : `/blog?type=${type.value}`

                        return (
                            <Link
                                key={type.value}
                                href={href}
                                className={`px-5 py-2 rounded-full text-sm font-medium transition-colors ${isActive
                                        ? 'bg-emerald-600 text-white shadow-md'
                                        : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                                    }`}
                            >
                                {type.label}
                            </Link>
                        )
                    })}
                </div>

                {listSponsor && (
                    <BlogSponsorBlock
                        variant="list"
                        sponsorLabel={listSponsor.sponsorLabel}
                        headline={listSponsor.headline}
                        imageUrl={listSponsor.imageUrl}
                        targetUrl={listSponsor.targetUrl}
                    />
                )}

                {/* Blog Grid */}
                {blogs.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {blogs.map((blog) => (
                            <BlogCard key={blog.id} blog={blog} />
                        ))}
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm mt-8">
                        <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9.5a2.5 2.5 0 00-2.5-2.5H14" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">No articles found</h3>
                        <p className="text-gray-500 max-w-md mx-auto">
                            We couldn't find any published articles {typeFilter ? 'in this category' : ''} at the moment. Please check back later!
                        </p>
                        {typeFilter && (
                            <Link href="/blog" className="mt-6 inline-block text-emerald-600 font-medium hover:text-emerald-700">
                                View all articles
                            </Link>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
