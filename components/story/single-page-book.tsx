'use client'

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from 'motion/react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { SpreadView } from '@/components/flow/spread-view'
import type { Photo, Spread } from '@/lib/flow/types'
import { cn } from '@/lib/utils'

const FLIP = 0.45
const EASE = [0.45, 0.05, 0.25, 1] as const

type PageRef = { spread: number; side: 'cover' | 'left' | 'right' }

/**
 * Phones: the book is one page at a time, filling the width. Forward, the page you are on slides off to the left and the
 * next page is waiting underneath. Back, the previous page slides in over the top. Swipe, tap the page, or use the arrows.
 * It is a flat slide (transform and opacity only, no 3D layers): a perspective page turn of two full-size pages is more than
 * a phone can paint smoothly.
 */
export function SinglePageBook({ spreads, photos, start = 0, onSpread, className }: { spreads: Spread[]; photos: Photo[]; /** spread to open on */ start?: number; /** reports which spread the visible page belongs to */ onSpread?: (spread: number) => void; className?: string }) {
  const reduce = useReducedMotion()
  const pages: PageRef[] = [{ spread: 0, side: 'cover' }, ...spreads.slice(1).flatMap((_, k): PageRef[] => [{ spread: k + 1, side: 'left' }, { spread: k + 1, side: 'right' }])]
  const last = pages.length - 1
  const [index, setIndex] = useState(() => (start <= 0 ? 0 : Math.min(start * 2 - 1, last)))
  useEffect(() => {
    onSpread?.(pages[Math.min(index, last)]?.spread ?? 0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index])
  const [flip, setFlip] = useState<{ from: number; to: number } | null>(null)
  const turn = useMotionValue(0) // 0 flat, -180 turned over to the left
  const busy = useRef(false)
  const drag = useRef<{ x: number; y: number } | null>(null)
  const slide = useTransform(turn, [0, -180], ['0%', '-104%'])
  const fade = useTransform(turn, [0, -120, -180], [1, 1, 0.4])
  const under = useTransform(turn, [0, -180], [0.96, 1])
  const cast = useTransform(turn, [0, -90, -180], [0.25, 0.12, 0])

  const go = useCallback(
    (to: number) => {
      const n = Math.max(0, Math.min(last, to))
      if (n === index || busy.current) return
      if (Math.abs(n - index) > 1 || reduce) {
        setIndex(n)
        return
      }
      const fwd = n > index
      busy.current = true
      setFlip({ from: index, to: n })
      turn.set(fwd ? 0 : -180)
      animate(turn, fwd ? -180 : 0, { duration: FLIP, ease: EASE }).then(() => {
        setIndex(n)
        setFlip(null)
        busy.current = false
        turn.set(0)
      })
    },
    [index, last, reduce, turn],
  )

  const show = (i: number): ReactNode => {
    const p = pages[i]
    if (!p) return null
    return <SpreadView spread={spreads[p.spread]} photos={photos} side={p.side === 'cover' ? undefined : p.side} />
  }

  const fwd = flip ? flip.to > flip.from : true
  // forward: the page we are on turns away over the next one. back: the previous page turns in over the one we are on.
  const base = flip ? show(fwd ? flip.to : flip.from) : show(index)
  const leaf = flip ? show(fwd ? flip.from : flip.to) : null

  const total = (spreads.length - 1) * 2
  const label = index === 0 ? 'Cover' : `Page ${index} of ${total}`
  const paper = 'absolute inset-0 overflow-hidden rounded-md bg-white'

  return (
    <div className={cn('w-full', className)}>
      <div
        tabIndex={0}
        role="group"
        aria-roledescription="book"
        aria-label={`Your book, ${label}. Swipe or use the arrows to turn pages.`}
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight') go(index + 1)
          if (e.key === 'ArrowLeft') go(index - 1)
        }}
        onPointerDown={(e) => (drag.current = { x: e.clientX, y: e.clientY })}
        onPointerUp={(e) => {
          const d = drag.current
          drag.current = null
          if (!d) return
          const dx = e.clientX - d.x
          if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(e.clientY - d.y)) go(index + (dx < 0 ? 1 : -1))
        }}
        className="relative aspect-square w-full touch-pan-y select-none overflow-x-clip outline-none"
      >
        <div className="absolute inset-0">
          <motion.div className={paper} style={{ scale: flip ? under : 1, boxShadow: '0 18px 34px -18px rgba(60,35,20,0.6), 4px 4px 0 -1px #efe5d3, 8px 8px 0 -2px #e4d7c1' }}>
            {base}
            {flip && <motion.span aria-hidden style={{ opacity: cast }} className="pointer-events-none absolute inset-0 bg-black" />}
          </motion.div>

          {flip && (
            <motion.div style={{ x: slide, opacity: fade, boxShadow: '8px 0 24px -10px rgba(60,35,20,0.5)' }} className={paper}>
              {leaf}
            </motion.div>
          )}
        </div>

        <button type="button" onClick={() => go(index - 1)} disabled={index === 0} aria-label="Previous page" className="absolute inset-y-0 left-0 z-10 w-[35%] focus-visible:outline-none" />
        <button type="button" onClick={() => go(index + 1)} disabled={index >= last} aria-label="Next page" className="absolute inset-y-0 right-0 z-10 w-[65%] focus-visible:outline-none" />
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <button type="button" onClick={() => go(index - 1)} disabled={index === 0} aria-label="Previous page" className="grid size-12 place-items-center rounded-full bg-white text-[#16324f] shadow-sm ring-1 ring-[#e8dfd2] transition enabled:active:scale-95 disabled:opacity-35">
          <ChevronLeft className="size-5" />
        </button>
        <p className="text-sm font-semibold tabular-nums text-[#16324f]" aria-live="polite">
          {label}
        </p>
        <button type="button" onClick={() => go(index + 1)} disabled={index >= last} aria-label="Next page" className="grid size-12 place-items-center rounded-full bg-white text-[#16324f] shadow-sm ring-1 ring-[#e8dfd2] transition enabled:active:scale-95 disabled:opacity-35">
          <ChevronRight className="size-5" />
        </button>
      </div>
    </div>
  )
}
