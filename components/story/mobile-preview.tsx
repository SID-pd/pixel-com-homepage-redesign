'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createPortal } from 'react-dom'
import { motion } from 'motion/react'
import { AlertTriangle, ArrowLeft, ArrowRight, BookOpen, ChevronLeft, ChevronRight, Lock, LockOpen, Pencil, RefreshCw, RotateCw, Rows3, Shuffle, Smartphone, Sparkles, X } from 'lucide-react'
import { AccountMenu } from '@/components/flow/account-menu'
import { CartBadgeLink } from '@/components/flow/flow-shell'
import { PixovoLogo } from '@/components/pixel/pixovo-logo'
import { flow, getState } from '@/lib/flow/store'
import { applyPhotoCaptions, captionIdeas, captionItem, type StoryTone } from '@/lib/flow/story'
import type { BookConfig, Photo, Spread } from '@/lib/flow/types'
import { cn } from '@/lib/utils'
import { PagesScroll } from './book-reader'
import { Flipbook, spreadLabel } from './flipbook'
import { StageBackdrop } from './stage-parts'
import { storyVars } from './story-theme'
import { SinglePageBook } from './single-page-book'
import { useMediaQuery } from './use-media'
import { usePreviewActions } from './use-preview-actions'

const emptySpots = (s: Spread) => s.items.filter((it) => it.type === 'photo' && !it.photoId).length

/** Which way the phone is physically turned, from the gyro: 'cw' / 'ccw' = on its side, 'up' = upright, null = unknown. */
type Tilt = 'cw' | 'ccw' | 'up' | null

const AUTO_KEY = 'pixovo-auto-rotate'

/**
 * Reads the orientation sensor so the book can turn landscape even when the phone's own rotation lock is on.
 * gamma is the left/right lean: about +90 when the phone is turned clockwise onto its side, -90 the other way.
 * Flat on a table tells us nothing, and there is a dead band between the two, so it keeps its last answer there.
 */
function useTilt(enabled: boolean): Tilt {
  const [tilt, setTilt] = useState<Tilt>(null)
  useEffect(() => {
    if (!enabled) return setTilt(null)
    let last: Tilt = null
    const on = (e: DeviceOrientationEvent) => {
      if (e.gamma === null || e.beta === null) return
      const g = e.gamma
      let next: Tilt = last
      if (Math.abs(g) > 58) next = g > 0 ? 'cw' : 'ccw'
      else if (Math.abs(g) < 32 && Math.abs(e.beta) > 35) next = 'up'
      if (next !== last) {
        last = next
        setTilt(next)
      }
    }
    window.addEventListener('deviceorientation', on)
    return () => window.removeEventListener('deviceorientation', on)
  }, [enabled])
  return tilt
}

/** iOS asks permission for motion sensors, and only from a tap. Everywhere else it is simply available. */
async function allowSensor(): Promise<'ok' | 'blocked' | 'none'> {
  const D = typeof window !== 'undefined' ? (window.DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> } | undefined) : undefined
  if (!D) return 'none'
  if (typeof D.requestPermission === 'function') {
    try {
      return (await D.requestPermission()) === 'granted' ? 'ok' : 'blocked'
    } catch {
      return 'blocked'
    }
  }
  return 'ok'
}

/** Re-deals the photos between the pages that are not locked. Locked pages stay as they are; each caption stays with its photo. */
function shuffleAll(locked: Set<string>) {
  const d = getState().draft
  if (!d) return
  const captions: Record<string, string> = {}
  const slots: { s: number; i: number }[] = []
  d.spreads.forEach((s, si) => {
    if (s.kind !== 'cover') {
      const first = s.items.find((it) => it.type === 'photo' && it.photoId)?.photoId
      const text = s.items.find((it) => it.type === 'text' && it.id.startsWith('c_'))?.text
      if (first && text) captions[first] = text
    }
    if (locked.has(s.id)) return
    s.items.forEach((it, ii) => {
      if (it.type === 'photo' && it.photoId) slots.push({ s: si, i: ii })
    })
  })
  const ids = slots.map(({ s, i }) => d.spreads[s].items[i].photoId as string)
  for (let i = ids.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[ids[i], ids[j]] = [ids[j], ids[i]]
  }
  const next = d.spreads.map((s) => ({ ...s, items: [...s.items] }))
  slots.forEach(({ s, i }, k) => {
    next[s].items[i] = { ...next[s].items[i], photoId: ids[k] }
  })
  flow.checkpoint()
  flow.apply(() => applyPhotoCaptions(next, captions))
}

