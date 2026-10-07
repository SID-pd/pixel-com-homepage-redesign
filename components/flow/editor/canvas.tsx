'use client'

import { useEffect, useMemo, useRef, useState, type PointerEvent as RPointerEvent } from 'react'
import { Copy, Crop, Lock, RotateCw, Trash2, Unlock } from 'lucide-react'
import type { Item, Photo, Spread } from '@/lib/flow/types'
import { cn } from '@/lib/utils'
import { ItemBox } from '../spread-view'
import { createBurst, ops } from './ops'

const BLUE = '#2f6bff'
type Corner = 'nw' | 'ne' | 'sw' | 'se'
const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n))

/** Which part of a two-page spread is shown. The cover is always a single page. */
export type PageSide = 'left' | 'right' | 'both'

export function EditorCanvas({
  spread,
  photos,
  selectedId,
  onSelect,
  zoom,
  onRequestPhotos,
  compact,
  side,
}: {
  spread: Spread
  photos: Photo[]
  selectedId: string | null
  onSelect: (id: string | null) => void
  zoom: number
  onRequestPhotos: () => void
  compact?: boolean
  side: PageSide
}) {
  const wrap = useRef<HTMLDivElement>(null)
  const canvas = useRef<HTMLDivElement>(null)
  const [avail, setAvail] = useState({ w: 0, h: 0 })
  const burst = useMemo(() => createBurst(), [])
  const photoMap = useMemo(() => new Map(photos.map((p) => [p.id, p])), [photos])
  // Single-page mode shows one half of the spread at full size. Item coordinates stay in spread space; only the view changes.
  const single = spread.kind === 'spread' && side !== 'both'
  const aspect = spread.kind === 'cover' || single ? 1 : 2
  const scaleX = single ? 2 : 1
  const offX = single && side === 'right' ? 100 : 0

  useEffect(() => {
    const el = wrap.current
    if (!el) return
    const ro = new ResizeObserver(() => setAvail({ w: el.clientWidth, h: el.clientHeight }))
    ro.observe(el)
    setAvail({ w: el.clientWidth, h: el.clientHeight })
    return () => ro.disconnect()
  }, [])

  const pad = compact ? 16 : 40
  const fitW = Math.max(0, Math.min(avail.w - pad * 2, (avail.h - pad * 2) * aspect))
  const width = fitW * zoom
  const selected = spread.items.find((i) => i.id === selectedId) ?? null

  function begin(e: RPointerEvent, item: Item, mode: 'move' | 'resize' | 'rotate', corner?: Corner) {
    e.stopPropagation()
    if (mode !== 'rotate' && e.button !== 0 && e.pointerType === 'mouse') return
    onSelect(item.id)
    if (item.locked && mode === 'move') return
    const rect = canvas.current!.getBoundingClientRect()
    const sx = e.clientX
    const sy = e.clientY
    const start = { x: item.x, y: item.y, w: item.w, h: item.h }
    let moved = false

    const onMove = (ev: PointerEvent) => {
      const dx = ((ev.clientX - sx) / rect.width) * 100
      const dy = ((ev.clientY - sy) / rect.height) * 100
      if (!moved && Math.abs(ev.clientX - sx) + Math.abs(ev.clientY - sy) < 3) return
      if (!moved) {
        moved = true
        burst.begin()
      }
      if (mode === 'move') {
        ops.patchLive(spread.id, item.id, {
          x: clamp(start.x + dx, -start.w * 0.5, 100 - start.w * 0.5),
          y: clamp(start.y + dy, -start.h * 0.5, 100 - start.h * 0.5),
        })
      } else if (mode === 'resize' && corner) {
        const min = 4
        let { x, y, w, h } = start
        if (corner.includes('e')) w = Math.max(min, start.w + dx)
        if (corner.includes('s')) h = Math.max(min, start.h + dy)
        if (corner.includes('w')) {
          w = Math.max(min, start.w - dx)
          x = start.x + (start.w - w)
        }
        if (corner.includes('n')) {
          h = Math.max(min, start.h - dy)
          y = start.y + (start.h - h)
        }
        ops.patchLive(spread.id, item.id, { x, y, w, h })
      } else if (mode === 'rotate') {
        const cx = rect.left + ((start.x + start.w / 2) / 100) * rect.width
        const cy = rect.top + ((start.y + start.h / 2) / 100) * rect.height
        let deg = (Math.atan2(ev.clientY - cy, ev.clientX - cx) * 180) / Math.PI + 90
        deg = ((deg + 180) % 360) - 180
        for (const snap of [0, 90, -90, 180, -180]) if (Math.abs(deg - snap) < 4) deg = snap
        ops.patchLive(spread.id, item.id, { rotation: Math.round(deg) })
      }
    }
    const onUp = () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
      burst.end()
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
  }

  function onDrop(e: React.DragEvent) {
    const raw = e.dataTransfer.getData('text/plain')
    if (!raw.startsWith('photo:')) return
    e.preventDefault()
    const photoId = raw.slice(6)
    const rect = canvas.current!.getBoundingClientRect()
    const px = ((e.clientX - rect.left) / rect.width) * 100
    const py = ((e.clientY - rect.top) / rect.height) * 100
    const hit = [...spread.items].reverse().find((i) => i.type === 'photo' && px >= i.x && px <= i.x + i.w && py >= i.y && py <= i.y + i.h)
    if (hit) {
      ops.placePhoto(spread.id, hit.id, photoId)
      onSelect(hit.id)
    } else onSelect(ops.smartPlace(spread, photoId, null))
  }

  const toolbarBelow = selected ? selected.y < 14 : false

  const boxLeft = selected ? selected.x * scaleX - offX : 0
  const boxWidth = selected ? selected.w * scaleX : 0
  const selectedVisible = !!selected && boxLeft + boxWidth > 0 && boxLeft < 100

  return (
    <div ref={wrap} className="relative size-full overflow-auto">
      <div className="grid min-h-full min-w-full place-items-center" style={{ padding: pad }}>
        <div
          className="relative shrink-0"
          style={{ width, aspectRatio: String(aspect) }}
          onPointerDown={(e) => {
            if (e.target === e.currentTarget || (e.target as HTMLElement).dataset.bg) onSelect(null)
          }}
          onDragOver={(e) => e.preventDefault()}
          onDrop={onDrop}
        >
          <div className="absolute inset-0 overflow-hidden shadow-lift ring-1 ring-black/5" style={{ background: spread.bg }} data-bg="1">
            <div
              ref={canvas}
              data-bg="1"
              className="absolute top-0 h-full [container-type:inline-size]"
              style={{ width: `${100 * scaleX}%`, left: `${-offX}%`, touchAction: 'pan-x pan-y' }}
            >
              {spread.kind === 'spread' && !single && (
                <>
                  <div aria-hidden className="pointer-events-none absolute inset-y-0 left-1/2 w-8 -translate-x-1/2 bg-gradient-to-r from-transparent via-black/[0.08] to-transparent" />
                  <div aria-hidden className="pointer-events-none absolute inset-[3%_51.5%_3%_1.5%] border border-dashed border-rose-300/70" />
                  <div aria-hidden className="pointer-events-none absolute inset-[3%_1.5%_3%_51.5%] border border-dashed border-rose-300/70" />
                </>
              )}
              {spread.items.map((it) => (
                <ItemBox
                  key={it.id}
                  item={it}
                  photo={it.photoId ? photoMap.get(it.photoId) : undefined}
                  onPointerDown={(e) => begin(e, it, 'move')}
                  style={{ touchAction: 'none', cursor: it.locked ? 'default' : 'grab' }}
                />
              ))}
            </div>
            {(single || spread.kind === 'cover') && (
              <div aria-hidden className="pointer-events-none absolute inset-[3%] border border-dashed border-rose-300/70" />
            )}
            {single && (
              <div
                aria-hidden
                className={cn('pointer-events-none absolute inset-y-0 w-6', side === 'left' ? 'right-0 bg-gradient-to-l' : 'left-0 bg-gradient-to-r', 'from-black/[0.09] to-transparent')}
              />
            )}
          </div>

          {selected && selectedVisible && (
            <SelectionLayer
              item={selected}
              boxLeft={boxLeft}
              boxWidth={boxWidth}
              toolbarBelow={toolbarBelow}
              showToolbar={!compact}
              onResize={(e, c) => begin(e, selected, 'resize', c)}
              onRotate={(e) => begin(e, selected, 'rotate')}
              spreadId={spread.id}
              onRequestPhotos={onRequestPhotos}
              onSelect={onSelect}
            />
          )}
        </div>
      </div>
    </div>
  )
}

