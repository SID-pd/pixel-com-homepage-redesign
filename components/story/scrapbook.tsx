'use client'

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { AlertCircle, ArrowLeft, ArrowRight, Check, Loader2, RotateCcw, X } from 'lucide-react'
import type { Photo } from '@/lib/flow/types'
import { cn } from '@/lib/utils'

// ---------------------------------------------------------------------------------------------------------------------
// Per-photo pipeline. Each photo owns its own timeline (queued -> uploading -> processing -> ready), independent of the
// chat and of the other photos, exactly like a real upload + analysis job would. Timers here are the mock; swap this hook
// for real upload/poll calls later and the cards do not change.
// ---------------------------------------------------------------------------------------------------------------------

export type PhotoState = 'queued' | 'uploading' | 'processing' | 'ready' | 'error'
export type PhotoStatus = { state: PhotoState; progress: number }

const rand = (a: number, b: number) => a + Math.random() * (b - a)

export function usePhotoPipeline(photos: Photo[]) {
  const initial = useRef<Set<string> | null>(null)
  if (initial.current === null) initial.current = new Set(photos.map((p) => p.id))
  const [status, setStatus] = useState<Record<string, PhotoStatus>>(() => Object.fromEntries(photos.map((p) => [p.id, { state: 'ready', progress: 100 }])))
  const seen = useRef<Set<string>>(new Set(initial.current))
  const timers = useRef<Set<number>>(new Set())
  const alive = useRef(true)

  useEffect(() => {
    alive.current = true
    const pending = timers.current
    return () => {
      alive.current = false
      pending.forEach((t) => window.clearTimeout(t))
      pending.clear()
    }
  }, [])

  const after = useCallback((ms: number, fn: () => void) => {
    const t = window.setTimeout(() => {
      timers.current.delete(t)
      if (alive.current) fn()
    }, ms)
    timers.current.add(t)
  }, [])

  const run = useCallback(
    (id: string, delay: number) => {
      const patch = (p: Partial<PhotoStatus>) => setStatus((s) => ({ ...s, [id]: { ...(s[id] ?? { state: 'queued', progress: 0 }), ...p } }))
      patch({ state: 'queued', progress: 0 })
      after(delay, () => {
        let progress = 4
        patch({ state: 'uploading', progress })
        const tick = () => {
          progress = Math.min(100, progress + rand(7, 15))
          if (progress >= 100) {
            patch({ state: 'processing', progress: 100 })
            after(rand(900, 1500), () => patch({ state: 'ready', progress: 100 }))
          } else {
            patch({ progress })
            after(rand(130, 210), tick)
          }
        }
        after(150, tick)
      })
    },
    [after],
  )

  useEffect(() => {
    const fresh = photos.filter((p) => !seen.current.has(p.id))
    if (!fresh.length) return
    fresh.forEach((p, i) => {
      seen.current.add(p.id)
      run(p.id, Math.min(i * 260, 4200))
    })
  }, [photos, run])

  const get = (id: string): PhotoStatus => status[id] ?? { state: 'queued', progress: 0 }
  const counts = photos.reduce(
    (c, p) => {
      const s = get(p.id).state
      c[s] += 1
      return c
    },
    { queued: 0, uploading: 0, processing: 0, ready: 0, error: 0 } as Record<PhotoState, number>,
  )
  return { get, counts, retry: (id: string) => run(id, 0), allReady: photos.length > 0 && counts.ready === photos.length }
}

// ---------------------------------------------------------------------------------------------------------------------

function hash(s: string) {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0
  return Math.abs(h)
}

export const tilt = (id: string) => ((hash(id) % 9) - 4) * 0.9

const TAPES = ['var(--st-butter)', 'var(--st-mint)', 'var(--st-lilac)', 'var(--st-peach)']