const AI_TONES: { id: StoryTone; label: string }[] = [
  { id: 'warm', label: 'Warm' },
  { id: 'playful', label: 'Playful' },
  { id: 'poetic', label: 'Poetic' },
  { id: 'minimal', label: 'Minimal' },
]

/** Caption for the page on screen: type your own, or open the AI ideas and tap one. */
function CaptionEditor({ spread, label }: { spread: Spread; label: string }) {
  const [ideasOpen, setIdeasOpen] = useState(false)
  const [round, setRound] = useState(0)
  const [tone, setTone] = useState<StoryTone>('warm')
  const caption = spread.items.find((it) => it.type === 'text' && it.id.startsWith('c_'))
  const hasPhoto = spread.items.some((it) => it.type === 'photo' && it.photoId)
  if (spread.kind === 'cover' || !hasPhoto) return null

  function setCaption(text: string) {
    flow.apply((all) =>
      all.map((s) => {
        if (s.id !== spread.id) return s
        if (caption) return { ...s, items: s.items.map((it) => (it.id === caption.id ? { ...it, text } : it)) }
        return text ? { ...s, items: [...s.items, captionItem(text)] } : s
      }),
    )
  }

  return (
    <div className="mx-auto mt-1 w-full max-w-sm shrink-0">
      <div className="flex items-center gap-1.5">
        <label className="flex min-w-0 flex-1 items-center gap-2 rounded-full bg-white/80 px-4 py-1.5 focus-within:bg-white focus-within:ring-2 focus-within:ring-[#d4673f]/50">
          <Pencil className="size-3.5 shrink-0 text-[#16324f]/40" aria-hidden />
          <span className="sr-only">Caption for {label}</span>
          <input value={caption?.text ?? ''} onChange={(e) => setCaption(e.target.value)} placeholder="Type a caption…" maxLength={90} className="w-full bg-transparent text-center font-[family-name:var(--font-hand)] text-xl outline-none placeholder:text-[#16324f]/35" />
        </label>
        <button type="button" aria-pressed={ideasOpen} aria-label="AI caption ideas" onClick={() => setIdeasOpen((o) => !o)} className={cn('grid size-10 shrink-0 place-items-center rounded-full shadow-sm transition active:scale-95', ideasOpen ? 'bg-[#16324f] text-white' : 'bg-white text-[#16324f]')}>
          <Sparkles className="size-4" />
        </button>
      </div>
      {ideasOpen && (
        <div className="mt-1.5 rounded-2xl bg-white/80 p-2">
          <div className="flex items-center gap-1">
            {AI_TONES.map((t) => (
              <button key={t.id} type="button" onClick={() => { setTone(t.id); setRound(0) }} className={cn('h-7 rounded-full px-2.5 text-[11px] font-semibold transition', tone === t.id ? 'bg-[#16324f] text-white' : 'bg-[#16324f]/8 text-[#16324f]/70')}>
                {t.label}
              </button>
            ))}
            <button type="button" aria-label="More ideas" onClick={() => setRound((r) => r + 1)} className="ml-auto grid size-7 place-items-center rounded-full bg-[#16324f]/8 text-[#16324f] transition active:scale-95">
              <RefreshCw className="size-3.5" />
            </button>
          </div>
          <div className="mt-1.5 flex flex-col gap-1">
            {captionIdeas(round, 4, tone).map((line) => (
              <button key={line} type="button" onClick={() => { setCaption(line); setIdeasOpen(false) }} className="rounded-xl bg-white px-3 py-1.5 text-left font-[family-name:var(--font-hand)] text-lg leading-tight text-[#16324f] shadow-sm transition active:scale-[0.98]">
                {line}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/** Sticky bottom bar: the two things you do with a finished book, always in reach. */
function ActionBar({ config, className }: { config: BookConfig; className?: string }) {
  const { busy, checkout, edit } = usePreviewActions(config)
  return (
    <div className={cn('flex shrink-0 items-center gap-2', className)}>
      <button type="button" onClick={edit} className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-full bg-white px-5 text-[15px] font-semibold text-[#16324f] shadow-sm transition active:scale-95">
        <Pencil className="size-4" /> Edit
      </button>
      <button type="button" disabled={busy} onClick={checkout} className="inline-flex h-12 min-w-0 flex-1 items-center justify-center gap-2 rounded-full bg-[#d4673f] px-6 text-[15px] font-semibold text-white shadow-[0_10px_24px_-12px_rgba(212,103,63,0.9)] transition enabled:active:scale-[0.97] disabled:opacity-60">
        {busy ? 'One moment…' : 'Checkout'} <ArrowRight className="size-4" />
      </button>
    </div>
  )
}

const chip = 'inline-flex h-9 shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-3 text-xs font-semibold transition active:scale-95'

function Tabs({ tab, onTab }: { tab: 'flip' | 'scroll'; onTab: (t: 'flip' | 'scroll') => void }) {
  const on = 'bg-[#16324f] text-white shadow-sm'
  const off = 'text-[#16324f]/70'
  return (
    <div role="tablist" aria-label="How to look at your book" className="grid grid-cols-2 gap-1 rounded-full bg-white/70 p-1">
      <button type="button" role="tab" aria-selected={tab === 'flip'} onClick={() => onTab('flip')} className={cn('inline-flex h-9 items-center justify-center gap-2 whitespace-nowrap rounded-full px-4 text-[13px] font-semibold transition', tab === 'flip' ? on : off)}>
        <BookOpen className="size-4" /> Flip
      </button>
      <button type="button" role="tab" aria-selected={tab === 'scroll'} onClick={() => onTab('scroll')} className={cn('inline-flex h-9 items-center justify-center gap-2 whitespace-nowrap rounded-full px-4 text-[13px] font-semibold transition', tab === 'scroll' ? on : off)}>
        <Rows3 className="size-4" /> Scroll all pages
      </button>
    </div>
  )
}

/**
 * The whole book, spread wide, using the full screen. When the phone is upright but the book should be sideways (rotation locked,
 * or the gyro says it is on its side) the stage is turned a quarter, in whichever direction the phone was turned.
 */
function LandscapeReader({ config, spreads, photos, index, onIndex, onClose, onScroll, onShuffle, closable, tilt }: { config: BookConfig; spreads: Spread[]; photos: Photo[]; index: number; onIndex: (i: number) => void; onClose: () => void; onScroll: () => void; onShuffle: () => void; closable: boolean; tilt: Tilt }) {
  const upright = useMediaQuery('(orientation: portrait)')
  const last = spreads.length - 1
  const base = { position: 'fixed', top: 0, left: 0, width: '100dvh', height: '100vw', transformOrigin: 'top left' } as const
  const turned = upright ? (tilt === 'cw' ? { ...base, transform: 'translateY(100dvh) rotate(-90deg)' } : { ...base, transform: 'translateX(100vw) rotate(90deg)' }) : undefined

  return (
    <motion.div role="dialog" aria-modal="true" aria-label={`${config.title}, landscape view`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }} className="fixed inset-0 z-[75] overflow-hidden text-[var(--st-ink)]">
      <StageBackdrop />
      <div style={turned} className={cn('flex flex-col @container', !turned && 'absolute inset-0')}>
        <div className="flex shrink-0 items-center gap-2 px-3 pt-2">
          <Link href="/" aria-label="Pixovo home" className="shrink-0">
            <PixovoLogo className="[&_img]:h-7" />
          </Link>
          <div className="hidden shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-accent/20 bg-accent/10 px-2.5 py-1 text-xs font-semibold text-accent @min-[820px]:flex">
            <Sparkles className="size-3.5" aria-hidden /> Story Mode
          </div>
          <div className="ml-1 shrink-0">
            <Tabs tab="flip" onTab={(t) => t === 'scroll' && onScroll()} />
          </div>
          <span className="min-w-0 flex-1" />
          <button type="button" onClick={onShuffle} aria-label="Shuffle all" className={cn(chip, 'bg-white text-[#16324f] shadow-sm')}>
            <Shuffle className="size-3.5" /> <span className="hidden @min-[700px]:inline">Shuffle all</span>
          </button>
          <AccountMenu />
          <CartBadgeLink />
          {closable && (
            <button type="button" onClick={onClose} aria-label="Close landscape view" className="grid size-10 shrink-0 place-items-center rounded-full bg-white text-[#16324f] shadow-sm transition active:scale-95">
              <X className="size-5" />
            </button>
          )}
        </div>

        <div className="min-h-0 flex-1 px-4 py-1 [container-type:size]">
          <div className="grid size-full place-items-center">
            <Flipbook spreads={spreads} photos={photos} index={index} onIndex={onIndex} controls={false} rotate={turned ? (tilt === 'cw' ? -90 : 90) : 0} className="max-w-[min(100cqw,200cqh)]" />
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-4 px-4 pb-2 pt-1">
          <div className="flex shrink-0 items-center gap-2">
            <button type="button" onClick={() => onIndex(Math.max(0, index - 1))} disabled={index === 0} aria-label="Previous page" className="grid size-10 place-items-center rounded-full bg-white text-[#16324f] shadow-sm transition enabled:active:scale-95 disabled:opacity-35">
              <ChevronLeft className="size-5" />
            </button>
            <button type="button" onClick={() => onIndex(Math.min(last, index + 1))} disabled={index >= last} aria-label="Next page" className="grid size-10 place-items-center rounded-full bg-white text-[#16324f] shadow-sm transition enabled:active:scale-95 disabled:opacity-35">
              <ChevronRight className="size-5" />
            </button>
          </div>
          <p className="min-w-0 flex-1 truncate text-center text-xs font-semibold tabular-nums text-[#16324f]/65">
            {spreadLabel(index)} · {index + 1} of {spreads.length}
          </p>
          <ActionBar config={config} className="w-72 max-w-[55%] [&_button]:h-10" />
        </div>
      </div>
    </motion.div>
  )
}

/**
 * Phone preview: no bubble, no card. A Flip / Scroll switch, a row of small actions, the book filling the space, and Edit and
 * Checkout pinned to the bottom. Landscape opens from the Rotate button, from turning the phone, or from the gyro (Auto).
 */
export function MobilePreview({ config, spreads, photos, onAddPhotos }: { config: BookConfig; spreads: Spread[]; photos: Photo[]; onAddPhotos: () => void }) {
  const [spread, setSpread] = useState(0)
  const [tab, setTab] = useState<'flip' | 'scroll'>('flip')
  const [asked, setAsked] = useState(false)
  const [auto, setAuto] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [sync, setSync] = useState(0)
  const [note, setNote] = useState<string | null>(null)
  const [locked, setLocked] = useState<Set<string>>(() => new Set())
  const sideways = useMediaQuery('(orientation: landscape)')
  const tilt = useTilt(auto)
  const last = Math.max(0, spreads.length - 1)
  const i = Math.min(spread, last)
  const emptySpreads = spreads.filter((s) => emptySpots(s) > 0).length
  const phoneSide = tilt === 'cw' || tilt === 'ccw'

  useEffect(() => {
    try {
      if (localStorage.getItem(AUTO_KEY) === '1') setAuto(true)
    } catch {}
  }, [])

  // turning the phone back upright re-arms the auto-open
  useEffect(() => {
    if (tilt === 'up') setDismissed(false)
  }, [tilt])

  async function toggleAuto() {
    const next = !auto
    if (next) {
      const sensor = await allowSensor()
      if (sensor !== 'ok') {
        setNote(sensor === 'none' ? 'This device has no motion sensor, so use Rotate instead.' : 'Motion access was blocked. Allow it in your browser settings to use Auto.')
        return
      }
      setNote('Auto is on. Turn your phone sideways to open the full book.')
    } else setNote(null)
    setAuto(next)
    try {
      localStorage.setItem(AUTO_KEY, next ? '1' : '0')
    } catch {}
  }

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
    if (phoneSide) setDismissed(true)
    setSync((n) => n + 1)
    try {
      screen.orientation?.unlock?.()
      if (document.fullscreenElement) void document.exitFullscreen()
    } catch {}
  }
  function toScroll() {
    closeReader()
    setTab('scroll')
  }
  function shuffle() {
    shuffleAll(locked)
    setSync((n) => n + 1)
  }
  function toggleLock() {
    const id = spreads[i]?.id
    if (!id) return
    setLocked((prev) => {
      const next = new Set(prev)
      if (!next.delete(id)) next.add(id)
      return next
    })
  }

  const reader = tab === 'flip' && (asked || sideways || (auto && phoneSide && !dismissed))
  const pageLocked = !!spreads[i] && locked.has(spreads[i].id)

  return (
    <div className="flex h-full min-h-0 flex-col px-3">
      <div className="shrink-0 pt-2">
        <Tabs tab={tab} onTab={setTab} />
      </div>

      <div className="flex shrink-0 items-center gap-1.5 py-2">
        <button type="button" onClick={onAddPhotos} className={cn(chip, 'bg-white text-[#16324f] shadow-sm')}>
          <ArrowLeft className="size-3.5" /> Photos
        </button>
        <button type="button" onClick={shuffle} aria-label="Shuffle all unlocked pages" title="Shuffle" className={cn(chip, 'w-9 bg-white px-0 text-[#16324f] shadow-sm')}>
          <Shuffle className="size-4" />
        </button>
        <button type="button" onClick={toggleLock} aria-pressed={pageLocked} aria-label={pageLocked ? 'Unlock this page' : 'Lock this page so Shuffle skips it'} title={pageLocked ? 'Unlock page' : 'Lock page'} className={cn(chip, 'w-9 px-0', pageLocked ? 'bg-[#d4673f] text-white' : 'bg-white text-[#16324f] shadow-sm')}>
          {pageLocked ? <Lock className="size-4" /> : <LockOpen className="size-4" />}
        </button>
        <button type="button" onClick={openReader} className={cn(chip, 'ml-auto bg-white text-[#16324f] shadow-sm')}>
          <RotateCw className="size-3.5" /> Rotate
        </button>
        <button type="button" role="switch" aria-checked={auto} aria-label="Auto-rotate with the phone's motion sensor" onClick={toggleAuto} className={cn(chip, auto ? 'bg-[#16324f] text-white' : 'bg-white text-[#16324f] shadow-sm')}>
          <Smartphone className="size-3.5" /> Auto
        </button>
      </div>

      {emptySpreads > 0 && (
        <button type="button" onClick={onAddPhotos} className="mb-2 flex shrink-0 items-center gap-2 rounded-xl bg-[#fff6d6] px-3 py-2 text-left text-xs font-medium text-[#6b4f00]">
          <AlertTriangle className="size-3.5 shrink-0" />
          <span className="min-w-0 flex-1">
            {emptySpreads} spread{emptySpreads === 1 ? '' : 's'} with empty photo spots
          </span>
          <span className="font-semibold underline underline-offset-2">Add photos</span>
        </button>
      )}

      {tab === 'flip' ? (
        <>
          <div className="min-h-0 flex-1 [container-type:size]">
            <div className="grid size-full place-items-center">
              <SinglePageBook key={sync} spreads={spreads} photos={photos} start={i} onSpread={setSpread} className="max-w-[min(100cqw,calc(100cqh-4.5rem))]" />
            </div>
          </div>
          {spreads[i] && <CaptionEditor key={spreads[i].id} spread={spreads[i]} label={spreadLabel(i)} />}
          <p role="status" className={cn('shrink-0 pb-1 pt-1 text-center text-[11px]', note?.startsWith('Motion') || note?.startsWith('This') ? 'font-semibold text-[#b4532a]' : 'text-[#16324f]/55')}>
            {note ?? 'Tap Rotate, or turn your phone sideways, for the whole spread'}
          </p>
        </>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-3">
          <PagesScroll spreads={spreads} photos={photos} />
        </div>
      )}

      <ActionBar config={config} className="pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-1" />

      {reader && createPortal(<div style={storyVars} className="contents"><LandscapeReader config={config} spreads={spreads} photos={photos} index={i} onIndex={setSpread} onClose={closeReader} onScroll={toScroll} onShuffle={shuffle} closable={!sideways} tilt={tilt} /></div>, document.body)}
    </div>
  )
}
