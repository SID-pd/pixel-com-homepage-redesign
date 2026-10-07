'use client'

import { useSyncExternalStore } from 'react'
import { PAGE_COUNTS, TEMPLATES, type ShippingId, type TemplateId } from './catalog'
import { loadPhotoData, deletePhotoData, makeThumb } from './images'
import { autoBuild, blankSpread, spreadCount, uid } from './layouts'
import { unitPrice } from './pricing'
import type { BookConfig, CartItem, Contact, Draft, MockUser, Order, Photo, Spread } from './types'

// One external store for the whole workflow (draft book, cart, orders, mock user).
// Everything is local: localStorage for state, IndexedDB for uploaded photo data.
// When the backend exists, replace the mutations here (and lib/flow/mock-api.ts) with apiCall().

export type FlowState = {
  hydrated: boolean
  draft: Draft | null
  cart: CartItem[]
  orders: Order[]
  user: MockUser | null
  promo: string | null
  shipping: ShippingId
  contact: Partial<Contact>
  canUndo: boolean
  canRedo: boolean
  /** bumped on every persisted write; drives the editor's "All changes saved" indicator */
  savedAt: number
}

const KEY = 'pixovo-flow-v1'

const EMPTY: FlowState = {
  hydrated: false,
  draft: null,
  cart: [],
  orders: [],
  user: null,
  promo: null,
  shipping: 'standard',
  contact: {},
  canUndo: false,
  canRedo: false,
  savedAt: 0,
}

let state: FlowState = EMPTY
let loaded = false
const listeners = new Set<() => void>()
let past: Spread[][] = []
let future: Spread[][] = []
let saveTimer: ReturnType<typeof setTimeout> | null = null

const stripPhotos = (photos: Photo[]) => photos.map((p) => (p.kind === 'sample' ? p : { ...p, src: '' }))

function persist() {
  if (typeof window === 'undefined') return
  if (saveTimer) clearTimeout(saveTimer)
  saveTimer = setTimeout(() => {
    try {
      const { draft, cart, orders, user, promo, shipping, contact } = state
      const out = {
        draft: draft && { ...draft, photos: stripPhotos(draft.photos) },
        cart: cart.map((c) => ({ ...c, snapshot: { ...c.snapshot, photos: stripPhotos(c.snapshot.photos) } })),
        orders,
        user,
        promo,
        shipping,
        contact,
      }
      localStorage.setItem(KEY, JSON.stringify(out))
      state = { ...state, savedAt: Date.now() }
      emit()
    } catch {
      /* quota or privacy mode: the session still works */
    }
  }, 350)
}

function emit() {
  listeners.forEach((l) => l())
}

function set(patch: Partial<FlowState>, save = true) {
  state = {
    ...state,
    ...patch,
    canUndo: past.length > 0,
    canRedo: future.length > 0,
  }
  emit()
  if (save) persist()
}

async function resolvePhotos(photos: Photo[]): Promise<Photo[]> {
  return Promise.all(
    photos.map(async (p) => {
      if (p.src || p.kind === 'sample') return p
      const data = await loadPhotoData(p.id)
      return { ...p, src: data ?? '' }
    }),
  )
}

function load() {
  if (loaded || typeof window === 'undefined') return
  loaded = true
  let saved: Partial<FlowState> | null = null
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) saved = JSON.parse(raw)
  } catch {
    saved = null
  }
  state = {
    ...EMPTY,
    hydrated: true,
    draft: saved?.draft ?? null,
    cart: saved?.cart ?? [],
    orders: saved?.orders ?? [],
    user: saved?.user ?? null,
    promo: saved?.promo ?? null,
    shipping: saved?.shipping ?? 'standard',
    contact: saved?.contact ?? {},
    savedAt: Date.now(),
  }
  // Re-attach uploaded photo data from IndexedDB, then re-render.
  const d = state.draft
  if (d && d.photos.some((p) => !p.src && p.kind !== 'sample')) {
    resolvePhotos(d.photos).then((photos) => {
      if (state.draft && state.draft.id === d.id) set({ draft: { ...state.draft, photos } }, false)
    })
  }
}

