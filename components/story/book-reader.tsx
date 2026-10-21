'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { AlertTriangle, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { SpreadView } from '@/components/flow/spread-view'
import type { Photo, Spread } from '@/lib/flow/types'
import { cn } from '@/lib/utils'

const label = (i: number) => (i === 0 ? 'Cover' : `Pages ${i * 2 - 1}–${i * 2}`)
const captionOf = (s: Spread) => s.items.find((it) => it.type === 'text' && it.id.startsWith('c_'))?.text ?? ''
const emptySpots = (s: Spread) => s.items.filter((it) => it.type === 'photo' && !it.photoId).length

/** Every page at a glance: tap one to jump straight to it. Pages with empty photo spots are marked. */
export function PagesGrid({ spreads, photos, current, onPick }: { spreads: Spread[]; photos: Photo[]; current: number; onPick: (i: number) => void }) {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4" aria-label="All pages">
      {spreads.map((s, i) => {
        const empty = emptySpots(s)
        const cap = captionOf(s)
        return (
          <li key={s.id} style={{ contentVisibility: 'auto', containIntrinsicSize: '0 170px' }} className={cn(s.kind === 'cover' ? '' : 'sm:col-span-1')}>
            <button type="button" onClick={() => onPick(i)} aria-label={`${label(i)}${empty ? `, ${empty} empty` : ''}`} aria-current={i === current} className={cn('group block w-full rounded-2xl bg-white p-2 text-left shadow-sm ring-2 transition hover:-translate-y-0.5 hover:shadow-md', i === current ? 'ring-[var(--st-peach-ink)]' : 'ring-transparent hover:ring-[var(--st-peach)]')}>
              <span className={cn('relative block overflow-hidden rounded-lg bg-[var(--st-cream)]', s.kind === 'cover' && 'mx-auto w-1/2')}>
                <SpreadView spread={s} photos={photos} />
              </span>
              <span className="mt-2 flex items-center justify-between gap-2 px-1 text-[11px] font-semibold text-foreground/70">
                <span>{label(i)}</span>
                {empty > 0 && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[var(--st-butter)] px-2 py-0.5 text-[#7a5b00]" title="Empty photo spots print as blank space">
                    <AlertTriangle className="size-3" /> {empty} empty
                  </span>
                )}
              </span>
              {cap && <span className="mt-0.5 block truncate px-1 font-[family-name:var(--font-hand)] text-base text-[var(--st-ink)]/80">{cap}</span>}
            </button>
          </li>
        )
      })}
    </ul>
  )
}

/**
 * Full-window reader for the whole book: big pages, arrow keys or swipe to turn, and a strip of every page along the
 * bottom for jumping around. Esc closes.
 */
export function BookReader({ spreads, photos, title, start, onClose }: { spreads: Spread[]; photos: Photo[]; title: string; start: number; onClose: () => void }) {
  const [i, setI] = useState(Math.min(start, spreads.length - 1))
  const [dir, setDir] = useState(1)
  const last = spreads.length - 1
  const strip = useRef<HTMLDivElement>(null)
  const drag = useRef<number | null>(null)

  const go = useCallback(
    (to: number) => {
      const n = Math.max(0, Math.min(last, to))
      setDir(n >= i ? 1 : -1)
      setI(n)
    },
    [i, last],
  )

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') go(i + 1)
      if (e.key === 'ArrowLeft') go(i - 1)
      if (e.key === 'Home') go(0)
      if (e.key === 'End') go(last)
    }
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  }, [go, i, last, onClose])

  // keep the current page's thumbnail in view
  useEffect(() => {
    const el = strip.current?.querySelector<HTMLElement>(`[data-i="${i}"]`)
    el?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
  }, [i])

  const s = spreads[i]
  const cap = s ? captionOf(s) : ''

  return (
    <motion.div role="dialog" aria-modal="true" aria-label={`${title}, full book`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="fixed inset-0 z-[55] flex flex-col bg-[#2b211c] text-white">
      <header className="flex shrink-0 items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{title}</p>
          <p className="text-xs tabular-nums text-white/60">
            {label(i)} · {i + 1} of {spreads.length}
          </p>
        </div>
        <button type="button" onClick={onClose} aria-label="Close reader" className="grid size-11 place-items-center rounded-full bg-white/10 transition hover:bg-white/20">
          <X className="size-5" />
        </button>
      </header>

      <div
        className="relative grid min-h-0 flex-1 place-items-center overflow-hidden px-3 sm:px-16"
        onPointerDown={(e) => (drag.current = e.clientX)}
        onPointerUp={(e) => {
          if (drag.current === null) return
          const dx = e.clientX - drag.current
          drag.current = null
          if (Math.abs(dx) > 70) go(i + (dx < 0 ? 1 : -1))
        }}
      >
        <AnimatePresence mode="popLayout" custom={dir} initial={false}>
          <motion.div
            key={i}
            custom={dir}
            variants={{ enter: (d: number) => ({ opacity: 0, x: d * 70, scale: 0.97 }), center: { opacity: 1, x: 0, scale: 1 }, exit: (d: number) => ({ opacity: 0, x: d * -70, scale: 0.97 }) }}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
            className={cn('w-full', s?.kind === 'cover' ? 'max-w-[min(70vh,520px)]' : 'max-w-[min(150vh,1100px)]')}
          >
            <div className="overflow-hidden rounded-lg bg-white shadow-[0_30px_70px_-20px_rgba(0,0,0,0.7)]">{s && <SpreadView spread={s} photos={photos} />}</div>
          </motion.div>
        </AnimatePresence>

        <button type="button" onClick={() => go(i - 1)} disabled={i === 0} aria-label="Previous page" className="absolute left-2 top-1/2 grid size-12 -translate-y-1/2 place-items-center rounded-full bg-white/12 transition enabled:hover:bg-white/25 disabled:opacity-0 sm:left-5">
          <ChevronLeft className="size-6" />
        </button>
        <button type="button" onClick={() => go(i + 1)} disabled={i === last} aria-label="Next page" className="absolute right-2 top-1/2 grid size-12 -translate-y-1/2 place-items-center rounded-full bg-white/12 transition enabled:hover:bg-white/25 disabled:opacity-0 sm:right-5">
          <ChevronRight className="size-6" />
        </button>
      </div>

      <p className="h-8 shrink-0 text-center font-[family-name:var(--font-hand)] text-2xl text-white/85">{cap}</p>

      <div className="shrink-0 border-t border-white/10 bg-black/20 px-3 py-3 sm:px-6">
        <div ref={strip} className="flex gap-2.5 overflow-x-auto pb-1 [scrollbar-width:thin]" role="tablist" aria-label="Jump to a page">
          {spreads.map((sp, n) => (
            <button key={sp.id} type="button" role="tab" aria-selected={n === i} data-i={n} onClick={() => go(n)} aria-label={label(n)} className={cn('shrink-0 overflow-hidden rounded-md bg-white ring-2 transition', n === i ? 'ring-[var(--st-peach)] opacity-100' : 'opacity-60 ring-transparent hover:opacity-100')} style={{ width: sp.kind === 'cover' ? 54 : 108 }}>
              <SpreadView spread={sp} photos={photos} />
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  )
}
