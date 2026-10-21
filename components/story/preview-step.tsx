'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { AlertTriangle, ArrowLeft, ArrowRight, BookOpen, Maximize2, Pencil, Rows3 } from 'lucide-react'
import { curtain } from '@/components/flow/page-curtain'
import { COVERS, SIZES, TEMPLATES } from '@/lib/flow/catalog'
import { flow } from '@/lib/flow/store'
import type { BookConfig, Photo, Spread } from '@/lib/flow/types'
import { cn } from '@/lib/utils'
import { useMode } from '@/components/flow/editor/use-media'
import { BookReader, PagesScroll } from './book-reader'
import { Celebration } from './celebration'
import { Flipbook, spreadLabel } from './flipbook'
import { SinglePageBook } from './single-page-book'

const EASE = [0.22, 1, 0.36, 1] as const

const seg = (on: boolean) =>
  cn('inline-flex h-10 items-center justify-center gap-2 rounded-full px-3 text-[13px] font-semibold transition sm:px-4 sm:text-sm', on ? 'bg-[#16324f] text-white shadow-sm' : 'text-[#16324f]/70 hover:bg-white hover:text-[#16324f]')

/**
 * Step 4: the finished book. Two ways to look at it:
 *  - Flip through: a real book whose pages turn
 *  - Scroll: every spread one under the next, with a list of all pages on the right to jump around
 * Packaging and pricing are chosen at checkout, so nothing here asks for a decision.
 */
