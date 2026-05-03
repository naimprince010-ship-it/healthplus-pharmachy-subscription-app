interface BlogSponsorBlockProps {
  variant: 'list' | 'sidebar'
  sponsorLabel: string
  headline: string | null
  imageUrl: string | null
  targetUrl: string
}

export function BlogSponsorBlock({
  variant,
  sponsorLabel,
  headline,
  imageUrl,
  targetUrl,
}: BlogSponsorBlockProps) {
  const body =
    imageUrl ? (
      <img
        src={imageUrl}
        alt={sponsorLabel}
        className={`w-full rounded-lg object-contain ${variant === 'list' ? 'max-h-[100px]' : 'max-h-[140px]'}`}
        referrerPolicy="no-referrer-when-downgrade"
        loading="lazy"
      />
    ) : headline ? (
      <p className="text-center text-sm font-medium leading-snug text-slate-800">{headline}</p>
    ) : (
      <p className="text-center text-sm text-slate-700">ওয়েবসাইট দেখুন</p>
    )

  const wrapClass =
    variant === 'list'
      ? 'mb-10 rounded-xl border border-amber-200/90 bg-gradient-to-r from-amber-50 via-white to-amber-50/40 p-4 shadow-sm md:p-5'
      : 'rounded-xl border border-amber-200/90 bg-gradient-to-br from-amber-50 to-white p-4 shadow-sm'

  return (
    <div className={wrapClass} role="complementary" aria-label="Sponsored advertisement">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="rounded-md bg-amber-200 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-950">
          স্পন্সর্ড
        </span>
        <span className="text-xs font-semibold uppercase tracking-wide text-amber-900/85">{sponsorLabel}</span>
      </div>
      <a
        href={targetUrl}
        target="_blank"
        rel="sponsored noopener noreferrer"
        className="block outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-amber-400"
      >
        {body}
      </a>
    </div>
  )
}
