import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { Components } from 'react-markdown'

const markdownComponents: Components = {
  h1: ({ children }) => (
    <h2 className="mt-16 first:mt-0 scroll-mt-24 text-balance border-b border-slate-200 pb-3 text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
      {children}
    </h2>
  ),
  h2: ({ children }) => (
    <h2 className="mt-14 first:mt-2 scroll-mt-24 text-balance border-b border-slate-200 pb-2.5 text-xl font-bold text-slate-900 md:text-2xl">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="mt-10 first:mt-3 scroll-mt-24 text-xl font-semibold text-slate-900 md:text-[1.35rem]">{children}</h3>
  ),
  h4: ({ children }) => (
    <h4 className="mt-8 text-lg font-semibold text-slate-900">{children}</h4>
  ),
  p: ({ children }) => (
    <p className="mb-5 text-[1.0625rem] leading-[1.85] text-slate-700 last:mb-0">{children}</p>
  ),
  strong: ({ children }) => (
    <strong className="font-semibold text-slate-900">{children}</strong>
  ),
  em: ({ children }) => <em className="italic text-slate-800">{children}</em>,
  ul: ({ children }) => (
    <ul className="my-6 list-disc space-y-2.5 ps-6 text-[1.0625rem] leading-[1.75] text-slate-700 marker:text-teal-600">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="my-6 list-decimal space-y-2.5 ps-7 text-[1.0625rem] leading-[1.75] text-slate-700 marker:font-semibold marker:text-teal-700">
      {children}
    </ol>
  ),
  li: ({ children }) => <li className="ps-1 [&>p]:mb-2 [&>p:last-child]:mb-0">{children}</li>,
  blockquote: ({ children }) => (
    <blockquote className="my-8 border-l-4 border-teal-500 bg-teal-50/60 px-6 py-4 text-[1rem] italic leading-relaxed text-slate-800 rounded-r-lg">
      {children}
    </blockquote>
  ),
  hr: () => (
    <hr className="my-12 border-0 bg-gradient-to-r from-transparent via-slate-300 to-transparent h-px" />
  ),
  a: ({ children, href }) => (
    <a
      href={href ?? '#'}
      className="font-medium text-teal-600 underline underline-offset-4 decoration-teal-300 hover:text-teal-800 hover:decoration-teal-600 transition-colors"
      rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
      target={href?.startsWith('http') ? '_blank' : undefined}
    >
      {children}
    </a>
  ),
  img: ({ src, alt }) => (
    <span className="my-10 block rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-slate-50">
      {/* eslint-disable-next-line @next/next/no-img-element -- CMS markdown uses arbitrary image URLs */}
      <img src={src ?? ''} alt={alt ?? ''} className="w-full h-auto object-cover" loading="lazy" decoding="async" />
    </span>
  ),
  table: ({ children }) => (
    <div className="my-8 w-full overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full border-collapse text-left text-[0.95rem] text-slate-800">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-slate-100 text-xs font-semibold uppercase tracking-wide text-slate-600">{children}</thead>,
  tbody: ({ children }) => <tbody className="divide-y divide-slate-100">{children}</tbody>,
  tr: ({ children }) => <tr className="hover:bg-slate-50/80">{children}</tr>,
  th: ({ children }) => <th className="border-b border-slate-200 px-4 py-3">{children}</th>,
  td: ({ children }) => <td className="px-4 py-3 align-top">{children}</td>,
  code: ({ className, children, ...props }) => {
    const isFencedBlock = !!(className && className.includes('language-'))
    if (!isFencedBlock) {
      return (
        <code
          className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-[0.9em] font-medium text-teal-900"
          {...props}
        >
          {children}
        </code>
      )
    }
    return (
      <code className={`${className} block whitespace-pre-wrap break-words`} {...props}>
        {children}
      </code>
    )
  },
  pre: ({ children }) => (
    <pre className="my-8 overflow-x-auto rounded-xl border border-slate-800 bg-slate-900 p-5 text-[0.9rem] leading-relaxed text-slate-100 shadow-inner [&>code]:bg-transparent [&>code]:p-0 [&>code]:font-mono">
      {children}
    </pre>
  ),
}

export function BlogMarkdown({ content }: { content: string }) {
  return (
    <div className="blog-markdown-contents max-w-none">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
        {content}
      </ReactMarkdown>
    </div>
  )
}
