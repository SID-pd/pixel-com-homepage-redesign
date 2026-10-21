'use client'

import { useEffect, useRef } from 'react'
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from 'motion/react'
import { Check, ChevronLeft, ChevronRight, ImagePlus, LayoutGrid, Loader2, Trash2, X } from 'lucide-react'
import { ISSUE_LABEL, type PhotoReport } from '@/lib/flow/photo-check'
import type { Photo } from '@/lib/flow/types'
import { cn } from '@/lib/utils'
import { tilt, type PhotoStatus } from './scrapbook'

const SPRING = { type: 'spring', stiffness: 120, damping: 26, mass: 1 } as const

/**
 * One tile, one size. The same tile (same layoutId) is drawn in the bottom lane while a photo is uploading and in the top
 * shelf once it is ready, so when its status flips it glides up the screen instead of popping.
 */
function Tile({ photo, status, flag, onOpen }: { photo: Photo; status: PhotoStatus; flag?: boolean; onOpen: () => void }) {
  const reduce = useReducedMotion()
  const ready = status.state === 'ready'
  return (
    <motion.button
      type="button"
      layout
      layoutId={`dock-${photo.id}`}
      initial={reduce ? false : { opacity: 0, scale: 0.8, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0, rotate: reduce ? 0 : tilt(photo.id) * 0.35 }}
      exit={{ opacity: 0, scale: 0.8 }}
      whileHover={reduce ? undefined : { y: -2, rotate: 0 }}
      transition={SPRING}
      onClick={onOpen}
      aria-label={`${photo.name}, ${ready ? 'ready' : 'uploading'}. Open`}
      className="relative size-12 shrink-0 cursor-zoom-in rounded-lg bg-white p-[3px] shadow-[0_6px_14px_-8px_rgba(90,55,30,0.6)] sm:size-14"
    >
      <span className="relative block size-full overflow-hidden rounded-[5px] bg-[var(--st-cream)]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photo.src} alt="" draggable={false} className={cn('size-full object-cover transition duration-500', !ready && 'scale-105 blur-[1px] saturate-50')} />
        {!ready && (
          <span className="absolute inset-x-0 bottom-0 h-1.5 bg-black/25">
            <span className="block h-full origin-left bg-[var(--st-peach)] transition-[width] duration-300 ease-out" style={{ width: `${status.state === 'queued' ? 4 : status.state === 'processing' ? 100 : status.progress}%` }} />
          </span>
        )}
        {status.state === 'processing' && <Loader2 className="absolute inset-0 m-auto size-4 animate-spin text-white drop-shadow" />}
      </span>
      {ready && (
        <span className={cn('absolute -right-1 -top-1 grid size-4 place-items-center rounded-full shadow-sm', flag ? 'bg-[var(--st-peach)] text-[var(--st-peach-ink)]' : 'bg-[var(--st-mint)] text-[var(--st-mint-ink)]')}>
          {flag ? <span className="size-1.5 rounded-full bg-current" /> : <Check className="size-2.5" strokeWidth={3} />}
        </span>
      )}
    </motion.button>
  )
}

/**
 * Persistent photo rail down the right edge, so uploading feels like it is happening in the background.
 *  - upper zone: photos that are uploaded and ready (they float up here)
 *  - lower zone: photos still on their way
 * Tap any photo to look at it closely and remove it.
 */
