'use client'

import { useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { ChevronLeft, ChevronRight, Gift, LayoutGrid, Maximize2, Package, Pencil, ShoppingBag, BookOpen } from 'lucide-react'
import { curtain } from '@/components/flow/page-curtain'
import { OfferStrip, PriceTag } from '@/components/flow/offer-ui'
import { SpreadView } from '@/components/flow/spread-view'
import { COVERS, PACKAGING, SIZES, TEMPLATES, type PackagingId } from '@/lib/flow/catalog'
import { unitPrice } from '@/lib/flow/pricing'
import { flow } from '@/lib/flow/store'
import type { BookConfig, Photo, Spread } from '@/lib/flow/types'
import { cn } from '@/lib/utils'
import { BookReader, PagesGrid } from './book-reader'
import { Celebration } from './celebration'
import { GhostButton, PrimaryButton } from './stage-parts'

const ICON: Record<PackagingId, typeof Package> = { basic: Package, gift: Gift, bag: ShoppingBag }
const EASE = [0.22, 1, 0.36, 1] as const

/** Fades a block up into place after the cover has landed. */
function Rise({ children, delay, reveal, className }: { children: ReactNode; delay: number; reveal: boolean; className?: string }) {
  return (
    <motion.div initial={reveal ? { opacity: 0, y: 18 } : false} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay, ease: EASE }} className={className}>
      {children}
    </motion.div>
  )
}

/**
 * Step 4: the finished book. With `reveal`, the photos gather, the cover swings in on a hinge and the rest of the controls
 * rise in behind it. Everything is transform and opacity on springs, so it stays smooth.
 */