export function getState(): FlowState {
  load()
  return state
}

function subscribe(fn: () => void) {
  listeners.add(fn)
  return () => {
    listeners.delete(fn)
  }
}

export function useFlow(): FlowState {
  return useSyncExternalStore(subscribe, getState, () => EMPTY)
}

export function useCartCount(): number {
  const s = useFlow()
  return s.cart.reduce((n, i) => n + i.qty, 0)
}

// ---------------------------------------------------------------------------
// Draft
// ---------------------------------------------------------------------------

const DEFAULT_CONFIG: BookConfig = {
  size: '10x10',
  pages: 20,
  cover: 'hardcover',
  material: 'linen',
  title: 'Our Story',
}

function newDraft(config: Partial<BookConfig> = {}): Draft {
  return {
    id: uid('d'),
    config: { ...DEFAULT_CONFIG, ...config },
    photos: [],
    spreads: [],
    step: 1,
    updatedAt: Date.now(),
  }
}

function touch(d: Draft): Draft {
  return { ...d, updatedAt: Date.now() }
}

/** Once a book has spreads, its page count follows them (cover + 2 pages per spread). */
function withSpreads(d: Draft, spreads: Spread[]): Draft {
  const pages = (spreads.length - 1) * 2
  const config = spreads.length > 1 && pages !== d.config.pages ? { ...d.config, pages } : d.config
  return touch({ ...d, spreads, config })
}

