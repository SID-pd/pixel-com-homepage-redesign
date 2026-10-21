'use client'

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowLeft, Sparkles, Trash2 } from 'lucide-react'
import { askCompanion } from '@/lib/flow/mock-api'
import { analyzePhotos, isSuggestedRemoval, type PhotoReport } from '@/lib/flow/photo-check'
import { COVERS, SIZES, TEMPLATES, type CoverId, type SizeId, type TemplateId } from '@/lib/flow/catalog'
import { flow, getState, useFlow } from '@/lib/flow/store'
import { captionsFor, orderPhotos, storyTitle, type StoryOccasion, type StoryTone } from '@/lib/flow/story'
import { MEMORY_EXAMPLES, MEMORY_PROMPT, OCCASIONS, OCCASION_REPLY, PIXIE, TONES, TONE_REPLY, bookPages, inferOccasion, photoReaction, type Mood } from '@/lib/flow/story-chat'
import type { Draft } from '@/lib/flow/types'
import { curtain } from '@/components/flow/page-curtain'
import { BotBubble, Choice, Composer, Reply, TypingBubble, UserBubble } from './chat-ui'
import { BookStage } from './book-stage'
import { Companion, type PixieCue } from './companion'
import { PhotoDock, PhotoViewer } from './photo-dock'
import { PhotoManager } from './photo-manager'
import { PreviewBody, PreviewFooter } from './preview-step'
import { ReviewBody } from './review-step'
import { usePhotoPipeline } from './scrapbook'
import { GhostButton, PrimaryButton, StageBackdrop } from './stage-parts'
import { StoryHeader } from './story-header'
import { DropOverlay, UploadBody, useIngest, useStageDrop } from './upload-step'
import { CoverWidget, PagesWidget, SizeWidget, TemplateWidget } from './widgets'

// Photos come first: they upload in the background (see PhotoDock) while the rest of the conversation carries on.
type Kind = 'photos' | 'occasion' | 'memory' | 'tone' | 'title' | 'template' | 'size' | 'pages' | 'cover' | 'review' | 'preview'
type Msg = { id: string; from: 'bot' | 'user'; text?: string; ask?: Kind }

const NEXT: Partial<Record<Kind, Kind>> = { photos: 'occasion', occasion: 'memory', memory: 'tone', tone: 'title', title: 'template', template: 'size', size: 'pages', pages: 'cover', cover: 'review' }
const TEXT_KINDS: Kind[] = ['occasion', 'memory', 'tone', 'title']
const REBUILD: Kind[] = ['occasion', 'memory', 'tone', 'title', 'template', 'pages', 'photos']
const PLACEHOLDER: Partial<Record<Kind, string>> = {
  occasion: 'Or just tell me what it’s about…',
  memory: 'Tell me the story in a few lines…',
  tone: 'Pick a feeling above, or describe your own…',
  title: 'Type a title, or pick one above…',
}
const TEMPLATE_FOR: Partial<Record<StoryOccasion, TemplateId>> = { wedding: 'ever-after', travel: 'road-trip', family: 'our-year', milestone: 'gallery', 'year-in-review': 'our-year' }
const TAG_OCCASION: Record<string, StoryOccasion> = { Wedding: 'wedding', Travel: 'travel', Family: 'family' }
const EDITS: { kind: Kind; label: string }[] = [
  { kind: 'memory', label: 'The story' },
  { kind: 'tone', label: 'Caption tone' },
  { kind: 'title', label: 'Title' },
  { kind: 'template', label: 'Design' },
  { kind: 'size', label: 'Size' },
  { kind: 'pages', label: 'Pages' },
  { kind: 'cover', label: 'Cover' },
  { kind: 'photos', label: 'Photos' },
]

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

function useWide() {
  return useSyncExternalStore(
    (cb) => {
      const m = window.matchMedia('(min-width: 1280px)')
      m.addEventListener('change', cb)
      return () => m.removeEventListener('change', cb)
    },
    () => window.matchMedia('(min-width: 1280px)').matches,
    () => true,
  )
}

