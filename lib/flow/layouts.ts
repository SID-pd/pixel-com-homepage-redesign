import type { TemplateId } from './catalog'
import { TEMPLATES } from './catalog'
import type { BookConfig, Item, Photo, Spread } from './types'

export const uid = (p = 'i') => `${p}_${Math.random().toString(36).slice(2, 9)}${Date.now().toString(36).slice(-3)}`

type Frame = [x: number, y: number, w: number, h: number]

// Spread canvas is 2:1 (two square pages). Coordinates are percent of the whole spread.
// The gutter sits at x = 50. Margins keep photos clear of the fold.
export const LAYOUTS: { id: string; name: string; frames: Frame[] }[] = [
  { id: 'pair', name: 'One per page', frames: [[5, 8, 41, 84], [54, 8, 41, 84]] },
  { id: 'full-right', name: 'Big + small', frames: [[3, 5, 55, 90], [63, 22, 32, 56]] },
  { id: 'duo-stack', name: 'Stacked pair', frames: [[5, 8, 41, 84], [54, 8, 41, 40], [54, 52, 41, 40]] },
  { id: 'hero-3', name: 'Hero + three', frames: [[4, 6, 44, 88], [54, 6, 42, 42], [54, 52, 20, 42], [76, 52, 20, 42]] },
  { id: 'grid-4', name: 'Four grid', frames: [[5, 8, 19.5, 40], [26.5, 8, 19.5, 40], [5, 52, 19.5, 40], [26.5, 52, 19.5, 40], [54, 8, 41, 84]] },
  { id: 'grid-6', name: 'Six grid', frames: [[5, 8, 19.5, 40], [26.5, 8, 19.5, 40], [5, 52, 19.5, 40], [26.5, 52, 19.5, 40], [54, 8, 19.5, 84], [75.5, 8, 19.5, 84]] },
  { id: 'wide', name: 'Panorama', frames: [[4, 14, 92, 72]] },
  { id: 'blank', name: 'Blank', frames: [] },
]

export const COVER_LAYOUT: Frame = [8, 8, 84, 66]

function frameItem(f: Frame, photoId: string | null): Item {
  return { id: uid('f'), type: 'photo', x: f[0], y: f[1], w: f[2], h: f[3], rotation: 0, photoId, fit: 'fill' }
}

export function titleItem(text: string): Item {
  return {
    id: uid('t'), type: 'text', x: 8, y: 78, w: 84, h: 14, rotation: 0,
    text, font: 'sans', color: '#2a2623', size: 56, align: 'center',
  }
}

export function layoutItems(layoutId: string, photoIds: (string | null)[]): Item[] {
  const l = LAYOUTS.find((x) => x.id === layoutId) ?? LAYOUTS[0]
  return l.frames.map((f, i) => frameItem(f, photoIds[i] ?? null))
}

export function blankSpread(kind: Spread['kind'] = 'spread', bg = '#ffffff'): Spread {
  return { id: uid('s'), kind, bg, items: [] }
}

export function spreadCount(pages: number) {
  return pages / 2
}

/**
 * Build a whole book from the customer's photos: cover + pages/2 spreads.
 * Layouts cycle (or follow the template). Photos are consumed in order, then the
 * remaining spreads are left with empty frames the customer can fill later.
 */
export function autoBuild(config: BookConfig, photos: Photo[], templateId?: TemplateId): Spread[] {
  const tpl = templateId ? TEMPLATES.find((t) => t.id === templateId) : undefined
  const bg = tpl?.bg ?? '#ffffff'
  const order = tpl?.layouts ?? ['pair', 'hero-3', 'duo-stack', 'full-right', 'grid-4', 'wide', 'grid-6']
  const queue = photos.map((p) => p.id)

  const cover: Spread = {
    id: uid('s'), kind: 'cover', bg: tpl?.bg ?? '#faf6ef',
    items: [frameItem(COVER_LAYOUT, queue.shift() ?? null), titleItem(config.title)],
  }

  const total = spreadCount(config.pages)
  const spreads: Spread[] = [cover]
  for (let i = 0; i < total; i++) {
    let id = order[i % order.length]
    // Don't strand a half-empty layout when only a few photos remain.
    const remaining = queue.length
    if (remaining > 0) {
      const need = LAYOUTS.find((l) => l.id === id)!.frames.length
      if (remaining < need) id = remaining >= 2 ? 'pair' : 'wide'
    } else {
      id = 'pair'
    }
    const l = LAYOUTS.find((x) => x.id === id)!
    const take = queue.splice(0, l.frames.length)
    spreads.push({ id: uid('s'), kind: 'spread', bg, items: layoutItems(id, take) })
  }
  return spreads
}

export function countPlaced(spreads: Spread[]) {
  let placed = 0
  let empty = 0
  for (const s of spreads) {
    for (const it of s.items) {
      if (it.type !== 'photo') continue
      if (it.photoId) placed++
      else empty++
    }
  }
  return { placed, empty }
}
