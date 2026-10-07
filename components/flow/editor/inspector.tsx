'use client'

import { useMemo } from 'react'
import {
  AlignCenterHorizontal, AlignCenterVertical, AlignLeft, AlignRight, AlignCenter, ArrowDown, ArrowUp, ChevronDown, ChevronUp, Copy,
  Crown, ImageIcon, Lock, Plus, Trash2, Unlock,
} from 'lucide-react'
import { FILTERS, FONTS, MAX_PAGES, MIN_PAGES, money } from '@/lib/flow/catalog'
import { unitPrice } from '@/lib/flow/pricing'
import type { Adjust, Item, Photo, Spread } from '@/lib/flow/types'
import { cn } from '@/lib/utils'
import { SpreadView, itemFilter } from '../spread-view'
import { BackgroundsPanel } from './panels'
import { createBurst, ops } from './ops'
import { TextEditor } from './text-tools'

export type InspectorTab = 'pages' | 'edit' | 'arrange' | 'page'

const ZERO: Adjust = { brightness: 0, contrast: 0, saturation: 0, warmth: 0 }

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-foreground/8 py-4 first:border-t-0 first:pt-0">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</h3>
      {children}
    </section>
  )
}

function Slider({
  label, value, min, max, onChange, burst,
}: {
  label: string
  value: number
  min: number
  max: number
  onChange: (n: number) => void
  burst: ReturnType<typeof createBurst>
}) {
  const id = `sl-${label.replace(/\s/g, '')}`
  return (
    <div className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1">
      <label htmlFor={id} className="text-sm">{label}</label>
      <output className="grid h-8 w-12 place-items-center rounded-lg ring-1 ring-inset ring-foreground/12 text-xs tabular-nums">{Math.round(value)}</output>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        value={value}
        onPointerDown={burst.begin}
        onPointerUp={burst.end}
        onKeyDown={burst.begin}
        onKeyUp={burst.end}
        onBlur={burst.end}
        onChange={(e) => {
          burst.begin()
          onChange(+e.target.value)
        }}
        className="col-span-2 h-6 w-full cursor-pointer accent-[#2f6bff]"
      />
    </div>
  )
}