export function Polaroid({
  photo,
  index,
  status,
  caption,
  onCaption,
  onRetry,
  onRemove,
  onMove,
  canMoveLeft,
  canMoveRight,
  muted,
  overlay,
  below,
  onOpen,
  className,
}: {
  photo: Photo
  index: number
  status?: PhotoStatus
  caption?: string
  onCaption?: (v: string) => void
  onRetry?: () => void
  onRemove?: () => void
  onMove?: (dir: -1 | 1) => void
  canMoveLeft?: boolean
  canMoveRight?: boolean
  /** caption is not printed under any spread (it is not the first photo on its page) */
  muted?: boolean
  /** drawn over the photo (issue badges in the review step) */
  overlay?: ReactNode
  /** drawn under the photo (actions in the review step) */
  below?: ReactNode
  /** click the photo to look at it closely */
  onOpen?: () => void
  className?: string
}) {
  const reduce = useReducedMotion()
  const rot = tilt(photo.id)
  const st = status ?? { state: 'ready' as const, progress: 100 }

  return (
    <motion.figure
      initial={{ opacity: 0, y: reduce ? 0 : 18, rotate: reduce ? 0 : rot - 4, scale: reduce ? 1 : 0.94 }}
      animate={{ opacity: 1, y: 0, rotate: rot, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={reduce ? undefined : { y: -4, rotate: 0, zIndex: 5 }}
      transition={{ type: 'spring', stiffness: 260, damping: 22, delay: Math.min(index * 0.05, 0.25) }}
      className={cn('group relative rounded-[6px] bg-white p-2 pb-3 shadow-[0_10px_24px_-12px_rgba(90,55,30,0.45),0_1px_2px_rgba(90,55,30,0.12)]', className)}
    >
      <span aria-hidden className="absolute -top-2 left-1/2 h-4 w-14 -translate-x-1/2 rotate-[-3deg] rounded-[2px] opacity-80 shadow-sm" style={{ background: TAPES[hash(photo.id) % TAPES.length] }} />

      <div className={cn('relative aspect-square overflow-hidden rounded-[3px] bg-[var(--st-cream)]', onOpen && 'cursor-zoom-in')} onClick={onOpen} role={onOpen ? 'button' : undefined} tabIndex={onOpen ? 0 : undefined} onKeyDown={onOpen ? (e) => (e.key === 'Enter' || e.key === ' ') && onOpen() : undefined} aria-label={onOpen ? `Open ${photo.name}` : undefined}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photo.src} alt={caption || photo.name} draggable={false} className={cn('size-full object-cover transition duration-500', st.state !== 'ready' && 'scale-105 blur-[1.5px] saturate-50')} />

        <AnimatePresence>
          {st.state === 'uploading' && (
            <motion.div key="up" exit={{ opacity: 0 }} className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/45 to-transparent p-2 pt-6 text-white">
              <div className="h-1 overflow-hidden rounded-full bg-white/35">
                <motion.div className="h-full origin-left rounded-full bg-[var(--st-peach)]" animate={{ width: `${st.progress}%` }} transition={{ duration: 0.15 }} />
              </div>
              <p className="mt-1 text-[10px] font-medium">Uploading {Math.round(st.progress)}%</p>
            </motion.div>
          )}
          {st.state === 'queued' && (
            <motion.p key="q" exit={{ opacity: 0 }} className="absolute inset-x-0 bottom-0 bg-black/35 p-1.5 text-center text-[10px] font-medium text-white">
              Waiting…
            </motion.p>
          )}
          {st.state === 'processing' && (
            <motion.div key="pr" exit={{ opacity: 0 }} className="absolute inset-0 grid place-items-center bg-[var(--st-lilac)]/45">
              <span className="inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-1 text-[10px] font-semibold text-[var(--st-lilac-ink)]">
                <Loader2 className="size-3 animate-spin" /> Getting to know it
              </span>
            </motion.div>
          )}
          {st.state === 'error' && (
            <motion.div key="er" className="absolute inset-0 grid place-items-center bg-[var(--st-peach)]/70">
              <button type="button" onClick={onRetry} className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-[var(--st-peach-ink)] shadow-sm">
                <AlertCircle className="size-3" /> Retry <RotateCcw className="size-3" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {overlay}

        {st.state === 'ready' && !overlay && (
          <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute right-1.5 top-1.5 grid size-5 place-items-center rounded-full bg-[var(--st-mint)] text-[var(--st-mint-ink)] shadow-sm">
            <Check className="size-3" strokeWidth={3} />
          </motion.span>
        )}

        {onRemove && (
          <button type="button" onClick={onRemove} aria-label={`Remove ${photo.name}`} className="absolute left-1.5 top-1.5 grid size-6 place-items-center rounded-full bg-white/90 text-foreground/70 opacity-100 shadow-sm transition hover:text-foreground sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
            <X className="size-3.5" />
          </button>
        )}
      </div>

      {onCaption !== undefined ? (
        <input
          value={caption ?? ''}
          onChange={(e) => onCaption(e.target.value)}
          aria-label={`Caption for photo ${index + 1}`}
          placeholder="Write a caption…"
          maxLength={90}
          title={muted ? 'Shares a page, so this caption is not printed' : undefined}
          className={cn('mt-2 w-full bg-transparent px-1 text-center font-[family-name:var(--font-hand)] text-lg leading-tight text-[var(--st-ink)] outline-none placeholder:text-foreground/30 focus:rounded focus:bg-[var(--st-butter)]/40', muted && 'opacity-45')}
        />
      ) : (
        caption && <figcaption className="mt-2 line-clamp-2 px-1 text-center font-[family-name:var(--font-hand)] text-lg leading-tight text-[var(--st-ink)]">{caption}</figcaption>
      )}

      {below}

      {onMove && (
        <div className="mt-1 flex items-center justify-center gap-1 sm:opacity-0 sm:transition sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
          <button type="button" disabled={!canMoveLeft} onClick={() => onMove(-1)} aria-label="Move earlier in the story" className="grid size-7 place-items-center rounded-full text-foreground/60 transition enabled:hover:bg-[var(--st-peach)]/50 disabled:opacity-25">
            <ArrowLeft className="size-3.5" />
          </button>
          <span className="text-[10px] font-semibold tabular-nums text-foreground/45">{index + 1}</span>
          <button type="button" disabled={!canMoveRight} onClick={() => onMove(1)} aria-label="Move later in the story" className="grid size-7 place-items-center rounded-full text-foreground/60 transition enabled:hover:bg-[var(--st-peach)]/50 disabled:opacity-25">
            <ArrowRight className="size-3.5" />
          </button>
        </div>
      )}
    </motion.figure>
  )
}

/** The scrapbook table shown beside the chat: photos land here as soon as they are chosen. */
export function ScrapbookTable({
  photos,
  status,
  onRetry,
  onRemove,
  title,
}: {
  photos: Photo[]
  status: (id: string) => PhotoStatus
  onRetry: (id: string) => void
  onRemove: (id: string) => void
  title?: string
}) {
  return (
    <div className="relative min-h-full overflow-hidden bg-[var(--st-cream)] [background-image:radial-gradient(rgba(150,100,60,0.13)_1px,transparent_1px)] [background-size:22px_22px]">
      <div className="mx-auto max-w-3xl px-5 py-8 sm:px-8">
        <p className="text-center font-[family-name:var(--font-hand)] text-2xl text-[var(--st-peach-ink)]">{title || 'Your scrapbook'}</p>
        <p className="mb-6 text-center text-xs text-foreground/50">{photos.length ? `${photos.length} moment${photos.length === 1 ? '' : 's'} on the table` : 'Photos land here as soon as you add them'}</p>

        {photos.length === 0 ? (
          <div className="relative mx-auto mt-6 h-64 max-w-sm" aria-hidden>
            {[-8, 3, 9].map((r, i) => (
              <motion.div
                key={r}
                initial={{ opacity: 0, y: 20, rotate: r - 6 }}
                animate={{ opacity: 1, y: 0, rotate: r }}
                transition={{ delay: 0.15 + i * 0.12, type: 'spring', stiffness: 200, damping: 20 }}
                className="absolute left-1/2 top-4 aspect-[4/5] w-40 -translate-x-1/2 rounded-md border-2 border-dashed border-[var(--st-peach-ink)]/25 bg-white/50"
                style={{ marginLeft: (i - 1) * 56 }}
              />
            ))}
          </div>
        ) : (
          <ul className="grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-3">
            <AnimatePresence initial={false}>
              {photos.map((p, i) => (
                <li key={p.id}>
                  <Polaroid photo={p} index={i} status={status(p.id)} onRetry={() => onRetry(p.id)} onRemove={() => onRemove(p.id)} />
                </li>
              ))}
            </AnimatePresence>
          </ul>
        )}
      </div>
    </div>
  )
}
