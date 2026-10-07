'use client'

import { memo, type CSSProperties, type PointerEventHandler, type ReactNode } from 'react'
import { FONTS, FILTERS } from '@/lib/flow/catalog'
import type { Item, Photo, Spread } from '@/lib/flow/types'
import { cn } from '@/lib/utils'

export function itemFilter(item: Item): string {
  const a = item.adjust
  const parts: string[] = []
  const preset = FILTERS.find((f) => f.id === item.filter)?.css
  if (preset) parts.push(preset)
  if (a) {
    if (a.brightness) parts.push(`brightness(${1 + a.brightness / 100})`)
    if (a.contrast) parts.push(`contrast(${1 + a.contrast / 100})`)
    if (a.saturation) parts.push(`saturate(${1 + a.saturation / 100})`)
    if (a.warmth > 0) parts.push(`sepia(${a.warmth / 250}) saturate(${1 + a.warmth / 400})`)
    if (a.warmth < 0) parts.push(`hue-rotate(${a.warmth / 5}deg)`)
  }
  return parts.join(' ') || 'none'
}

export function fontCss(id?: string) {
  return FONTS.find((f) => f.id === id)?.css ?? FONTS[0].css
}

export const ItemBox = memo(function ItemBox({
  item,
  photo,
  children,
  className,
  style,
  onPointerDown,
}: {
  item: Item
  photo?: Photo
  children?: ReactNode
  className?: string
  style?: CSSProperties
  onPointerDown?: PointerEventHandler<HTMLDivElement>
}) {
  const box: CSSProperties = {
    left: `${item.x}%`,
    top: `${item.y}%`,
    width: `${item.w}%`,
    height: `${item.h}%`,
    transform: item.rotation ? `rotate(${item.rotation}deg)` : undefined,
    ...style,
  }
  return (
    <div className={cn('absolute', className)} style={box} data-item={item.id} onPointerDown={onPointerDown}>
      {item.type === 'photo' &&
        (photo?.src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photo.src}
            alt=""
            draggable={false}
            className="size-full select-none"
            style={{
              objectFit: item.fit === 'fit' ? 'contain' : item.fit === 'stretch' ? 'fill' : 'cover',
              filter: itemFilter(item),
            }}
          />
        ) : (
          <div className="grid size-full place-items-center bg-foreground/[0.05] text-foreground/30 ring-1 ring-inset ring-foreground/10">
            <svg viewBox="0 0 24 24" className="size-[18%] min-w-4" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
              <rect x="3" y="4" width="18" height="16" rx="2" />
              <circle cx="9" cy="10" r="1.6" />
              <path d="m21 16-5-5-9 9" />
            </svg>
          </div>
        ))}
      {item.type === 'text' && (
        <div
          className="size-full whitespace-pre-wrap break-words leading-[1.15]"
          style={{
            fontFamily: fontCss(item.font),
            fontWeight: item.bold ? 700 : item.font === 'sans' || !item.font ? 500 : 400,
            fontStyle: item.italic ? 'italic' : undefined,
            color: item.color,
            textAlign: item.align,
            fontSize: `calc(${item.size ?? 24} * 0.1cqw)`,
            background: item.fill ?? undefined,
            border: item.border ? `max(1px, 0.25cqw) solid ${item.color ?? 'currentColor'}` : undefined,
            padding: item.fill || item.border ? '0.6cqw' : undefined,
            boxSizing: 'border-box',
          }}
        >
          {item.text}
        </div>
      )}
      {item.type === 'sticker' && (
        <div className="grid size-full place-items-center leading-none" style={{ fontSize: `calc(${item.h * 1.2} * 0.1cqw * 2)` }}>
          {item.emoji}
        </div>
      )}
      {children}
    </div>
  )
})

/** Read-only render of one spread (used by the wizard review, cart thumbnails and preview). */
export function SpreadView({
  spread,
  photos,
  className,
  side,
}: {
  spread: Spread
  photos: Photo[]
  className?: string
  /** Show only one page of the spread (square). Ignored for the cover. */
  side?: 'left' | 'right'
}) {
  const map = new Map(photos.map((p) => [p.id, p]))
  const cover = spread.kind === 'cover'
  const items = spread.items.map((it) => (
    <ItemBox key={it.id} item={it} photo={it.photoId ? map.get(it.photoId) : undefined} />
  ))

  if (side && !cover) {
    return (
      <div className={cn('relative w-full overflow-hidden', className)} style={{ background: spread.bg, aspectRatio: '1 / 1' }}>
        <div
          className="absolute top-0 h-full [container-type:inline-size]"
          style={{ width: '200%', left: side === 'right' ? '-100%' : '0' }}
        >
          {items}
        </div>
        <div
          aria-hidden
          className={cn(
            'pointer-events-none absolute inset-y-0 w-4 from-black/[0.08] to-transparent',
            side === 'left' ? 'right-0 bg-gradient-to-l' : 'left-0 bg-gradient-to-r',
          )}
        />
      </div>
    )
  }

  return (
    <div
      className={cn('relative w-full overflow-hidden [container-type:inline-size]', className)}
      style={{ background: spread.bg, aspectRatio: cover ? '1 / 1' : '2 / 1' }}
    >
      {items}
      {!cover && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-1/2 w-6 -translate-x-1/2 bg-gradient-to-r from-transparent via-black/[0.07] to-transparent"
        />
      )}
    </div>
  )
}
