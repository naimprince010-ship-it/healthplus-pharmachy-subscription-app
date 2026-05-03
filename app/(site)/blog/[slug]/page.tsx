import { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { BlogSponsorPlacement, BlogStatus, BlogType } from '@prisma/client'
import { BlogSponsorBlock } from '@/components/blog/BlogSponsorBlock'
import { getActiveBlogSponsorAd } from '@/lib/blog-sponsor-ads'
import { BlogMarkdown } from '@/components/blog/BlogMarkdown'
import { linkProductMentionsInMarkdown } from '@/lib/blog-engine/linkProductMentionsInMarkdown'
import { serializeJsonLd } from '@/lib/serialize-json-ld'

interface BlogDetailPageProps {
    params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: BlogDetailPageProps): Promise<Metadata> {
    try {
        const { slug } = await params;
        const blog = await prisma.blog.findUnique({
            where: { slug },
        })

        if (!blog) {
            return { title: 'Blog Not Found - Halalzi' }
        }

        const seoTitle = blog.seoTitle || blog.title
        const seoDesc = blog.seoDescription || blog.summary || `Read ${blog.title} on Halalzi Blog.`
        const canonicalUrl = `https://halalzi.com/blog/${slug}`
        const ogImage = blog.imageUrl || 'https://halalzi.com/images/default-product.png'

        return {
            title: `${seoTitle} | Halalzi Blog`,
            description: seoDesc,
            keywords: blog.seoKeywords || undefined,
            alternates: { canonical: canonicalUrl },
            openGraph: {
                title: seoTitle,
                description: seoDesc,
                url: canonicalUrl,
                siteName: 'Halalzi',
                type: 'article',
                publishedTime: blog.publishedAt?.toISOString(),
                modifiedTime: blog.updatedAt?.toISOString(),
                images: [{ url: ogImage, width: 1200, height: 630, alt: seoTitle }],
            },
            twitter: {
                card: 'summary_large_image',
                title: seoTitle,
                description: seoDesc,
                images: [ogImage],
            },
        }
    } catch (error) {
        console.error('Blog generateMetadata error:', error)
        return { title: 'Halalzi Blog' }
    }
}

export const revalidate = 60 // Revalidate every minute

const typeColors: Record<BlogType, string> = {
    BEAUTY: 'bg-pink-100 text-pink-800',
    GROCERY: 'bg-green-100 text-green-800',
    RECIPE: 'bg-orange-100 text-orange-800',
    MONEY_SAVING: 'bg-blue-100 text-blue-800',
}

const typeLabels: Record<BlogType, string> = {
    BEAUTY: 'Beauty & Care',
    GROCERY: 'Grocery',
    RECIPE: 'Recipe',
    MONEY_SAVING: 'Money Saving',
}

function removeLeadingMarkdownTitle(contentMd: string): string {
    // Page header already renders title; remove duplicated first markdown H1 from AI content.
    return contentMd.replace(/^\s*#\s+.+\n+/, '').trimStart()
}

async function getPublishedBlogBySlug(slug: string) {
    return prisma.blog.findUnique({
        where: {
            slug,
            status: BlogStatus.PUBLISHED, // Ensure only published blogs can be viewed
        },
        include: {
            topic: true,
            blogProducts: {
                include: {
                    product: {
                        select: {
                            id: true,
                            name: true,
                            slug: true,
                            type: true,
                            imageUrl: true,
                            sellingPrice: true,
                            mrp: true,
                        },
                    },
                },
                orderBy: {
                    stepOrder: 'asc',
                },
            },
        },
    })
}

export default async function BlogDetailPage({ params }: BlogDetailPageProps) {
    let blog: Awaited<ReturnType<typeof getPublishedBlogBySlug>> | null = null
    try {
        const { slug } = await params;
        blog = await getPublishedBlogBySlug(slug)
    } catch (error) {
        console.error('BlogDetailPage error:', error)
        return (
            <div className="bg-slate-50 min-h-screen pb-20">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
                    <h1 className="text-2xl font-bold text-slate-900 mb-2">Blog is temporarily unavailable</h1>
                    <p className="text-slate-600">Please try again in a few minutes.</p>
                </div>
            </div>
        )
    }

    if (!blog) {
        notFound()
    }

    const sidebarSponsor =
        await getActiveBlogSponsorAd(BlogSponsorPlacement.BLOG_ARTICLE_SIDEBAR_TOP).catch(() => null)
    const featuredGeneralProducts = blog.blogProducts.filter(
        (bp) => bp.product && bp.product.type === 'GENERAL'
    )
    const showBlogSidebar = sidebarSponsor != null || featuredGeneralProducts.length > 0

    // Fetch related blogs for internal linking
    let relatedBlogs: any[] = []
    try {
        if (blog.internalLinkSlugs && blog.internalLinkSlugs.length > 0) {
            relatedBlogs = await prisma.blog.findMany({
                where: {
                    slug: { in: blog.internalLinkSlugs },
                    status: BlogStatus.PUBLISHED,
                },
                select: {
                    id: true,
                    title: true,
                    slug: true,
                    imageUrl: true,
                    createdAt: true,
                    publishedAt: true,
                },
                take: 3,
            })
        }
        if (relatedBlogs.length < 3) {
            const fallbackRelated = await prisma.blog.findMany({
                where: {
                    type: blog.type,
                    status: BlogStatus.PUBLISHED,
                    NOT: { id: blog.id },
                },
                select: {
                    id: true,
                    title: true,
                    slug: true,
                    imageUrl: true,
                    createdAt: true,
                    publishedAt: true,
                },
                take: 3 - relatedBlogs.length,
            })
            relatedBlogs = [...relatedBlogs, ...fallbackRelated]
        }
    } catch (err) {
        console.error('Failed to fetch related blogs:', err)
    }

    // Calculate estimated reading time (approx 200 words per minute)
    const productsForInlineLinks = blog.blogProducts.flatMap((bp) => {
      const p = bp.product
      if (!p?.name?.trim() || !p.slug?.trim()) return []
      return [{ name: p.name, slug: p.slug }]
    })

    let blogMarkdownBody = ''
    if (blog.contentMd) {
      const trimmed = removeLeadingMarkdownTitle(blog.contentMd)
      blogMarkdownBody = linkProductMentionsInMarkdown(trimmed, productsForInlineLinks)
    }

    const wordCount = blog.contentMd ? blog.contentMd.split(/\s+/).length : 0
    const readingTime = Math.max(1, Math.ceil(wordCount / 200))
    const displayDate = blog.publishedAt || blog.createdAt
    const canonicalUrl = `https://halalzi.com/blog/${blog.slug}`
    const ogImage = blog.imageUrl || 'https://halalzi.com/images/default-product.png'

    // Article JSON-LD for Google rich results
    const articleJsonLd = {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: blog.title,
        description: blog.summary || blog.seoDescription || blog.title,
        image: ogImage,
        url: canonicalUrl,
        datePublished: displayDate.toISOString(),
        dateModified: (blog.updatedAt || displayDate).toISOString(),
        inLanguage: 'bn-BD',
        author: {
            '@type': 'Organization',
            name: 'Halalzi Expert Team',
            url: 'https://halalzi.com',
        },
        publisher: {
            '@type': 'Organization',
            name: 'Halalzi',
            url: 'https://halalzi.com',
            logo: {
                '@type': 'ImageObject',
                url: 'https://halalzi.com/images/default-product.png',
            },
        },
        mainEntityOfPage: {
            '@type': 'WebPage',
            '@id': canonicalUrl,
        },
        wordCount: wordCount,
        timeRequired: `PT${readingTime}M`,
    }

    const breadcrumbJsonLd = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://halalzi.com' },
            { '@type': 'ListItem', position: 2, name: 'Blog', item: 'https://halalzi.com/blog' },
            { '@type': 'ListItem', position: 3, name: blog.title, item: canonicalUrl },
        ],
    }

    return (
        <div className="bg-slate-50 min-h-screen pb-20">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(articleJsonLd) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(breadcrumbJsonLd) }} />
            {blog.faqJsonLd && (
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html:
                            typeof blog.faqJsonLd === 'string'
                                ? blog.faqJsonLd.replace(/</g, '\\u003c')
                                : serializeJsonLd(blog.faqJsonLd)
                    }}
                />
            )}
            
            {/* Blog Article */}
            <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {/* Header Section */}
                <header className="mb-10 text-center">
                    <Link href="/blog" className="inline-flex items-center text-sm font-medium text-emerald-600 hover:text-emerald-700 mb-6">
                        <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Back to Blog
                    </Link>

                    <div className="flex items-center justify-center space-x-3 mb-6 flex-wrap gap-2">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${typeColors[blog.type]}`}>
                            {typeLabels[blog.type]}
                        </span>
                        {blog.topic && (
                            <span className="text-gray-500 text-sm">• {blog.topic.title}</span>
                        )}
                    </div>

                    <h1 className="text-3xl md:text-5xl font-extrabold text-slate-900 mb-6 leading-tight">
                        {blog.title}
                    </h1>

                    <div className="flex items-center justify-center text-sm text-slate-500 space-x-4 mb-2 flex-wrap gap-2">
                        <div className="flex items-center">
                            <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            <span>By Halalzi Expert Team</span>
                        </div>
                        <div className="flex items-center">
                            <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <time dateTime={displayDate.toISOString()}>
                                {format(displayDate, 'MMMM d, yyyy')}
                            </time>
                        </div>
                        <div className="flex items-center">
                            <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>{readingTime} min read</span>
                        </div>
                    </div>
                </header>

                {/* Featured Image */}
                {blog.imageUrl && (
                    <div className="relative aspect-[21/9] w-full mb-12 rounded-2xl overflow-hidden shadow-md">
                        <img
                            src={blog.imageUrl}
                            alt={blog.title}
                            className="w-full h-full object-cover"
                        />
                    </div>
                )}

                {/* Summary (Optional) */}
                {blog.summary && (
                    <div className="bg-emerald-50 border-l-4 border-emerald-500 p-6 rounded-r-xl mb-10 text-emerald-900 font-medium text-lg leading-relaxed italic">
                        {blog.summary}
                    </div>
                )}

                {/* Main Content Area */}
                <div className="flex flex-col lg:flex-row gap-12 mb-16">

                    {/* Markdown Content — typography from BlogMarkdown (headings, lists, spacing) */}
                    <div className="flex-1 min-w-0 rounded-2xl border border-slate-200/80 bg-white px-5 py-10 shadow-sm sm:px-10 sm:py-12">
                        {blog.contentMd ? (
                            <BlogMarkdown content={blogMarkdownBody} />
                        ) : (
                            <p className="text-slate-600 text-lg">Content is currently being written.</p>
                        )}
                    </div>

                    {/* Sidebar: sponsored placement + featured products */}
                    {showBlogSidebar && (
                        <aside className="lg:w-80 shrink-0">
                            <div className="sticky top-24 space-y-6">
                                {sidebarSponsor && (
                                    <BlogSponsorBlock
                                        variant="sidebar"
                                        sponsorLabel={sidebarSponsor.sponsorLabel}
                                        headline={sidebarSponsor.headline}
                                        imageUrl={sidebarSponsor.imageUrl}
                                        targetUrl={sidebarSponsor.targetUrl}
                                    />
                                )}
                                {featuredGeneralProducts.length > 0 ? (
                                    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                                        <h3 className="mb-6 flex items-center text-lg font-bold text-slate-900">
                                            <svg className="mr-2 h-5 w-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                            </svg>
                                            Featured in this Article
                                        </h3>

                                        <div className="space-y-4">
                                            {featuredGeneralProducts.map((bp) => (
                                                <Link
                                                    key={bp.id}
                                                    href={`/products/${bp.product.slug}`}
                                                    className="group flex items-center gap-4 rounded-xl border border-transparent p-3 transition-colors hover:border-slate-100 hover:bg-slate-50"
                                                >
                                                    <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border border-gray-100 bg-white">
                                                        {bp.product.imageUrl ? (
                                                            <img
                                                                src={bp.product.imageUrl}
                                                                alt={bp.product.name}
                                                                className="h-full w-full object-contain p-1"
                                                            />
                                                        ) : (
                                                            <div className="flex h-full w-full items-center justify-center bg-gray-50 text-gray-400">
                                                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                                </svg>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="min-w-0 flex-1">
                                                        <p className="mb-1 line-clamp-2 text-sm font-semibold text-slate-900 transition-colors group-hover:text-emerald-600">
                                                            {bp.product.name}
                                                        </p>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-sm font-bold text-teal-600">৳{bp.product.sellingPrice}</span>
                                                            {bp.product.mrp && bp.product.mrp > bp.product.sellingPrice && (
                                                                <span className="text-xs text-gray-400 line-through">৳{bp.product.mrp}</span>
                                                            )}
                                                        </div>
                                                        {bp.role && (
                                                            <span className="mt-1 inline-block rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                                                {bp.role} {bp.stepOrder ? `(Step ${bp.stepOrder})` : ''}
                                                            </span>
                                                        )}
                                                    </div>
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                ) : null}
                            </div>
                        </aside>
                    )}
                </div>

                {/* Related Blogs / Internal Linking Section */}
                {relatedBlogs.length > 0 && (
                    <div className="border-t border-slate-200/80 pt-12">
                        <h3 className="text-2xl font-bold text-slate-900 mb-8 flex items-center">
                            <svg className="w-6 h-6 mr-2 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.246.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5s3.246.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                            Related Articles
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {relatedBlogs.map((rBlog) => (
                                <Link
                                    key={rBlog.id}
                                    href={`/blog/${rBlog.slug}`}
                                    className="group bg-white rounded-2xl overflow-hidden border border-slate-200/80 shadow-sm hover:shadow-md transition-all flex flex-col h-full"
                                >
                                    <div className="relative aspect-[16/9] bg-slate-100 overflow-hidden">
                                        {rBlog.imageUrl ? (
                                            <img
                                                src={rBlog.imageUrl}
                                                alt={rBlog.title}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-slate-400">
                                                <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-5 flex-1 flex flex-col justify-between">
                                        <h4 className="text-base font-bold text-slate-900 group-hover:text-emerald-600 transition-colors line-clamp-2 mb-3">
                                            {rBlog.title}
                                        </h4>
                                        <time className="text-xs text-slate-500 block">
                                            {format(rBlog.publishedAt || rBlog.createdAt, 'MMMM d, yyyy')}
                                        </time>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
            </article>
        </div>
    )
}