export function StoryStudio() {
  const { draft, hydrated } = useFlow()

  useEffect(() => {
    if (hydrated && !draft) flow.openDraft({ size: '10x10' })
  }, [hydrated, draft])

  if (!hydrated || !draft) {
    return (
      <div className="relative grid h-dvh place-items-center overflow-hidden">
        <StageBackdrop />
      </div>
    )
  }
  return <Studio draft={draft} />
}

function Studio({ draft }: { draft: Draft }) {
  const router = useRouter()
  const wide = useWide()
  const { config, photos, spreads } = draft

  const [msgs, setMsgs] = useState<Msg[]>([])
  const [typing, setTyping] = useState(false)
  const [phase, setPhase] = useState<Kind | null>(null)
  const [mood, setMood] = useState<Mood>('idle')
  const [cue, setCue] = useState<PixieCue | undefined>()
  const [occasion, setOccasion] = useState<StoryOccasion>('general')
  const [tone, setTone] = useState<StoryTone>('warm')
  const [description, setDescription] = useState('')
  const [title, setTitle] = useState('')
  const [pagesChosen, setPagesChosen] = useState(false)
  const [reports, setReports] = useState<Record<string, PhotoReport> | null>(null)
  const [checking, setChecking] = useState({ active: false, done: 0, total: 0 })
  const [manage, setManage] = useState(false)
  const [ignored, setIgnored] = useState<Set<string>>(new Set())
  const [viewId, setViewId] = useState<string | null>(null)
  // the full-page "book comes together" scene; the chat dissolves into it and it dissolves into the finished preview
  const [stage, setStage] = useState(false)

  const pipeline = usePhotoPipeline(photos)
  const { reading, errors, ingest, addPack } = useIngest(photos)
  const dropping = useStageDrop(ingest, true)

  const alive = useRef(true)
  const seq = useRef(0)
  const cueId = useRef(0)
  const moodTimer = useRef<number | null>(null)
  const editing = useRef<Kind | null>(null)
  const started = useRef(false)
  const builtSig = useRef('')
  const scroller = useRef<HTMLDivElement>(null)
  const picker = useRef<HTMLInputElement>(null)

  useEffect(() => {
    alive.current = true
    return () => {
      alive.current = false
      if (moodTimer.current) window.clearTimeout(moodTimer.current)
    }
  }, [])

  // ---- Pixie's body language: cues are one-shots, moods are held only while they apply -------------------------------
  const fire = useCallback((type: PixieCue['type']) => setCue({ type, id: ++cueId.current }), [])
  const holdMood = useCallback((m: Mood, ms: number) => {
    if (moodTimer.current) window.clearTimeout(moodTimer.current)
    setMood(m)
    moodTimer.current = window.setTimeout(() => alive.current && setMood('idle'), ms)
  }, [])

  const push = useCallback((m: Omit<Msg, 'id'>) => setMsgs((all) => [...all, { ...m, id: `m${++seq.current}` }]), [])

  /** Pixie says one or more lines (with a typing beat each), then waits on `ask` if given. */
  const say = useCallback(
    async (lines: string[], ask?: Kind) => {
      for (let i = 0; i < lines.length; i++) {
        if (!alive.current) return
        setTyping(true)
        const text = await askCompanion(lines[i])
        if (!alive.current) return
        setTyping(false)
        const last = i === lines.length - 1
        push({ from: 'bot', text, ask: last ? ask : undefined })
        fire('nod')
        holdMood('talking', Math.min(2600, 500 + text.length * 22))
        if (last && ask) setPhase(ask)
        await wait(120)
      }
    },
    [push, fire, holdMood],
  )

  const you = useCallback(
    (text: string) => {
      push({ from: 'user', text })
      fire('tilt')
    },
    [push, fire],
  )

  const effOccasion = useMemo<StoryOccasion>(() => {
    if (occasion !== 'general') return occasion
    const tag = TEMPLATES.find((t) => t.id === config.templateId)?.tag
    return (tag && TAG_OCCASION[tag]) || inferOccasion(description)
  }, [occasion, description, config.templateId])

  // ---- build the book -------------------------------------------------------------------------------------------------
  const build = useCallback(() => {
    const d = getState().draft
    if (!d) return
    const ordered = orderPhotos(d.photos)
    const order = ordered.map((p) => p.id)
    const tpl = TEMPLATES.find((t) => t.id === d.config.templateId)
    const bookTitle = title.trim() || (description.trim() ? storyTitle(description, 'Our Story', effOccasion) : (tpl?.name ?? storyTitle('', 'Our Story', effOccasion)))
    const pages = pagesChosen ? Math.max(d.config.pages, bookPages(ordered.length)) : bookPages(ordered.length)
    const sig = JSON.stringify([order, bookTitle, pages, d.config.templateId, tone, description, effOccasion])
    if (sig === builtSig.current && (getState().draft?.spreads.length ?? 0) > 1) return
    builtSig.current = sig

    flow.rebuildStory({ order, captions: {}, title: bookTitle, pages })
    const lead = (getState().draft?.spreads ?? [])
      .filter((s) => s.kind !== 'cover')
      .map((s) => s.items.find((i) => i.type === 'photo' && i.photoId)?.photoId)
      .filter(Boolean) as string[]
    const lines = captionsFor(description, Math.max(lead.length, 1), effOccasion, tone)
    const map: Record<string, string> = {}
    lead.forEach((id, i) => (map[id] = lines[i % lines.length]))
    flow.rebuildStory({ order, captions: map, title: bookTitle, pages })
  }, [title, description, effOccasion, tone, pagesChosen])

  const startBuild = useCallback(() => {
    build()
    setMood('thinking')
    setStage(true)
    setPhase('preview')
  }, [build])

  const endStage = useCallback(() => {
    setStage(false)
    fire('hop')
    holdMood('celebrate', 2600)
  }, [fire, holdMood])

  // ---- the conversation script ----------------------------------------------------------------------------------------
  const prompt = useCallback((kind: Kind, occ: StoryOccasion): string[] => {
    switch (kind) {
      case 'occasion':
        return ['What are we remembering today?']
      case 'memory':
        return [OCCASION_REPLY[occ], MEMORY_PROMPT[occ]]
      case 'tone':
        return ['Love it. How should the captions feel?']
      case 'title':
        return ['What should we call your book? Pick one, type your own, or let me choose.']
      case 'template': {
        const rec = TEMPLATES.find((t) => t.id === TEMPLATE_FOR[occ])
        return [rec ? `Now the look. Based on your story I’d start from ${rec.name}, but you know best.` : 'Now the look. Pick a starting design, or let me decide.']
      }
      case 'size':
        return ['Which size would you like?']
      case 'pages':
        return ['How many pages? Auto fits the book to your photos, so nothing is cut and nothing is empty.']
      case 'cover':
        return ['Last question: hardcover or softcover?']
      case 'review':
        return ['That’s everything I need! I checked your photos while we chatted, so here’s just what’s left to decide.']
      default:
        return []
    }
  }, [])

  const goNext = useCallback(
    async (from: Kind, occ: StoryOccasion = effOccasion) => {
      // editing one answer from the preview: go straight back instead of replaying the whole interview
      if (editing.current) {
        const was = editing.current
        editing.current = null
        if (REBUILD.includes(was)) {
          builtSig.current = ''
          if (was === 'photos') return void say(['Got it, let me look through them again.'], 'review')
          return void startBuild()
        }
        setPhase('preview')
        return
      }
      const next = NEXT[from]
      if (!next) return
      await say(prompt(next, occ), next)
    },
    [effOccasion, prompt, say, startBuild],
  )

  // Scene 1: Pixie drops in, waves, then asks for the photos first so they can upload while we talk
  useEffect(() => {
    if (started.current) return
    started.current = true
    void (async () => {
      await wait(1150)
      fire('wave')
      await wait(450)
      await say(['Hi, I’m Pixie! I’ll turn your photos into a storybook, with captions and layouts done for you.', 'Let’s start with the photos. Drop them in and I’ll keep uploading them while we chat.'], 'photos')
    })()
  }, [say, fire])

  // answers ------------------------------------------------------------------------------------------------------------
  const photosDone = () => {
    you(`${photos.length} photo${photos.length === 1 ? '' : 's'} added`)
    holdMood('excited', 1400)
    void (async () => {
      if (editing.current === 'photos') return goNext('photos')
      await say([`${photoReaction(photos.length, effOccasion)} They’ll keep uploading in the background.`])
      await goNext('photos')
    })()
  }
  const pickOccasion = (o: StoryOccasion, label: string) => {
    you(label)
    setOccasion(o)
    void goNext('occasion', o)
  }
  const pickTone = (t: StoryTone, label: string) => {
    you(label)
    setTone(t)
    holdMood('excited', 1400)
    void (async () => {
      if (!editing.current) await say([TONE_REPLY[t]])
      await goNext('tone')
    })()
  }
  const pickTitle = (t: string, label: string) => {
    you(label)
    setTitle(t)
    void goNext('title')
  }
  const pickTemplate = (id: TemplateId | undefined) => {
    const t = TEMPLATES.find((x) => x.id === id)
    you(t ? t.name : 'Let Pixie decide')
    flow.setConfig({ templateId: id })
    void goNext('template')
  }
  const pickSize = (id: SizeId) => {
    you(SIZES.find((s) => s.id === id)!.label.replace(/"/g, '″'))
    flow.setConfig({ size: id })
    void goNext('size')
  }
  const pickPages = (n: number | 'auto') => {
    you(n === 'auto' ? 'Auto' : `${n} pages`)
    if (n === 'auto') setPagesChosen(false)
    else {
      setPagesChosen(true)
      flow.setConfig({ pages: n })
    }
    void goNext('pages')
  }
  const pickCover = (id: CoverId) => {
    you(COVERS.find((c) => c.id === id)!.label)
    flow.setConfig({ cover: id })
    void goNext('cover')
  }

  const onSend = (text: string) => {
    if (phase === 'occasion') return pickOccasion(inferOccasion(text), text)
    if (phase === 'memory') {
      you(text)
      setDescription(text)
      holdMood('excited', 1200)
      return void goNext('memory')
    }
    if (phase === 'tone') {
      const hit = TONES.find((t) => text.toLowerCase().includes(t.id)) ?? TONES[0]
      return pickTone(hit.id, text)
    }
    if (phase === 'title') return pickTitle(text.trim().slice(0, 40), text)
  }

  const edit = (kind: Kind, label: string) => {
    you(`I’d like to change: ${label.toLowerCase()}`)
    editing.current = kind
    const lines: Partial<Record<Kind, string>> = {
      memory: 'Sure, tell me the story again.',
      tone: 'Of course. How should the captions feel?',
      title: 'New title? Type it below.',
      template: 'Pick another starting design.',
      size: 'Which size would you like instead?',
      pages: 'How many pages should it have?',
      cover: 'Hardcover or softcover?',
      photos: 'Add or remove photos here, then tell me when you’re done.',
    }
    void say([lines[kind] ?? 'Sure!'], kind)
  }

  // ---- photo check: runs quietly in the background as soon as uploads land, long before the review step --------------
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

  // when the review step begins (or the check finishes while it is open), Pixie says what was found, once
  const reviewSaid = useRef(false)
  useEffect(() => {
    if (phase !== 'review') {
      reviewSaid.current = false
      return
    }
    if (!reports || reviewSaid.current) return
    reviewSaid.current = true
    const n = photos.filter((p) => reports[p.id]?.issues.length && !ignored.has(p.id)).length
    if (!n) fire('hop')
    void say([n ? PIXIE.found(n) : PIXIE.allClear])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, reports])

  // every upload has landed: a little cheer, wherever the conversation is
  const cheered = useRef(false)
  useEffect(() => {
    if (!photos.length) return
    if (pipeline.allReady && reading === 0) {
      if (!cheered.current && phase !== 'preview') {
        cheered.current = true
        fire('hop')
        holdMood('excited', 1200)
      }
    } else cheered.current = false
  }, [photos.length, pipeline.allReady, reading, phase, fire, holdMood])

  const flaggedIds = reports ? photos.filter((p) => reports[p.id] && isSuggestedRemoval(reports[p.id]) && !ignored.has(p.id)).map((p) => p.id) : []
  const waitingCount = photos.filter((p) => pipeline.get(p.id).state !== 'ready').length
  const flagSet = useMemo(() => new Set(photos.filter((p) => reports?.[p.id]?.issues.length && !ignored.has(p.id)).map((p) => p.id)), [photos, reports, ignored])

  // ---- scrolling ----------------------------------------------------------------------------------------------------
  const activeAskId = useMemo(() => {
    for (let i = msgs.length - 1; i >= 0; i--) if (msgs[i].ask && msgs[i].ask === phase) return msgs[i].id
    return null
  }, [msgs, phase])

  useEffect(() => {
    const el = scroller.current
    if (!el) return
    const id = window.setTimeout(() => {
      const tall = phase === 'review'
      const target = tall && activeAskId ? document.getElementById(`msg-${activeAskId}`) : null
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' })
      else el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
    }, 90)
    return () => window.clearTimeout(id)
  }, [msgs.length, typing, phase, activeAskId])

  const recommended = TEMPLATE_FOR[effOccasion]
  const suggestedTitle = useMemo(() => storyTitle(description, 'Our Story', effOccasion), [description, effOccasion])

  // ---- render ----------------------------------------------------------------------------------------------------------
  const widget = (m: Msg) => {
    if (m.id !== activeAskId) return null
    switch (m.ask) {
      case 'photos':
        return (
          <Reply wide>
            <div className="rounded-3xl bg-white/70 p-4 ring-1 ring-white sm:p-5">
              <UploadBody reading={reading} errors={errors} recommended={pagesChosen ? config.pages : 20} onFiles={ingest} onPack={addPack} />
              <div className="mt-5 flex items-center justify-between gap-3 border-t border-[var(--st-peach)]/60 pt-4">
                <p className="text-xs text-foreground/60" aria-live="polite">
                  {photos.length === 0 ? 'Add at least one photo to continue' : waitingCount > 0 ? `${photos.length - waitingCount} of ${photos.length} uploaded, the rest keep going while we chat` : `${photos.length} uploaded`}
                </p>
                <PrimaryButton disabled={photos.length === 0 || reading > 0} onClick={photosDone}>
                  Continue
                </PrimaryButton>
              </div>
            </div>
          </Reply>
        )
      case 'occasion':
        return (
          <Reply>
            <div className="flex flex-wrap gap-2">
              {OCCASIONS.map((o) => (
                <Choice key={o.id} onClick={() => pickOccasion(o.id, o.label)}>
                  <span aria-hidden>{o.emoji}</span> {o.label}
                </Choice>
              ))}
            </div>
          </Reply>
        )
      case 'memory':
        return (
          <Reply>
            <div className="flex flex-wrap gap-2">
              {MEMORY_EXAMPLES[effOccasion].map((ex, i) => (
                <Choice key={i} hint="Use this as a starting point" onClick={() => onSend(ex)}>
                  {ex}
                </Choice>
              ))}
            </div>
          </Reply>
        )
      case 'tone':
        return (
          <Reply>
            <div className="flex flex-wrap gap-2">
              {TONES.map((t) => (
                <Choice key={t.id} hint={t.blurb} onClick={() => pickTone(t.id, t.label)}>
                  <span aria-hidden>{t.emoji}</span> {t.label}
                </Choice>
              ))}
            </div>
          </Reply>
        )
      case 'title':
        return (
          <Reply>
            <div className="flex flex-wrap gap-2">
              <Choice onClick={() => pickTitle(suggestedTitle, suggestedTitle)}>📖 {suggestedTitle}</Choice>
              <Choice onClick={() => pickTitle('', 'Let Pixie choose')}>✨ Let Pixie choose</Choice>
            </div>
          </Reply>
        )
      case 'template':
        return (
          <Reply wide>
            <TemplateWidget value={config.templateId} recommended={recommended} onPick={pickTemplate} />
          </Reply>
        )
      case 'size':
        return (
          <Reply>
            <SizeWidget value={config.size} onPick={pickSize} />
          </Reply>
        )
      case 'pages':
        return (
          <Reply>
            <PagesWidget value={config.pages} auto={!pagesChosen} onPick={pickPages} />
          </Reply>
        )
      case 'cover':
        return (
          <Reply>
            <CoverWidget value={config.cover} onPick={pickCover} />
          </Reply>
        )
      case 'review':
        return (
          <Reply wide>
            <div className="rounded-3xl bg-white/70 p-4 ring-1 ring-white sm:p-5">
              {photos.length === 0 ? (
                <p className="py-8 text-center text-foreground/60">No photos left. Add some to continue.</p>
              ) : (
                <ReviewBody
                  photos={photos}
                  reports={reports}
                  checking={checking}
                  ignored={ignored}
                  onKeep={(id) => setIgnored((s) => new Set(s).add(id))}
                  onUndoKeep={(id) =>
                    setIgnored((s) => {
                      const n = new Set(s)
                      n.delete(id)
                      return n
                    })
                  }
                  onRemove={(id) => flow.removePhoto(id)}
                  onOpen={setViewId}
                  onManage={() => setManage(true)}
                />
              )}
              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--st-peach)]/60 pt-4">
                <GhostButton onClick={() => edit('photos', 'Photos')}>
                  <ArrowLeft className="size-4" /> Add more photos
                </GhostButton>
                <div className="flex flex-wrap items-center gap-2">
                  {flaggedIds.length > 0 && (
                    <button type="button" onClick={() => flaggedIds.forEach((id) => flow.removePhoto(id))} className="inline-flex h-11 items-center gap-2 rounded-full bg-[var(--st-peach)] px-5 text-sm font-semibold text-[var(--st-peach-ink)] transition hover:brightness-95 active:scale-95">
                      <Trash2 className="size-4" /> Remove suggested ({flaggedIds.length})
                    </button>
                  )}
                  <PrimaryButton
                    disabled={!reports || photos.length === 0}
                    onClick={() => {
                      you('Build my storybook')
                      void startBuild()
                    }}
                  >
                    <Sparkles className="size-4" /> Build my storybook
                  </PrimaryButton>
                </div>
              </div>
            </div>
          </Reply>
        )
      default:
        return null
    }
  }

  const inputEnabled = !!phase && TEXT_KINDS.includes(phase) && !typing
  const pixie = (size: number, intro = false) => <Companion intro={intro} size={size} mood={typing ? 'thinking' : mood} cue={cue} />
  const hasPhotos = photos.length > 0
  const showroom = phase === 'preview'
  const SMOOTH = [0.4, 0, 0.2, 1] as const

  return (
    <div className="relative flex h-dvh flex-col overflow-hidden text-[var(--st-ink)]">
      <StageBackdrop />
      <div className="relative z-30">
        <StoryHeader onExit={() => curtain.go(router, '/', 'Heading home…')} />
      </div>

      {/* live Pixie stands beside the conversation on wide screens, and stays for the finished book */}
      {wide && (
        <div className="pointer-events-none absolute bottom-3 left-6 z-20">
          <div className="pointer-events-auto">{pixie(132, true)}</div>
        </div>
      )}

      <AnimatePresence mode="wait" initial={false}>
        {!showroom ? (
          <motion.div key="chat" initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -26, scale: 0.985 }} transition={{ duration: 0.7, ease: SMOOTH }} className="relative z-10 flex min-h-0 flex-1 flex-col">
            <main className="relative min-h-0 flex-1">
              <PhotoDock photos={photos} status={pipeline.get} flags={flagSet} checking={checking} onOpen={setViewId} onAdd={() => picker.current?.click()} onManage={() => setManage(true)} />

              <div ref={scroller} className={`relative z-10 h-full overflow-y-auto overscroll-contain px-3 pb-6 pt-6 sm:px-6 ${hasPhotos ? 'max-[1279px]:pr-[5.75rem]' : ''}`}>
                <div className="mx-auto flex max-w-4xl flex-col gap-3">
                  {msgs.map((m) => (
                    <div key={m.id} id={`msg-${m.id}`} className="scroll-mt-6 space-y-3">
                      {m.from === 'bot' ? <BotBubble>{m.text}</BotBubble> : <UserBubble>{m.text}</UserBubble>}
                      {widget(m)}
                    </div>
                  ))}
                  {typing && <TypingBubble />}
                </div>
              </div>
            </main>

            <Composer enabled={inputEnabled} placeholder={(phase && PLACEHOLDER[phase]) || 'Pick an option above…'} onSend={onSend} lead={!wide ? <div className="mb-0.5 shrink-0">{pixie(54, true)}</div> : undefined} />
          </motion.div>
        ) : (
          <motion.div key="showroom" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, y: 20 }} transition={{ duration: 0.6, ease: SMOOTH }} className="relative z-10 min-h-0 flex-1 overflow-y-auto overscroll-contain">
            {!stage && (
              <div className="mx-auto max-w-4xl space-y-4 px-3 pb-12 pt-6 sm:px-6">
                <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: SMOOTH }} className="flex items-end gap-3">
                  {!wide && <div className="shrink-0">{pixie(60)}</div>}
                  <div className="min-w-0 flex-1">
                    <BotBubble avatar={wide}>{PIXIE.preview}</BotBubble>
                  </div>
                </motion.div>
                <div className="space-y-5 rounded-3xl bg-white/70 p-4 ring-1 ring-white sm:p-6">
                  <PreviewBody reveal config={config} spreads={spreads} photos={photos} onAddPhotos={() => edit('photos', 'Photos')} />
                  <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.1, duration: 0.7, ease: SMOOTH }} className="space-y-5">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--st-peach)]/60 pt-4">
                      <PreviewFooter config={config} />
                    </div>
                    <div>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-foreground/50">Want to change something?</p>
                      <div className="flex flex-wrap gap-2">
                        {EDITS.map((e) => (
                          <Choice key={e.kind} onClick={() => edit(e.kind, e.label)} className="min-h-9 py-1.5 text-xs">
                            {e.label}
                          </Choice>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>{stage && <BookStage photos={photos} spreads={spreads} title={config.title} onDone={endStage} />}</AnimatePresence>

      <DropOverlay show={dropping && !stage} />

      <input ref={picker} type="file" accept="image/*" multiple className="sr-only" aria-hidden tabIndex={-1} onChange={(e) => { void ingest(Array.from(e.target.files ?? [])); e.target.value = '' }} />

      <AnimatePresence>
        {manage && !showroom && (
          <PhotoManager
            photos={photos}
            status={pipeline.get}
            reports={reports}
            ignored={ignored}
            onOpen={(id) => {
              setViewId(id)
            }}
            onRemoveMany={(ids) => ids.forEach((id) => flow.removePhoto(id))}
            onKeep={(id) => setIgnored((s) => new Set(s).add(id))}
            onUndoKeep={(id) =>
              setIgnored((s) => {
                const n = new Set(s)
                n.delete(id)
                return n
              })
            }
            onAdd={() => picker.current?.click()}
            onClose={() => setManage(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {viewId && !showroom && (
          <PhotoViewer photos={photos} id={viewId} status={pipeline.get} reports={reports} onNav={setViewId} onRemove={(id) => flow.removePhoto(id)} onClose={() => setViewId(null)} />
        )}
      </AnimatePresence>
    </div>
  )
}
