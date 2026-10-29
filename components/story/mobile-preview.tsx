'use client'

import { useEffect, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { AlertTriangle, ArrowRight, Images, Pencil, RotateCw, X } from 'lucide-react'
import { SpreadView } from '@/components/flow/spread-view'
import { flow } from '@/lib/flow/store'
import type { BookConfig, Photo, Spread } from '@/lib/flow/types'
import { cn } from '@/lib/utils'
import { Flipbook, spreadLabel } from './flipbook'
import { useMediaQuery } from './use-media'
import { usePreviewActions } from './use-preview-actions'

const emptySpots = (s: Spread) => s.items.filter((it) => it.type === 'photo' && !it.photoId).length

/** Sticky bottom bar: the two things you do with a finished book, always in reach. `dark` is for the landscape reader. */
function ActionBar({ config, onPhotos, dark = false, className }: { config: BookConfig; onPhotos?: () => void; dark?: boolean; className?: string }) {
  const { busy, checkout, edit } = usePreviewActions(config)
  const soft = dark ? 'bg-white/15 text-white' : 'bg-white text-[#16324f] shadow-sm'
  return (
    <div className={cn('flex shrink-0 items-center gap-2', className)}>
      {onPhotos && (
        <button type="button" onClick={onPhotos} aria-label="Back to photos" className={cn('grid size-12 shrink-0 place-items-center rounded-full transition active:scale-95', soft)}>
          <Images className="size-5" />
        </button>
      )}
      <button type="button" onClick={edit} className={cn('inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-full px-5 text-[15px] font-semibold transition active:scale-95', soft)}>
        <Pencil className="size-4" /> Edit
      </button>
      <button type="button" disabled={busy} onClick={checkout} className="ml-auto inline-flex h-12 min-w-0 flex-1 items-center justify-center gap-2 rounded-full bg-[#d4673f] px-6 text-[15px] font-semibold text-white shadow-[0_10px_24px_-12px_rgba(212,103,63,0.9)] transition enabled:active:scale-[0.97] disabled:opacity-60">
        {busy ? 'One moment…' : 'Checkout'} <ArrowRight className="size-4" />
      </button>
    </div>
  )
}

/**
 * The whole book, spread wide, using the full screen. On a phone held upright the stage is turned a quarter so the book gets the
 * long side of the screen (turn the phone and it is the right way up). Where the browser can lock the orientation we ask it to
 * instead, and the stage stays unturned.
 */
function LandscapeReader({ config, spreads, photos, index, onIndex, onClose, closable }: { config: BookConfig; spreads: Spread[]; photos: Photo[]; index: number; onIndex: (i: number) => void; onClose: () => void; closable: boolean }) {
  const upright = useMediaQuery('(orientation: portrait)')
  const last = spreads.length - 1
  const turned = upright
    ? ({ position: 'fixed', top: 0, left: 0, width: '100dvh', height: '100vw', transformOrigin: 'top left', transform: 'translateX(100vw) rotate(90deg)' } as const)
    : undefined

  return (
    <motion.div role="dialog" aria-modal="true" aria-label={`${config.title}, landscape view`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }} className="fixed inset-0 z-[75] bg-[#2b211c] text-white">
      <div style={turned} className={cn('flex flex-col', !turned && 'absolute inset-0')}>
        <div className="flex shrink-0 items-center justify-between gap-3 px-4 pt-2">
          <p className="min-w-0 truncate text-xs font-semibold text-white/75">
            {config.title} · {spreadLabel(index)} · {index + 1}/{spreads.length}
          </p>
          {closable && (
            <button type="button" onClick={onClose} aria-label="Close landscape view" className="grid size-10 shrink-0 place-items-center rounded-full bg-white/15 transition active:scale-95">
              <X className="size-5" />
            </button>
          )}
        </div>

        <div className="min-h-0 flex-1 px-4 py-1 [container-type:size]">
          <div className="grid size-full place-items-center">
            <Flipbook spreads={spreads} photos={photos} index={index} onIndex={onIndex} controls={false} className="max-w-[min(100cqw,200cqh)]" />
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-4 px-4 pb-2 pt-1">
          <input type="range" min={0} max={last} value={index} onChange={(e) => onIndex(Number(e.target.value))} aria-label="Jump to a page" aria-valuetext={spreadLabel(index)} className="h-1.5 min-w-0 flex-1 cursor-pointer appearance-none rounded-full bg-white/20 accent-[#ffdcc6]" />
          <ActionBar config={config} dark className="w-72 max-w-[55%] [&_button]:h-10" />
        </div>
      </div>
    </motion.div>
  )
}

/**
 * Phone preview: no bubble, no card, no scrolling page. The book fills the space, every page is one tap away in a strip, and
 * Edit and Checkout stay pinned to the bottom.
 */
