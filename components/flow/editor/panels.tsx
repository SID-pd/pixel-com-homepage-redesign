'use client'

import { useRef, useState } from 'react'
import { ImagePlus, Sparkles, Type } from 'lucide-react'
import { BACKGROUNDS, STICKERS } from '@/lib/flow/catalog'
import { fileToPhoto, samplePhotos } from '@/lib/flow/images'
import { LAYOUTS, uid } from '@/lib/flow/layouts'
import { flow } from '@/lib/flow/store'
import type { Item, Photo, Spread } from '@/lib/flow/types'
import { cn } from '@/lib/utils'
import { ops } from './ops'
import { TextEditor } from './text-tools'

function PanelTitle({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <div className="mb-3">
      <h2 className="text-base font-semibold">{children}</h2>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}

export function PhotosPanel({
  spread,
  photos,
  selectedId,
  used,
  onPlaced,
}: {
  spread: Spread
  photos: Photo[]
  selectedId: string | null
  used: Set<string>
  onPlaced: (itemId: string) => void
}) {
  const input = useRef<HTMLInputElement>(null)
  const [error, setError] = useState('')
  const [unusedOnly, setUnusedOnly] = useState(false)

  async function upload(files: File[]) {
    setError('')
    const ok: Photo[] = []
    for (const f of files) {
      try {
        ok.push(await fileToPhoto(f))
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not add photo')
      }
    }
    flow.addPhotos(ok)
  }

  return (
    <div>
      <div className="mb-4 flex items-center gap-2.5">
        <button
          type="button"
          onClick={() => input.current?.click()}
          className="flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-accent px-5 text-sm font-semibold text-accent-foreground transition hover:brightness-105"
        >
          <ImagePlus className="size-4" /> Add more photos
        </button>
        <button
          type="button"
          onClick={async () => {
            const have = new Set(photos.map((p) => p.name))
            flow.addPhotos((await samplePhotos(12)).filter((p) => !have.has(p.name)))
          }}
          className="grid size-12 shrink-0 place-items-center rounded-full bg-secondary transition hover:bg-foreground/10"
          aria-label="Add sample photos"
          title="Add sample photos"
        >
          <Sparkles className="size-5 text-accent" />
        </button>
        <input
          ref={input}
          type="file"
          accept="image/*"
          multiple
          className="sr-only"
          aria-label="Upload photos"
          onChange={(e) => {
            void upload(Array.from(e.target.files ?? []))
            e.target.value = ''
          }}
        />
      </div>
      <div className="mb-3 flex items-center justify-between gap-3 text-sm">
        <p>
          <strong className="font-semibold">{photos.length}</strong> photo{photos.length === 1 ? '' : 's'}
          <span className="text-muted-foreground"> · {photos.filter((p) => !used.has(p.id)).length} unused</span>
        </p>
        <button
          type="button"
          aria-pressed={unusedOnly}
          onClick={() => setUnusedOnly((v) => !v)}
          className={cn('rounded-full px-3 py-1.5 text-xs font-medium transition', unusedOnly ? 'bg-foreground text-background' : 'bg-secondary hover:bg-foreground/10')}
        >
          Unused only
        </button>
      </div>
      <p className="mb-3 text-xs text-muted-foreground">Tap a photo to place it, or drag it onto a frame.</p>
      {error && (
        <p role="alert" className="mb-3 text-xs text-destructive">
          {error}
        </p>
      )}
      {photos.length === 0 ? (
        <p className="rounded-xl bg-secondary px-3 py-6 text-center text-sm text-muted-foreground">No photos yet. Upload some to get started.</p>
      ) : (
        <ul className="grid grid-cols-3 gap-2">
          {photos.filter((p) => !unusedOnly || !used.has(p.id)).map((p) => (
            <li key={p.id}>
              <button
                type="button"
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData('text/plain', `photo:${p.id}`)
                  e.dataTransfer.effectAllowed = 'copy'
                }}
                onClick={() => onPlaced(ops.smartPlace(spread, p.id, selectedId))}
                aria-label={`Place ${p.name}`}
                className={cn('relative block aspect-square w-full overflow-hidden rounded-xl bg-secondary ring-offset-2 ring-offset-card transition hover:ring-2 hover:ring-accent', used.has(p.id) && 'opacity-90')}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {p.src ? <img src={p.src} alt="" draggable={false} className="size-full object-cover" /> : <span className="block size-full animate-pulse bg-foreground/10" />}
                {used.has(p.id) && (
                  <span className="absolute bottom-1 right-1 rounded-full bg-background/90 px-1.5 py-0.5 text-[10px] font-semibold">Used</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export function LayoutsPanel({ spread }: { spread: Spread }) {
  if (spread.kind === 'cover') {
    return (
      <div>
        <PanelTitle>Layouts</PanelTitle>
        <p className="rounded-xl bg-secondary px-3 py-4 text-sm text-muted-foreground">
          The cover uses one big photo and a title. Pick another page to try different layouts.
        </p>
      </div>
    )
  }
  return (
    <div>
      <PanelTitle hint="Your photos on this page carry over.">Layouts</PanelTitle>
      <ul className="grid grid-cols-2 gap-2.5">
        {LAYOUTS.map((l) => (
          <li key={l.id}>
            <button
              type="button"
              onClick={() => ops.applyLayout(spread, l.id)}
              aria-label={`${l.name} layout`}
              className="group block w-full rounded-xl p-1.5 text-left ring-1 ring-inset ring-foreground/10 transition hover:ring-accent"
            >
              <span className="relative block aspect-[2/1] w-full overflow-hidden rounded-md bg-secondary">
                {l.frames.map((f, i) => (
                  <span
                    key={i}
                    className="absolute rounded-[2px] bg-foreground/25 transition group-hover:bg-accent/60"
                    style={{ left: `${f[0]}%`, top: `${f[1]}%`, width: `${f[2]}%`, height: `${f[3]}%` }}
                  />
                ))}
              </span>
              <span className="mt-1.5 block px-0.5 text-xs font-medium">{l.name}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function BackgroundsPanel({ spread }: { spread: Spread }) {
  return (
    <div>
      <PanelTitle hint="Set the paper colour.">Backgrounds</PanelTitle>
      <ul className="grid grid-cols-4 gap-2.5">
        {BACKGROUNDS.map((c) => (
          <li key={c}>
            <button
              type="button"
              aria-label={`Background ${c}`}
              aria-pressed={spread.bg === c}
              onClick={() => ops.setBg(spread.id, c)}
              className={cn('aspect-square w-full rounded-xl ring-offset-2 ring-offset-card transition', spread.bg === c ? 'ring-2 ring-accent' : 'ring-1 ring-foreground/15 hover:ring-foreground/40')}
              style={{ background: c }}
            />
          </li>
        ))}
      </ul>
      <label className="mt-4 flex items-center gap-3 text-sm">
        <span className="text-muted-foreground">Custom</span>
        <input
          type="color"
          value={spread.bg.startsWith('#') && spread.bg.length === 7 ? spread.bg : '#ffffff'}
          onChange={(e) => ops.setBg(spread.id, e.target.value)}
          className="h-9 w-14 cursor-pointer rounded-lg border border-foreground/15 bg-transparent"
        />
      </label>
      <button
        type="button"
        onClick={() => ops.setBgAll(spread.bg)}
        className="mt-4 h-10 w-full rounded-xl text-sm font-medium ring-1 ring-inset ring-foreground/15 transition hover:bg-foreground/5"
      >
        Apply to all pages
      </button>
    </div>
  )
}

export function TextPanel({ spread, onAdded }: { spread: Spread; onAdded: (id: string) => void }) {
  return <TextEditor spread={spread} item={null} onAdded={onAdded} />
}

export function StickersPanel({ spread, onAdded }: { spread: Spread; onAdded: (id: string) => void }) {
  return (
    <div>
      <PanelTitle hint="Tap to add, then resize and rotate.">Stickers</PanelTitle>
      <ul className="grid grid-cols-4 gap-2">
        {STICKERS.map((s) => (
          <li key={s}>
            <button
              type="button"
              aria-label={`Add ${s}`}
              onClick={() => {
                const item: Item = { id: uid('e'), type: 'sticker', x: 42, y: 36, w: 14, h: 28, rotation: 0, emoji: s }
                ops.add(spread.id, item)
                onAdded(item.id)
              }}
              className="grid aspect-square w-full place-items-center rounded-xl bg-secondary text-2xl transition hover:scale-105 hover:bg-accent/15"
            >
              {s}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