function Segmented<T extends string>({ value, options, onChange }: { value: T; options: { id: T; label: React.ReactNode; aria?: string }[]; onChange: (v: T) => void }) {
  return (
    <div className="grid auto-cols-fr grid-flow-col gap-1.5 rounded-xl bg-secondary p-1" role="group">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          aria-pressed={value === o.id}
          aria-label={o.aria}
          onClick={() => onChange(o.id)}
          className={cn('flex h-9 items-center justify-center gap-1.5 rounded-lg text-xs font-medium transition', value === o.id ? 'bg-card shadow-xs ring-1 ring-foreground/10' : 'text-muted-foreground hover:text-foreground')}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function InspectorBody({
  tab, spread, item, photos, onRequestPhotos, onDeselect, aspect, onAddedItem,
}: {
  tab: Exclude<InspectorTab, 'pages'>
  spread: Spread
  item: Item | null
  photos: Photo[]
  onRequestPhotos: () => void
  onDeselect: () => void
  aspect: number
  onAddedItem?: (id: string) => void
}) {
  const burst = useMemo(() => createBurst(), [])

  if (tab === 'page') {
    return (
      <div>
        <BackgroundsPanel spread={spread} />
      </div>
    )
  }

  if (!item) {
    return (
      <p className="rounded-xl bg-secondary px-3.5 py-6 text-center text-sm text-muted-foreground">
        Select a photo, text or sticker on the page to edit it.
      </p>
    )
  }

  const patchLive = (p: Partial<Item>) => ops.patchLive(spread.id, item.id, p)
  const patch = (p: Partial<Item>) => ops.patch(spread.id, item.id, p)
  const photo = item.photoId ? photos.find((p) => p.id === item.photoId) : undefined

  if (tab === 'arrange') {
    return (
      <div>
        <Section title="Rotate">
          <Slider label="Angle" value={item.rotation} min={-180} max={180} onChange={(n) => patchLive({ rotation: n })} burst={burst} />
        </Section>
        <Section title="Align on page">
          <div className="grid grid-cols-2 gap-2">
            <ActionBtn onClick={() => patch({ x: (100 - item.w) / 2 })}><AlignCenterVertical className="size-4" /> Center ↔</ActionBtn>
            <ActionBtn onClick={() => patch({ y: (100 - item.h) / 2 })}><AlignCenterHorizontal className="size-4" /> Center ↕</ActionBtn>
          </div>
        </Section>
        <Section title="Order">
          <div className="grid grid-cols-2 gap-2">
            <ActionBtn onClick={() => ops.reorder(spread.id, item.id, 1)}><ArrowUp className="size-4" /> Forward</ActionBtn>
            <ActionBtn onClick={() => ops.reorder(spread.id, item.id, -1)}><ArrowDown className="size-4" /> Backward</ActionBtn>
          </div>
        </Section>
        <Section title="Actions">
          <div className="grid grid-cols-2 gap-2">
            <ActionBtn onClick={() => patch({ locked: !item.locked })}>{item.locked ? <Unlock className="size-4" /> : <Lock className="size-4" />}{item.locked ? 'Unlock' : 'Lock'}</ActionBtn>
            <ActionBtn onClick={() => ops.duplicate(spread.id, item.id)}><Copy className="size-4" /> Duplicate</ActionBtn>
            <ActionBtn danger onClick={() => { ops.remove(spread.id, item.id); onDeselect() }} className="col-span-2"><Trash2 className="size-4" /> Delete</ActionBtn>
          </div>
        </Section>
      </div>
    )
  }

  // tab === 'edit'
  if (item.type === 'photo') {
    const adj = item.adjust ?? ZERO
    const setAdj = (k: keyof Adjust, n: number) => patchLive({ adjust: { ...adj, [k]: n } })
    return (
      <div>
        <Section title="Image">
          <div className="flex items-center gap-3">
            <div className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-xl bg-secondary">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {photo?.src ? <img src={photo.src} alt="" className="size-full object-cover" style={{ filter: itemFilter(item) }} /> : <ImageIcon className="size-5 text-muted-foreground" />}
            </div>
            <button type="button" onClick={onRequestPhotos} className="h-11 flex-1 rounded-xl text-sm font-medium ring-1 ring-inset ring-foreground/15 transition hover:bg-foreground/5">
              {photo ? 'Replace Image' : 'Choose a photo'}
            </button>
          </div>
          {photo && (
            <button type="button" onClick={() => ops.placePhoto(spread.id, item.id, null)} className="mt-2 text-xs text-muted-foreground underline-offset-4 hover:text-destructive hover:underline">
              Remove photo from frame
            </button>
          )}
        </Section>
        <Section title="Crop & frame">
          <Segmented
            value={item.fit ?? 'fill'}
            onChange={(v) => patch({ fit: v })}
            options={[{ id: 'fill', label: 'Fill' }, { id: 'fit', label: 'Fit' }, { id: 'stretch', label: 'Stretch' }]}
          />
        </Section>
        <Section title="Adjust">
          <div className="space-y-3.5">
            <Slider label="Brightness" value={adj.brightness} min={-60} max={60} onChange={(n) => setAdj('brightness', n)} burst={burst} />
            <Slider label="Contrast" value={adj.contrast} min={-60} max={60} onChange={(n) => setAdj('contrast', n)} burst={burst} />
            <Slider label="Saturation" value={adj.saturation} min={-100} max={100} onChange={(n) => setAdj('saturation', n)} burst={burst} />
            <Slider label="Warmth" value={adj.warmth} min={-100} max={100} onChange={(n) => setAdj('warmth', n)} burst={burst} />
          </div>
          {(adj.brightness || adj.contrast || adj.saturation || adj.warmth) ? (
            <button type="button" onClick={() => patch({ adjust: ZERO })} className="mt-3 text-xs text-accent hover:underline">Reset adjustments</button>
          ) : null}
        </Section>
        <Section title="Filters">
          <ul className="grid grid-cols-3 gap-2">
            {FILTERS.map((f) => (
              <li key={f.id}>
                <button
                  type="button"
                  onClick={() => patch({ filter: f.id })}
                  aria-pressed={(item.filter ?? 'none') === f.id}
                  className={cn('block w-full rounded-xl p-1 text-center ring-offset-2 ring-offset-card transition', (item.filter ?? 'none') === f.id ? 'ring-2 ring-[#2f6bff]' : 'ring-1 ring-foreground/10 hover:ring-foreground/30')}
                >
                  <span className="block aspect-[4/3] overflow-hidden rounded-lg bg-secondary">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {photo?.src && <img src={photo.src} alt="" className="size-full object-cover" style={{ filter: f.css || 'none' }} />}
                  </span>
                  <span className="mt-1 block text-[11px]">{f.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </Section>
      </div>
    )
  }

  if (item.type === 'text') {
    return <TextEditor spread={spread} item={item} onAdded={onAddedItem ?? (() => {})} />
  }

  // sticker
  return (
    <div>
      <Section title="Sticker">
        <div className="mb-4 grid h-20 place-items-center rounded-xl bg-secondary text-5xl">{item.emoji}</div>
        <Slider
          label="Size"
          value={item.h}
          min={6}
          max={90}
          onChange={(n) => patchLive({ h: n, w: n / aspect })}
          burst={burst}
        />
      </Section>
    </div>
  )
}

function ActionBtn({ children, onClick, danger, className }: { children: React.ReactNode; onClick: () => void; danger?: boolean; className?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn('flex h-11 items-center justify-center gap-2 rounded-xl text-sm font-medium ring-1 ring-inset transition', danger ? 'text-destructive ring-destructive/30 hover:bg-destructive/8' : 'ring-foreground/15 hover:bg-foreground/5', className)}
    >
      {children}
    </button>
  )
}

export type PagesSide = 'left' | 'right' | 'both'

/**
 * "All pages": every spread as a card with its two pages. Tap a page to open it for editing.
 * Used as the right-hand panel on desktop/tablet and as the full-screen overview on mobile.
 */
export function PagesPanel({
  spreads, photos, index, side, onOpen, onMutated, config, overview,
}: {
  spreads: Spread[]
  photos: Photo[]
  index: number
  side: PagesSide
  onOpen: (i: number, side: 'left' | 'right') => void
  onMutated: (i: number) => void
  config: { size: '8x8' | '10x10' | '12x12'; pages: number; cover: 'hardcover' | 'softcover' }
  overview?: boolean
}) {
  const canAdd = ops.canAddSpread(spreads.length)
  const canRemove = ops.canRemoveSpread(spreads.length)

  const tile = (s: Spread, i: number, which: 'left' | 'right', number: number) => {
    const active = i === index && (side === which || side === 'both')
    return (
      <button
        key={which}
        type="button"
        onClick={() => onOpen(i, which)}
        aria-label={`Edit page ${number}`}
        aria-current={active}
        className={cn(
          'group relative block overflow-hidden rounded-lg bg-secondary ring-offset-2 ring-offset-card transition',
          active ? 'ring-2 ring-[#2f6bff]' : 'ring-1 ring-black/10 hover:ring-[#2f6bff]/60',
        )}
      >
        <SpreadView spread={s} photos={photos} side={which} />
        <span className="absolute bottom-1.5 left-1.5 rounded-full bg-background/90 px-2 py-0.5 text-[11px] font-semibold shadow-xs">{number}</span>
      </button>
    )
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between text-sm">
        <span className="font-semibold">{config.pages} pages</span>
        <span className="text-muted-foreground">{money(unitPrice(config))}</span>
      </div>

      <ul className={cn('grid gap-4', overview && 'sm:grid-cols-2 lg:grid-cols-3')} aria-label="All pages">
        {spreads.map((s, i) => (
          <li key={s.id} className="rounded-2xl border border-foreground/8 bg-card p-3 shadow-xs">
            {s.kind === 'cover' ? (
              <div className="mx-auto w-1/2 min-w-24">
                <button
                  type="button"
                  onClick={() => onOpen(0, 'left')}
                  aria-label="Edit cover"
                  aria-current={i === index}
                  className={cn(
                    'relative block w-full overflow-hidden rounded-lg ring-offset-2 ring-offset-card transition',
                    i === index ? 'ring-2 ring-[#2f6bff]' : 'ring-1 ring-black/10 hover:ring-[#2f6bff]/60',
                  )}
                >
                  <SpreadView spread={s} photos={photos} />
                  <span className="absolute bottom-1.5 left-1.5 inline-flex items-center gap-1 rounded-full bg-background/90 px-2 py-0.5 text-[11px] font-semibold shadow-xs">
                    <Crown className="size-3" /> Cover
                  </span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-1.5">
                {tile(s, i, 'left', i * 2 - 1)}
                {tile(s, i, 'right', i * 2)}
              </div>
            )}

            {s.kind !== 'cover' && (
              <div className="mt-2.5 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Pages {i * 2 - 1}–{i * 2}</span>
                <div className="flex gap-1">
                  <IconAction label="Move earlier" disabled={i < 2} onClick={() => { ops.moveSpread(s.id, -1); onMutated(i - 1) }}><ChevronUp className="size-4" /></IconAction>
                  <IconAction label="Move later" disabled={i >= spreads.length - 1} onClick={() => { ops.moveSpread(s.id, 1); onMutated(i + 1) }}><ChevronDown className="size-4" /></IconAction>
                  <IconAction label="Duplicate these pages" disabled={!canAdd} onClick={() => { ops.duplicateSpread(s.id); onMutated(i + 1) }}><Copy className="size-4" /></IconAction>
                  <IconAction label="Delete these pages" danger disabled={!canRemove} onClick={() => { ops.removeSpread(s.id); onMutated(Math.max(1, Math.min(i, spreads.length - 2))) }}><Trash2 className="size-4" /></IconAction>
                </div>
              </div>
            )}
          </li>
        ))}
        <li>
          <button
            type="button"
            disabled={!canAdd}
            onClick={() => { ops.addSpread(spreads.length - 1); onMutated(spreads.length) }}
            className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-foreground/15 text-sm font-medium text-muted-foreground transition hover:border-accent hover:text-accent disabled:opacity-40"
          >
            <Plus className="size-4" /> Add 2 pages
          </button>
        </li>
      </ul>
      <p className="mt-3 text-center text-[11px] text-muted-foreground">{MIN_PAGES}–{MAX_PAGES} pages. Price updates as you add or remove.</p>
    </div>
  )
}

function IconAction({ children, label, onClick, disabled, danger }: { children: React.ReactNode; label: string; onClick: () => void; disabled?: boolean; danger?: boolean }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className={cn('grid size-9 place-items-center rounded-lg transition hover:bg-foreground/6 disabled:opacity-30', danger && 'text-destructive hover:bg-destructive/10')}
    >
      {children}
    </button>
  )
}
