'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export interface HeroBanner {
  id: string
  title: string
  subtitle?: string | null
  description?: string | null
  imageUrl: string
  imageDesktopUrl?: string | null
  ctaLabel?: string | null
  ctaUrl?: string | null
  bgColor?: string | null
  textColor?: string | null
  link?: string | null
}

interface HeroBannerSliderProps {
  banners: HeroBanner[]
  /** Auto-slide interval in ms (default 4500) */
  interval?: number
}

function getImageUrl(banner: HeroBanner): string {
  return banner.imageDesktopUrl || banner.imageUrl
}

function getCtaUrl(banner: HeroBanner): string | null {
  return banner.ctaUrl || banner.link || null
}

export function HeroBannerSlider({ banners, interval = 4500 }: HeroBannerSliderProps) {
  const [current, setCurrent] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const total = banners.length

  const goTo = useCallback(
    (index: number) => {
      if (isAnimating || index === current) return
      setIsAnimating(true)
      setCurrent((index + total) % total)
      setTimeout(() => setIsAnimating(false), 600)
    },
    [current, isAnimating, total]
  )

  const next = useCallback(() => goTo(current + 1), [current, goTo])
  const prev = useCallback(() => goTo(current - 1), [current, goTo])

  // Auto-play
  useEffect(() => {
    if (total <= 1 || isPaused) return
    timerRef.current = setTimeout(next, interval)
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [current, isPaused, next, interval, total])

  if (total === 0) return null

  const banner = banners[current]
  const imgUrl = getImageUrl(banner)
  const ctaUrl = getCtaUrl(banner)
  const hasImage = imgUrl && imgUrl !== ''

  return (
    <div
      className="relative w-full overflow-hidden rounded-2xl"
      style={{ minHeight: '340px' }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Slides */}
      <div className="relative w-full h-full" style={{ minHeight: '340px' }}>
        {banners.map((b, i) => {
          const bImg = getImageUrl(b)
          const bCta = getCtaUrl(b)
          const isActive = i === current
          return (
            <div
              key={b.id}
              aria-hidden={!isActive}
              className="absolute inset-0 transition-opacity duration-500"
              style={{
                opacity: isActive ? 1 : 0,
                zIndex: isActive ? 10 : 0,
                pointerEvents: isActive ? 'auto' : 'none',
              }}
            >
              {/* Background */}
              <div
                className="absolute inset-0"
                style={{
                  backgroundColor: b.bgColor || '#0d4a3a',
                }}
              >
                {bImg && (
                  <Image
                    src={bImg}
                    alt={b.title}
                    fill
                    sizes="(max-width: 1400px) 100vw, 1400px"
                    className="object-cover"
                    priority={i === 0}
                    draggable={false}
                  />
                )}
                {/* Overlay gradient */}
                <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-black/10" />
              </div>

              {/* Content */}
              <div
                className="relative z-10 flex h-full flex-col justify-center px-10 py-10"
                style={{ minHeight: '340px', color: b.textColor || '#ffffff' }}
              >
                <div style={{ maxWidth: '520px' }}>
                  {b.subtitle && (
                    <p className="mb-2 text-xs font-semibold uppercase tracking-widest opacity-80">
                      {b.subtitle}
                    </p>
                  )}
                  <h2
                    className="font-extrabold leading-tight"
                    style={{ fontSize: '2rem', lineHeight: 1.25 }}
                  >
                    {b.title}
                  </h2>
                  {b.description && (
                    <p className="mt-3 text-sm opacity-85 leading-relaxed max-w-sm">
                      {b.description}
                    </p>
                  )}
                  {bCta && b.ctaLabel && (
                    <Link
                      href={bCta}
                      className="mt-6 inline-flex items-center gap-2 rounded-xl bg-orange-500 px-6 py-3 text-sm font-bold text-white shadow-lg transition-all hover:-translate-y-0.5 hover:bg-orange-600 hover:shadow-xl"
                    >
                      {b.ctaLabel}
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Prev / Next arrows — only if > 1 banner */}
      {total > 1 && (
        <>
          <button
            onClick={prev}
            aria-label="Previous banner"
            className="absolute left-3 top-1/2 z-20 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-sm transition-all hover:bg-black/50 hover:scale-110"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={next}
            aria-label="Next banner"
            className="absolute right-3 top-1/2 z-20 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-sm transition-all hover:bg-black/50 hover:scale-110"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </>
      )}

      {/* Dot indicators */}
      {total > 1 && (
        <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2">
          {banners.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              aria-label={`Go to slide ${i + 1}`}
              className="transition-all duration-300"
              style={{
                width: i === current ? '24px' : '8px',
                height: '8px',
                borderRadius: '999px',
                backgroundColor: i === current ? '#ffffff' : 'rgba(255,255,255,0.45)',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
              }}
            />
          ))}
        </div>
      )}

      {/* Progress bar */}
      {total > 1 && !isPaused && (
        <div className="absolute bottom-0 left-0 right-0 z-20 h-0.5 bg-white/20">
          <div
            key={current}
            className="h-full bg-orange-400"
            style={{
              animation: `slider-progress ${interval}ms linear forwards`,
            }}
          />
          <style>{`
            @keyframes slider-progress {
              from { width: 0%; }
              to   { width: 100%; }
            }
          `}</style>
        </div>
      )}
    </div>
  )
}