function SelectionLayer({
  item,
  boxLeft,
  boxWidth,
  toolbarBelow,
  showToolbar,
  onResize,
  onRotate,
  spreadId,
  onRequestPhotos,
  onSelect,
}: {
  item: Item
  boxLeft: number
  boxWidth: number
  toolbarBelow: boolean
  showToolbar: boolean
  onResize: (e: RPointerEvent, c: Corner) => void
  onRotate: (e: RPointerEvent) => void
  spreadId: string
  onRequestPhotos: () => void
  onSelect: (id: string | null) => void
}) {
  const corners: [Corner, string][] = [
    ['nw', 'left-0 top-0 -translate-x-1/2 -translate-y-1/2 cursor-nwse-resize'],
    ['ne', 'right-0 top-0 translate-x-1/2 -translate-y-1/2 cursor-nesw-resize'],
    ['sw', 'left-0 bottom-0 -translate-x-1/2 translate-y-1/2 cursor-nesw-resize'],
    ['se', 'right-0 bottom-0 translate-x-1/2 translate-y-1/2 cursor-nwse-resize'],
  ]
  return (
    <div
      className="pointer-events-none absolute"
      style={{
        left: `${boxLeft}%`,
        top: `${item.y}%`,
        width: `${boxWidth}%`,
        height: `${item.h}%`,
        transform: item.rotation ? `rotate(${item.rotation}deg)` : undefined,
      }}
    >
      <div className="absolute inset-0" style={{ outline: `2px solid ${BLUE}` }} />
      {!item.locked &&
        corners.map(([c, pos]) => (
          <span
            key={c}
            onPointerDown={(e) => onResize(e, c)}
            className={cn('pointer-events-auto absolute size-3.5 touch-none rounded-full bg-white', pos)}
            style={{ border: `2px solid ${BLUE}`, boxShadow: '0 1px 3px rgba(0,0,0,.2)' }}
            role="presentation"
          />
        ))}
      {!item.locked && (
        <span
          onPointerDown={onRotate}
          className="pointer-events-auto absolute -top-9 left-1/2 grid size-6 -translate-x-1/2 cursor-grab touch-none place-items-center rounded-full bg-white text-[#2f6bff] shadow-float"
          role="presentation"
          title="Rotate"
        >
          <RotateCw className="size-3.5" />
        </span>
      )}

      {showToolbar && (
      <div
        className={cn(
          'pointer-events-auto absolute left-1/2 z-10 flex -translate-x-1/2 items-center gap-0.5 rounded-xl bg-card p-1 shadow-lift ring-1 ring-foreground/10',
          toolbarBelow ? 'top-full mt-12' : '-top-[4.25rem]',
        )}
        style={{ transform: item.rotation ? `translateX(-50%) rotate(${-item.rotation}deg)` : undefined }}
        onPointerDown={(e) => e.stopPropagation()}
      >
        {item.type === 'photo' && (
          <TB label={item.photoId ? 'Replace photo' : 'Add photo'} onClick={onRequestPhotos}>
            <span className="text-xs font-medium">{item.photoId ? 'Replace' : 'Add'}</span>
          </TB>
        )}
        {item.type === 'photo' && item.photoId && (
          <TB label="Fill or fit" onClick={() => ops.patch(spreadId, item.id, { fit: item.fit === 'fit' ? 'fill' : 'fit' })}>
            <Crop className="size-4" />
          </TB>
        )}
        <TB label="Duplicate" onClick={() => { const id = ops.duplicate(spreadId, item.id); if (id) onSelect(id) }}>
          <Copy className="size-4" />
        </TB>
        <TB label={item.locked ? 'Unlock' : 'Lock'} onClick={() => ops.patch(spreadId, item.id, { locked: !item.locked })}>
          {item.locked ? <Unlock className="size-4" /> : <Lock className="size-4" />}
        </TB>
        <TB label="Delete" onClick={() => { ops.remove(spreadId, item.id); onSelect(null) }} danger>
          <Trash2 className="size-4" />
        </TB>
      </div>
      )}
    </div>
  )
}

function TB({ label, onClick, children, danger }: { label: string; onClick: () => void; children: React.ReactNode; danger?: boolean }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={cn('grid h-9 min-w-9 place-items-center rounded-lg px-2 transition hover:bg-foreground/8', danger && 'hover:bg-destructive/10 hover:text-destructive')}
    >
      {children}
    </button>
  )
}

