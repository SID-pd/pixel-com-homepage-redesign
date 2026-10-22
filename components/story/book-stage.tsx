'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { SpreadView } from '@/components/flow/spread-view'
import { photoThumb } from '@/lib/flow/images'
import type { Photo, Spread } from '@/lib/flow/types'
import type { Mood } from '@/lib/flow/story-chat'
import { Celebration } from './celebration'
import { Companion, type PixieCue } from './companion'

const SLOW = [0.45, 0, 0.2, 1] as const

// Timeline, in ms. Deliberately unhurried so the moment has room to land.
const T_FORM = 3200
const T_OPEN = 5800
const T_LEAVE = 8700
const T_DONE = 9500

const LINES = ['Gathering your moments…', 'Binding the pages…', 'Opening your book…']

/**
 * The whole page becomes a stage while the book comes together:
 *  1. your photos drift in from the right (where they were uploading) and circle the centre
 *  2. they fold into a stack and a closed book rises out of it
 *  3. the cover swings open on its spine, revealing the first page
 * It sits over the entire window and fades away into the finished preview, so there is no visible "switch".
 */
// Phones get the same story in a lighter telling: 6 thumbnails circle, then a flat closed book rises (no 3D, no second page, no mascot).
const LIGHT = { form: 2400, open: 3900, leave: 5000, done: 5700 }

