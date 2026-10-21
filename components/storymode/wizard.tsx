'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { BookOpen, Image as ImageIcon, Sparkles, Type, UploadCloud } from 'lucide-react'
import { MarketingShell } from '@/components/content/blocks'
import { PriceTag } from '@/components/flow/offer-ui'
import { BookStage } from '@/components/story/book-stage'
import { PhotoDock, PhotoPill, PhotoViewer } from '@/components/story/photo-dock'
import { PhotoManager } from '@/components/story/photo-manager'
import { PreviewBody, PreviewFooter } from '@/components/story/preview-step'
import { usePhotoPipeline } from '@/components/story/scrapbook'
import { DropOverlay, useIngest, useStageDrop } from '@/components/story/upload-step'
import { COVERS, PAGE_COUNTS, SIZES, type CoverId, type SizeId } from '@/lib/flow/catalog'
import { analyzePhotos, isSuggestedRemoval, type PhotoReport } from '@/lib/flow/photo-check'
import { unitPrice } from '@/lib/flow/pricing'
import { flow, getState, useFlow } from '@/lib/flow/store'
import { captionsFor, orderPhotos } from '@/lib/flow/story'
import type { Draft } from '@/lib/flow/types'
import { cn } from '@/lib/utils'
import { ReviewDialog } from './review-dialog'
import { Stepper, type WizardStep } from './stepper'

const ORDER: WizardStep[] = ['book', 'photos', 'review', 'preview']
const MAX_PER_PAGE = 4
const EASE = [0.4, 0, 0.2, 1] as const

const SAMPLE_SETS = [
  { id: 'travel', label: 'Trip' },
  { id: 'wedding', label: 'Wedding' },
  { id: 'family', label: 'Family' },
  { id: 'mix', label: 'Surprise me' },
]

/** /storymode: the step-by-step version. Your book, photos, a review only if something needs it, then the preview. */
export function StoryModeWizard() {
  const { draft, hydrated } = useFlow()

  useEffect(() => {
    if (hydrated && !draft) flow.openDraft({ size: '10x10' })
  }, [hydrated, draft])

  if (!hydrated || !draft) {
    return (
      <MarketingShell hideFab>
        <div className="mx-auto max-w-3xl px-4 pb-24 pt-40">
          <div className="h-96 animate-pulse rounded-3xl bg-white/60" />
        </div>
      </MarketingShell>
    )
  }
  return <Wizard draft={draft} />
}