export function PreviewBody({ config, spreads, photos, reveal = false, onAddPhotos }: { config: BookConfig; spreads: Spread[]; photos: Photo[]; reveal?: boolean; onAddPhotos?: () => void }) {
  const [index, setIndex] = useState(0)
  const [tab, setTab] = useState<'flip' | 'grid'>('flip')
  const [reader, setReader] = useState(false)
  const reduce = useReducedMotion()
  const fancy = reveal && !reduce
  const last = Math.max(0, spreads.length - 1)
  const i = Math.min(index, last)
  const emptySpreads = spreads.filter((sp) => sp.items.some((it) => it.type === 'photo' && !it.photoId)).length
  const spread = spreads[i]
  const caption = spread?.items.find((it) => it.type === 'text' && it.id.startsWith('c_'))
  const tpl = TEMPLATES.find((t) => t.id === config.templateId)
  const size = SIZES.find((s) => s.id === config.size)
  const cover = COVERS.find((c) => c.id === config.cover)

  function setCaption(text: string) {
    if (!spread || !caption) return
    flow.apply((all) => all.map((s) => (s.id !== spread.id ? s : { ...s, items: s.items.map((it) => (it.id === caption.id ? { ...it, text } : it)) })))
  }

  return (
    <div className="relative grid gap-6">
      {fancy && <Celebration delay={0.3} />}

      <div className="min-w-0">
        {emptySpreads > 0 && (
          <Rise reveal={fancy} delay={0.2} className="mb-4">
            <div role="note" className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-2xl bg-[var(--st-butter)]/70 px-4 py-3 text-sm text-[#6b4f00]">
              <span className="font-semibold">
                {emptySpreads} of {spreads.length} spreads have empty photo spots
              </span>
              <span className="text-[#6b4f00]/75">Empty spots print as blank space. Add more photos, or choose fewer pages.</span>
              <span className="ml-auto flex gap-2">
                <button type="button" onClick={() => setTab('grid')} className="inline-flex h-9 items-center rounded-full bg-white/80 px-3.5 text-xs font-semibold transition hover:bg-white">
                  See them
                </button>
                {onAddPhotos && (
                  <button type="button" onClick={onAddPhotos} className="inline-flex h-9 items-center rounded-full bg-[var(--st-ink)] px-3.5 text-xs font-semibold text-white transition hover:opacity-90 active:scale-95">
                    Add photos
                  </button>
                )}
              </span>
            </div>
          </Rise>
        )}
        <Rise reveal={fancy} delay={0.25} className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs font-semibold text-foreground/55">
          <span className="tabular-nums">
            {tab === 'flip' ? `${i === 0 ? 'Front cover' : `Pages ${i * 2 - 1}–${i * 2}`} · ${i + 1} / ${spreads.length}` : `All ${spreads.length} spreads`}
          </span>
          <div className="flex items-center gap-1.5" role="tablist" aria-label="How to look at your book">
            {([['flip', 'Flip through', BookOpen], ['grid', 'All pages', LayoutGrid]] as const).map(([id, text, Icon]) => (
              <button key={id} type="button" role="tab" aria-selected={tab === id} onClick={() => setTab(id)} className={cn('inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 text-xs font-semibold transition', tab === id ? 'bg-[var(--st-ink)] text-white' : 'bg-white text-foreground/70 ring-1 ring-[var(--st-peach)] hover:ring-[var(--st-peach-ink)]/40')}>
                <Icon className="size-3.5" /> {text}
              </button>
            ))}
            <button type="button" onClick={() => setReader(true)} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white px-3.5 text-xs font-semibold text-foreground/70 ring-1 ring-[var(--st-peach)] transition hover:ring-[var(--st-peach-ink)]/40">
              <Maximize2 className="size-3.5" /> Full screen
            </button>
          </div>
        </Rise>

        {tab === 'grid' ? (
          <PagesGrid spreads={spreads} photos={photos} current={i} onPick={(n) => { setIndex(n); setTab('flip') }} />
        ) : (
          <>
        <div className="relative [perspective:1400px]">
          <motion.div
            initial={fancy ? { opacity: 0, scale: 0.94, y: 24 } : false}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 70, damping: 18, mass: 1, delay: fancy ? 0.1 : 0 }}
            style={{ transformOrigin: '0% 50%' }}
            className={cn('mx-auto overflow-hidden rounded-lg bg-white shadow-[0_24px_50px_-24px_rgba(60,35,20,0.6)] ring-1 ring-black/10 transition-[max-width] duration-500 ease-out', spread?.kind === 'cover' ? 'max-w-[300px]' : 'max-w-full')}
          >
            {spread && <SpreadView spread={spread} photos={photos} />}
          </motion.div>
          <Rise reveal={fancy} delay={0.6} className="contents">
            <button type="button" onClick={() => setIndex(Math.max(0, i - 1))} disabled={i === 0} aria-label="Previous spread" className="absolute left-0 top-1/2 grid size-11 -translate-x-1/3 -translate-y-1/2 place-items-center rounded-full bg-white shadow-lg transition enabled:hover:scale-105 disabled:opacity-0 sm:-translate-x-1/2">
              <ChevronLeft className="size-5" />
            </button>
            <button type="button" onClick={() => setIndex(Math.min(last, i + 1))} disabled={i >= last} aria-label="Next spread" className="absolute right-0 top-1/2 grid size-11 translate-x-1/3 -translate-y-1/2 place-items-center rounded-full bg-white shadow-lg transition enabled:hover:scale-105 disabled:opacity-0 sm:translate-x-1/2">
              <ChevronRight className="size-5" />
            </button>
          </Rise>
        </div>

        <Rise reveal={fancy} delay={0.55} className="mt-4 flex flex-wrap justify-center gap-1">
          {spreads.map((s, n) => (
            <button key={s.id} type="button" aria-label={n === 0 ? 'Cover' : `Spread ${n}`} aria-current={n === i} onClick={() => setIndex(n)} className={cn('h-2 rounded-full transition-all duration-300', n === i ? 'w-6 bg-[var(--st-peach-ink)]' : 'w-2 bg-foreground/20 hover:bg-foreground/35')} />
          ))}
        </Rise>

        <Rise reveal={fancy} delay={0.7} className="mx-auto mt-4 max-w-md">
          {caption ? (
            <label className="flex items-center gap-2 rounded-full bg-white px-4 py-2 shadow-sm ring-1 ring-[var(--st-peach)] focus-within:ring-2 focus-within:ring-[var(--st-peach-ink)]/50">
              <Pencil className="size-3.5 shrink-0 text-foreground/40" aria-hidden />
              <span className="sr-only">Caption for this spread</span>
              <input value={caption.text ?? ''} onChange={(e) => setCaption(e.target.value)} maxLength={90} className="w-full bg-transparent text-center font-[family-name:var(--font-hand)] text-xl outline-none" />
            </label>
          ) : (
            <p className="text-center text-xs text-foreground/45">{spread?.kind === 'cover' ? 'Your title is on the cover. You can restyle it in the editor.' : 'No caption on this spread.'}</p>
          )}
        </Rise>
          </>
        )}
      </div>

      <Rise reveal={fancy} delay={0.85}>
        <aside className="space-y-4 rounded-3xl bg-white/70 p-4 ring-1 ring-white sm:p-5">
          <div>
            <p className="font-semibold leading-tight">{config.title}</p>
            <p className="mt-0.5 text-xs text-foreground/60">
              {size?.label} · {config.pages} pages · {cover?.label}
              {tpl ? ` · ${tpl.name}` : ''}
            </p>
          </div>
          <OfferStrip compact />
          <fieldset>
            <legend className="mb-2 text-xs font-semibold uppercase tracking-wider text-foreground/50">How should we pack it?</legend>
            <div className="space-y-2">
              {PACKAGING.map((p) => {
                const Icon = ICON[p.id]
                const on = config.packaging === p.id
                return (
                  <label key={p.id} className={cn('flex cursor-pointer items-center gap-3 rounded-2xl bg-white p-3 ring-1 transition has-[:focus-visible]:ring-2', on ? 'ring-2 ring-[var(--st-peach-ink)]' : 'ring-[var(--st-peach)] hover:ring-[var(--st-peach-ink)]/40')}>
                    <input type="radio" name="story-packaging" value={p.id} checked={on} onChange={() => flow.setConfig({ packaging: p.id })} className="sr-only" />
                    <span className={cn('grid size-9 shrink-0 place-items-center rounded-xl', on ? 'bg-[var(--st-ink)] text-white' : 'bg-[var(--st-cream)] text-foreground/60')}>
                      <Icon className="size-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold">{p.label}</span>
                      <span className="block text-[11px] leading-snug text-foreground/55">{p.blurb}</span>
                    </span>
                    <span className="text-xs font-semibold">{p.price ? `+$${p.price.toFixed(2)}` : 'Free'}</span>
                  </label>
                )
              })}
            </div>
          </fieldset>
        </aside>
      </Rise>

      <AnimatePresence>{reader && <BookReader spreads={spreads} photos={photos} title={config.title} start={i} onClose={() => setReader(false)} />}</AnimatePresence>
    </div>
  )
}

