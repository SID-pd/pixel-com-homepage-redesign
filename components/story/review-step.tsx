'use client'

import { useState, type ReactNode } from 'react'
import { AlertTriangle, Check, Copy, EyeOff, LayoutGrid, Sun, Trash2, Undo2, ZoomIn } from 'lucide-react'
import { ISSUE_LABEL, isSuggestedRemoval, type PhotoIssue, type PhotoReport } from '@/lib/flow/photo-check'
import { photoThumb } from '@/lib/flow/images'
import type { Photo } from '@/lib/flow/types'
import { cn } from '@/lib/utils'
import { Polaroid } from './scrapbook'

export const TONE: Record<PhotoIssue, string> = {
  duplicate: 'bg-[var(--st-peach)] text-[var(--st-peach-ink)]',
  'low-res': 'bg-[var(--st-butter)] text-[#7a5b00]',
  blurry: 'bg-[var(--st-lilac)] text-[var(--st-lilac-ink)]',
  dark: 'bg-[#e5e0dc] text-[#4a413c]',
}
export const ICON: Record<PhotoIssue, typeof Copy> = { duplicate: Copy, 'low-res': AlertTriangle, blurry: EyeOff, dark: Sun }

function Badges({ children }: { children: ReactNode }) {
  return <span className="absolute inset-x-1.5 top-1.5 flex flex-col items-start gap-1">{children}</span>
}

function IssueBadge({ k, extra }: { k: PhotoIssue; extra?: string }) {
  const Icon = ICON[k]
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold shadow-sm', TONE[k])}>
      <Icon className="size-3" /> {ISSUE_LABEL[k]}
      {extra}
    </span>
  )
}


/**
 * One set of similar photos, all shown together. The one we suggest keeping starts selected; tap a photo to flip it between
 * Keep and Remove, use the bin to delete a single photo right away, then apply, or keep them all.
 */