export function BookStage({ photos, spreads, title, onDone, light = false }: { photos: Photo[]; spreads: Spread[]; title: string; onDone: () => void; light?: boolean }) {
  const reduce = useReducedMotion()
  const [stage, setStage] = useState(0)
  const [vp, setVp] = useState({ w: 1200, h: 800 })
  const [cue, setCue] = useState<PixieCue | undefined>()

  useEffect(() => {
    setVp({ w: window.innerWidth, h: window.innerHeight })
    const quick = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const t = light ? LIGHT : { form: T_FORM, open: T_OPEN, leave: T_LEAVE, done: T_DONE }
    const ts = [
      window.setTimeout(() => (setStage(1), setCue({ type: 'hop', id: 1 })), quick ? 200 : t.form),
      window.setTimeout(() => (setStage(2), setCue({ type: 'wave', id: 2 })), quick ? 400 : t.open),
      window.setTimeout(() => setStage(3), quick ? 600 : t.leave),
      window.setTimeout(onDone, quick ? 900 : t.done),
    ]
    return () => ts.forEach(window.clearTimeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // one page is a square; the book is two pages wide
  const P = light ? Math.round(Math.max(140, Math.min(vp.w * 0.6, vp.h * 0.36, 280))) : Math.round(Math.max(150, Math.min(vp.w * 0.4, vp.h * 0.44, 400)))
  const ring = Math.min(vp.w, vp.h) * (light ? 0.34 : 0.3)
  const flying = useMemo(() => photos.slice(0, light ? 6 : 14), [photos, light])
  const cover = spreads[0]
  const first = spreads[1]
  const mood: Mood = stage === 0 ? 'excited' : stage === 1 ? 'thinking' : 'celebrate'

  return (
    <motion.div role="status" aria-live="polite" aria-label="Building your storybook" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 1.03 }} transition={{ duration: 0.9, ease: SLOW }} className="fixed inset-0 z-[60] overflow-hidden bg-[var(--st-cream)] [background-image:radial-gradient(70vmax_55vmax_at_20%_0%,rgba(255,220,198,0.9),transparent_70%),radial-gradient(60vmax_50vmax_at_100%_20%,rgba(231,222,254,0.85),transparent_70%),radial-gradient(60vmax_50vmax_at_40%_110%,rgba(207,241,227,0.8),transparent_70%)]">
      <div aria-hidden className="absolute inset-0 [background-image:radial-gradient(rgba(150,100,60,0.13)_1px,transparent_1px)] [background-size:24px_24px]" />

      <button type="button" onClick={onDone} className="absolute right-4 top-4 z-10 rounded-full bg-white/80 px-4 py-2 text-xs font-semibold text-foreground/70 shadow-sm transition hover:bg-white hover:text-foreground">
        Skip
      </button>

      {/* 1 + 2: photos arrive from the right, circle, then fold into the stack */}
      <div aria-hidden className="absolute inset-0">
        {flying.map((p, i) => {
          const a = (i / flying.length) * Math.PI * 2 - Math.PI / 2
          const rx = Math.cos(a) * ring * 1.15
          const ry = Math.sin(a) * ring * 0.8
          const tilt = ((i * 37) % 24) - 12
          return (
            <motion.div
              key={p.id}
              className="absolute left-1/2 top-1/2 -ml-[34px] -mt-[34px] w-[68px] rounded-[5px] bg-white p-1 shadow-[0_10px_22px_-10px_rgba(60,35,20,0.6)]"
              initial={{ x: vp.w * 0.5, y: (i / flying.length - 0.5) * vp.h * 0.7, rotate: 18 + i * 3, scale: 0.7, opacity: 0 }}
              animate={
                stage === 0
                  ? { x: rx, y: ry, rotate: tilt, scale: 1, opacity: 1 }
                  : { x: 0, y: 0, rotate: 0, scale: 0.3, opacity: 0 }
              }
              transition={stage === 0 ? { type: 'spring', stiffness: 38, damping: 14, mass: 1.1, delay: 0.4 + i * (light ? 0.12 : 0.16) } : { duration: 1.3, delay: i * 0.05, ease: SLOW }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photoThumb(p)} alt="" className="aspect-square w-full rounded-[2px] object-cover" />
            </motion.div>
          )
        })}
      </div>

      {/* light: a flat closed book rises out of the stack */}
      {light && (
        <div className="absolute inset-0 grid place-items-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.5, y: 40 }}
            animate={stage >= 1 ? { opacity: 1, scale: 1, y: 0 } : { opacity: 0, scale: 0.5, y: 40 }}
            transition={{ type: 'spring', stiffness: 60, damping: 14 }}
            style={{ width: P, height: P }}
            className="relative overflow-hidden rounded-r-md rounded-l-[3px] bg-white shadow-[4px_4px_0_#efe5d3,8px_8px_0_#e4d7c1,18px_24px_34px_-10px_rgba(60,35,20,0.45)]"
          >
            {cover && <SpreadView spread={cover} photos={photos} />}
            <div aria-hidden className="absolute inset-y-0 left-0 w-3 bg-gradient-to-r from-black/15 to-transparent" />
          </motion.div>
        </div>
      )}

      {/* 2 + 3: the book */}
      {!light && (
      <div className="absolute inset-0 grid place-items-center [perspective:2000px]">
        <motion.div
          initial={{ opacity: 0, scale: 0.45, y: 60, rotateX: 22 }}
          animate={stage >= 1 ? { opacity: 1, scale: 1, y: 0, rotateX: stage >= 2 ? 4 : 10 } : { opacity: 0, scale: 0.45, y: 60, rotateX: 22 }}
          transition={{ type: 'spring', stiffness: 34, damping: 13, mass: 1.3 }}
          style={{ width: P * 2, height: P, transformStyle: 'preserve-3d' }}
          className="relative"
        >
          {/* the closed book is centred; opening slides it so both pages sit in the middle */}
          <motion.div initial={{ x: -P / 2 }} animate={{ x: stage >= 2 ? 0 : -P / 2 }} transition={{ duration: 2.4, ease: SLOW }} style={{ transformStyle: 'preserve-3d' }} className="absolute inset-0">
            {/* page block under the right half: stacked paper edges + soft shadow */}
            <div className="absolute rounded-r-md bg-[#f6efe3]" style={{ left: P, top: 0, width: P, height: P, boxShadow: '3px 3px 0 #efe5d3, 6px 6px 0 #e7dac5, 9px 9px 0 #ddceb6, 22px 28px 40px -10px rgba(60,35,20,0.45)' }} />
            {/* the first page, waiting under the cover */}
            <div className="absolute overflow-hidden rounded-r-md bg-white" style={{ left: P, top: 0, width: P, height: P }}>
              {first && <SpreadView spread={first} photos={photos} side="left" />}
            </div>
            {/* the left page appears as the cover swings over */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: stage >= 2 ? 1 : 0 }} transition={{ duration: 1.4, delay: 0.9 }} className="absolute rounded-l-md bg-[#f6efe3]" style={{ left: 0, top: 0, width: P, height: P, boxShadow: '-6px 8px 30px -12px rgba(60,35,20,0.4)' }}>
              <div className="grid size-full place-items-center p-6 text-center">
                <p className="font-[family-name:var(--font-hand)] text-3xl leading-tight text-[var(--st-peach-ink)]/80">{title}</p>
              </div>
            </motion.div>

            {/* cover: hinged on the spine */}
            <motion.div
              animate={{ rotateY: stage >= 2 ? -180 : 0 }}
              transition={{ duration: 2.6, ease: SLOW }}
              style={{ left: P, top: 0, width: P, height: P, transformOrigin: '0% 50%', transformStyle: 'preserve-3d' }}
              className="absolute"
            >
              <div className="absolute inset-0 overflow-hidden rounded-r-md bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.08)]" style={{ backfaceVisibility: 'hidden' }}>
                {cover && <SpreadView spread={cover} photos={photos} />}
                <div aria-hidden className="absolute inset-y-0 left-0 w-3 bg-gradient-to-r from-black/15 to-transparent" />
              </div>
              <div className="absolute inset-0 rounded-l-md bg-[#efe5d3]" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }} />
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
      )}

      {/* status line */}
      <div className="pointer-events-none absolute inset-x-0 bottom-[9%] text-center">
        <motion.p key={stage} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="font-[family-name:var(--font-hand)] text-3xl text-[var(--st-ink)]/80 sm:text-4xl">
          {LINES[Math.min(stage, 2)]}
        </motion.p>
        <div className="mx-auto mt-3 flex justify-center gap-1.5" aria-hidden>
          {[0, 1, 2].map((n) => (
            <span key={n} className={`h-1.5 rounded-full transition-all duration-700 ${stage >= n ? 'w-7 bg-[var(--st-peach-ink)]' : 'w-1.5 bg-foreground/20'}`} />
          ))}
        </div>
      </div>

      {!light && (
        <div className="absolute bottom-4 left-4 sm:bottom-6 sm:left-8">
          <Companion size={104} mood={mood} cue={cue} />
        </div>
      )}

      {stage >= 2 && !reduce && !light && <Celebration delay={1.2} />}
    </motion.div>
  )
}
