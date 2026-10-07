import { MAX_PAGES, MIN_PAGES } from '@/lib/flow/catalog'
import { LAYOUTS, blankSpread, layoutItems, uid } from '@/lib/flow/layouts'
import { flow } from '@/lib/flow/store'
import type { Item, Spread } from '@/lib/flow/types'

// All editor mutations go through here so history, page count and persistence stay consistent.
// "live" edits (drags, sliders, typing) rely on a prior flow.checkpoint(); the rest are one-shot undoable commits.

type Fn = (items: Item[]) => Item[]

const onSpread = (spreadId: string, fn: Fn) => (spreads: Spread[]) =>
  spreads.map((s) => (s.id === spreadId ? { ...s, items: fn(s.items) } : s))

export const ops = {
  /** Live update (no history push). Call flow.checkpoint() once before a burst. */
  patchLive(spreadId: string, itemId: string, patch: Partial<Item>) {
    flow.apply(onSpread(spreadId, (items) => items.map((i) => (i.id === itemId ? { ...i, ...patch } : i))))
  },
  /** One-shot undoable update. */
  patch(spreadId: string, itemId: string, patch: Partial<Item>) {
    flow.commit(onSpread(spreadId, (items) => items.map((i) => (i.id === itemId ? { ...i, ...patch } : i))))
  },
  add(spreadId: string, item: Item) {
    flow.commit(onSpread(spreadId, (items) => [...items, item]))
  },
  remove(spreadId: string, itemId: string) {
    flow.commit(onSpread(spreadId, (items) => items.filter((i) => i.id !== itemId)))
  },
  duplicate(spreadId: string, itemId: string): string | null {
    const id = uid('i')
    let ok = false
    flow.commit(
      onSpread(spreadId, (items) => {
        const src = items.find((i) => i.id === itemId)
        if (!src) return items
        ok = true
        const copy: Item = { ...src, id, x: Math.min(95 - src.w, src.x + 3), y: Math.min(95 - src.h, src.y + 3), locked: false }
        return [...items, copy]
      }),
    )
    return ok ? id : null
  },
  /** dir 1 = bring forward, -1 = send backward */
  reorder(spreadId: string, itemId: string, dir: 1 | -1) {
    flow.commit(
      onSpread(spreadId, (items) => {
        const i = items.findIndex((x) => x.id === itemId)
        const j = i + dir
        if (i < 0 || j < 0 || j >= items.length) return items
        const next = items.slice()
        ;[next[i], next[j]] = [next[j], next[i]]
        return next
      }),
    )
  },
  setBg(spreadId: string, bg: string) {
    flow.commit((spreads) => spreads.map((s) => (s.id === spreadId ? { ...s, bg } : s)))
  },
  setBgAll(bg: string) {
    flow.commit((spreads) => spreads.map((s) => ({ ...s, bg })))
  },
  placePhoto(spreadId: string, itemId: string, photoId: string | null) {
    ops.patch(spreadId, itemId, { photoId, fit: 'fill' })
  },
  /** Drop a photo into the best frame: selected frame, else first empty frame, else a new frame. */
  smartPlace(spread: Spread, photoId: string, selectedId: string | null): string {
    const selected = spread.items.find((i) => i.id === selectedId && i.type === 'photo')
    const empty = spread.items.find((i) => i.type === 'photo' && !i.photoId)
    const target = selected ?? empty
    if (target) {
      ops.placePhoto(spread.id, target.id, photoId)
      return target.id
    }
    const item: Item = {
      id: uid('f'), type: 'photo', x: spread.kind === 'cover' ? 15 : 30, y: 20, w: spread.kind === 'cover' ? 70 : 40, h: 60,
      rotation: 0, photoId, fit: 'fill',
    }
    ops.add(spread.id, item)
    return item.id
  },
  applyLayout(spread: Spread, layoutId: string) {
    const photoIds = spread.items.filter((i) => i.type === 'photo').map((i) => i.photoId ?? null)
    const others = spread.items.filter((i) => i.type !== 'photo')
    const frames = layoutItems(layoutId, photoIds)
    // Photos that no longer fit are dropped from the page (they stay in the library).
    flow.commit((spreads) => spreads.map((s) => (s.id === spread.id ? { ...s, items: [...frames, ...others] } : s)))
  },
  layoutCount: LAYOUTS.length,

  // ---- pages ---------------------------------------------------------------
  canAddSpread(count: number) {
    return (count - 1) * 2 + 2 <= MAX_PAGES
  },
  canRemoveSpread(count: number) {
    return (count - 1) * 2 - 2 >= MIN_PAGES
  },
  addSpread(afterIndex: number, bg = '#ffffff'): string {
    const s = { ...blankSpread('spread', bg), items: layoutItems('pair', [null, null]) }
    flow.commit((spreads) => {
      const next = spreads.slice()
      next.splice(Math.max(1, afterIndex + 1), 0, s)
      return next
    })
    return s.id
  },
  removeSpread(id: string) {
    flow.commit((spreads) => spreads.filter((s) => s.id !== id || s.kind === 'cover'))
  },
  duplicateSpread(id: string) {
    flow.commit((spreads) => {
      const i = spreads.findIndex((s) => s.id === id)
      if (i < 1) return spreads
      const src = spreads[i]
      const copy: Spread = { ...src, id: uid('s'), items: src.items.map((it) => ({ ...it, id: uid('i') })) }
      const next = spreads.slice()
      next.splice(i + 1, 0, copy)
      return next
    })
  },
  moveSpread(id: string, dir: 1 | -1) {
    flow.commit((spreads) => {
      const i = spreads.findIndex((s) => s.id === id)
      const j = i + dir
      if (i < 1 || j < 1 || j >= spreads.length) return spreads
      const next = spreads.slice()
      ;[next[i], next[j]] = [next[j], next[i]]
      return next
    })
  },
}

/** Arms a single history checkpoint for a burst of live edits (drag, slider, typing). */
export function createBurst() {
  let armed = false
  return {
    begin() {
      if (!armed) {
        flow.checkpoint()
        armed = true
      }
    },
    end() {
      armed = false
    },
  }
}
