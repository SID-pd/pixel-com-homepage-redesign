'use client'

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { animate, motion, useMotionTemplate, useMotionValue, useReducedMotion, useTransform } from 'motion/react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { SpreadView } from '@/components/flow/spread-view'
import type { Photo, Spread } from '@/lib/flow/types'
import { cn } from '@/lib/utils'

const FLIP_MS = 0.95
const EASE = [0.45, 0.05, 0.25, 1] as const

export const spreadLabel = (i: number) => (i === 0 ? 'Cover' : `Pages ${i * 2 - 1}–${i * 2}`)

/**
 * A book you actually turn the pages of.
 *
 * It is modelled like a real one. Going forward from spread N to N+1, the right-hand page of N is a leaf hinged on the
 * spine: its front is that page, its back is the left-hand page of N+1, and the right-hand page of N+1 is already waiting
 * underneath. Going back plays the same leaf in reverse. The cover is the first leaf, and the closed book sits centred
 * until it opens. The leaf shades as it turns and casts a soft shadow on the pages below. Only transforms and opacity are
 * animated.
 */
export function Flipbook({
  spreads,
  photos,
  index,
  onIndex,
  controls = true,
  className,
}: {
  spreads: Spread[]
  photos: Photo[]
  index: number
  onIndex: (i: number) => void
  controls?: boolean
  className?: string
}) {
  const reduce = useReducedMotion()
  const last = spreads.length - 1
  const [flip, setFlip] = useState<{ from: number; to: number } | null>(null)
  const turn = useMotionValue(0) // rotation of the moving leaf, 0 (flat right) to -180 (flat left)
  const shift = useMotionValue(index === 0 ? -25 : 0) // % the whole book slides so a closed cover stays centred
  const frame = useMotionTemplate`translateX(${shift}%)`
  const shadeFront = useTransform(turn, [0, -90], [0, 0.5])
  const shadeBack = useTransform(turn, [-90, -180], [0.5, 0])
  const cast = useTransform(turn, [0, -90, -180], [0, 0.32, 0])
  const drag = useRef<number | null>(null)
  const busy = useRef(false)

  // keep the resting position right when the index changes from outside (slider, thumbnails, full-screen reader)
  useEffect(() => {
    if (!busy.current) shift.set(index === 0 ? -25 : 0)
  }, [index, shift])

  const go = useCallback(
    (to: number) => {
      const n = Math.max(0, Math.min(last, to))
      if (n === index || busy.current) return
      if (Math.abs(n - index) > 1 || reduce) {
        onIndex(n)
        return
      }
      const dir = n > index ? 1 : -1
      busy.current = true
      setFlip({ from: index, to: n })
      const involvesCover = index === 0 || n === 0
      const from = dir === 1 ? 0 : -180
      const toR = dir === 1 ? -180 : 0
      turn.set(from)
      if (involvesCover) {
        shift.set(dir === 1 ? -25 : 0)
        animate(shift, dir === 1 ? 0 : -25, { duration: FLIP_MS, ease: EASE })
      }
      animate(turn, toR, { duration: FLIP_MS, ease: EASE }).then(() => {
        onIndex(n)
        setFlip(null)
        busy.current = false
        turn.set(0)
      })
    },
    [index, last, onIndex, reduce, shift, turn],
  )

  const page = (i: number, side: 'left' | 'right'): ReactNode => {
    if (i < 0 || i > last) return null
    if (i === 0) return side === 'right' ? <SpreadView spread={spreads[0]} photos={photos} /> : null
    return <SpreadView spread={spreads[i]} photos={photos} side={side} />
  }

  // what is on the table right now
  const fwd = flip ? flip.to > flip.from : true
  const baseLeft = flip ? page(fwd ? flip.from : flip.to, 'left') : page(index, 'left')
  const baseRight = flip ? page(fwd ? flip.to : flip.from, 'right') : page(index, 'right')
  const front = flip ? page(fwd ? flip.from : flip.to, 'right') : null
  const back = flip ? page(fwd ? flip.to : flip.from, 'left') : null

  const paper = 'absolute top-0 h-full w-1/2 overflow-hidden bg-white'

  return (
    <div className={cn('w-full', className)}>
      <div
        tabIndex={0}
        role="group"
        aria-roledescription="book"
        aria-label={`Your book, ${spreadLabel(index)}. Use the arrow keys to turn pages.`}
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight') go(index + 1)
          if (e.key === 'ArrowLeft') go(index - 1)
        }}
        onPointerDown={(e) => (drag.current = e.clientX)}
        onPointerUp={(e) => {
          if (drag.current === null) return
          const dx = e.clientX - drag.current
          drag.current = null
          if (Math.abs(dx) > 60) go(index + (dx < 0 ? 1 : -1))
        }}
        className="relative mx-auto aspect-[2/1] w-full select-none rounded-sm outline-none [perspective:2400px] focus-visible:ring-2 focus-visible:ring-[#d4673f]/50"
      >
        <motion.div style={{ transform: frame, transformStyle: 'preserve-3d' }} className="absolute inset-0">
          {/* left page */}
          {baseLeft && (
            <div className={cn(paper, 'left-0 rounded-l-md shadow-[0_26px_44px_-24px_rgba(60,35,20,0.55)]')}>
              {baseLeft}
              <span aria-hidden className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-black/16 via-black/5 to-transparent" />
              <motion.span aria-hidden style={{ opacity: cast }} className="pointer-events-none absolute inset-0 bg-gradient-to-l from-black/55 via-black/10 to-transparent" />
            </div>
          )}
          {/* right page */}
          <div className={cn(paper, 'left-1/2 rounded-r-md shadow-[0_26px_44px_-24px_rgba(60,35,20,0.55),5px_5px_0_-1px_#efe5d3,9px_9px_0_-2px_#e4d7c1]')}>
            {baseRight}
            <span aria-hidden className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-black/16 via-black/5 to-transparent" />
            <motion.span aria-hidden style={{ opacity: cast }} className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/55 via-black/10 to-transparent" />
          </div>

          {/* the leaf that is turning */}
          {flip && (
            <motion.div style={{ rotateY: turn, transformOrigin: '0% 50%', transformStyle: 'preserve-3d' }} className="absolute left-1/2 top-0 h-full w-1/2">
              <div className="absolute inset-0 overflow-hidden rounded-r-md bg-white" style={{ backfaceVisibility: 'hidden' }}>
                {front}
                <span aria-hidden className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-black/16 to-transparent" />
                <motion.span aria-hidden style={{ opacity: shadeFront }} className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/70 to-black/10" />
              </div>
              <div className="absolute inset-0 overflow-hidden rounded-l-md bg-white" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
                {back}
                <span aria-hidden className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-black/16 to-transparent" />
                <motion.span aria-hidden style={{ opacity: shadeBack }} className="pointer-events-none absolute inset-0 bg-gradient-to-l from-black/70 to-black/10" />
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* tap the left or right page to turn */}
        <button type="button" onClick={() => go(index - 1)} disabled={index === 0} aria-label="Previous page" className="absolute inset-y-0 left-0 z-10 w-[30%] cursor-w-resize focus-visible:outline-none disabled:cursor-default" />
        <button type="button" onClick={() => go(index + 1)} disabled={index >= last} aria-label="Next page" className="absolute inset-y-0 right-0 z-10 w-[30%] cursor-e-resize focus-visible:outline-none disabled:cursor-default" />
      </div>

      {controls && (
        <div className="mx-auto mt-6 flex max-w-xl items-center gap-3">
          <button type="button" onClick={() => go(index - 1)} disabled={index === 0} aria-label="Previous page" className="grid size-11 shrink-0 place-items-center rounded-full bg-white text-[#16324f] shadow-sm ring-1 ring-[#e8dfd2] transition enabled:hover:ring-[#cdbfa9] enabled:active:scale-95 disabled:opacity-35">
            <ChevronLeft className="size-5" />
          </button>
          <div className="min-w-0 flex-1">
            <input type="range" min={0} max={last} value={index} onChange={(e) => go(Number(e.target.value))} aria-label="Jump to a page" aria-valuetext={spreadLabel(index)} className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-[#e8dfd2] accent-[#d4673f]" />
            <p className="mt-1.5 text-center text-xs font-medium tabular-nums text-[#16324f]/65">
              {spreadLabel(index)} · {index + 1} of {spreads.length}
            </p>
          </div>
          <button type="button" onClick={() => go(index + 1)} disabled={index >= last} aria-label="Next page" className="grid size-11 shrink-0 place-items-center rounded-full bg-white text-[#16324f] shadow-sm ring-1 ring-[#e8dfd2] transition enabled:hover:ring-[#cdbfa9] enabled:active:scale-95 disabled:opacity-35">
            <ChevronRight className="size-5" />
          </button>
        </div>
      )}
    </div>
  )
}
