'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import {
  ArrowLeft, ArrowRight, Check, ChevronDown, ChevronLeft, ChevronRight, Columns2, Eye, Hand, ImageIcon, LayoutGrid, Layers, Loader2, Maximize2,
  Minimize2, Palette, Redo2, ShoppingBag, Smile, Sparkles, Square, Trash2, Type, Undo2, X, ZoomIn, ZoomOut,
} from 'lucide-react'
import { COVERS, SIZES } from '@/lib/flow/catalog'
import { autoBuild } from '@/lib/flow/layouts'
import { flow, useFlow } from '@/lib/flow/store'
import type { Item, Photo, Spread } from '@/lib/flow/types'
import { cn } from '@/lib/utils'
import { PixovoLogo } from '@/components/pixel/pixovo-logo'
import { BookPreview } from '../book-preview'
import { FlowButton, FlowLink } from '../flow-button'
import { Modal } from '../modal'
import { EditorCanvas, type PageSide } from './canvas'
import { InspectorBody, PagesPanel, type InspectorTab } from './inspector'
import { ops } from './ops'
import { PagesSidebar } from './pages-sidebar'
import { BackgroundsPanel, LayoutsPanel, PhotosPanel, StickersPanel, TextPanel } from './panels'
import { useMode } from './use-media'

type View = 'pages' | 'inspect' | 'photos' | 'layouts' | 'backgrounds' | 'text' | 'stickers'
type Tool = Exclude<View, 'inspect'>

const TOOLS: { id: Tool; label: string; icon: ReactNode }[] = [
  { id: 'photos', label: 'Photos', icon: <ImageIcon className="size-[22px]" /> },
  { id: 'layouts', label: 'Layouts', icon: <LayoutGrid className="size-[22px]" /> },
  { id: 'backgrounds', label: 'Background', icon: <Palette className="size-[22px]" /> },
  { id: 'stickers', label: 'Stickers', icon: <Smile className="size-[22px]" /> },
  { id: 'text', label: 'Text', icon: <Type className="size-[22px]" /> },
  { id: 'pages', label: 'Pages', icon: <Layers className="size-[22px]" /> },
]

const TITLES: Record<View, string> = {
  pages: 'Pages', inspect: 'Edit', photos: 'Photos', layouts: 'Layouts', backgrounds: 'Backgrounds', text: 'Text', stickers: 'Stickers',
}

