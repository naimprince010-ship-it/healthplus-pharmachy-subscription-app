import { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { format } from 'date-fns'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { BlogStatus, BlogType } from '@prisma/client'
import { MDXRemote } from 'next-mdx-remote/rsc'

interface BlogDetailPageProps {
    params: { slug: string }
}

export async function generateMetadata({ params }: BlogDetailPageProps): Promise<Metadata> {
    const blog = await prisma.blog.findUnique({
        where: { slug: params.slug },
    })

    if (!blog) {
        return { title: 'Blog Not Found - Halalzi' }
    }

    return {
        title: `${blog.seoTitle || blog.title} - Halalzi`,
        description: blog.seoDescription || blog.summary || `Read ${blog.title} on Halalzi Blog.`,
        keywords: blog.seoKeywords || undefined,
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

export default async function BlogDetailPage({ params }: BlogDetailPageProps) {
    const blog = await prisma.blog.findUnique({
        where: {
            slug: params.slug,
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
                            imageUrl: true,
                            sellingPrice: true,
                            mrp: true,
                        }
                    }
                },
                orderBy: {
                    stepOrder: 'asc'
                }
            }
        },
    })

    if (!blog) {
        notFound()
    }

    // Calculate estimated reading time (approx 200 words per minute)
    const wordCount = blog.contentMd ? blog.contentMd.split(/\s+/).length : 0
    const readingTime = Math.max(1, Math.ceil(wordCount / 200))
    const displayDate = blog.publishedAt || blog.createdAt

    return (
        <div className="bg-slate-50 min-h-screen pb-20">
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

                    <div className="flex items-center justify-center text-sm text-slate-500 space-x-4">
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
                        <Image
                            src={blog.imageUrl}
                            alt={blog.title}
                            fill
                            className="object-cover"
                            priority
                            sizes="(max-width: 1024px) 100vw, 1024px"
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
                <div className="flex flex-col lg:flex-row gap-12">

                    {/* Markdown Content */}
                    <div className="flex-1 min-w-0 prose prose-lg prose-slate prose-headings:font-bold prose-headings:text-slate-900 prose-a:text-emerald-600 hover:prose-a:text-emerald-700 prose-img:rounded-xl">
                        {blog.contentMd ? (
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {blog.contentMd}
                            </ReactMarkdown>
                        ) : (
                            <p>Content is currently being written.</p>
                        )}
                    </div>

                    {/* Sidebar: Related Products */}
                    {blog.blogProducts.length > 0 && (
                        <aside className="lg:w-80 flex-shrink-0">
                            <div className="sticky top-24 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                                <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center">
                                    <svg className="w-5 h-5 mr-2 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                    </svg>
                                    Featured in this Article
                                </h3>

                                <div className="space-y-4">
                                    {blog.blogProducts.map((bp) => (
                                        <Link
                                            key={bp.id}
                                            href={`/products/${bp.product.slug}`}
                                            className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100 group"
                                        >
                                            <div className="relative w-16 h-16 rounded-lg bg-white border border-gray-100 overflow-hidden flex-shrink-0">
                                                {bp.product.imageUrl ? (
                                                    <Image
                                                        src={bp.product.imageUrl}
                                                        alt={bp.product.name}
                                                        fill
                                                        className="object-contain p-1"
                                                        sizes="64px"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full bg-gray-50 flex items-center justify-center text-gray-400">
                                                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                        </svg>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold text-slate-900 group-hover:text-emerald-600 transition-colors line-clamp-2 mb-1">
                                                    {bp.product.name}
                                                </p>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-bold text-teal-600">৳{bp.product.sellingPrice}</span>
                                                    {bp.product.mrp && bp.product.mrp > bp.product.sellingPrice && (
                                                        <span className="text-xs text-gray-400 line-through">৳{bp.product.mrp}</span>
                                                    )}
                                                </div>
                                                {bp.role && (
                                                    <span className="inline-block mt-1 text-[10px] uppercase font-bold tracking-wider text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                                                        {bp.role} {bp.stepOrder ? `(Step ${bp.stepOrder})` : ''}
                                                    </span>
                                                )}
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        </aside>
                    )}
                </div>
            </article>
        </div>
    )
}
