import Link from 'next/link'
import Image from 'next/image'
import { format } from 'date-fns'
import { BlogType } from '@prisma/client'

interface BlogCardProps {
    blog: {
        title: string
        slug: string
        summary: string | null
        type: BlogType
        imageUrl: string | null
        publishedAt: Date | null
        createdAt: Date
        topic: { title: string } | null
    }
}

const typeColors: Record<BlogType, string> = {
    BEAUTY: 'bg-pink-100 text-pink-800',
    GROCERY: 'bg-green-100 text-green-800',
    RECIPE: 'bg-orange-100 text-orange-800',
    MONEY_SAVING: 'bg-blue-100 text-blue-800',
    GENERAL: 'bg-slate-100 text-slate-800',
}

const typeLabels: Record<BlogType, string> = {
    BEAUTY: 'Beauty & Care',
    GROCERY: 'Grocery',
    RECIPE: 'Recipe',
    MONEY_SAVING: 'Money Saving',
    GENERAL: 'General',
}

export function BlogCard({ blog }: BlogCardProps) {
    const displayDate = blog.publishedAt || blog.createdAt

    return (
        <article className="flex flex-col bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden group h-full">
            <Link href={`/blog/${blog.slug}`} className="block relative aspect-[16/9] w-full overflow-hidden bg-gray-100">
                {blog.imageUrl ? (
                    <Image
                        src={blog.imageUrl}
                        alt={blog.title}
                        fill
                        unoptimized
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-emerald-800/20">
                        <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                    </div>
                )}
                <div className="absolute top-4 left-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${typeColors[blog.type]}`}>
                        {typeLabels[blog.type]}
                    </span>
                </div>
            </Link>

            <div className="flex flex-col flex-grow p-5">
                <div className="flex items-center text-xs text-slate-500 mb-3 space-x-2">
                    <time dateTime={displayDate.toISOString()}>
                        {format(displayDate, 'MMM d, yyyy')}
                    </time>
                    {blog.topic && (
                        <>
                            <span>•</span>
                            <span className="truncate max-w-[120px]">{blog.topic.title}</span>
                        </>
                    )}
                </div>

                <Link href={`/blog/${blog.slug}`} className="block group-hover:text-emerald-700 transition-colors">
                    <h3 className="text-xl font-bold text-slate-900 mb-2 line-clamp-2">
                        {blog.title}
                    </h3>
                </Link>

                <p className="text-slate-600 text-sm line-clamp-3 mb-4 flex-grow text-justify">
                    {blog.summary || 'Click to read more about this topic...'}
                </p>

                <div className="mt-auto pt-4 border-t border-gray-50 flex items-center text-emerald-600 font-medium text-sm group-hover:text-emerald-700">
                    Read Article
                    <svg className="w-4 h-4 ml-1.5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                </div>
            </div>
        </article>
    )
}