export function PreviewBody({ config, spreads, photos, reveal = false, onAddPhotos }: { config: BookConfig; spreads: Spread[]; photos: Photo[]; reveal?: boolean; onAddPhotos?: () => void }) {
  const [index, setIndex] = useState(0)
  const [tab, setTab] = useState<'flip' | 'scroll'>('flip')
  const [reader, setReader] = useState(false)
  const reduce = useReducedMotion()
  const mobile = useMode() === 'mobile'
  const fancy = reveal && !reduce
  const last = Math.max(0, spreads.length - 1)
  const i = Math.min(index, last)
  const spread = spreads[i]
  const emptySpreads = spreads.filter((sp) => sp.items.some((it) => it.type === 'photo' && !it.photoId)).length
  const caption = spread?.items.find((it) => it.type === 'text' && it.id.startsWith('c_'))
  const tpl = TEMPLATES.find((t) => t.id === config.templateId)
  const size = SIZES.find((s) => s.id === config.size)
  const cover = COVERS.find((c) => c.id === config.cover)

  function setCaption(text: string) {
    if (!spread || !caption) return
    flow.apply((all) => all.map((s) => (s.id !== spread.id ? s : { ...s, items: s.items.map((it) => (it.id === caption.id ? { ...it, text } : it)) })))
  }

  // Phones get one page at a time and nothing else: no view switch, no full-screen mode, no extra chrome.
  if (mobile) {
    return (
      <motion.div initial={fancy ? { opacity: 0, y: 14 } : false} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: EASE }} className="space-y-3">
        {emptySpreads > 0 && (
          <p role="note" className="flex items-center gap-2 rounded-xl bg-[#fff6d6] px-3 py-2 text-xs font-medium text-[#6b4f00]">
            <AlertTriangle className="size-3.5 shrink-0" /> {emptySpreads} spread{emptySpreads === 1 ? '' : 's'} with empty photo spots
            {onAddPhotos && (
              <button type="button" onClick={onAddPhotos} className="ml-auto font-semibold underline underline-offset-2">
                Add photos
              </button>
            )}
          </p>
        )}
        <SinglePageBook spreads={spreads} photos={photos} />
      </motion.div>
    )
  }

  return (
    <motion.div initial={fancy ? { opacity: 0, y: 18 } : false} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: fancy ? 0.1 : 0, ease: EASE }} className="relative space-y-6">
      {fancy && <Celebration delay={0.3} />}

      {emptySpreads > 0 && (
        <div role="note" className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-2xl bg-[#fff6d6] px-4 py-3 text-sm text-[#6b4f00]">
          <AlertTriangle className="size-4 shrink-0" />
          <span className="font-semibold">
            {emptySpreads} of {spreads.length} spreads have empty photo spots
          </span>
          <span className="text-[#6b4f00]/75">They print as blank space.</span>
          {onAddPhotos && (
            <button type="button" onClick={onAddPhotos} className="ml-auto inline-flex h-9 items-center rounded-full bg-[#16324f] px-4 text-xs font-semibold text-white transition hover:opacity-90 active:scale-95">
              Add photos
            </button>
          )}
        </div>
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h2 className="truncate text-2xl font-bold tracking-tight text-[#16324f]">{config.title}</h2>
          <p className="mt-1 text-sm text-[#16324f]/65">
            {size?.label.replace(/[″"]/g, '').replace('×', 'x')} · {config.pages} pages · {cover?.label}
            {tpl ? ` · ${tpl.name}` : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div role="tablist" aria-label="How to look at your book" className="grid flex-1 grid-cols-2 items-center gap-1 rounded-full bg-[#f1ece4] p-1 sm:flex sm:flex-none">
            <button type="button" role="tab" aria-selected={tab === 'flip'} onClick={() => setTab('flip')} className={seg(tab === 'flip')}>
              <BookOpen className="size-4" /> Flip
            </button>
            <button type="button" role="tab" aria-selected={tab === 'scroll'} onClick={() => setTab('scroll')} className={seg(tab === 'scroll')}>
              <Rows3 className="size-4" /> <span className="sm:hidden">Scroll</span><span className="hidden sm:inline">Scroll all pages</span>
            </button>
          </div>
          <button type="button" onClick={() => setReader(true)} aria-label="Full screen" className="inline-flex size-12 shrink-0 items-center justify-center gap-2 rounded-full bg-white text-sm font-semibold text-[#16324f] ring-1 ring-[#e3d9cb] transition hover:ring-[#cdbfa9] active:scale-95 sm:w-auto sm:px-4">
            <Maximize2 className="size-4" /> <span className="hidden sm:inline">Full screen</span>
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait" initial={false}>
        {tab === 'flip' ? (
          <motion.div key="flip" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.35, ease: EASE }} className="rounded-[1.5rem] bg-[#f6f1e8] px-2 pb-5 pt-6 sm:rounded-[1.75rem] sm:px-8 sm:pb-8 sm:pt-12">
            <Flipbook spreads={spreads} photos={photos} index={i} onIndex={setIndex} className="max-w-[860px]" />
            <div className="mx-auto mt-5 max-w-md">
              {caption ? (
                <label className="flex items-center gap-2 rounded-full bg-white px-4 py-2 shadow-sm ring-1 ring-[#e8dfd2] focus-within:ring-2 focus-within:ring-[#d4673f]/50">
                  <Pencil className="size-3.5 shrink-0 text-[#16324f]/40" aria-hidden />
                  <span className="sr-only">Caption for {spreadLabel(i)}</span>
                  <input value={caption.text ?? ''} onChange={(e) => setCaption(e.target.value)} maxLength={90} className="w-full bg-transparent text-center font-[family-name:var(--font-hand)] text-xl outline-none" />
                </label>
              ) : (
                <p className="text-center text-xs text-[#16324f]/50">{spread?.kind === 'cover' ? 'Your title is on the cover. You can restyle it in the editor.' : 'No caption on this spread.'}</p>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div key="scroll" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.35, ease: EASE }}>
            <PagesScroll spreads={spreads} photos={photos} />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>{reader && <BookReader spreads={spreads} photos={photos} title={config.title} start={i} onClose={() => setReader(false)} />}</AnimatePresence>
    </motion.div>
  )
}

/**
 * The only three things to do from the preview. Packaging, wrapping and the price are all handled at checkout.
 */
export function PreviewFooter({ config, onBack }: { config: BookConfig; onBack: () => void }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)

  async function checkout(e: React.MouseEvent) {
    const origin = { x: e.clientX, y: e.clientY }
    setBusy(true)
    // basic packaging unless they choose another at checkout
    if (!config.packaging) flow.setConfig({ packaging: 'basic' })
    await flow.addToCart()
    curtain.go(router, '/checkout/', 'Taking you to checkout…', origin)
  }

  return (
    <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <button type="button" disabled={busy} onClick={checkout} className="order-first inline-flex h-14 w-full items-center justify-center gap-2 rounded-full bg-[#d4673f] px-8 text-base font-semibold text-white shadow-[0_10px_24px_-12px_rgba(212,103,63,0.9)] transition enabled:hover:brightness-105 enabled:active:scale-[0.97] disabled:opacity-60 sm:order-last sm:h-12 sm:w-auto sm:text-[15px]">
        {busy ? 'One moment…' : 'Checkout'} <ArrowRight className="size-4" />
      </button>
      <div className="grid grid-cols-2 gap-3 sm:contents">
        <button type="button" onClick={onBack} className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-white px-4 text-[15px] font-semibold text-[#16324f] ring-1 ring-[#e3d9cb] transition hover:ring-[#cdbfa9] active:scale-[0.97] sm:order-first sm:px-5">
          <ArrowLeft className="size-4" /> Back to photos
        </button>
        <button type="button" onClick={(e) => curtain.go(router, '/photo-book/editor/', 'Opening the editor…', { x: e.clientX, y: e.clientY })} className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-white px-4 text-[15px] font-semibold text-[#16324f] ring-1 ring-[#e3d9cb] transition hover:ring-[#cdbfa9] active:scale-[0.97] sm:ml-auto sm:mr-3 sm:px-5">
          <Pencil className="size-4" /> Edit
        </button>
      </div>
    </div>
  )
}
