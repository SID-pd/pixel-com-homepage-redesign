'use client'

import { useEffect, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { AlertTriangle, X } from 'lucide-react'
import { SpreadView } from '@/components/flow/spread-view'
import type { Photo, Spread } from '@/lib/flow/types'
import { cn } from '@/lib/utils'
import { Flipbook, spreadLabel } from './flipbook'

const captionOf = (s: Spread) => s.items.find((it) => it.type === 'text' && it.id.startsWith('c_'))?.text ?? ''
const emptySpots = (s: Spread) => s.items.filter((it) => it.type === 'photo' && !it.photoId).length

/**
 * Scroll through the whole book: every spread full width, one under the next. A list of all the pages stays on the right so
 * you can jump to any of them, and it follows along as you scroll.
 */
export function PagesScroll({ spreads, photos }: { spreads: Spread[]; photos: Photo[] }) {
  const [current, setCurrent] = useState(0)
  const refs = useRef<(HTMLElement | null)[]>([])
  const list = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        const hit = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
        if (hit) setCurrent(Number((hit.target as HTMLElement).dataset.i))
      },
      { rootMargin: '-35% 0px -45% 0px', threshold: [0, 0.2, 0.5, 1] },
    )
    refs.current.forEach((el) => el && io.observe(el))
    return () => io.disconnect()
  }, [spreads.length])

  // keep the highlighted thumbnail in view in the side list
  useEffect(() => {
    const el = list.current?.querySelector<HTMLElement>(`[data-t="${current}"]`)
    const box = list.current
    if (!el || !box) return
    const top = el.offsetTop - box.clientHeight / 2 + el.clientHeight / 2
    box.scrollTo({ top, behavior: 'smooth' })
  }, [current])

  const jump = (i: number) => refs.current[i]?.scrollIntoView({ behavior: 'smooth', block: 'center' })

  const thumb = (s: Spread, i: number) => {
    const empty = emptySpots(s)
    return (
      <button key={s.id} type="button" data-t={i} onClick={() => jump(i)} aria-label={`Go to ${spreadLabel(i)}`} aria-current={i === current} className={cn('group block w-full rounded-xl bg-white p-1.5 text-left shadow-sm ring-2 transition hover:shadow-md', i === current ? 'ring-[#d4673f]' : 'ring-transparent hover:ring-[#f0d9cb]')}>
        <span className={cn('block overflow-hidden rounded-md bg-[#f4efe7]', s.kind === 'cover' && 'mx-auto w-1/2')}>
          <SpreadView spread={s} photos={photos} />
        </span>
        <span className="mt-1 flex items-center justify-between px-0.5 text-[11px] font-semibold text-[#16324f]/70">
          <span>{spreadLabel(i)}</span>
          {empty > 0 && <AlertTriangle className="size-3 text-[#b88a00]" aria-label={`${empty} empty`} />}
        </span>
      </button>
    )
  }

  return (
    <div className="flex flex-col-reverse gap-5 lg:grid lg:grid-cols-[minmax(0,1fr)_13rem] lg:gap-6">
      <ol className="min-w-0 space-y-6 sm:space-y-8">
        {spreads.map((s, i) => {
          const empty = emptySpots(s)
          return (
            <li key={s.id} ref={(el) => { refs.current[i] = el }} data-i={i} style={{ contentVisibility: 'auto', containIntrinsicSize: '0 460px' }} className="scroll-mt-32">
              <div className="mb-2 flex items-center justify-between gap-3 px-1 text-xs font-semibold text-[#16324f]/65">
                <span>{spreadLabel(i)}</span>
                {empty > 0 && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#fff0b5] px-2.5 py-1 text-[#7a5b00]">
                    <AlertTriangle className="size-3" /> {empty} empty photo spot{empty === 1 ? '' : 's'}
                  </span>
                )}
              </div>
              <div className={cn('mx-auto overflow-hidden rounded-xl bg-white shadow-[0_24px_50px_-26px_rgba(60,35,20,0.55)] ring-1 ring-black/5', s.kind === 'cover' ? 'max-w-[26rem]' : 'w-full')}>
                <SpreadView spread={s} photos={photos} />
              </div>
            </li>
          )
        })}
      </ol>

      <aside aria-label="All pages" className="hidden lg:block">
        <div ref={list} className="sticky top-28 max-h-[calc(100dvh-9rem)] space-y-2.5 overflow-y-auto rounded-2xl bg-[#f6f1e8] p-2.5 [scrollbar-width:thin]">
          <p className="px-1 pt-1 text-[11px] font-bold uppercase tracking-wider text-[#16324f]/55">All pages · {spreads.length}</p>
          {spreads.map((s, i) => thumb(s, i))}
        </div>
      </aside>

      {/* phones and tablets: the same list as a strip */}
      <div className="min-w-0 lg:hidden">
        <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-[#16324f]/55">Jump to a page</p>
        <div className="flex gap-2.5 overflow-x-auto pb-2 [scrollbar-width:thin]">
          {spreads.map((s, i) => (
            <div key={s.id} className="w-28 shrink-0">
              {thumb(s, i)}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/** Full-window reader: the same book, larger, with a strip of every page along the bottom. Esc closes. */
export function BookReader({ spreads, photos, title, start, onClose }: { spreads: Spread[]; photos: Photo[]; title: string; start: number; onClose: () => void }) {
  const [i, setI] = useState(Math.min(start, spreads.length - 1))
  const last = spreads.length - 1
  const strip = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'Home') setI(0)
      if (e.key === 'End') setI(last)
    }
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  }, [last, onClose])

  useEffect(() => {
    strip.current?.querySelector<HTMLElement>(`[data-i="${i}"]`)?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
  }, [i])

  const cap = captionOf(spreads[i])

  return (
    <motion.div role="dialog" aria-modal="true" aria-label={`${title}, full book`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="fixed inset-0 z-[75] flex flex-col bg-[#2b211c] text-white">
      <header className="flex shrink-0 items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{title}</p>
          <p className="text-xs tabular-nums text-white/60">
            {spreadLabel(i)} · {i + 1} of {spreads.length}
          </p>
        </div>
        <button type="button" onClick={onClose} aria-label="Close reader" className="grid size-11 place-items-center rounded-full bg-white/10 transition hover:bg-white/20">
          <X className="size-5" />
        </button>
      </header>

      <div className="grid min-h-0 flex-1 place-items-center px-3 sm:px-10">
        <Flipbook spreads={spreads} photos={photos} index={i} onIndex={setI} controls={false} className="max-w-[min(150vh,1100px)]" />
      </div>

      <p className="h-9 shrink-0 text-center font-[family-name:var(--font-hand)] text-2xl text-white/85">{cap}</p>

      <div className="shrink-0 border-t border-white/10 bg-black/20 px-3 py-3 sm:px-6">
        <div ref={strip} className="flex gap-2.5 overflow-x-auto pb-1 [scrollbar-width:thin]" role="tablist" aria-label="Jump to a page">
          {spreads.map((sp, n) => (
            <button key={sp.id} type="button" role="tab" aria-selected={n === i} data-i={n} onClick={() => setI(n)} aria-label={spreadLabel(n)} className={cn('shrink-0 overflow-hidden rounded-md bg-white ring-2 transition', n === i ? 'opacity-100 ring-[#ffdcc6]' : 'opacity-60 ring-transparent hover:opacity-100')} style={{ width: sp.kind === 'cover' ? 54 : 108 }}>
              <SpreadView spread={sp} photos={photos} />
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  )
}
