'use client'

import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { Photo, Spread } from '@/lib/flow/types'
import { cn } from '@/lib/utils'
import { SpreadView } from './spread-view'

function label(i: number) {
  return i === 0 ? 'Cover' : `Pages ${i * 2 - 1}–${i * 2}`
}

export function BookPreview({ spreads, photos, startAt = 0 }: { spreads: Spread[]; photos: Photo[]; startAt?: number }) {
  const [i, setI] = useState(startAt)
  const max = spreads.length - 1
  const go = (n: number) => setI(Math.max(0, Math.min(max, n)))

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return
      if (e.key === 'ArrowLeft') setI((n) => Math.max(0, n - 1))
      if (e.key === 'ArrowRight') setI((n) => Math.min(max, n + 1))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [max])

  const current = spreads[i]
  if (!current) return null

  return (
    <div>
      <div className="relative rounded-3xl bg-gradient-to-b from-secondary to-secondary/50 p-4 sm:p-8">
        <div
          className={cn(
            'mx-auto overflow-hidden rounded-md shadow-lift ring-1 ring-black/5 transition-[max-width] duration-300',
            current.kind === 'cover' ? 'max-w-[min(100%,420px)]' : 'max-w-full',
          )}
        >
          <SpreadView spread={current} photos={photos} />
        </div>
        <button
          type="button"
          onClick={() => go(i - 1)}
          disabled={i === 0}
          aria-label="Previous page"
          className="absolute left-2 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-background/90 shadow-float transition hover:bg-background disabled:opacity-0 sm:left-3"
        >
          <ChevronLeft className="size-5" />
        </button>
        <button
          type="button"
          onClick={() => go(i + 1)}
          disabled={i === max}
          aria-label="Next page"
          className="absolute right-2 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-background/90 shadow-float transition hover:bg-background disabled:opacity-0 sm:right-3"
        >
          <ChevronRight className="size-5" />
        </button>
      </div>
      <p className="mt-3 text-center text-sm text-muted-foreground" aria-live="polite">
        {label(i)} · {i + 1} of {spreads.length}
      </p>
      <ul className="mt-3 flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" aria-label="Pages">
        {spreads.map((s, n) => (
          <li key={s.id} className="shrink-0">
            <button
              type="button"
              onClick={() => go(n)}
              aria-label={label(n)}
              aria-current={n === i}
              className={cn(
                'block overflow-hidden rounded-md ring-2 ring-offset-2 ring-offset-background transition',
                s.kind === 'cover' ? 'w-12' : 'w-24',
                n === i ? 'ring-accent' : 'ring-transparent opacity-75 hover:opacity-100',
              )}
            >
              <SpreadView spread={s} photos={photos} />
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