export function PhotoDock({ photos, status, flags, checking, onOpen, onAdd, onManage }: { photos: Photo[]; status: (id: string) => PhotoStatus; flags: Set<string>; checking: { active: boolean; done: number; total: number }; onOpen: (id: string) => void; onAdd: () => void; onManage: () => void }) {
  const ready = photos.filter((p) => status(p.id).state === 'ready')
  const waiting = photos.filter((p) => status(p.id).state !== 'ready')
  const readyRef = useRef<HTMLDivElement>(null)

  // keep the newest arrival in view
  useEffect(() => {
    const el = readyRef.current
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
  }, [ready.length])

  return (
    <LayoutGroup id="photo-dock">
      <AnimatePresence>
        {photos.length > 0 && (
          <motion.aside key="rail" initial={{ opacity: 0, x: 48 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 48 }} transition={SPRING} aria-label="Your photos" className="pointer-events-none absolute bottom-3 right-2 top-3 z-20 flex w-[4.4rem] flex-col sm:right-4 sm:w-[5rem]">
            <div className="pointer-events-auto flex min-h-0 flex-1 flex-col items-center rounded-3xl bg-white/85 px-1.5 py-2 shadow-[0_14px_34px_-20px_rgba(90,55,30,0.65)] ring-1 ring-white">
              <button type="button" onClick={onManage} aria-label="See all photos and manage them" title="All photos" className="grid size-10 shrink-0 place-items-center rounded-full bg-[var(--st-ink)] text-white transition hover:scale-105 active:scale-95">
                <LayoutGrid className="size-[18px]" />
              </button>
              <button type="button" onClick={onAdd} aria-label="Add more photos" title="Add photos" className="mt-1.5 grid size-8 shrink-0 place-items-center rounded-full bg-white text-foreground/70 ring-1 ring-foreground/15 transition hover:text-foreground hover:ring-foreground/30">
                <ImagePlus className="size-4" />
              </button>
              <p className="mt-1.5 shrink-0 text-center text-[10px] font-semibold leading-tight">
                On the table
                <span className="block tabular-nums text-foreground/55">
                  {ready.length}/{photos.length}
                </span>
              </p>
              {checking.active && (
                <div className="mt-1.5 w-full shrink-0 px-1" role="progressbar" aria-label="Checking photos" aria-valuenow={checking.done} aria-valuemin={0} aria-valuemax={checking.total}>
                  <div className="h-[3px] overflow-hidden rounded-full bg-[var(--st-lilac)]">
                    <div className="h-full rounded-full bg-[var(--st-lilac-ink)] transition-[width] duration-500 ease-out" style={{ width: `${checking.total ? (checking.done / checking.total) * 100 : 0}%` }} />
                  </div>
                  <p className="mt-0.5 text-center text-[9px] font-medium text-[var(--st-lilac-ink)]">Checking</p>
                </div>
              )}

              <div ref={readyRef} className="mt-2 flex min-h-0 w-full flex-1 flex-col items-center gap-2.5 overflow-y-auto px-0.5 py-1.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <AnimatePresence initial={false}>
                  {ready.map((p) => (
                    <Tile key={p.id} photo={p} status={status(p.id)} flag={flags.has(p.id)} onOpen={() => onOpen(p.id)} />
                  ))}
                </AnimatePresence>
              </div>

              <AnimatePresence initial={false}>
                {waiting.length > 0 && (
                  <motion.div key="lane" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={SPRING} className="flex max-h-[40%] min-h-0 w-full shrink-0 flex-col items-center overflow-hidden border-t border-[var(--st-peach)]/70 pt-2">
                    <p className="mb-1.5 shrink-0 text-center text-[10px] font-semibold leading-tight text-foreground/70">
                      Uploading
                      <span className="block tabular-nums text-foreground/50">{waiting.length} left</span>
                    </p>
                    <div className="flex min-h-0 w-full flex-1 flex-col items-center gap-2.5 overflow-y-auto px-0.5 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                      <AnimatePresence initial={false}>
                        {waiting.map((p) => (
                          <Tile key={p.id} photo={p} status={status(p.id)} onOpen={() => onOpen(p.id)} />
                        ))}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </LayoutGroup>
  )
}


/**
 * Phones and tablets: the right-hand rail would eat a fifth of the screen, so the same information lives in one small pill
 * in the corner. It shows the newest photos, how many are on the table, and whether anything is still uploading or being
 * checked. Tap it to open the full overview.
 */
export function PhotoPill({ photos, status, checking, onManage, className }: { photos: Photo[]; status: (id: string) => PhotoStatus; checking: { active: boolean; done: number; total: number }; onManage: () => void; className?: string }) {
  const ready = photos.filter((p) => status(p.id).state === 'ready')
  const waiting = photos.length - ready.length
  const recent = ready.slice(-3)
  return (
    <AnimatePresence>
      {photos.length > 0 && (
        <motion.button
          type="button"
          onClick={onManage}
          initial={{ opacity: 0, y: 16, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16 }}
          transition={SPRING}
          aria-label={`${photos.length} photos${waiting ? `, ${waiting} still uploading` : ''}. Open all photos`}
          className={cn('flex h-14 items-center gap-3 rounded-full bg-white/95 py-1.5 pl-2 pr-4 shadow-[0_14px_34px_-14px_rgba(90,55,30,0.7)] ring-1 ring-black/5 active:scale-[0.97]', className)}
        >
          <span className="relative flex h-11 w-[3.6rem] shrink-0 items-center">
            {recent.map((p, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={p.id} src={p.src || undefined} alt="" className="absolute size-10 rounded-lg border-2 border-white object-cover shadow-sm" style={{ left: i * 14, zIndex: i, transform: `rotate(${(i - 1) * 6}deg)` }} />
            ))}
          </span>
          <span className="text-left leading-tight">
            <span className="block text-sm font-semibold text-[var(--st-ink,#16324f)]">{photos.length} photos</span>
            <span className={cn('block text-[11px] font-medium', waiting || checking.active ? 'text-[var(--st-lilac-ink,#6a4fc4)]' : 'text-[var(--st-mint-ink,#1f7a5c)]')}>
              {waiting ? `Uploading ${waiting}…` : checking.active ? 'Checking…' : 'All ready · tap to manage'}
            </span>
          </span>
          {waiting > 0 || checking.active ? <Loader2 className="size-4 animate-spin text-[var(--st-lilac-ink,#6a4fc4)]" /> : <LayoutGrid className="size-4 text-foreground/50" />}
        </motion.button>
      )}
    </AnimatePresence>
  )
}

/** Close-up of a single photo: its state, anything Pixie noticed, and a way to remove it. */
export function PhotoViewer({
  photos,
  id,
  status,
  reports,
  onNav,
  onRemove,
  onClose,
}: {
  photos: Photo[]
  id: string
  status: (id: string) => PhotoStatus
  reports: Record<string, PhotoReport> | null
  onNav: (id: string) => void
  onRemove: (id: string) => void
  onClose: () => void
}) {
  const i = photos.findIndex((p) => p.id === id)
  const photo = photos[i]
  const closeRef = useRef<HTMLButtonElement>(null)
  const go = (d: -1 | 1) => {
    const n = photos[(i + d + photos.length) % photos.length]
    if (n) onNav(n.id)
  }

  useEffect(() => {
    closeRef.current?.focus()
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') go(-1)
      if (e.key === 'ArrowRight') go(1)
    }
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i, photos.length])

  if (!photo) return null
  const st = status(photo.id)
  const rep = reports?.[photo.id]
  const remove = () => {
    const rest = photos.filter((p) => p.id !== photo.id)
    onRemove(photo.id)
    if (rest.length) onNav(rest[Math.min(i, rest.length - 1)].id)
    else onClose()
  }

  return (
    <motion.div role="dialog" aria-modal="true" aria-label={`Photo ${i + 1} of ${photos.length}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="fixed inset-0 z-50 grid place-items-center bg-[rgba(40,25,18,0.6)] p-3 sm:p-6" onClick={onClose}>
      <motion.div initial={{ opacity: 0, scale: 0.94, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }} transition={SPRING} onClick={(e) => e.stopPropagation()} className="relative flex max-h-full w-full max-w-3xl flex-col overflow-hidden rounded-[2rem] bg-white shadow-2xl">
        <div className="relative grid min-h-0 flex-1 place-items-center bg-[var(--st-cream)] p-3 sm:p-5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photo.src} alt={photo.name} className="max-h-[58vh] w-auto max-w-full rounded-lg object-contain shadow-lg" />
          {photos.length > 1 && (
            <>
              <button type="button" onClick={() => go(-1)} aria-label="Previous photo" className="absolute left-3 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-white shadow-lg transition hover:scale-105">
                <ChevronLeft className="size-5" />
              </button>
              <button type="button" onClick={() => go(1)} aria-label="Next photo" className="absolute right-3 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-white shadow-lg transition hover:scale-105">
                <ChevronRight className="size-5" />
              </button>
            </>
          )}
          <button ref={closeRef} type="button" onClick={onClose} aria-label="Close" className="absolute right-3 top-3 grid size-10 place-items-center rounded-full bg-white shadow-lg transition hover:scale-105">
            <X className="size-5" />
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 p-4 sm:px-6">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{photo.name}</p>
            <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-foreground/60">
              <span className="tabular-nums">
                {photo.w} × {photo.h}px
              </span>
              <span className="tabular-nums">
                {i + 1} of {photos.length}
              </span>
              <span className={cn('rounded-full px-2 py-0.5 font-semibold', st.state === 'ready' ? 'bg-[var(--st-mint)] text-[var(--st-mint-ink)]' : 'bg-[var(--st-lilac)] text-[var(--st-lilac-ink)]')}>
                {st.state === 'ready' ? 'Ready' : st.state === 'processing' ? 'Getting to know it…' : `Uploading ${Math.round(st.progress)}%`}
              </span>
              {rep?.issues.map((k) => (
                <span key={k} className="rounded-full bg-[var(--st-peach)] px-2 py-0.5 font-semibold text-[var(--st-peach-ink)]">
                  {ISSUE_LABEL[k]}
                </span>
              ))}
            </p>
          </div>
          <button type="button" onClick={remove} className="inline-flex h-11 items-center gap-2 rounded-full bg-[var(--st-ink)] px-5 text-sm font-semibold text-white transition hover:opacity-90 active:scale-95">
            <Trash2 className="size-4" /> Remove photo
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}
