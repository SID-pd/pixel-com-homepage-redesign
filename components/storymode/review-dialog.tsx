'use client'

import { useEffect, useMemo, useRef } from 'react'
import { motion } from 'motion/react'
import { ZoomIn } from 'lucide-react'
import { ISSUE_LABEL, type PhotoReport } from '@/lib/flow/photo-check'
import type { Photo } from '@/lib/flow/types'
import { cn } from '@/lib/utils'

/**
 * "Check these photos": only opens when something was found (similar photos or low quality). Nothing is removed until the
 * customer presses Continue; each photo is simply marked Keep or Remove, and the best of each similar set starts as Keep.
 */
export function ReviewDialog({
  photos,
  reports,
  marked,
  minPhotos,
  onSetMarked,
  onOpen,
  onUploadMore,
  onContinue,
  onBack,
  inline = false,
}: {
  photos: Photo[]
  reports: Record<string, PhotoReport>
  marked: Set<string>
  minPhotos: number
  onSetMarked: (next: Set<string>) => void
  onOpen: (id: string) => void
  onUploadMore: () => void
  onContinue: () => void
  onBack: () => void
  /** render as a card inside the page (the chat) instead of a modal over it */
  inline?: boolean
}) {
  const byId = useMemo(() => new Map(photos.map((p) => [p.id, p])), [photos])

  // similar sets: the suggested original plus every copy that points at it
  const groups = useMemo(() => {
    const g = new Map<string, Photo[]>()
    for (const p of photos) {
      const of = reports[p.id]?.duplicateOf
      if (of && byId.has(of)) g.set(of, [...(g.get(of) ?? [byId.get(of)!]), p])
    }
    return [...g.values()]
  }, [photos, reports, byId])
  const inGroup = useMemo(() => new Set(groups.flat().map((p) => p.id)), [groups])
  const lowQuality = useMemo(() => photos.filter((p) => !inGroup.has(p.id) && reports[p.id]?.issues.some((k) => k !== 'duplicate')), [photos, reports, inGroup])

  const keeping = photos.length - [...marked].filter((id) => byId.has(id)).length
  const short = Math.max(0, minPhotos - keeping)
  const num = (id: string) => photos.findIndex((x) => x.id === id) + 1

  const set = (id: string, remove: boolean) => {
    const next = new Set(marked)
    if (remove) next.add(id)
    else next.delete(id)
    onSetMarked(next)
  }
  const setMany = (ids: string[], remove: boolean) => {
    const next = new Set(marked)
    ids.forEach((id) => (remove ? next.add(id) : next.delete(id)))
    onSetMarked(next)
  }

  const closeRef = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    if (inline) return
    closeRef.current?.focus()
    const key = (e: KeyboardEvent) => e.key === 'Escape' && onBack()
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  }, [onBack, inline])

  const tile = (p: Photo, best?: boolean) => {
    const remove = marked.has(p.id)
    const issues = reports[p.id]?.issues.filter((k) => k !== 'duplicate') ?? []
    return (
      <li key={p.id} className="w-[8.5rem] shrink-0 sm:w-40">
        <div className={cn('relative overflow-hidden rounded-xl bg-white p-1 shadow-sm ring-2 transition', remove ? 'ring-transparent' : 'ring-[#d4673f]')}>
          <div className="relative aspect-square overflow-hidden rounded-lg bg-[#f4efe7]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.src} alt="" draggable={false} className={cn('size-full object-cover transition duration-300', remove && 'opacity-50 saturate-50')} />
            {best && <span className="absolute left-1.5 top-1.5 rounded-full bg-[#14a085] px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">Best</span>}
            <button type="button" onClick={() => onOpen(p.id)} aria-label={`Look closer at photo ${num(p.id)}`} className="absolute right-1.5 top-1.5 grid size-7 place-items-center rounded-full bg-white/90 text-[#16324f]/70 shadow-sm transition hover:text-[#16324f]">
              <ZoomIn className="size-3.5" />
            </button>
            {issues.length > 0 && <span className="absolute inset-x-1.5 bottom-1.5 truncate rounded-full bg-[#fff0b5] px-2 py-0.5 text-center text-[10px] font-bold text-[#7a5b00] shadow-sm">{issues.map((k) => ISSUE_LABEL[k]).join(' · ')}</span>}
          </div>
          <div className="mt-1.5 flex gap-1.5" role="group" aria-label={`Photo ${num(p.id)}`}>
            <button type="button" aria-pressed={!remove} onClick={() => set(p.id, false)} className={cn('h-8 flex-1 rounded-full text-xs font-semibold transition', !remove ? 'bg-[#16324f] text-white' : 'bg-[#f1ece4] text-[#16324f]/70 hover:bg-[#e9e2d6]')}>
              Keep
            </button>
            <button type="button" aria-pressed={remove} onClick={() => set(p.id, true)} className={cn('h-8 flex-1 rounded-full text-xs font-semibold transition', remove ? 'bg-[#16324f] text-white' : 'bg-[#f1ece4] text-[#16324f]/70 hover:bg-[#e9e2d6]')}>
              Remove
            </button>
          </div>
        </div>
      </li>
    )
  }

  return (
    <motion.div initial={inline ? false : { opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className={inline ? '' : 'fixed inset-0 z-[70] grid items-end bg-[rgba(22,50,79,0.5)] sm:place-items-center sm:p-6'} onClick={inline ? undefined : onBack}>
      <motion.div
        role="dialog"
        aria-modal={!inline}
        aria-labelledby="sm-review-title"
        initial={inline ? false : { opacity: 0, y: 48, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.98 }}
        transition={{ type: 'spring', stiffness: 160, damping: 24 }}
        onClick={(e) => e.stopPropagation()}
        className={inline ? 'flex w-full flex-col overflow-hidden rounded-3xl bg-white/90 ring-1 ring-[#efe7da]' : 'mx-auto flex max-h-[92dvh] w-full max-w-3xl flex-col overflow-hidden rounded-t-[1.75rem] bg-white shadow-2xl sm:max-h-full sm:rounded-[1.75rem]'}
      >
        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-2 pt-6 sm:px-8 sm:pt-8">
          <h2 id="sm-review-title" className="text-2xl font-bold tracking-tight text-[#16324f]">
            Check these photos
          </h2>
          <p className="mt-2 text-[15px] text-[#16324f]/80">We found some similar or soft photos. Choose what to keep. Nothing is removed until you press Continue.</p>

          {groups.length > 0 && (
            <section className="mt-6" aria-label="Similar photos">
              <h3 className="text-base font-semibold text-[#16324f]">Similar photos</h3>
              <div className="mt-3 divide-y divide-[#eee7db]">
                {groups.map((g, gi) => (
                  <div key={g[0].id} className="py-4 first:pt-0">
                    <p className="mb-2 text-xs font-semibold text-[#16324f]/55">
                      Group {gi + 1} · {g.length} similar photos
                    </p>
                    <ul className="flex flex-wrap gap-3">
                      {g.map((p, i) => tile(p, i === 0))}
                    </ul>
                    <div className="mt-2 flex gap-4 text-sm font-medium">
                      <button type="button" onClick={() => setMany(g.map((p) => p.id), false)} className="text-[#14a085] underline underline-offset-4 hover:no-underline">
                        Keep all
                      </button>
                      <button type="button" onClick={() => { const next = new Set(marked); g.forEach((p, i) => (i === 0 ? next.delete(p.id) : next.add(p.id))); onSetMarked(next) }} className="text-[#14a085] underline underline-offset-4 hover:no-underline">
                        Keep only the best
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {lowQuality.length > 0 && (
            <section className="mt-6" aria-label="Low quality photos">
              <h3 className="text-base font-semibold text-[#16324f]">Low quality photos</h3>
              <p className="mt-1 text-xs text-[#16324f]/55">Blurry, dark or too small to print crisply.</p>
              <ul className="mt-3 flex flex-wrap gap-3">
                {lowQuality.map((p) => tile(p))}
              </ul>
              <div className="mt-2 flex gap-4 text-sm font-medium">
                <button type="button" onClick={() => setMany(lowQuality.map((p) => p.id), false)} className="text-[#14a085] underline underline-offset-4 hover:no-underline">
                  Keep all
                </button>
                <button type="button" onClick={() => setMany(lowQuality.map((p) => p.id), true)} className="text-[#14a085] underline underline-offset-4 hover:no-underline">
                  Remove all
                </button>
              </div>
            </section>
          )}
        </div>

        <div className="flex flex-col gap-3 border-t border-[#eee7db] px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:px-8">
          <p className="text-sm text-[#16324f]" aria-live="polite">
            You’re keeping <strong>{keeping}</strong> of {photos.length} photos <span className="text-[#16324f]/60">(book needs at least {minPhotos})</span>
          </p>
          <div className="flex flex-wrap items-center gap-3">
            {short > 0 && (
              <p className="text-sm text-[#c0392b]">
                Keep {short} more, or{' '}
                <button type="button" onClick={onUploadMore} className="font-semibold text-[#16324f] underline underline-offset-4 hover:no-underline">
                  Upload more
                </button>
              </p>
            )}
            {!inline && (
              <button ref={closeRef} type="button" onClick={onBack} className="h-11 rounded-full px-4 text-sm font-semibold text-[#16324f]/70 transition hover:bg-[#f1ece4]">
                Back
              </button>
            )}
            <button type="button" disabled={short > 0} onClick={onContinue} className="h-12 rounded-full bg-[#d4673f] px-7 text-[15px] font-semibold text-white shadow-[0_10px_24px_-12px_rgba(212,103,63,0.9)] transition enabled:hover:brightness-105 enabled:active:scale-[0.97] disabled:opacity-45">
              Continue
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
