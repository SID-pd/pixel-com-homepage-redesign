'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { ArrowRight, ChevronLeft, ChevronRight, Sparkles, Star } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface FavoriteItem {
  id: string
  subheading: string
  titlePrefix: string
  highlightText: string
  titleSuffix: string
  highlightColor: string
  textColor?: string
  description: string
  productTitle: string
  price: string
  originalPrice: string
  rating: number
  reviewsCount: number
  bgImage: string
  thumbImage: string
  href: string
  badge: string
}

const FAVORITES: FavoriteItem[] = [
  {
    id: 'hardcover-photobook',
    subheading: 'CUSTOMER FAVOURITES',
    titlePrefix: 'Warm, Personal & ',
    highlightText: 'Made to keep forever',
    titleSuffix: '.',
    highlightColor: '#FFC5C5', // Rose pastel
    textColor: '#191514',
    description: "Beautifully printed, built to last, and loved by everyone who's tried them. Go on, browse our bestsellers.",
    productTitle: 'Little Big Adventure Photo Book',
    price: '$19.99',
    originalPrice: '$39.99',
    rating: 4.9,
    reviewsCount: 1420,
    bgImage: '/images/photo-travel.png',
    thumbImage: '/images/choose_your_size_1.webp',
    href: '/photo-book/?variant=adventure',
    badge: 'Best Seller',
  },
  {
    id: 'layflat-album',
    subheading: 'UNMATCHED QUALITY',
    titlePrefix: 'Rich & Vivid, on ',
    highlightText: 'every single page',
    titleSuffix: '.',
    highlightColor: '#BCEEFA', // Sky Blue pastel
    textColor: '#191514',
    description: 'Ultra-thick archival paper that lays completely flat with zero loss in the seam. Pure premium luxury.',
    productTitle: 'Simple Classic Layflat Hardcover',
    price: '$29.99',
    originalPrice: '$59.99',
    rating: 5.0,
    reviewsCount: 2180,
    bgImage: '/images/photo-wedding.png',
    thumbImage: '/images/choose_your_size_2.webp',
    href: '/photo-book/?variant=layflat',
    badge: 'Top Rated',
  },
  {
    id: 'desk-calendar',
    subheading: 'EVERYDAY MAGIC',
    titlePrefix: 'Less screen time, ',
    highlightText: 'more shelf life',
    titleSuffix: '.',
    highlightColor: '#FCF876', // Butter Yellow pastel
    textColor: '#191514',
    description: 'Turn your camera roll into 12 months of daily joy on textured wood stands and heavy matte stock.',
    productTitle: 'Signature Desk & Wall Calendar',
    price: '$14.99',
    originalPrice: '$24.99',
    rating: 4.9,
    reviewsCount: 890,
    bgImage: '/images/product-calendar.png',
    thumbImage: '/images/product-calendar.png',
    href: '/photo-book/?variant=calendar',
    badge: 'Popular',
  },
  {
    id: 'canvas-prints',
    subheading: 'ARTISAN PRINTS',
    titlePrefix: 'Museum grade, ',
    highlightText: 'ready to hang',
    titleSuffix: '.',
    highlightColor: '#DCD3FF', // Lavender pastel
    textColor: '#191514',
    description: '100% cotton canvas wrapped on solid pine frames. UV-resistant inks that stay vibrant for 100+ years.',
    productTitle: 'Museum Canvas Print (Custom Size)',
    price: '$24.99',
    originalPrice: '$49.99',
    rating: 4.95,
    reviewsCount: 1050,
    bgImage: '/images/product-canvas.png',
    thumbImage: '/images/product-canvas.png',
    href: '/photo-book/?variant=canvas',
    badge: '50% OFF',
  },
]

