'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion } from 'motion/react'
import { Check, ImagePlus, Loader2, Trash2, X } from 'lucide-react'
import { ISSUE_LABEL, isSuggestedRemoval, type PhotoReport } from '@/lib/flow/photo-check'
import { photoThumb } from '@/lib/flow/images'
import type { Photo } from '@/lib/flow/types'
import { cn } from '@/lib/utils'
import type { PhotoStatus } from './scrapbook'
import { ICON, TONE } from './review-step'

type Filter = 'all' | 'attention' | 'kept'

/**
 * Slide-in overview of every photo from the right-hand rail: what is uploaded, what Pixie flagged, what you kept.
 * Select several to remove them together, or tap one to look at it closely.
 */
export function PhotoManager({
  photos,
  status,
  reports,
  ignored,
  onOpen,
  onRemoveMany,
  onKeep,
  onUndoKeep,
  onAdd,
  onClose,
}: {
  photos: Photo[]
  status: (id: string) => PhotoStatus
  reports: Record<string, PhotoReport> | null
  ignored: Set<string>
  onOpen: (id: string) => void
  onRemoveMany: (ids: string[]) => void
  onKeep: (id: string) => void
  onUndoKeep: (id: string) => void
  onAdd: () => void
  onClose: () => void
}) {
  const [filter, setFilter] = useState<Filter>('all')
  const [selecting, setSelecting] = useState(false)
  const [picked, setPicked] = useState<Set<string>>(new Set())

  useEffect(() => {
    const key = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  }, [onClose])

  const flagged = (p: Photo) => !!reports?.[p.id]?.issues.length
  const attention = useMemo(() => photos.filter((p) => flagged(p) && !ignored.has(p.id)), [photos, reports, ignored])
  const kept = useMemo(() => photos.filter((p) => flagged(p) && ignored.has(p.id)), [photos, reports, ignored])
  const suggested = useMemo(() => photos.filter((p) => reports?.[p.id] && isSuggestedRemoval(reports[p.id]) && !ignored.has(p.id)), [photos, reports, ignored])
  const shown = filter === 'all' ? photos : filter === 'attention' ? attention : kept
  const uploading = photos.filter((p) => status(p.id).state !== 'ready').length

  const toggle = (id: string) =>
    setPicked((s) => {
      const n = new Set(s)
      if (n.has(id)) n.delete(id)
      else n.add(id)
      return n
    })
  const removePicked = () => {
    onRemoveMany([...picked])
    setPicked(new Set())
    setSelecting(false)
  }

  const tab = (id: Filter, label: string, n: number) => (
    <button key={id} type="button" role="tab" aria-selected={filter === id} onClick={() => setFilter(id)} className={cn('inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 text-xs font-semibold transition', filter === id ? 'bg-[var(--st-ink)] text-white' : 'bg-white text-foreground/70 ring-1 ring-[var(--st-peach)] hover:ring-[var(--st-peach-ink)]/40')}>
      {label} <span className={cn('tabular-nums', filter === id ? 'text-white/70' : 'text-foreground/45')}>{n}</span>
    </button>
  )

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }} className="fixed inset-0 z-50 bg-[rgba(40,25,18,0.35)]" onClick={onClose}>
      <motion.aside
        role="dialog"
        aria-modal="true"
        aria-label="All your photos"
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', stiffness: 220, damping: 30 }}
        onClick={(e) => e.stopPropagation()}
        className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-[var(--st-cream)] shadow-2xl"
      >
        <header className="flex items-start justify-between gap-3 border-b border-[var(--st-peach)]/60 px-5 pb-4 pt-5">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Your photos</h2>
            <p className="mt-0.5 text-xs text-foreground/60" aria-live="polite">
              {photos.length} total
              {uploading > 0 ? ` · ${uploading} still uploading` : ' · all uploaded'}
              {!reports ? ' · checking…' : ''}
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="grid size-10 place-items-center rounded-full bg-white shadow-sm transition hover:scale-105">
            <X className="size-5" />
          </button>
        </header>

        <div className="space-y-3 px-5 pt-4">
          <div role="tablist" aria-label="Filter photos" className="flex flex-wrap gap-2">
            {tab('all', 'All', photos.length)}
            {tab('attention', 'Needs a look', attention.length)}
            {tab('kept', 'Kept', kept.length)}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => { setSelecting((v) => !v); setPicked(new Set()) }} aria-pressed={selecting} className={cn('inline-flex h-9 items-center rounded-full px-3.5 text-xs font-semibold transition', selecting ? 'bg-[var(--st-peach)] text-[var(--st-peach-ink)]' : 'bg-white text-foreground/70 ring-1 ring-foreground/15 hover:ring-foreground/30')}>
              {selecting ? 'Done selecting' : 'Select'}
            </button>
            {suggested.length > 0 && (
              <button type="button" onClick={() => onRemoveMany(suggested.map((p) => p.id))} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[var(--st-peach)] px-3.5 text-xs font-semibold text-[var(--st-peach-ink)] transition hover:brightness-95 active:scale-95">
                <Trash2 className="size-3.5" /> Remove suggested ({suggested.length})
              </button>
            )}
            <button type="button" onClick={onAdd} className="ml-auto inline-flex h-9 items-center gap-1.5 rounded-full bg-white px-3.5 text-xs font-semibold text-foreground/75 ring-1 ring-foreground/15 transition hover:ring-foreground/30">
              <ImagePlus className="size-3.5" /> Add
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5 pt-4">
          {shown.length === 0 ? (
            <p className="py-12 text-center text-sm text-foreground/55">{filter === 'attention' ? 'Nothing left to judge. 🎉' : filter === 'kept' ? 'You haven’t kept any flagged photos.' : 'No photos yet.'}</p>
          ) : (
            <ul className="grid grid-cols-3 gap-2.5">
              {shown.map((p) => {
                const st = status(p.id)
                const r = reports?.[p.id]
                const sel = picked.has(p.id)
                const first = r?.issues[0]
                const Icon = first ? ICON[first] : null
                return (
                  <li key={p.id} className="relative">
                    <button
                      type="button"
                      onClick={() => (selecting ? toggle(p.id) : onOpen(p.id))}
                      aria-label={`${p.name}${first ? `, ${ISSUE_LABEL[first]}` : ''}${selecting ? (sel ? ', selected' : ', not selected') : ''}`}
                      aria-pressed={selecting ? sel : undefined}
                      className={cn('group relative block aspect-square w-full overflow-hidden rounded-xl bg-white p-1 shadow-sm ring-2 transition', sel ? 'ring-[var(--st-peach-ink)]' : 'ring-transparent hover:ring-[var(--st-peach)]')}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={photoThumb(p)} alt="" draggable={false} loading="lazy" decoding="async" className={cn('size-full rounded-lg object-cover transition', st.state !== 'ready' && 'scale-105 blur-[1px] saturate-50', sel && 'opacity-80')} />
                      {st.state !== 'ready' && <Loader2 className="absolute inset-0 m-auto size-5 animate-spin text-white drop-shadow" />}
                      {first && Icon && (
                        <span className={cn('absolute bottom-1.5 left-1.5 inline-flex size-6 items-center justify-center rounded-full shadow-sm', TONE[first])} title={ISSUE_LABEL[first]}>
                          <Icon className="size-3.5" />
                        </span>
                      )}
                      {selecting && (
                        <span className={cn('absolute right-1.5 top-1.5 grid size-5 place-items-center rounded-full ring-2 ring-white', sel ? 'bg-[var(--st-peach-ink)] text-white' : 'bg-white/90')}>
                          {sel && <Check className="size-3" strokeWidth={3} />}
                        </span>
                      )}
                    </button>
                    {filter === 'kept' && !selecting && (
                      <button type="button" onClick={() => onUndoKeep(p.id)} className="mt-1 w-full text-center text-[11px] font-semibold text-foreground/55 hover:text-foreground">
                        Review again
                      </button>
                    )}
                    {filter === 'attention' && !selecting && (
                      <button type="button" onClick={() => onKeep(p.id)} className="mt-1 w-full text-center text-[11px] font-semibold text-foreground/55 hover:text-foreground">
                        Keep
                      </button>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        {selecting && (
          <footer className="flex items-center justify-between gap-3 border-t border-[var(--st-peach)]/60 bg-white px-5 py-3">
            <p className="text-xs text-foreground/60">{picked.size} selected</p>
            <button type="button" disabled={picked.size === 0} onClick={removePicked} className="inline-flex h-11 items-center gap-2 rounded-full bg-[var(--st-ink)] px-5 text-sm font-semibold text-white transition enabled:hover:opacity-90 enabled:active:scale-95 disabled:opacity-40">
              <Trash2 className="size-4" /> Remove selected
            </button>
          </footer>
        )}
      </motion.aside>
    </motion.div>
  )
}
