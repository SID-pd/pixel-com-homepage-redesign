'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState, type ReactNode } from 'react'
import {
  ArrowLeft, Check, Cloud, Eye, ImageIcon, LayoutGrid, Layers, Loader2, Minus, Plus, Redo2, Save,
  ShoppingBag, Smile, Type, Undo2, Wand2, X, Palette,
} from 'lucide-react'
import { COVERS, SIZES } from '@/lib/flow/catalog'
import { autoBuild } from '@/lib/flow/layouts'
import { flow, useFlow } from '@/lib/flow/store'
import { cn } from '@/lib/utils'
import { PixovoLogo } from '@/components/pixel/pixovo-logo'
import { BookPreview } from '../book-preview'
import { FlowButton, FlowLink } from '../flow-button'
import { Modal } from '../modal'
import { EditorCanvas, type PageSide } from './canvas'
import { InspectorBody, PagesPanel, type InspectorTab } from './inspector'
import { ops } from './ops'
import { BackgroundsPanel, LayoutsPanel, PhotosPanel, StickersPanel, TextPanel } from './panels'
import { useMode } from './use-media'

type View = 'pages' | 'inspect' | 'photos' | 'layouts' | 'backgrounds' | 'text' | 'stickers'

const TOOLS: { id: Exclude<View, 'inspect'>; label: string; icon: ReactNode }[] = [
  { id: 'photos', label: 'Photos', icon: <ImageIcon className="size-[22px]" /> },
  { id: 'layouts', label: 'Layouts', icon: <LayoutGrid className="size-[22px]" /> },
  { id: 'backgrounds', label: 'Background', icon: <Palette className="size-[22px]" /> },
  { id: 'text', label: 'Text', icon: <Type className="size-[22px]" /> },
  { id: 'stickers', label: 'Stickers', icon: <Smile className="size-[22px]" /> },
  { id: 'pages', label: 'Pages', icon: <Layers className="size-[22px]" /> },
]

const TITLES: Record<View, string> = {
  pages: 'Pages', inspect: 'Edit', photos: 'Photos', layouts: 'Layouts', backgrounds: 'Background', text: 'Text', stickers: 'Stickers',
}