export function ScrollingCards() {
  const [activeIndex, setActiveIndex] = useState(0)
  const scrollRef = useRef<HTMLDivElement>(null)
  const isAutoPlaying = useRef(true)

  // Sync scroll position when activeIndex changes
  const scrollToCard = (index: number) => {
    setActiveIndex(index)
    if (scrollRef.current) {
      const container = scrollRef.current
      const card = container.children[index] as HTMLElement
      if (card) {
        const offsetLeft = card.offsetLeft - (container.clientWidth - card.clientWidth) / 2
        container.scrollTo({ left: offsetLeft, behavior: 'smooth' })
      }
    }
  }

  // Handle manual user scroll detection
  const handleScroll = () => {
    if (!scrollRef.current) return
    const container = scrollRef.current
    const scrollPosition = container.scrollLeft + container.clientWidth / 2
    
    let closestIndex = 0
    let minDistance = Infinity

    Array.from(container.children).forEach((child, idx) => {
      const el = child as HTMLElement
      const center = el.offsetLeft + el.clientWidth / 2
      const distance = Math.abs(scrollPosition - center)
      if (distance < minDistance) {
        minDistance = distance
        closestIndex = idx
      }
    })

    if (closestIndex !== activeIndex) {
      setActiveIndex(closestIndex)
    }
  }

  const activeItem = FAVORITES[activeIndex]

  return (
    <section 
      aria-label="Featured Showcase"
      className="relative px-4 py-12 md:px-8 md:py-20 overflow-hidden bg-[#FAF7F2]"
    >
      <div className="mx-auto max-w-7xl">
        {/* CAROUSEL / OVERLAY CARDS CONTAINER */}
        <div className="relative">
          {/* Section Header Bar with Navigation Controls & Dots */}
          <div className="flex items-center justify-between mb-6 md:mb-8 px-2">
            {/* Dots navigation */}
            <div className="flex items-center gap-2">
              {FAVORITES.map((item, idx) => (
                <button
                  key={item.id}
                  onClick={() => scrollToCard(idx)}
                  aria-label={`Go to ${item.productTitle}`}
                  className={cn(
                    "h-2.5 rounded-full transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent",
                    idx === activeIndex
                      ? "w-8 bg-accent"
                      : "w-2.5 bg-foreground/20 hover:bg-foreground/40"
                  )}
                />
              ))}
            </div>

            {/* Desktop Left/Right Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => scrollToCard(Math.max(0, activeIndex - 1))}
                disabled={activeIndex === 0}
                aria-label="Previous card"
                className="grid size-10 place-items-center rounded-full border border-foreground/10 bg-background/80 text-foreground shadow-sm transition hover:bg-accent hover:text-accent-foreground disabled:opacity-30 disabled:pointer-events-none"
              >
                <ChevronLeft className="size-5" />
              </button>
              <button
                onClick={() => scrollToCard(Math.min(FAVORITES.length - 1, activeIndex + 1))}
                disabled={activeIndex === FAVORITES.length - 1}
                aria-label="Next card"
                className="grid size-10 place-items-center rounded-full border border-foreground/10 bg-background/80 text-foreground shadow-sm transition hover:bg-accent hover:text-accent-foreground disabled:opacity-30 disabled:pointer-events-none"
              >
                <ChevronRight className="size-5" />
              </button>
            </div>
          </div>

          {/* Horizontal Scroll Grid */}
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="flex gap-6 overflow-x-auto snap-x snap-mandatory scrollbar-none py-4 px-2 -mx-2"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {FAVORITES.map((item, idx) => {
              const isActive = idx === activeIndex
              return (
                <div
                  key={item.id}
                  onClick={() => scrollToCard(idx)}
                  className={cn(
                    "snap-center shrink-0 w-[85vw] sm:w-[420px] md:w-[460px] lg:w-[480px] transition-all duration-500 cursor-pointer",
                    isActive ? "scale-100 opacity-100" : "scale-[0.97] opacity-80 hover:opacity-100"
                  )}
                >
                  {/* OVERLAY PRODUCT CARD INPIRED BY SHOPIFY SCROLLING CARDS */}
                  <div className="group relative h-[480px] sm:h-[540px] w-full rounded-[2.5rem] overflow-hidden border border-black/5 bg-black/5 shadow-lg transition-all duration-500 hover:shadow-2xl">
                    {/* Background Hero Product Image with Scale Zoom Reveal */}
                    <img
                      src={item.bgImage}
                      alt={item.productTitle}
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                    />

                    {/* Dark gradient vignette overlay at bottom for maximum legibility */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent transition-opacity duration-300 group-hover:from-black/85" />

                    {/* Top Pill Tag */}
                    <div className="absolute top-5 left-5 right-5 flex items-center justify-between z-10">
                      <span
                        className="px-3.5 py-1 rounded-full text-xs font-bold tracking-wide shadow-md"
                        style={{ backgroundColor: item.highlightColor, color: '#191514' }}
                      >
                        {item.badge}
                      </span>
                      <div className="flex items-center gap-1 bg-black/40 backdrop-blur-md px-3 py-1 rounded-full text-white text-xs font-medium border border-white/20">
                        <Star className="size-3 fill-amber-400 text-amber-400" />
                        <span>{item.rating}</span>
                        <span className="text-white/60">({item.reviewsCount})</span>
                      </div>
                    </div>

                    {/* FLOATING OVERLAY BOTTOM CARD (Shopify style) */}
                    <div className="absolute bottom-4 left-4 right-4 z-20">
                      <div className="flex items-center justify-between gap-3 p-3.5 rounded-[1.75rem] bg-white/90 backdrop-blur-xl border border-white/50 shadow-2xl transition-all duration-300 group-hover:bg-white group-hover:scale-[1.01]">
                        {/* Avatar Thumbnail Preview */}
                        <div className="relative size-14 shrink-0 rounded-2xl overflow-hidden border border-black/10 shadow-sm bg-neutral-100">
                          <img
                            src={item.thumbImage}
                            alt={item.productTitle}
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                          />
                        </div>

                        {/* Title & Pricing Info */}
                        <div className="flex flex-col flex-grow min-w-0 pr-1">
                          <h3 className="font-sans text-sm sm:text-base font-bold text-[#191514] truncate leading-tight group-hover:text-accent transition-colors">
                            {item.productTitle}
                          </h3>
                          <div className="flex items-baseline gap-2 mt-1">
                            <span className="text-sm font-extrabold text-accent">
                              {item.price}
                            </span>
                            <span className="text-xs text-muted-foreground line-through font-medium">
                              {item.originalPrice}
                            </span>
                          </div>
                        </div>

                        {/* Action CTA Button */}
                        <Link
                          href={item.href}
                          className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-accent text-accent-foreground font-semibold text-xs transition-all duration-300 hover:bg-accent/90 shadow-md group-hover:shadow-lg group-hover:translate-x-0.5"
                        >
                          <span>Shop</span>
                          <ArrowRight className="size-3.5" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