export function PreviewFooter({ config }: { config: BookConfig }) {
  const router = useRouter()
  const [busy, setBusy] = useState<'cart' | 'checkout' | null>(null)
  const ok = !!config.packaging

  async function order(to: '/cart/' | '/checkout/', e: React.MouseEvent) {
    const origin = { x: e.clientX, y: e.clientY }
    setBusy(to === '/cart/' ? 'cart' : 'checkout')
    await flow.addToCart()
    curtain.go(router, to, to === '/cart/' ? 'Adding your book to the cart…' : 'Taking you to checkout…', origin)
  }

  return (
    <>
      <div className="leading-tight">
        <PriceTag list={unitPrice(config)} size="md" />
        <p className="text-[11px] text-foreground/50">{ok ? 'Saved on this device. Design free, pay only to print.' : 'Choose packaging to continue'}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <GhostButton onClick={(e) => curtain.go(router, '/photo-book/editor/', 'Opening the editor…', { x: e.clientX, y: e.clientY })}>
          <Pencil className="size-4" /> Edit in editor
        </GhostButton>
        <button type="button" disabled={!ok || busy !== null} onClick={(e) => order('/cart/', e)} className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-white px-5 text-sm font-semibold ring-1 ring-inset ring-foreground/15 transition enabled:hover:ring-foreground/30 disabled:opacity-45">
          <ShoppingBag className="size-4" /> {busy === 'cart' ? 'Adding…' : 'Add to cart'}
        </button>
        <PrimaryButton disabled={!ok || busy !== null} onClick={(e) => order('/checkout/', e)}>
          {busy === 'checkout' ? 'One moment…' : 'Checkout now'}
        </PrimaryButton>
      </div>
    </>
  )
}
