'use client'

import { useState } from 'react'
import { COVERS, SIZES, money, type CoverId, type SizeId } from '@/lib/flow/catalog'
import { unitPrice } from '@/lib/flow/pricing'
import { cn } from '@/lib/utils'
import { CtaLink } from '@/components/pixel/cta-link'

/** Lets people price their exact book before committing. Same numbers as the checkout (lib/flow/pricing). */
export function PriceCalculator() {
  const [size, setSize] = useState<SizeId>('10x10')
  const [pages, setPages] = useState(20)
  const [cover, setCover] = useState<CoverId>('hardcover')
  const price = unitPrice({ size, pages, cover })
  const perPage = pages > 20 ? (price - unitPrice({ size, pages: 20, cover })) / (pages - 20) : 0

  return (
    <div className="grid gap-8 rounded-[2rem] border border-foreground/8 bg-card p-6 shadow-xs sm:p-10 lg:grid-cols-[1fr_320px]">
      <div className="space-y-8">
        <fieldset>
          <legend className="mb-3 text-sm font-semibold">Size</legend>
          <div className="grid grid-cols-3 gap-2.5">
            {SIZES.map((s) => (
              <button
                key={s.id}
                type="button"
                aria-pressed={size === s.id}
                onClick={() => setSize(s.id)}
                className={cn('rounded-2xl border p-3.5 text-left transition', size === s.id ? 'border-accent bg-accent/8 ring-1 ring-accent' : 'border-foreground/10 hover:border-foreground/30')}
              >
                <span className="block font-semibold">{s.label}</span>
                <span className="mt-0.5 block text-xs text-muted-foreground">{s.id === '10x10' ? 'Most popular' : s.blurb}</span>
              </button>
            ))}
          </div>
        </fieldset>

        <div>
          <label htmlFor="calc-pages" className="mb-3 flex items-baseline justify-between text-sm font-semibold">
            <span>Pages</span>
            <span className="font-serif text-2xl text-accent">{pages}</span>
          </label>
          <input
            id="calc-pages"
            type="range"
            min={20}
            max={100}
            step={2}
            value={pages}
            onChange={(e) => setPages(+e.target.value)}
            className="h-6 w-full cursor-pointer accent-[var(--accent)]"
          />
          <div className="mt-1 flex justify-between text-xs text-muted-foreground">
            <span>20</span>
            <span>100</span>
          </div>
        </div>

        <fieldset>
          <legend className="mb-3 text-sm font-semibold">Cover</legend>
          <div className="grid grid-cols-2 gap-2.5">
            {COVERS.map((c) => (
              <button
                key={c.id}
                type="button"
                aria-pressed={cover === c.id}
                onClick={() => setCover(c.id)}
                className={cn('rounded-2xl border p-3.5 text-left transition', cover === c.id ? 'border-accent bg-accent/8 ring-1 ring-accent' : 'border-foreground/10 hover:border-foreground/30')}
              >
                <span className="block font-semibold">{c.label}</span>
                <span className="mt-0.5 block text-xs text-muted-foreground">{c.adjust === 0 ? 'Premium finish' : 'Lightweight & budget-friendly'}</span>
              </button>
            ))}
          </div>
        </fieldset>
      </div>

      <div className="flex flex-col justify-between rounded-3xl bg-ink p-6 text-ink-foreground">
        <div>
          <p className="text-sm text-ink-foreground/70">Your book</p>
          <p className="mt-1 text-sm">
            {SIZES.find((s) => s.id === size)!.label} · {pages} pages · {COVERS.find((c) => c.id === cover)!.label}
          </p>
          <p className="mt-6 font-serif text-5xl tracking-tight" aria-live="polite">
            {money(price)}
          </p>
          <p className="mt-2 text-sm text-ink-foreground/70">
            {perPage ? `Extra pages cost about ${money(perPage)} each.` : 'Includes 20 premium silk pages.'} Shipping calculated at checkout.
          </p>
        </div>
        <div className="mt-8 space-y-3">
          <CtaLink href={`/photo-book/?size=${size}`} variant="accent" size="lg" className="w-full">
            Start with this book
          </CtaLink>
          <p className="text-center text-xs text-ink-foreground/65">Design free. You only pay when you order.</p>
        </div>
      </div>
    </div>
  )
}