export function EditorView() {
  const router = useRouter()
  const mode = useMode()
  const { hydrated, draft, canUndo, canRedo, savedAt } = useFlow()

  const [idx, setIdx] = useState(0)
  // Which page of the open spread is being edited, and (mobile) whether we are on the All pages screen or inside a page.
  const [side, setSide] = useState<PageSide>('left')
  const [screen, setScreen] = useState<'overview' | 'edit'>('overview')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [view, setView] = useState<View>('pages')
  const [tab, setTab] = useState<Exclude<InspectorTab, 'pages'>>('edit')
  const [panelOpen, setPanelOpen] = useState(false) // tablet / mobile only; desktop is always open
  const [zoom, setZoom] = useState(1)
  const [preview, setPreview] = useState(false)
  const [leaving, setLeaving] = useState(false)
  const [toast, setToast] = useState('')

  const spreads = draft?.spreads ?? []
  const spread = spreads[Math.min(idx, Math.max(0, spreads.length - 1))]
  const selected = spread?.items.find((i) => i.id === selectedId) ?? null
  const desktop = mode === 'desktop'
  const mobile = mode === 'mobile'
  const open = desktop || panelOpen
  const showOverview = mobile && screen === 'overview'

  // A book with photos but no layout yet (opened straight from a deep link): build it once.
  useEffect(() => {
    if (draft && draft.spreads.length === 0) flow.buildBook()
  }, [draft])

  useEffect(() => {
    if (idx > spreads.length - 1 && spreads.length) setIdx(spreads.length - 1)
  }, [idx, spreads.length])

  /** Open one page for editing (from the All pages screen or panel). */
  const go = useCallback(
    (i: number, which: 'left' | 'right' = 'left') => {
      setIdx(i)
      setSide(which)
      setScreen('edit')
      setSelectedId(null)
      setView((v) => (v === 'inspect' ? 'pages' : v))
      if (!desktop) setPanelOpen(false)
    },
    [desktop],
  )

  /** A page was added, moved or deleted: keep the cursor sensible without leaving the current screen. */
  const mutated = useCallback((i: number) => {
    setIdx(Math.max(0, i))
    setSelectedId(null)
  }, [])

  const switchSide = useCallback((which: PageSide) => {
    setSide(which)
    setSelectedId(null)
    setView((v) => (v === 'inspect' ? 'pages' : v))
  }, [])

  const select = useCallback((id: string | null) => {
    setSelectedId(id)
    if (id) {
      setView('inspect')
      setPanelOpen(true)
    } else {
      setView((v) => (v === 'inspect' ? 'pages' : v))
    }
  }, [])

  const choose = (v: Exclude<View, 'inspect'>) => {
    if (v === 'pages' && mobile) {
      setSelectedId(null)
      setPanelOpen(false)
      setScreen('overview')
      return
    }
    if (view === v && open && !desktop) setPanelOpen(false)
    else if (view === v && desktop && v !== 'pages') setView('pages')
    else {
      setView(v)
      setPanelOpen(true)
    }
  }

  const requestPhotos = () => {
    setView('photos')
    setPanelOpen(true)
  }

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement
      if (t.closest('input, textarea, select, [contenteditable="true"], [role="dialog"]')) return
      const mod = e.ctrlKey || e.metaKey
      if (mod && e.key.toLowerCase() === 'z') {
        e.preventDefault()
        if (e.shiftKey) flow.redo()
        else flow.undo()
      } else if (mod && e.key.toLowerCase() === 'y') {
        e.preventDefault()
        flow.redo()
      } else if (!spread) return
      else if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) {
        e.preventDefault()
        ops.remove(spread.id, selectedId)
        select(null)
      } else if (e.key === 'Escape') select(null)
      else if (selected && !selected.locked && e.key.startsWith('Arrow')) {
        e.preventDefault()
        const step = e.shiftKey ? 2 : 0.5
        ops.patch(spread.id, selected.id, {
          x: selected.x + (e.key === 'ArrowRight' ? step : e.key === 'ArrowLeft' ? -step : 0),
          y: selected.y + (e.key === 'ArrowDown' ? step : e.key === 'ArrowUp' ? -step : 0),
        })
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [spread, selected, selectedId, select])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(''), 1800)
    return () => clearTimeout(t)
  }, [toast])

  if (!hydrated) return <div className="h-dvh bg-background" />

  if (!draft || !spread) {
    return (
      <div className="grid h-dvh place-items-center bg-background px-6">
        {leaving ? (
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        ) : (
          <div className="max-w-sm text-center">
            <h1 className="text-2xl font-semibold tracking-tight">No book to edit yet</h1>
            <p className="mt-2 text-muted-foreground">Start a book and add your photos, then come back to fine-tune it here.</p>
            <FlowLink href="/photo-book/" variant="accent" size="lg" arrow className="mt-6">
              Start a photo book
            </FlowLink>
          </div>
        )}
      </div>
    )
  }

  const { config, photos } = draft
  const size = SIZES.find((s) => s.id === config.size)!
  const cover = COVERS.find((c) => c.id === config.cover)!
  const saved = savedAt >= draft.updatedAt
  const used = new Set(spreads.flatMap((s) => s.items.map((i) => i.photoId).filter((x): x is string => !!x)))
  const aspect = spread.kind === 'cover' ? 1 : 2

  async function checkout() {
    setLeaving(true)
    await flow.addToCart()
    router.push('/checkout/')
  }

  function backToWizard() {
    flow.setStep(3)
    router.push('/photo-book/')
  }

  const label = idx === 0 ? 'Cover' : `Pages ${idx * 2 - 1}–${idx * 2}`

  const panel = (
    <PanelBody
      view={view}
      tab={tab}
      setTab={setTab}
      draftConfig={config}
      spreads={spreads}
      spread={spread}
      selected={selected}
      photos={photos}
      selectedId={selectedId}
      used={used}
      idx={idx}
      side={side}
      aspect={aspect}
      onGo={go}
      onMutated={mutated}
      onSelect={(id) => { setSelectedId(id); setView('inspect') }}
      onRequestPhotos={requestPhotos}
      onDeselect={() => select(null)}
      onPlaced={(id) => setSelectedId(id)}
    />
  )

  const panelHeader = (
    <div className="flex items-center justify-between border-b border-foreground/8 px-4 py-3">
      <h2 className="font-semibold">{view === 'inspect' ? (selected?.type === 'text' ? 'Text' : selected?.type === 'sticker' ? 'Sticker' : 'Image') : TITLES[view]}</h2>
      <div className="flex items-center gap-1">
        {view !== 'pages' && (
          <button type="button" onClick={() => { if (mobile) choose('pages'); else { setView('pages'); setSelectedId(null) } }} className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium text-muted-foreground transition hover:bg-foreground/6 hover:text-foreground">
            <Layers className="size-3.5" /> All pages
          </button>
        )}
        {!desktop && (
          <button type="button" aria-label="Close panel" onClick={() => setPanelOpen(false)} className="grid size-8 place-items-center rounded-lg hover:bg-foreground/6">
            <X className="size-4" />
          </button>
        )}
      </div>
    </div>
  )

  const inspectTabs = view === 'inspect' && (
    <div role="tablist" aria-label="Edit sections" className="flex gap-1 border-b border-foreground/8 px-3">
      {(['edit', 'arrange', 'page'] as const).map((t) => (
        <button
          key={t}
          type="button"
          role="tab"
          aria-selected={tab === t}
          onClick={() => setTab(t)}
          className={cn('relative h-11 px-3 text-sm font-medium capitalize transition', tab === t ? 'text-foreground' : 'text-muted-foreground hover:text-foreground')}
        >
          {t === 'edit' ? (selected?.type === 'photo' ? 'Image' : 'Style') : t}
          {tab === t && <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-[#2f6bff]" />}
        </button>
      ))}
    </div>
  )

  const topBar = (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b border-foreground/8 bg-card px-2 sm:h-16 sm:gap-3 sm:px-4">
      <button type="button" onClick={backToWizard} aria-label="Back to review" className="grid size-10 shrink-0 place-items-center rounded-full transition hover:bg-foreground/6">
        <ArrowLeft className="size-5" />
      </button>
      {!mobile && (
        <Link href="/" aria-label="Pixovo home" className="shrink-0">
          <PixovoLogo className="[&_img]:h-9" priority={false} />
        </Link>
      )}
      <div className="min-w-0 leading-tight sm:ml-2">
        <p className="truncate text-sm font-semibold">{config.title || 'My Photo Book'}</p>
        <p className="truncate text-xs text-muted-foreground">
          {size.label} {cover.label} · {config.pages} Pages
        </p>
      </div>

      <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
        {!mobile && (
          <>
            <IconBtn label="Undo" disabled={!canUndo} onClick={flow.undo}><Undo2 className="size-[18px]" /></IconBtn>
            <IconBtn label="Redo" disabled={!canRedo} onClick={flow.redo}><Redo2 className="size-[18px]" /></IconBtn>
            <span className="hidden items-center gap-1.5 px-2 text-xs text-muted-foreground xl:flex" role="status">
              {saved ? <><Cloud className="size-4" /> All changes saved</> : <><Loader2 className="size-4 animate-spin" /> Saving…</>}
            </span>
            <FlowButton variant="secondary" size="sm" onClick={() => setPreview(true)}><Eye className="size-4" /> Preview</FlowButton>
            <FlowButton variant="secondary" size="sm" onClick={() => { setToast('Saved to this device'); }}><Save className="size-4" /> Save</FlowButton>
          </>
        )}
        <FlowButton variant="primary" size={mobile ? 'sm' : 'md'} loading={leaving} onClick={checkout}>
          <ShoppingBag className="size-4" /> Checkout
        </FlowButton>
      </div>
    </header>
  )

  const isCover = spread.kind === 'cover'
  // "Spread" (both pages) only exists on larger screens; phones always edit one page.
  const viewSide: PageSide = mobile && side === 'both' ? 'left' : side
  const leftNo = idx * 2 - 1
  const rightNo = idx * 2

  // Switch between the two pages of the open spread. Not a free-flip: moving to another page goes through All pages.
  const pageToggle = (
    <div role="group" aria-label="Page being edited" className="inline-flex items-center gap-0.5 rounded-full bg-card p-1 shadow-float ring-1 ring-foreground/8">
      {isCover ? (
        <span className="px-4 py-1.5 text-sm font-semibold">Cover</span>
      ) : (
        <>
          {([
            ['left', `Page ${leftNo}`],
            ['right', `Page ${rightNo}`],
            ...(!mobile ? ([['both', 'Spread']] as const) : []),
          ] as const).map(([k, text]) => (
            <button
              key={k}
              type="button"
              aria-pressed={viewSide === k}
              onClick={() => switchSide(k)}
              className={cn('h-8 rounded-full px-3.5 text-sm font-medium tabular-nums transition', viewSide === k ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground')}
            >
              {text}
            </button>
          ))}
        </>
      )}
    </div>
  )

  const canvasArea = (
    <div className="relative min-h-0 flex-1 bg-[oklch(0.955_0.008_80)]" onPointerDown={(e) => e.target === e.currentTarget && select(null)}>
      <div className="absolute inset-0" style={mobile && panelOpen ? { paddingBottom: '46dvh' } : undefined}>
        <EditorCanvas
          spread={spread}
          photos={photos}
          selectedId={selectedId}
          onSelect={select}
          zoom={zoom}
          onRequestPhotos={requestPhotos}
          compact={mobile}
          side={isCover ? 'left' : viewSide}
        />
      </div>
      {toast && (
        <div role="status" className="absolute left-1/2 top-4 z-20 -translate-x-1/2 rounded-full bg-foreground px-4 py-2 text-sm text-background shadow-lift">
          <Check className="mr-1.5 inline size-4" /> {toast}
        </div>
      )}
    </div>
  )

  const bottomBar = (
    <div className="flex shrink-0 items-center justify-between gap-3 border-t border-foreground/8 bg-card/70 px-3 py-2 sm:px-4">
      <div className="hidden items-center gap-1 sm:flex">
        <IconBtn label="Zoom out" disabled={zoom <= 0.5} onClick={() => setZoom((z) => Math.max(0.5, +(z - 0.25).toFixed(2)))}><Minus className="size-4" /></IconBtn>
        <button type="button" onClick={() => setZoom(1)} className="w-14 text-center text-sm tabular-nums text-muted-foreground hover:text-foreground" aria-label="Reset zoom">{Math.round(zoom * 100)}%</button>
        <IconBtn label="Zoom in" disabled={zoom >= 2} onClick={() => setZoom((z) => Math.min(2, +(z + 0.25).toFixed(2)))}><Plus className="size-4" /></IconBtn>
      </div>
      <div className="mx-auto sm:mx-0">{pageToggle}</div>
      <div className="hidden items-center gap-2 sm:flex">
        <FlowButton
          variant="secondary"
          size="sm"
          onClick={() => {
            flow.checkpoint()
            flow.apply(() => autoBuild(config, photos, config.templateId))
            setIdx(0)
            setToast('Photos re-arranged. Undo to go back')
          }}
        >
          <Wand2 className="size-4" /> Auto-fill all
        </FlowButton>
      </div>
    </div>
  )

  const rail = (
    <nav aria-label="Editor tools" className={cn('flex shrink-0 gap-1 bg-ink text-ink-foreground', mobile ? 'order-last h-16 justify-around border-t border-white/10 px-1 pb-[env(safe-area-inset-bottom)]' : 'w-[76px] flex-col items-stretch overflow-y-auto px-1.5 py-3 xl:w-[88px]')}>
      {TOOLS.map((t) => {
        const active = view === t.id
        return (
          <button
            key={t.id}
            type="button"
            aria-pressed={active && open}
            onClick={() => choose(t.id)}
            className={cn(
              'flex flex-col items-center justify-center gap-1 rounded-xl text-[11px] font-medium transition',
              mobile ? 'min-w-0 flex-1 py-1.5' : 'py-3',
              active && open ? 'bg-white/14 text-white' : 'text-white/65 hover:bg-white/8 hover:text-white',
            )}
          >
            {t.icon}
            <span className="max-w-full truncate">{t.label}</span>
          </button>
        )
      })}
      {!mobile && (
        <button
          type="button"
          onClick={() => {
            flow.checkpoint()
            flow.apply(() => autoBuild(config, photos, config.templateId))
            setIdx(0)
            setToast('Photos re-arranged. Undo to go back')
          }}
          className="mt-auto flex flex-col items-center gap-1 rounded-xl py-3 text-[11px] font-medium text-white/65 transition hover:bg-white/8 hover:text-white xl:hidden"
        >
          <Wand2 className="size-[22px]" /> Auto
        </button>
      )}
    </nav>
  )

  // Mobile: inside a page, "All pages" takes you back; the toggle switches between the two pages of this spread.
  const mobileRow = mobile && (
    <div className="flex shrink-0 items-center justify-between gap-2 border-b border-foreground/8 bg-card px-3 py-2">
      {showOverview ? (
        <>
          <div className="min-w-0 px-1">
            <p className="text-sm font-semibold">All pages</p>
            <p className="text-xs text-muted-foreground">Tap a page to edit it</p>
          </div>
          <FlowButton variant="secondary" size="sm" onClick={() => setPreview(true)}>
            <Eye className="size-4" /> Preview
          </FlowButton>
        </>
      ) : (
        <>
          <button
            type="button"
            onClick={() => { setSelectedId(null); setPanelOpen(false); setScreen('overview') }}
            className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-secondary px-3 text-sm font-medium transition hover:bg-foreground/10"
          >
            <Layers className="size-4" /> Pages
          </button>
          {pageToggle}
          <div className="flex shrink-0">
            <IconBtn label="Undo" disabled={!canUndo} onClick={flow.undo}><Undo2 className="size-[18px]" /></IconBtn>
            <IconBtn label="Redo" disabled={!canRedo} onClick={flow.redo}><Redo2 className="size-[18px]" /></IconBtn>
          </div>
        </>
      )}
    </div>
  )

  return (
    <div className="fixed inset-0 flex flex-col bg-background">
      {topBar}
      {mobileRow}
      {showOverview ? (
        <div className="min-h-0 flex-1 overflow-y-auto bg-background p-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
          <PagesPanel spreads={spreads} photos={photos} index={idx} side={side} onOpen={go} onMutated={mutated} config={config} overview />
        </div>
      ) : (
      <div className={cn('flex min-h-0 flex-1', mobile && 'flex-col')}>
        {!mobile && rail}
        <div className="flex min-w-0 flex-1 flex-col">
          {canvasArea}
          {!mobile && bottomBar}
        </div>

        {desktop && (
          <aside aria-label="Editor panel" className="flex w-[320px] shrink-0 flex-col border-l border-foreground/8 bg-card xl:w-[340px]">
            {panelHeader}
            {inspectTabs}
            <div className="min-h-0 flex-1 overflow-y-auto p-4">{panel}</div>
          </aside>
        )}

        {mode === 'tablet' && panelOpen && (
          <aside aria-label="Editor panel" className="absolute bottom-0 right-0 top-[calc(4rem+1px)] z-30 flex w-[340px] max-w-[88vw] flex-col border-l border-foreground/8 bg-card shadow-lift">
            {panelHeader}
            {inspectTabs}
            <div className="min-h-0 flex-1 overflow-y-auto p-4">{panel}</div>
          </aside>
        )}

        {mobile && panelOpen && (
          <aside aria-label="Editor panel" className="absolute inset-x-0 bottom-16 z-30 flex h-[46dvh] flex-col overflow-hidden rounded-t-3xl border-t border-foreground/10 bg-card shadow-lift pb-[env(safe-area-inset-bottom)]">
            <div className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-foreground/15" aria-hidden />
            {panelHeader}
            {inspectTabs}
            <div className="min-h-0 flex-1 overflow-y-auto p-4">{panel}</div>
          </aside>
        )}
        {mobile && rail}
      </div>
      )}

      <Modal open={preview} onClose={() => setPreview(false)} title="Preview your book" className="sm:max-w-4xl">
        <div className="p-4 sm:p-6">
          <BookPreview spreads={spreads} photos={photos} startAt={idx} />
        </div>
      </Modal>
    </div>
  )
}

function IconBtn({ label, onClick, disabled, children }: { label: string; onClick: () => void; disabled?: boolean; children: ReactNode }) {
  return (
    <button type="button" aria-label={label} title={label} onClick={onClick} disabled={disabled} className="grid size-9 place-items-center rounded-full transition hover:bg-foreground/6 disabled:opacity-35">
      {children}
    </button>
  )
}

function PanelBody({
  view, tab, setTab, draftConfig, spreads, spread, selected, photos, selectedId, used, idx, side, aspect, onGo, onMutated, onSelect, onRequestPhotos, onDeselect, onPlaced,
}: {
  view: View
  tab: Exclude<InspectorTab, 'pages'>
  setTab: (t: Exclude<InspectorTab, 'pages'>) => void
  draftConfig: { size: '8x8' | '10x10' | '12x12'; pages: number; cover: 'hardcover' | 'softcover' }
  spreads: import('@/lib/flow/types').Spread[]
  spread: import('@/lib/flow/types').Spread
  selected: import('@/lib/flow/types').Item | null
  photos: import('@/lib/flow/types').Photo[]
  selectedId: string | null
  used: Set<string>
  idx: number
  side: PageSide
  aspect: number
  onGo: (i: number, side: 'left' | 'right') => void
  onMutated: (i: number) => void
  onSelect: (id: string) => void
  onRequestPhotos: () => void
  onDeselect: () => void
  onPlaced: (id: string) => void
}) {
  void setTab
  switch (view) {
    case 'pages':
      return <PagesPanel spreads={spreads} photos={photos} index={idx} side={side} onOpen={onGo} onMutated={onMutated} config={draftConfig} />
    case 'inspect':
      return <InspectorBody tab={tab} spread={spread} item={selected} photos={photos} onRequestPhotos={onRequestPhotos} onDeselect={onDeselect} aspect={aspect} />
    case 'photos':
      return <PhotosPanel spread={spread} photos={photos} selectedId={selectedId} used={used} onPlaced={onPlaced} />
    case 'layouts':
      return <LayoutsPanel spread={spread} />
    case 'backgrounds':
      return <BackgroundsPanel spread={spread} />
    case 'text':
      return <TextPanel spread={spread} onAdded={onSelect} />
    case 'stickers':
      return <StickersPanel spread={spread} onAdded={onSelect} />
  }
}