export function MobilePreview({ config, spreads, photos, onAddPhotos }: { config: BookConfig; spreads: Spread[]; photos: Photo[]; onAddPhotos: () => void }) {
  const [index, setIndex] = useState(0)
  const [asked, setAsked] = useState(false)
  const sideways = useMediaQuery('(orientation: landscape)')
  const strip = useRef<HTMLDivElement>(null)
  const last = Math.max(0, spreads.length - 1)
  const i = Math.min(index, last)
  const spread = spreads[i]
  const caption = spread?.items.find((it) => it.type === 'text' && it.id.startsWith('c_'))
  const emptySpreads = spreads.filter((s) => emptySpots(s) > 0).length

  useEffect(() => {
    strip.current?.querySelector<HTMLElement>(`[data-i="${i}"]`)?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
  }, [i])

  // fullscreen + orientation lock are best-effort: they need a tap, and iOS has neither (the turned stage covers it)
  async function openReader() {
    setAsked(true)
    try {
      await document.documentElement.requestFullscreen?.()
      await (screen.orientation as ScreenOrientation & { lock?: (o: string) => Promise<void> }).lock?.('landscape')
    } catch {}
  }
  function closeReader() {
    setAsked(false)
    try {
      screen.orientation?.unlock?.()
      if (document.fullscreenElement) void document.exitFullscreen()
    } catch {}
  }

  function setCaption(text: string) {
    if (!spread || !caption) return
    flow.apply((all) => all.map((s) => (s.id !== spread.id ? s : { ...s, items: s.items.map((it) => (it.id === caption.id ? { ...it, text } : it)) })))
  }

  const reader = asked || sideways

  return (
    <div className="flex h-full min-h-0 flex-col px-3">
      <div className="flex shrink-0 items-center justify-between gap-3 pb-1 pt-2">
        <div className="min-w-0">
          <h2 className="truncate text-base font-bold text-[#16324f]">{config.title}</h2>
          <p className="text-xs font-medium tabular-nums text-[#16324f]/60">
            {spreadLabel(i)} · {i + 1} of {spreads.length}
          </p>
        </div>
        <button type="button" onClick={openReader} className="inline-flex h-10 shrink-0 items-center gap-2 rounded-full bg-white px-4 text-[13px] font-semibold text-[#16324f] shadow-sm transition active:scale-95">
          <RotateCw className="size-4" /> Landscape
        </button>
      </div>

      {emptySpreads > 0 && (
        <button type="button" onClick={onAddPhotos} className="mb-1 flex shrink-0 items-center gap-2 rounded-xl bg-[#fff6d6] px-3 py-2 text-left text-xs font-medium text-[#6b4f00]">
          <AlertTriangle className="size-3.5 shrink-0" />
          <span className="min-w-0 flex-1">
            {emptySpreads} spread{emptySpreads === 1 ? '' : 's'} with empty photo spots
          </span>
          <span className="font-semibold underline underline-offset-2">Add photos</span>
        </button>
      )}

      <div className="min-h-0 flex-1 [container-type:size]">
        <div className="grid size-full place-items-center">
          <Flipbook spreads={spreads} photos={photos} index={i} onIndex={setIndex} controls={false} className="max-w-[min(100cqw,200cqh)]" />
        </div>
      </div>

      {caption && (
        <label className="mx-auto mt-1 flex w-full max-w-sm shrink-0 items-center gap-2 rounded-full bg-white/80 px-4 py-1.5 focus-within:bg-white focus-within:ring-2 focus-within:ring-[#d4673f]/50">
          <Pencil className="size-3.5 shrink-0 text-[#16324f]/40" aria-hidden />
          <span className="sr-only">Caption for {spreadLabel(i)}</span>
          <input value={caption.text ?? ''} onChange={(e) => setCaption(e.target.value)} maxLength={90} className="w-full bg-transparent text-center font-[family-name:var(--font-hand)] text-xl outline-none" />
        </label>
      )}

      <div ref={strip} role="tablist" aria-label="Jump to a page" className="flex shrink-0 items-center gap-2 overflow-x-auto py-2 [scrollbar-width:none]">
        {spreads.map((s, n) => (
          <button key={s.id} type="button" role="tab" aria-selected={n === i} data-i={n} onClick={() => setIndex(n)} aria-label={spreadLabel(n)} className={cn('shrink-0 overflow-hidden rounded-md bg-white transition', n === i ? 'opacity-100 ring-2 ring-[#d4673f]' : 'opacity-60')} style={{ width: s.kind === 'cover' ? 40 : 80 }}>
            <SpreadView spread={s} photos={photos} />
          </button>
        ))}
      </div>

      <ActionBar config={config} onPhotos={onAddPhotos} className="pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-1" />

      {reader && <LandscapeReader config={config} spreads={spreads} photos={photos} index={i} onIndex={setIndex} onClose={closeReader} closable={!sideways} />}
    </div>
  )
}