export function EditorView() {
  const router = useRouter()
  const mode = useMode()
  const { hydrated, draft, canUndo, canRedo, savedAt } = useFlow()

  const [idx, setIdx] = useState(0)
  // The page being worked on within the open spread. Single-page view shows only this page; spread view outlines it.
  const [side, setSide] = useState<'left' | 'right'>('left')
  // null = automatic (single page on phones/tablets, full spread on desktop); true/false = the user's choice.
  const [focusPref, setFocusPref] = useState<boolean | null>(null)
  const [screen, setScreen] = useState<'overview' | 'edit'>('overview') // mobile only
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [view, setView] = useState<View>('photos')
  const [lastTool, setLastTool] = useState<Tool>('photos')
  const [tab, setTab] = useState<Exclude<InspectorTab, 'pages'>>('edit')
  const [panelOpen, setPanelOpen] = useState(false) // tablet / mobile slide-over or sheet
  const [leftOpen, setLeftOpen] = useState(true) // desktop tool panel
  const [sidebarOpen, setSidebarOpen] = useState(true) // desktop pages strip
  const [zoom, setZoom] = useState(1)
  const [hand, setHand] = useState(false)
  const [preview, setPreview] = useState(false)
  const [leaving, setLeaving] = useState(false)
  const [toast, setToast] = useState('')
  const [fullscreen, setFullscreen] = useState(false)

  const spreads = draft?.spreads ?? []
  const spread = spreads[Math.min(idx, Math.max(0, spreads.length - 1))]
  const selected = spread?.items.find((i) => i.id === selectedId) ?? null
  const desktop = mode === 'desktop'
  const mobile = mode === 'mobile'
  const open = desktop ? leftOpen : panelOpen
  const showOverview = mobile && screen === 'overview'
  const focus = mobile ? true : (focusPref ?? !desktop)
  /** where the panel returns to when nothing is selected */
  const restView: View = desktop ? lastTool : 'pages'

  // A book with photos but no layout yet (opened straight from a deep link): build it once.
  useEffect(() => {
    if (draft && draft.spreads.length === 0) flow.buildBook()
  }, [draft])

  useEffect(() => {
    if (idx > spreads.length - 1 && spreads.length) setIdx(spreads.length - 1)
  }, [idx, spreads.length])

  useEffect(() => {
    const on = () => setFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', on)
    return () => document.removeEventListener('fullscreenchange', on)
  }, [])

  // "Pages" is its own screen/panel on small layouts; on desktop it lives in the right-hand strip.
  useEffect(() => {
    if (desktop && view === 'pages') setView(lastTool)
  }, [desktop, view, lastTool])

  /** Open one page for editing. */
  const go = useCallback(
    (i: number, which: 'left' | 'right' = 'left') => {
      setIdx(i)
      setSide(which)
      setScreen('edit')
      setSelectedId(null)
      setView((v) => (v === 'inspect' ? restView : v))
      if (!desktop) setPanelOpen(false)
    },
    [desktop, restView],
  )

  /** A page was added, moved or deleted: keep the cursor sensible without leaving the current screen. */
  const mutated = useCallback((i: number) => {
    setIdx(Math.max(0, i))
    setSelectedId(null)
  }, [])

  const switchSide = useCallback(
    (which: 'left' | 'right') => {
      setSide(which)
      setSelectedId(null)
      setView((v) => (v === 'inspect' ? restView : v))
    },
    [restView],
  )

  const select = useCallback(
    (id: string | null) => {
      setSelectedId(id)
      if (id) {
        setView('inspect')
        setPanelOpen(true)
        setLeftOpen(true)
      } else {
        setView((v) => (v === 'inspect' ? restView : v))
      }
    },
    [restView],
  )

  const choose = (v: Tool) => {
    if (v === 'pages' && mobile) {
      setSelectedId(null)
      setPanelOpen(false)
      setScreen('overview')
      return
    }
    if (desktop) {
      if (v === 'pages') return
      setView(v)
      setLastTool(v)
      setLeftOpen(true)
      return
    }
    if (view === v && panelOpen) setPanelOpen(false)
    else {
      setView(v)
      setPanelOpen(true)
    }
  }

  const requestPhotos = () => {
    setView('photos')
    setLastTool('photos')
    setPanelOpen(true)
    setLeftOpen(true)
  }

  const addedItem = (id: string) => {
    setSelectedId(id)
    setView('inspect')
    setPanelOpen(true)
    setLeftOpen(true)
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
    const t = setTimeout(() => setToast(''), 2200)
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
  const isCover = spread.kind === 'cover'
  const viewSide: PageSide = isCover ? 'left' : focus ? side : 'both'
  const leftNo = idx * 2 - 1
  const rightNo = idx * 2
  const spreadLabel = isCover ? 'Front Cover' : `${leftNo} — ${rightNo}`
  const canAdd = ops.canAddSpread(spreads.length)
  const pageName = isCover ? 'cover' : `page ${side === 'left' ? leftNo : rightNo}`

  async function checkout() {
    setLeaving(true)
    await flow.addToCart()
    router.push('/checkout/')
  }

  function backToWizard() {
    flow.setStep(3)
    router.push('/photo-book/')
  }

  function autoCreate() {
    flow.checkpoint()
    flow.apply(() => autoBuild(config, photos, config.templateId))
    setIdx(0)
    setSelectedId(null)
    setToast('Photos re-arranged. Undo to go back')
  }

  function toggleFullscreen() {
    if (document.fullscreenElement) void document.exitFullscreen()
    else void document.documentElement.requestFullscreen?.().catch(() => setToast('Full screen is blocked in this browser'))
  }

  function deletePages() {
    if (isCover || !ops.canRemoveSpread(spreads.length)) return
    ops.removeSpread(spread.id)
    mutated(Math.max(1, Math.min(idx, spreads.length - 2)))
    setToast('Pages deleted. Undo to bring them back')
  }

  const panel = (
    <PanelBody
      view={view}
      tab={tab}
      draftConfig={config}
      spreads={spreads}
      spread={spread}
      selected={selected}
      photos={photos}
      selectedId={selectedId}
      used={used}
      idx={idx}
      side={viewSide}
      activeSide={side}
      aspect={aspect}
      onGo={go}
      onMutated={mutated}
      onSelect={addedItem}
      onRequestPhotos={requestPhotos}
      onDeselect={() => select(null)}
      onPlaced={(id) => setSelectedId(id)}
    />
  )

  const panelTitle = view === 'inspect' ? (selected?.type === 'text' ? 'Text' : selected?.type === 'sticker' ? 'Sticker' : 'Image') : TITLES[view]

  const panelHeader = (
    <div className="flex items-center justify-between px-5 py-4">
      <h2 className="text-xl font-semibold">{panelTitle}</h2>
      <div className="flex items-center gap-1">
        {!desktop && view !== 'pages' && (
          <button
            type="button"
            onClick={() => { if (mobile) choose('pages'); else { setView('pages'); setSelectedId(null) } }}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium text-muted-foreground transition hover:bg-foreground/6 hover:text-foreground"
          >
            <Layers className="size-3.5" /> All pages
          </button>
        )}
        <button
          type="button"
          aria-label="Close panel"
          onClick={() => (desktop ? setLeftOpen(false) : setPanelOpen(false))}
          className="grid size-9 place-items-center rounded-lg hover:bg-foreground/6"
        >
          <X className="size-5" />
        </button>
      </div>
    </div>
  )

  const inspectTabs = view === 'inspect' && (
    <div role="tablist" aria-label="Edit sections" className="flex gap-1 border-b border-foreground/8 px-4">
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
          {tab === t && <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-accent" />}
        </button>
      ))}
    </div>
  )

  // ---- top bar -----------------------------------------------------------------
  const topBar = mobile ? (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b border-foreground/8 bg-card px-2">
      <button type="button" onClick={backToWizard} aria-label="Back to review" className="grid size-10 shrink-0 place-items-center rounded-full transition hover:bg-foreground/6">
        <ArrowLeft className="size-5" />
      </button>
      <div className="min-w-0 leading-tight">
        <p className="truncate text-sm font-semibold">{config.title || 'My Photo Book'}</p>
        <p className="truncate text-xs text-muted-foreground">
          {size.label} {cover.label} · {config.pages} Pages
        </p>
      </div>
      <FlowButton variant="primary" size="sm" loading={leaving} onClick={checkout} className="ml-auto">
        <ShoppingBag className="size-4" /> Checkout
      </FlowButton>
    </header>
  ) : (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b border-foreground/8 bg-card px-3 sm:gap-3 sm:px-4">
      <button type="button" onClick={backToWizard} aria-label="Back to review" className="grid size-10 shrink-0 place-items-center rounded-full transition hover:bg-foreground/6">
        <ArrowLeft className="size-5" />
      </button>
      <Link href="/" aria-label="Pixovo home" className="shrink-0">
        <PixovoLogo className="[&_img]:h-9" priority={false} />
      </Link>
      <span aria-hidden className="mx-1 hidden h-7 w-px bg-foreground/12 sm:block" />
      <IconBtn label={fullscreen ? 'Exit full screen' : 'Full screen'} onClick={toggleFullscreen}>
        {fullscreen ? <Minimize2 className="size-[18px]" /> : <Maximize2 className="size-[18px]" />}
      </IconBtn>
      <span className="inline-flex items-center gap-1.5 px-1 text-sm font-medium" role="status">
        {saved ? <><Check className="size-4 text-accent" /> Saved</> : <><Loader2 className="size-4 animate-spin text-muted-foreground" /> Saving…</>}
      </span>
      <FlowButton variant="secondary" size="sm" onClick={() => setPreview(true)}>
        <Eye className="size-4" /> Preview
      </FlowButton>
      <FlowButton variant="accent" size="sm" onClick={autoCreate}>
        <Sparkles className="size-4" /> Auto Create
      </FlowButton>

      <div className="ml-auto flex min-w-0 items-center gap-3">
        <div className="hidden min-w-0 text-right leading-tight xl:block">
          <p className="truncate text-sm font-semibold">{config.title || 'My Photo Book'}</p>
          <p className="truncate text-xs text-muted-foreground">
            {size.label} {cover.label} · {config.pages} Pages
          </p>
        </div>
        <FlowButton variant="primary" loading={leaving} onClick={checkout}>
          Order <ShoppingBag className="size-4" />
        </FlowButton>
      </div>
    </header>
  )

  // ---- page switching ----------------------------------------------------------
  const pageToggle = (
    <div role="group" aria-label="Page being edited" className="inline-flex items-center gap-0.5 rounded-full bg-card p-1 shadow-float ring-1 ring-foreground/8">
      {isCover ? (
        <span className="px-4 py-1.5 text-sm font-semibold">Cover</span>
      ) : (
        (['left', 'right'] as const).map((k) => (
          <button
            key={k}
            type="button"
            aria-pressed={side === k}
            onClick={() => switchSide(k)}
            className={cn('h-8 rounded-full px-3.5 text-sm font-medium tabular-nums transition', side === k ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground')}
          >
            Page {k === 'left' ? leftNo : rightNo}
          </button>
        ))
      )}
    </div>
  )

  // ---- center toolbar (desktop + tablet) --------------------------------------------
  const toolbar = !mobile && (
    <div className="flex shrink-0 flex-wrap items-center justify-center gap-2 px-4 py-3">
      <div className="mr-auto flex items-center gap-2">
        <ToolbarBtn icon={<Undo2 className="size-[18px]" />} disabled={!canUndo} onClick={flow.undo}>
          Undo
        </ToolbarBtn>
        <ToolbarBtn icon={<Redo2 className="size-[18px]" />} disabled={!canRedo} onClick={flow.redo}>
          Redo
        </ToolbarBtn>
      </div>
      <ToolbarMenu
        label="Add Pages"
        items={[
          { label: 'Add 2 pages after this spread', disabled: !canAdd, onClick: () => { ops.addSpread(idx); go(Math.max(1, idx + 1)) } },
          { label: 'Add 2 pages at the end', disabled: !canAdd, onClick: () => { ops.addSpread(spreads.length - 1); go(spreads.length) } },
        ]}
      />
      <ToolbarMenu
        label="Clear Pages"
        items={[
          {
            label: isCover ? 'Clear the cover' : `Clear ${pageName}`,
            onClick: () => {
              ops.clearPage(spread.id, isCover ? 'both' : side)
              setSelectedId(null)
              setToast('Cleared. Undo to bring it back')
            },
          },
          ...(isCover
            ? []
            : [
                {
                  label: 'Clear both pages of this spread',
                  onClick: () => {
                    ops.clearPage(spread.id, 'both')
                    setSelectedId(null)
                    setToast('Cleared. Undo to bring them back')
                  },
                },
              ]),
        ]}
      />
      <ToolbarBtn icon={<Trash2 className="size-[18px]" />} disabled={isCover || !ops.canRemoveSpread(spreads.length)} onClick={deletePages}>
        Delete Pages
      </ToolbarBtn>
      <div className="ml-auto flex items-center gap-2">
        {desktop && (
          <IconBtn label={sidebarOpen ? 'Hide pages' : 'Show pages'} onClick={() => setSidebarOpen((o) => !o)}>
            {sidebarOpen ? <ArrowRight className="size-5 text-accent" /> : <ArrowLeft className="size-5 text-accent" />}
          </IconBtn>
        )}
      </div>
    </div>
  )

  // ---- canvas ------------------------------------------------------------------
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
          side={viewSide}
          activeSide={side}
          onActiveSide={setSide}
          pan={hand}
        />
      </div>
      {toast && (
        <div role="status" className="absolute left-1/2 top-4 z-20 -translate-x-1/2 rounded-full bg-foreground px-4 py-2 text-sm text-background shadow-lift">
          <Check className="mr-1.5 inline size-4" /> {toast}
        </div>
      )}
    </div>
  )

  // ---- bottom bar: spread navigator, zoom, hand ---------------------------------------
  const bottomBar = (
    <div className="flex shrink-0 flex-wrap items-center justify-center gap-3 border-t border-foreground/8 bg-card/70 px-3 py-2.5 sm:px-4">
      <div className="inline-flex items-center rounded-xl bg-card shadow-float ring-1 ring-foreground/8">
        <button type="button" aria-label="Previous spread" disabled={idx === 0} onClick={() => go(idx - 1)} className="grid size-11 place-items-center rounded-l-xl text-accent transition hover:bg-foreground/5 disabled:opacity-35">
          <ArrowLeft className="size-5" />
        </button>
        <span className="min-w-28 border-x border-foreground/8 px-4 text-center text-sm font-medium tabular-nums" aria-live="polite">
          {spreadLabel}
        </span>
        <button type="button" aria-label="Next spread" disabled={idx >= spreads.length - 1} onClick={() => go(idx + 1)} className="grid size-11 place-items-center rounded-r-xl text-accent transition hover:bg-foreground/5 disabled:opacity-35">
          <ArrowRight className="size-5" />
        </button>
      </div>

      {focus && !isCover && pageToggle}

      <div className="inline-flex items-center gap-1 rounded-xl bg-card px-1.5 shadow-float ring-1 ring-foreground/8">
        <button type="button" aria-label="Zoom out" disabled={zoom <= 0.5} onClick={() => setZoom((z) => Math.max(0.5, +(z - 0.1).toFixed(2)))} className="grid size-11 place-items-center rounded-lg text-accent transition hover:bg-foreground/5 disabled:opacity-35">
          <ZoomOut className="size-5" />
        </button>
        <input
          type="range"
          min={0.5}
          max={2}
          step={0.05}
          value={zoom}
          aria-label="Zoom"
          onChange={(e) => setZoom(+e.target.value)}
          className="h-6 w-28 cursor-pointer accent-[var(--accent)] sm:w-36"
        />
        <button type="button" aria-label="Zoom in" disabled={zoom >= 2} onClick={() => setZoom((z) => Math.min(2, +(z + 0.1).toFixed(2)))} className="grid size-11 place-items-center rounded-lg text-accent transition hover:bg-foreground/5 disabled:opacity-35">
          <ZoomIn className="size-5" />
        </button>
        <button type="button" onClick={() => setZoom(1)} aria-label="Reset zoom" className="hidden w-12 text-center text-xs tabular-nums text-muted-foreground hover:text-foreground md:block">
          {Math.round(zoom * 100)}%
        </button>
      </div>

      <button
        type="button"
        aria-label="Hand tool: drag to move around"
        aria-pressed={hand}
        title="Hand tool: drag to move around when zoomed in"
        onClick={() => setHand((h) => !h)}
        className={cn('grid size-11 place-items-center rounded-xl shadow-float ring-1 ring-foreground/8 transition', hand ? 'bg-accent text-accent-foreground' : 'bg-card text-accent hover:bg-foreground/5')}
      >
        <Hand className="size-5" />
      </button>

      {!isCover && (
        <div role="group" aria-label="View" className="inline-flex rounded-xl bg-card p-1 shadow-float ring-1 ring-foreground/8">
          {([[false, Columns2, 'Spread view'], [true, Square, 'Single page view']] as const).map(([f, Icon, label]) => (
            <button
              key={label}
              type="button"
              aria-label={label}
              title={label}
              aria-pressed={focus === f}
              onClick={() => setFocusPref(f)}
              className={cn('grid size-9 place-items-center rounded-lg transition', focus === f ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground')}
            >
              <Icon className="size-[18px]" />
            </button>
          ))}
        </div>
      )}
    </div>
  )

  // ---- tool rail -----------------------------------------------------------------
  const railTools = desktop ? TOOLS.filter((t) => t.id !== 'pages') : TOOLS
  const rail = (
    <nav
      aria-label="Editor tools"
      className={cn(
        'flex shrink-0 gap-1 bg-card',
        mobile ? 'order-last h-16 justify-around border-t border-foreground/8 px-1 pb-[env(safe-area-inset-bottom)]' : 'w-[88px] flex-col items-stretch overflow-y-auto border-r border-foreground/8 px-2 py-3',
      )}
    >
      {railTools.map((t) => {
        const active = t.id === view && open
        return (
          <button
            key={t.id}
            type="button"
            aria-pressed={active}
            onClick={() => choose(t.id)}
            className={cn(
              'relative flex flex-col items-center justify-center gap-1 rounded-xl text-[11px] font-medium transition',
              mobile ? 'min-w-0 flex-1 py-1.5' : 'py-3.5',
              active ? 'bg-accent/12 text-accent' : 'text-foreground/70 hover:bg-foreground/5 hover:text-foreground',
            )}
          >
            <span className="relative">
              {t.icon}
              {t.id === 'photos' && photos.length > 0 && !mobile && (
                <span className="absolute -right-4 -top-2 min-w-5 rounded-full bg-accent/15 px-1 text-center text-[10px] font-semibold leading-5 text-accent">{photos.length}</span>
              )}
            </span>
            <span className="max-w-full truncate">{t.label}</span>
          </button>
        )
      })}
    </nav>
  )

  // ---- mobile row --------------------------------------------------------------------
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

          {desktop && leftOpen && (
            <aside aria-label="Editor panel" className="relative flex w-[340px] shrink-0 flex-col border-r border-foreground/8 bg-card xl:w-[380px]">
              {panelHeader}
              {inspectTabs}
              <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-6 pt-4">{panel}</div>
              <button
                type="button"
                aria-label="Collapse panel"
                onClick={() => setLeftOpen(false)}
                className="absolute -right-3 top-1/2 z-10 grid h-14 w-3 -translate-y-1/2 place-items-center rounded-r-md bg-card shadow-float ring-1 ring-foreground/10 transition hover:bg-secondary"
              >
                <ChevronLeft className="size-3 text-muted-foreground" />
              </button>
            </aside>
          )}
          {desktop && !leftOpen && (
            <button
              type="button"
              aria-label="Expand panel"
              onClick={() => setLeftOpen(true)}
              className="z-10 my-auto -ml-px grid h-14 w-3 shrink-0 place-items-center rounded-r-md bg-card shadow-float ring-1 ring-foreground/10 transition hover:bg-secondary"
            >
              <ChevronRight className="size-3 text-muted-foreground" />
            </button>
          )}

          <div className="flex min-w-0 flex-1 flex-col">
            {toolbar}
            {canvasArea}
            {!mobile && bottomBar}
          </div>

          {desktop && sidebarOpen && (
            <aside aria-label="Pages" className="w-[200px] shrink-0 border-l border-foreground/8 bg-card xl:w-[224px]">
              <PagesSidebar spreads={spreads} photos={photos} index={idx} onOpen={(i) => go(i, 'left')} onMutated={mutated} />
            </aside>
          )}

          {mode === 'tablet' && panelOpen && (
            <aside aria-label="Editor panel" className="absolute bottom-0 right-0 top-16 z-30 flex w-[360px] max-w-[88vw] flex-col border-l border-foreground/8 bg-card shadow-lift">
              {panelHeader}
              {inspectTabs}
              <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-6 pt-4">{panel}</div>
            </aside>
          )}

          {mobile && panelOpen && (
            <aside aria-label="Editor panel" className="absolute inset-x-0 bottom-16 z-30 flex h-[46dvh] flex-col overflow-hidden rounded-t-3xl border-t border-foreground/10 bg-card shadow-lift pb-[env(safe-area-inset-bottom)]">
              <div className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-foreground/15" aria-hidden />
              {panelHeader}
              {inspectTabs}
              <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-6 pt-2">{panel}</div>
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

function ToolbarBtn({ icon, children, onClick, disabled }: { icon: ReactNode; children: ReactNode; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex h-11 items-center gap-2 rounded-xl bg-card px-4 text-sm font-medium shadow-xs ring-1 ring-foreground/8 transition hover:bg-foreground/5 disabled:opacity-40 [&_svg]:text-accent"
    >
      {icon} {children}
    </button>
  )
}

function ToolbarMenu({ label, items }: { label: string; items: { label: string; onClick: () => void; disabled?: boolean }[] }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const down = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false)
    const key = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', down)
    document.addEventListener('keydown', key)
    return () => {
      document.removeEventListener('mousedown', down)
      document.removeEventListener('keydown', key)
    }
  }, [open])
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="inline-flex h-11 items-center gap-2 rounded-xl bg-card px-4 text-sm font-medium shadow-xs ring-1 ring-foreground/8 transition hover:bg-foreground/5"
      >
        {label} <ChevronDown className={cn('size-4 text-accent transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <div role="menu" className="absolute left-0 top-full z-30 mt-1.5 w-64 rounded-xl bg-card p-1 shadow-lift ring-1 ring-foreground/10">
          {items.map((it) => (
            <button
              key={it.label}
              type="button"
              role="menuitem"
              disabled={it.disabled}
              onClick={() => {
                setOpen(false)
                it.onClick()
              }}
              className="flex w-full items-center rounded-lg px-3 py-2.5 text-left text-sm transition hover:bg-foreground/5 disabled:opacity-40"
            >
              {it.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function PanelBody({
  view, tab, draftConfig, spreads, spread, selected, photos, selectedId, used, idx, side, activeSide, aspect, onGo, onMutated, onSelect, onRequestPhotos, onDeselect, onPlaced,
}: {
  view: View
  tab: Exclude<InspectorTab, 'pages'>
  draftConfig: { size: '8x8' | '10x10' | '12x12'; pages: number; cover: 'hardcover' | 'softcover' }
  spreads: Spread[]
  spread: Spread
  selected: Item | null
  photos: Photo[]
  selectedId: string | null
  used: Set<string>
  idx: number
  side: PageSide
  activeSide: 'left' | 'right'
  aspect: number
  onGo: (i: number, side: 'left' | 'right') => void
  onMutated: (i: number) => void
  onSelect: (id: string) => void
  onRequestPhotos: () => void
  onDeselect: () => void
  onPlaced: (id: string) => void
}) {
  switch (view) {
    case 'pages':
      return <PagesPanel spreads={spreads} photos={photos} index={idx} side={side} onOpen={onGo} onMutated={onMutated} config={draftConfig} />
    case 'inspect':
      return <InspectorBody tab={tab} spread={spread} item={selected} photos={photos} onRequestPhotos={onRequestPhotos} onDeselect={onDeselect} aspect={aspect} onAddedItem={onSelect} activeSide={activeSide} />
    case 'photos':
      return <PhotosPanel spread={spread} photos={photos} selectedId={selectedId} used={used} onPlaced={onPlaced} />
    case 'layouts':
      return <LayoutsPanel spread={spread} />
    case 'backgrounds':
      return <BackgroundsPanel spread={spread} />
    case 'text':
      return <TextPanel spread={spread} onAdded={onSelect} activeSide={activeSide} />
    case 'stickers':
      return <StickersPanel spread={spread} onAdded={onSelect} activeSide={activeSide} />
  }
}