function SimilarGroup({
  n,
  original,
  copies,
  num,
  onRemove,
  onKeepAll,
  onOpen,
}: {
  n: number
  original: Photo
  copies: Photo[]
  num: (id: string) => number
  onRemove: (id: string) => void
  onKeepAll: (ids: string[]) => void
  onOpen?: (id: string) => void
}) {
  const all = [original, ...copies]
  const [keep, setKeep] = useState<Set<string>>(() => new Set([original.id]))
  const live = all.filter((p) => !keep.has(p.id))
  const toggle = (id: string) =>
    setKeep((s) => {
      const next = new Set(s)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  const keepCount = all.filter((p) => keep.has(p.id)).length

  return (
    <section aria-label={`Group ${n}: ${all.length} similar photos`} className="rounded-3xl bg-white/80 p-4 ring-1 ring-[var(--st-peach)]">
      <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1">
        <h3 className="text-sm font-semibold">Group {n}</h3>
        <span className="text-xs text-foreground/55">{all.length} similar photos. Pick the ones to keep.</span>
        <span className={cn('ml-auto rounded-full px-3 py-1 text-xs font-bold', keepCount === 0 ? 'bg-[var(--st-peach)] text-[var(--st-peach-ink)]' : 'bg-[var(--st-ink)] text-white')}>Keep {keepCount}</span>
      </div>

      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {all.map((p) => {
          const on = keep.has(p.id)
          return (
            <li key={p.id} className="flex flex-col items-center gap-1.5">
              <div className={cn('relative w-full overflow-hidden rounded-xl bg-white p-1 shadow-sm ring-2 transition', on ? 'ring-[var(--st-peach-ink)]' : 'ring-transparent')}>
                <button type="button" onClick={() => toggle(p.id)} aria-pressed={on} aria-label={`Photo ${num(p.id)}: ${on ? 'keeping' : 'removing'}. Tap to switch`} className="block aspect-square w-full overflow-hidden rounded-lg bg-[var(--st-cream)]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photoThumb(p)} alt="" draggable={false} loading="lazy" decoding="async" className={cn('size-full object-cover transition duration-300', !on && 'opacity-55 saturate-50')} />
                </button>
                <span className={cn('pointer-events-none absolute right-2 top-2 grid size-6 place-items-center rounded-full ring-2 ring-white', on ? 'bg-[var(--st-peach-ink)] text-white' : 'bg-white/90')}>{on && <Check className="size-3.5" strokeWidth={3} />}</span>
                {onOpen && (
                  <button type="button" onClick={() => onOpen(p.id)} aria-label={`Look closer at photo ${num(p.id)}`} className="absolute left-2 top-2 grid size-7 place-items-center rounded-full bg-white/90 text-foreground/70 shadow-sm transition hover:text-foreground">
                    <ZoomIn className="size-3.5" />
                  </button>
                )}
                <span className={cn('absolute inset-x-2 bottom-2 rounded-full px-2 py-1 text-center text-[11px] font-bold shadow-sm', on ? 'bg-[var(--st-peach-ink)] text-white' : 'bg-white text-foreground/70')}>{on ? 'Keep' : 'Remove'}</span>
              </div>
              <div className="flex w-full items-center justify-between gap-1 px-1 text-[11px] text-foreground/55">
                <span className="tabular-nums">
                  #{num(p.id)}
                  {p.id === original.id && <span className="ml-1 rounded-full bg-[var(--st-mint)] px-1.5 py-0.5 font-bold text-[var(--st-mint-ink)]">suggested</span>}
                </span>
                <button type="button" onClick={() => onRemove(p.id)} aria-label={`Delete photo ${num(p.id)} now`} title="Delete this photo now" className="grid size-8 place-items-center rounded-full text-foreground/55 transition hover:bg-[var(--st-peach)] hover:text-[var(--st-peach-ink)]">
                  <Trash2 className="size-4" />
                </button>
              </div>
            </li>
          )
        })}
      </ul>

      <div className="mt-3 flex flex-wrap items-center justify-end gap-2 border-t border-[var(--st-peach)]/60 pt-3">
        <button type="button" onClick={() => onKeepAll(all.filter((p) => p.id !== original.id).map((p) => p.id))} className="inline-flex h-10 items-center rounded-full bg-white px-4 text-xs font-semibold text-foreground/70 ring-1 ring-foreground/15 transition hover:ring-foreground/30">
          Keep all {all.length}
        </button>
        <button type="button" disabled={live.length === 0} onClick={() => live.forEach((p) => onRemove(p.id))} className="inline-flex h-10 items-center gap-1.5 rounded-full bg-[var(--st-ink)] px-4 text-xs font-semibold text-white transition enabled:hover:opacity-90 enabled:active:scale-95 disabled:opacity-40">
          <Trash2 className="size-3.5" /> Remove {live.length} marked
        </button>
      </div>
    </section>
  )
}

/**
 * The end-of-chat photo review. By now every photo has been uploaded and checked quietly in the background (see the rail),
 * so this only shows what is left to judge. Duplicates are shown next to the photo they match so they can be compared.
 */
export function ReviewBody({
  photos,
  reports,
  checking,
  ignored,
  onKeep,
  onUndoKeep,
  onRemove,
  onOpen,
  onManage,
}: {
  photos: Photo[]
  reports: Record<string, PhotoReport> | null
  checking: { active: boolean; done: number; total: number }
  ignored: Set<string>
  onKeep: (id: string) => void
  onUndoKeep: (id: string) => void
  onRemove: (id: string) => void
  onOpen?: (id: string) => void
  onManage: () => void
}) {
  if (!reports) {
    const pct = checking.total ? (checking.done / checking.total) * 100 : 0
    return (
      <div className="flex items-center gap-3 rounded-2xl bg-[var(--st-lilac)]/55 px-4 py-3 text-sm font-medium text-[var(--st-lilac-ink)]" aria-live="polite">
        <span>{checking.total ? `Finishing the photo check… ${checking.done}/${checking.total}` : 'Waiting for your photos to finish uploading…'}</span>
        <span className="ml-auto h-1 w-24 overflow-hidden rounded-full bg-white/80">
          <span className="block h-full rounded-full bg-[var(--st-lilac-ink)] transition-[width] duration-500 ease-out" style={{ width: `${pct}%` }} />
        </span>
      </div>
    )
  }

  const byId = new Map(photos.map((p) => [p.id, p]))
  const flagged = photos.filter((p) => reports[p.id]?.issues.length)
  const pending = flagged.filter((p) => !ignored.has(p.id))
  const kept = flagged.length - pending.length
  const fine = photos.length - flagged.length

  // duplicate copies that still need a decision, grouped under the photo they match (the one we suggest keeping)
  const groups = new Map<string, Photo[]>()
  for (const p of pending) {
    const of = reports[p.id].duplicateOf
    if (of && byId.has(of)) groups.set(of, [...(groups.get(of) ?? []), p])
  }
  const inGroup = new Set([...groups.values()].flat().map((p) => p.id))
  const singles = pending.filter((p) => !inGroup.has(p.id) && !groups.has(p.id))
  const left = singles.length + inGroup.size

  const num = (id: string) => photos.findIndex((x) => x.id === id) + 1

  return (
    <div className="space-y-5">
      <div className={cn('flex flex-wrap items-center gap-x-3 gap-y-2 rounded-2xl px-4 py-3 text-sm', left ? 'bg-white' : 'bg-[var(--st-mint)]/70 text-[var(--st-mint-ink)]')}>
        {left ? (
          <>
            <span className="font-semibold">
              {left} photo{left === 1 ? '' : 's'} left to judge
            </span>
            <span className="text-foreground/55">
              {fine} look great{kept ? `, ${kept} kept` : ''}. These are suggestions, you decide.
            </span>
          </>
        ) : (
          <span className="inline-flex items-center gap-2 font-semibold">
            <Check className="size-4" /> Nothing needs your attention. All {photos.length} photos are good to go{kept ? ` (you kept ${kept} flagged)` : ''}.
          </span>
        )}
        <button type="button" onClick={onManage} className="ml-auto inline-flex h-9 items-center gap-2 rounded-full bg-[var(--st-ink)] px-4 text-xs font-semibold text-white transition hover:opacity-90 active:scale-95">
          <LayoutGrid className="size-3.5" /> All photos
        </button>
      </div>

      {[...groups.entries()].map(([origId, copies], gi) => (
        <SimilarGroup key={origId} n={gi + 1} original={byId.get(origId)!} copies={copies} num={num} onRemove={onRemove} onKeepAll={(ids) => ids.forEach(onKeep)} onOpen={onOpen} />
      ))}

      {singles.length > 0 && (
        <ul className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4">
          {singles.map((p, i) => {
            const r = reports[p.id]
            return (
              <li key={p.id}>
                <Polaroid
                  photo={p}
                  index={i}
                  status={{ state: 'ready', progress: 100 }}
                  onOpen={onOpen ? () => onOpen(p.id) : undefined}
                  overlay={
                    <Badges>
                      {r.issues.map((k) => (
                        <IssueBadge key={k} k={k} />
                      ))}
                    </Badges>
                  }
                  below={
                    <div className="mt-2 flex items-center justify-center gap-1.5">
                      <button type="button" onClick={() => onRemove(p.id)} className={cn('inline-flex h-8 items-center gap-1 rounded-full px-3 text-xs font-semibold transition', isSuggestedRemoval(r) ? 'bg-[var(--st-ink)] text-white' : 'bg-white text-foreground/70 ring-1 ring-foreground/15 hover:ring-foreground/30')}>
                        <Trash2 className="size-3" /> Remove
                      </button>
                      <button type="button" onClick={() => onKeep(p.id)} className="inline-flex h-8 items-center rounded-full bg-white px-3 text-xs font-semibold text-foreground/70 ring-1 ring-foreground/15 transition hover:ring-foreground/30">
                        Keep
                      </button>
                    </div>
                  }
                />
              </li>
            )
          })}
        </ul>
      )}

      {kept > 0 && left > 0 && (
        <button type="button" onClick={() => flagged.filter((p) => ignored.has(p.id)).forEach((p) => onUndoKeep(p.id))} className="inline-flex items-center gap-1.5 text-xs font-semibold text-foreground/55 underline-offset-4 hover:text-foreground hover:underline">
          <Undo2 className="size-3" /> Review the {kept} I kept again
        </button>
      )}
    </div>
  )
}