function Card({ icon, title, hint, children }: { icon: React.ReactNode; title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl bg-white/75 p-5 ring-1 ring-[#efe7da] sm:p-6">
      <div className="mb-4 flex items-start gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#fbeee6] text-[#d4673f]">{icon}</span>
        <div>
          <h2 className="text-[15px] font-semibold leading-tight text-[#16324f]">{title}</h2>
          {hint && <p className="mt-0.5 text-[13px] text-[#16324f]/70">{hint}</p>}
        </div>
      </div>
      {children}
    </section>
  )
}

function Pill({ name, checked, onChange, children }: { name: string; checked: boolean; onChange: () => void; children: React.ReactNode }) {
  return (
    <label className={cn('flex min-h-[3.1rem] cursor-pointer items-center gap-3 rounded-full border px-4 py-2.5 text-[15px] text-[#16324f] transition has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[#d4673f]/50', checked ? 'border-[#d4673f] bg-[#fbeee6]' : 'border-[#e8dfd2] bg-white hover:border-[#d9c9b3]')}>
      <input type="radio" name={name} checked={checked} onChange={onChange} className="sr-only" />
      <span aria-hidden className={cn('grid size-[18px] shrink-0 place-items-center rounded-full border-2 transition', checked ? 'border-[#d4673f]' : 'border-[#b9c2cc]')}>
        <span className={cn('size-2 rounded-full bg-[#d4673f] transition-transform', checked ? 'scale-100' : 'scale-0')} />
      </span>
      <span>{children}</span>
    </label>
  )
}

const orangeBtn = 'inline-flex h-12 items-center justify-center rounded-full bg-[#d4673f] px-7 text-[15px] font-semibold text-white shadow-[0_10px_24px_-12px_rgba(212,103,63,0.9)] transition enabled:hover:brightness-105 enabled:active:scale-[0.97] disabled:opacity-45'
const lightBtn = 'inline-flex h-12 items-center justify-center rounded-full bg-white px-7 text-[15px] font-semibold text-[#16324f] ring-1 ring-[#e3d9cb] transition hover:ring-[#cdbfa9] active:scale-[0.97]'

function Wizard({ draft }: { draft: Draft }) {
  const { config, photos, spreads } = draft

  const [step, setStep] = useState<WizardStep>('book')
  const [reached, setReached] = useState(0)
  const [title, setTitle] = useState('')
  const [reports, setReports] = useState<Record<string, PhotoReport> | null>(null)
  const [checking, setChecking] = useState({ active: false, done: 0, total: 0 })
  const [marked, setMarked] = useState<Set<string>>(new Set())
  const [dialog, setDialog] = useState(false)
  const [stage, setStage] = useState(false)
  const [viewId, setViewId] = useState<string | null>(null)
  const [manage, setManage] = useState(false)
  const [ignored] = useState<Set<string>>(new Set())

  const pipeline = usePhotoPipeline(photos)
  const { reading, errors, ingest, addPack } = useIngest(photos)
  const dropping = useStageDrop(ingest, step === 'photos' && !stage)
  const picker = useRef<HTMLInputElement>(null)
  const alive = useRef(true)
  const decided = useRef(false)

  useEffect(() => {
    alive.current = true
    return () => {
      alive.current = false
    }
  }, [])

  const min = config.pages
  const max = config.pages * MAX_PER_PAGE
  const count = photos.length
  const waiting = photos.filter((p) => pipeline.get(p.id).state !== 'ready').length

  const go = useCallback((s: WizardStep) => {
    setStep(s)
    setReached((r) => Math.max(r, ORDER.indexOf(s)))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  // ---- quiet photo check, as soon as uploads land -----------------------------------------------------------------------
  const photoSig = photos.map((p) => p.id).join(',')
  useEffect(() => {
    if (!photos.length || !pipeline.allReady) return
    let cancelled = false
    setChecking({ active: true, done: 0, total: photos.length })
    void analyzePhotos(photos, (done, total) => !cancelled && setChecking({ active: true, done, total })).then((r) => {
      if (cancelled || !alive.current) return
      setReports(r)
      setChecking({ active: false, done: photos.length, total: photos.length })
    })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photoSig, pipeline.allReady])

  // ---- build the book and show it ---------------------------------------------------------------------------------------
  const proceed = useCallback(() => {
    const d = getState().draft
    if (!d) return
    const ordered = orderPhotos(d.photos)
    const order = ordered.map((p) => p.id)
    const bookTitle = title.trim() || 'Our Story'
    const pages = d.config.pages
    flow.rebuildStory({ order, captions: {}, title: bookTitle, pages })
    const lead = (getState().draft?.spreads ?? [])
      .filter((s) => s.kind !== 'cover')
      .map((s) => s.items.find((i) => i.type === 'photo' && i.photoId)?.photoId)
      .filter(Boolean) as string[]
    const lines = captionsFor('', Math.max(lead.length, 1), 'general', 'warm')
    const map: Record<string, string> = {}
    lead.forEach((id, i) => (map[id] = lines[i % lines.length]))
    flow.rebuildStory({ order, captions: map, title: bookTitle, pages })
    setDialog(false)
    setStage(true)
    go('preview')
  }, [title, go])

  // The review step only exists when something needs a look; otherwise it is skipped straight to the preview.
  useEffect(() => {
    if (step !== 'review') {
      decided.current = false
      return
    }
    if (!reports || decided.current) return
    decided.current = true
    const flagged = photos.filter((p) => reports[p.id]?.issues.length && !ignored.has(p.id))
    if (flagged.length === 0) {
      proceed()
      return
    }
    setMarked(new Set(photos.filter((p) => reports[p.id] && (reports[p.id].duplicateOf || isSuggestedRemoval(reports[p.id]))).map((p) => p.id)))
    setDialog(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, reports])

  const applyAndContinue = () => {
    marked.forEach((id) => flow.removePhoto(id))
    setMarked(new Set())
    proceed()
  }

  const price = unitPrice(config)
  const cover = COVERS.find((c) => c.id === 'softcover')!
  const hardPlus = -cover.adjust

  const photoOk = count >= min && count <= max && pipeline.allReady && reading === 0
  const railOn = (step === 'photos' || step === 'review') && count > 0 && !stage

  return (
    <MarketingShell hideFab>
      <div className="relative px-4 pb-20 pt-32 sm:pt-40">
        <div className={cn('mx-auto transition-[max-width] duration-500', step === 'preview' ? 'max-w-5xl' : 'max-w-3xl', railOn && 'pb-24 lg:pb-0')}>
          <header className="text-center">
            <h1 className={cn('text-3xl font-bold tracking-tight text-[#16324f] sm:text-4xl', step === 'preview' && 'max-sm:text-2xl')}>Story Mode</h1>
            <p className={cn('mx-auto mt-3 max-w-xl text-[15px] text-[#16324f]/80', step === 'preview' && 'max-sm:hidden')}>Upload your photos and we’ll arrange them into a book that tells your story. You can edit everything afterwards.</p>
          </header>

          <div className={cn('mt-8', step === 'preview' && 'max-sm:mt-5')}>
            <Stepper step={step} reached={reached} onGo={go} />
          </div>

          {/* enter-only: a step never waits on an exit animation, so a throttled or backgrounded tab cannot stall the wizard */}
          <motion.div key={step} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: EASE }} className={cn('mt-8 space-y-5', step === 'preview' && 'max-sm:mt-5')}>
              {step === 'book' && (
                <>
                  <Card icon={<BookOpen className="size-[18px]" />} title="1. Book size">
                    <div className="grid gap-3 sm:grid-cols-3">
                      {[...SIZES].sort((a, b) => ['10x10', '12x12', '8x8'].indexOf(a.id) - ['10x10', '12x12', '8x8'].indexOf(b.id)).map((s) => (
                        <Pill key={s.id} name="size" checked={config.size === s.id} onChange={() => flow.setConfig({ size: s.id as SizeId })}>
                          {s.label.replace(/[″"]/g, '').replace('×', 'x')}
                        </Pill>
                      ))}
                    </div>
                  </Card>

                  <Card icon={<ImageIcon className="size-[18px]" />} title="2. Number of pages" hint="Your book needs at least one photo per page.">
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                      {PAGE_COUNTS.map((n) => (
                        <Pill key={n} name="pages" checked={config.pages === n} onChange={() => flow.setConfig({ pages: n })}>
                          {n} pages
                        </Pill>
                      ))}
                    </div>
                  </Card>

                  <Card icon={<BookOpen className="size-[18px]" />} title="3. Cover">
                    <div className="grid gap-3 sm:grid-cols-2">
                      {COVERS.map((c) => (
                        <Pill key={c.id} name="cover" checked={config.cover === c.id} onChange={() => flow.setConfig({ cover: c.id as CoverId })}>
                          {c.label}
                          {c.id === 'hardcover' && hardPlus > 0 ? ` (+$${hardPlus.toFixed(2)})` : ''}
                        </Pill>
                      ))}
                    </div>
                  </Card>

                  <Card icon={<Type className="size-[18px]" />} title="4. Book title (optional)">
                    <label className="sr-only" htmlFor="sm-title">
                      Book title
                    </label>
                    <input id="sm-title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={40} placeholder="e.g. Summer in Lisbon" className="h-12 w-full rounded-2xl border border-[#e8dfd2] bg-white px-4 text-[15px] text-[#16324f] outline-none transition placeholder:text-[#16324f]/40 focus:border-[#d4673f] focus:ring-4 focus:ring-[#d4673f]/15" />
                  </Card>

                  <div className="flex flex-col gap-4 pt-1 sm:flex-row sm:items-center sm:justify-between">
                    <PriceTag list={price} size="lg" />
                    <button type="button" className={cn(orangeBtn, 'w-full sm:w-auto')} onClick={() => go('photos')}>
                      Next: add photos
                    </button>
                  </div>
                </>
              )}

              {step === 'photos' && (
                <>
                  <Card icon={<UploadCloud className="size-[18px]" />} title="5. Your photos" hint={`At least ${min} photos for ${config.pages} pages (up to ${max}).`}>
                    <p className="mb-4 text-[13px] text-[#16324f]/75">AI suggests captions from small previews of your photos. You can change every word in the editor.</p>
                    <div className="grid place-items-center gap-3 rounded-2xl border-2 border-dashed border-[#d9cdbb] bg-white/70 px-4 py-10 text-center">
                      <motion.span animate={{ y: [0, -4, 0] }} transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }} className="grid size-12 place-items-center rounded-full bg-[#fbeee6] text-[#d4673f]">
                        <UploadCloud className="size-6" />
                      </motion.span>
                      <p className="text-[15px] text-[#16324f]">
                        Drop photos here or{' '}
                        <button type="button" onClick={() => picker.current?.click()} className="font-semibold underline underline-offset-4 hover:no-underline">
                          browse
                        </button>
                      </p>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-[#16324f]/70">
                      <span className="inline-flex items-center gap-1.5 font-semibold">
                        <Sparkles className="size-3.5 text-[#d4673f]" /> No photos handy? Try a sample set:
                      </span>
                      {SAMPLE_SETS.map((s) => (
                        <button key={s.id} type="button" onClick={() => void addPack(s.id)} className="inline-flex h-8 items-center rounded-full bg-[#fff0b5] px-3 font-medium text-[#16324f] transition hover:brightness-95 active:scale-95">
                          {s.label}
                        </button>
                      ))}
                    </div>

                    <p className="mt-4 text-[13px] text-[#16324f]" aria-live="polite">
                      {count - waiting} of at least {min} photos
                      {waiting > 0 ? ` · uploading ${waiting}…` : count > 0 ? ' · all uploaded' : ''}
                    </p>
                    {count > max && <p className="mt-1 text-[13px] text-[#c0392b]">That’s more than {config.pages} pages can hold. Remove some photos or choose more pages.</p>}
                    {count > 0 && count < min && <p className="mt-1 text-[13px] text-[#16324f]/60">Add {min - count} more to continue.</p>}
                    {errors.length > 0 && (
                      <ul role="alert" className="mt-2 space-y-1 rounded-xl bg-[#fde8df] p-3 text-xs text-[#a3401f]">
                        {errors.slice(0, 3).map((e, i) => (
                          <li key={i}>{e}</li>
                        ))}
                      </ul>
                    )}
                  </Card>

                  <div className="flex flex-col-reverse gap-3 pt-1 sm:flex-row sm:items-center sm:justify-between">
                    <button type="button" className={cn(lightBtn, 'w-full sm:w-auto')} onClick={() => go('book')}>
                      Back
                    </button>
                    <button type="button" className={cn(orangeBtn, 'w-full sm:w-auto')} disabled={!photoOk} onClick={() => go('review')}>
                      Next: check photos
                    </button>
                  </div>
                </>
              )}

              {step === 'review' && (
                <>
                  <div className="rounded-2xl bg-[#dff3ec] px-5 py-4 text-[15px] text-[#14705a]" aria-live="polite">
                    {reports ? `Ready: ${count} photos for ${config.pages} pages.` : checking.total ? `Checking your photos… ${checking.done}/${checking.total}` : 'Waiting for your photos to finish uploading…'}
                  </div>
                  <div className="flex items-center justify-between gap-3 pt-1">
                    <button type="button" className={lightBtn} onClick={() => go('photos')}>
                      Back
                    </button>
                    {reports && !dialog && (
                      <button type="button" className={orangeBtn} onClick={() => { decided.current = false; setDialog(false); go('review'); setReports({ ...reports }) }}>
                        Review photos
                      </button>
                    )}
                  </div>
                </>
              )}

              {step === 'preview' && !stage && (
                <>
                  <div className="rounded-[2rem] bg-white/75 p-4 ring-1 ring-[#efe7da] max-sm:bg-transparent max-sm:p-0 max-sm:ring-0 sm:p-8">
                    <PreviewBody reveal config={config} spreads={spreads} photos={photos} onAddPhotos={() => go('photos')} />
                    <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-[#eee7db] pt-5 max-sm:mt-4 max-sm:border-0 max-sm:pt-0">
                      <PreviewFooter config={config} onBack={() => go('photos')} />
                    </div>
                  </div>
                </>
              )}
          </motion.div>
        </div>
      </div>

      {/* uploads happen quietly down the right edge, exactly like Story Mode */}
      {railOn && (
        <div className="fixed bottom-4 right-0 top-28 z-30 hidden w-24 lg:block">
          <PhotoDock
            photos={photos}
            status={pipeline.get}
            flags={new Set(photos.filter((p) => reports?.[p.id]?.issues.length).map((p) => p.id))}
            checking={checking}
            onOpen={setViewId}
            onAdd={() => picker.current?.click()}
            onManage={() => setManage(true)}
          />
        </div>
      )}

      {railOn && <PhotoPill photos={photos} status={pipeline.get} checking={checking} onManage={() => setManage(true)} className="fixed bottom-4 right-4 z-30 lg:hidden" />}

      <input ref={picker} type="file" accept="image/*" multiple className="sr-only" aria-hidden tabIndex={-1} onChange={(e) => { void ingest(Array.from(e.target.files ?? [])); e.target.value = '' }} />

      <DropOverlay show={dropping} />

      <AnimatePresence>{stage && <BookStage photos={photos} spreads={spreads} title={config.title} onDone={() => setStage(false)} />}</AnimatePresence>

      <div className="pointer-events-none fixed inset-0 z-[70] [&>*]:pointer-events-auto">
        <AnimatePresence>
          {dialog && reports && step === 'review' && (
            <ReviewDialog
              photos={photos}
              reports={reports}
              marked={marked}
              minPhotos={min}
              onSetMarked={setMarked}
              onOpen={setViewId}
              onUploadMore={() => {
                setDialog(false)
                go('photos')
                window.setTimeout(() => picker.current?.click(), 450)
              }}
              onContinue={applyAndContinue}
              onBack={() => {
                setDialog(false)
              }}
            />
          )}
        </AnimatePresence>
        <AnimatePresence>
          {manage && (
            <PhotoManager
              photos={photos}
              status={pipeline.get}
              reports={reports}
              ignored={ignored}
              onOpen={setViewId}
              onRemoveMany={(ids) => ids.forEach((id) => flow.removePhoto(id))}
              onKeep={() => {}}
              onUndoKeep={() => {}}
              onAdd={() => picker.current?.click()}
              onClose={() => setManage(false)}
            />
          )}
        </AnimatePresence>
        <AnimatePresence>
          {viewId && <PhotoViewer photos={photos} id={viewId} status={pipeline.get} reports={reports} onNav={setViewId} onRemove={(id) => flow.removePhoto(id)} onClose={() => setViewId(null)} />}
        </AnimatePresence>
      </div>
    </MarketingShell>
  )
}