export const flow = {
  /**
   * Start (or resume) the creation flow. A template or an explicit size starts fresh unless the
   * existing draft already matches, so deep links from the homepage always land on what was clicked.
   */
  openDraft(opts: { size?: BookConfig['size']; templateId?: TemplateId } = {}) {
    const cur = getState().draft
    const tpl = opts.templateId ? TEMPLATES.find((t) => t.id === opts.templateId) : undefined
    const patch: Partial<BookConfig> = {
      ...(opts.size ? { size: opts.size } : {}),
      ...(tpl ? { templateId: tpl.id, pages: tpl.pages, title: tpl.name } : {}),
    }
    const asked = !!tpl || !!opts.size
    if (!cur || (cur.cartItemId && asked)) {
      past = []
      future = []
      set({ draft: newDraft(patch) })
      return
    }
    if (!asked) return // resume where the customer left off
    const changed = (tpl && cur.config.templateId !== tpl.id) || (opts.size && cur.config.size !== opts.size)
    if (!changed) return
    past = []
    future = []
    // Keep any photos already added; only the book setup changes.
    set({ draft: touch({ ...cur, config: { ...cur.config, ...patch }, spreads: [], step: 1 }) })
  },

  discardDraft() {
    past = []
    future = []
    set({ draft: null })
  },

  setConfig(patch: Partial<BookConfig>) {
    const d = getState().draft
    if (!d) return
    let spreads = d.spreads
    if (patch.pages && patch.pages !== d.config.pages && spreads.length) {
      const target = spreadCount(patch.pages) + 1
      spreads = spreads.slice(0, target)
      while (spreads.length < target) spreads = [...spreads, blankSpread('spread')]
    }
    set({ draft: touch({ ...d, config: { ...d.config, ...patch }, spreads }) })
  },

  setStep(step: number) {
    const d = getState().draft
    if (d) set({ draft: { ...d, step } })
  },

  addPhotos(photos: Photo[]) {
    const d = getState().draft
    if (!d || !photos.length) return
    set({ draft: touch({ ...d, photos: [...d.photos, ...photos] }) })
  },

  removePhoto(id: string) {
    const d = getState().draft
    if (!d) return
    const spreads = d.spreads.map((s) => ({
      ...s,
      items: s.items.map((i) => (i.photoId === id ? { ...i, photoId: null } : i)),
    }))
    const photo = d.photos.find((p) => p.id === id)
    if (photo?.kind === 'upload') void deletePhotoData(id)
    set({ draft: touch({ ...d, photos: d.photos.filter((p) => p.id !== id), spreads }) })
  },

  /** Lay all photos out automatically (wizard "Review" step and editor "Auto-fill"). */
  buildBook() {
    const d = getState().draft
    if (!d) return
    past = []
    future = []
    set({ draft: touch({ ...d, spreads: autoBuild(d.config, d.photos, d.config.templateId) }) })
  },

  // ---- editor history ------------------------------------------------------
  /** Snapshot once before a burst of live edits (slider drag, text typing, drag). */
  checkpoint() {
    const d = getState().draft
    if (!d) return
    past = [...past.slice(-49), d.spreads]
    future = []
    set({}, false)
  },
  /** Apply an edit without pushing history (pair with checkpoint()). */
  apply(fn: (spreads: Spread[]) => Spread[]) {
    const d = getState().draft
    if (!d) return
    set({ draft: withSpreads(d, fn(d.spreads)) })
  },
  /** One-shot undoable edit. */
  commit(fn: (spreads: Spread[]) => Spread[]) {
    flow.checkpoint()
    flow.apply(fn)
  },
  undo() {
    const d = getState().draft
    const prev = past[past.length - 1]
    if (!d || !prev) return
    past = past.slice(0, -1)
    future = [...future, d.spreads]
    set({ draft: withSpreads(d, prev) })
  },
  redo() {
    const d = getState().draft
    const next = future[future.length - 1]
    if (!d || !next) return
    future = future.slice(0, -1)
    past = [...past, d.spreads]
    set({ draft: withSpreads(d, next) })
  },

  // ---- cart ----------------------------------------------------------------
  async addToCart(): Promise<CartItem | null> {
    const d = getState().draft
    if (!d) return null
    const coverItem = d.spreads[0]?.items.find((i) => i.type === 'photo' && i.photoId)
    const coverPhoto = d.photos.find((p) => p.id === coverItem?.photoId) ?? d.photos[0]
    const tpl = d.config.templateId ? TEMPLATES.find((t) => t.id === d.config.templateId) : undefined
    const thumb = await makeThumb(coverPhoto?.src || tpl?.image || '/images/product-photobook.png')
    const existing = d.cartItemId ? getState().cart.find((c) => c.id === d.cartItemId) : undefined
    const item: CartItem = {
      id: existing?.id ?? uid('c'),
      title: d.config.title,
      config: d.config,
      unitPrice: unitPrice(d.config),
      qty: existing?.qty ?? 1,
      thumb,
      photoCount: d.photos.length,
      snapshot: { photos: d.photos, spreads: d.spreads },
      addedAt: Date.now(),
    }
    const cart = existing ? getState().cart.map((c) => (c.id === item.id ? item : c)) : [...getState().cart, item]
    past = []
    future = []
    set({ cart, draft: null })
    return item
  },

  editCartItem(id: string) {
    const item = getState().cart.find((c) => c.id === id)
    if (!item) return
    past = []
    future = []
    const draft: Draft = {
      id: uid('d'),
      config: item.config,
      photos: item.snapshot.photos,
      spreads: item.snapshot.spreads,
      step: 3,
      updatedAt: Date.now(),
      cartItemId: item.id,
    }
    set({ draft })
    resolvePhotos(item.snapshot.photos).then((photos) => {
      const cur = getState().draft
      if (cur && cur.id === draft.id) set({ draft: { ...cur, photos } }, false)
    })
  },

  setQty(id: string, qty: number) {
    const q = Math.max(1, Math.min(99, qty))
    set({ cart: getState().cart.map((c) => (c.id === id ? { ...c, qty: q } : c)) })
  },
  removeFromCart(id: string) {
    set({ cart: getState().cart.filter((c) => c.id !== id) })
  },
  setPromo(code: string | null) {
    set({ promo: code })
  },
  setShipping(id: ShippingId) {
    set({ shipping: id })
  },
  saveContact(c: Partial<Contact>) {
    set({ contact: { ...getState().contact, ...c } })
  },

  // ---- orders / user (used by mock-api) -----------------------------------
  completeOrder(order: Order) {
    set({ orders: [order, ...getState().orders], cart: [], promo: null })
  },
  setUser(user: MockUser | null) {
    set({ user })
  },
}

export { PAGE_COUNTS }
