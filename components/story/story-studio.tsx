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
import { MEMORY_EXAMPLES, MEMORY_PROMPT, OCCASION_REPLY, PIXIE, TONES, TONE_REPLY, bookPages, inferOccasion, photoReaction, type Mood } from '@/lib/flow/story-chat'
import type { Draft } from '@/lib/flow/types'
import { curtain } from '@/components/flow/page-curtain'
import { BotBubble, Choice, Composer, Reply, TypingBubble, UserBubble } from './chat-ui'
import { BookStage } from './book-stage'
import { Companion, type PixieCue } from './companion'
import { PhotoDock, PhotoPill, PhotoViewer } from './photo-dock'
import { PhotoManager } from './photo-manager'
import { cn } from '@/lib/utils'
import { MobilePreview } from './mobile-preview'
import { PreviewBody, PreviewFooter } from './preview-step'
import { ReviewBody } from './review-step'
import { usePhotoPipeline } from './scrapbook'
import { GhostButton, PrimaryButton, StageBackdrop } from './stage-parts'
import { StoryHeader } from './story-header'
import { DropOverlay, UploadBody, useIngest, useStageDrop } from './upload-step'
import { useMediaQuery } from './use-media'
import { CoverWidget, PagesWidget, SizeWidget, TemplateWidget } from './widgets'

// The flow, in order: photos (they upload in the background while the chat carries on) -> pages + captions -> template ->
// the story -> title -> size -> cover -> photo check -> preview.
type Kind = 'photos' | 'pages' | 'template' | 'story' | 'title' | 'size' | 'cover' | 'review' | 'preview'
type Msg = { id: string; from: 'bot' | 'user'; text?: string; ask?: Kind }

const NEXT: Partial<Record<Kind, Kind>> = { photos: 'pages', pages: 'template', template: 'story', story: 'title', title: 'size', size: 'cover', cover: 'review' }
const TEXT_KINDS: Kind[] = ['story', 'title']
const REBUILD: Kind[] = ['photos', 'pages', 'template', 'story', 'title']
const PLACEHOLDER: Partial<Record<Kind, string>> = {
  story: 'Tell me the story in a few lines…',
  title: 'Type a title, or pick one above…',
}
const TAG_OCCASION: Record<string, StoryOccasion> = { Wedding: 'wedding', Travel: 'travel', Family: 'family' }

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
  // phones and tablets get a lighter page: no live mascot, no full-screen build scene, a pill instead of the photo rail
  const compact = !useMediaQuery('(min-width: 1024px)')
  // a phone, upright or on its side: the finished book gets its own full-screen layout instead of the scrolling page
  const phone = useMediaQuery('(max-width: 639px), (max-height: 500px)')
  const { config, photos, spreads } = draft

  const [msgs, setMsgs] = useState<Msg[]>([])
  const [typing, setTyping] = useState(false)
  const [phase, setPhase] = useState<Kind | null>(null)
  const [mood, setMood] = useState<Mood>('idle')
  const [cue, setCue] = useState<PixieCue | undefined>()
  const [tone, setTone] = useState<StoryTone>('warm')
  const [description, setDescription] = useState('')
  const [title, setTitle] = useState('')
  const [pagesChosen, setPagesChosen] = useState(false)
  const [captionsOn, setCaptionsOn] = useState(true)
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

  // one answer per question: a second tap while Pixie is still replying must not answer it twice
  const answering = useRef(false)
  const claim = () => {
    if (answering.current) return false
    answering.current = true
    return true
  }
  useEffect(() => {
    answering.current = false
  }, [phase])

  const you = useCallback(
    (text: string) => {
      push({ from: 'user', text })
      fire('tilt')
    },
    [push, fire],
  )

  // the template comes before the story, so it is the first hint of what the book is about; the story text refines it
  const effOccasion = useMemo<StoryOccasion>(() => {
    const fromStory = inferOccasion(description)
    if (fromStory !== 'general') return fromStory
    const tag = TEMPLATES.find((t) => t.id === config.templateId)?.tag
    return (tag && TAG_OCCASION[tag]) || 'general'
  }, [description, config.templateId])

  // ---- build the book -------------------------------------------------------------------------------------------------
  const build = useCallback(() => {
    const d = getState().draft
    if (!d) return
    const ordered = orderPhotos(d.photos)
    const order = ordered.map((p) => p.id)
    const tpl = TEMPLATES.find((t) => t.id === d.config.templateId)
    const bookTitle = title.trim() || (description.trim() ? storyTitle(description, 'Our Story', effOccasion) : (tpl?.name ?? storyTitle('', 'Our Story', effOccasion)))
    const pages = pagesChosen ? Math.max(d.config.pages, bookPages(ordered.length)) : bookPages(ordered.length)
    const sig = JSON.stringify([order, bookTitle, pages, d.config.templateId, tone, description, effOccasion, captionsOn])
    if (sig === builtSig.current && (getState().draft?.spreads.length ?? 0) > 1) return
    builtSig.current = sig

    flow.rebuildStory({ order, captions: {}, title: bookTitle, pages })
    const lead = (getState().draft?.spreads ?? [])
      .filter((s) => s.kind !== 'cover')
      .map((s) => s.items.find((i) => i.type === 'photo' && i.photoId)?.photoId)
      .filter(Boolean) as string[]
    if (!captionsOn) return
    const lines = captionsFor(description, Math.max(lead.length, 1), effOccasion, tone)
    const map: Record<string, string> = {}
    lead.forEach((id, i) => (map[id] = lines[i % lines.length]))
    flow.rebuildStory({ order, captions: map, title: bookTitle, pages })
  }, [title, description, effOccasion, tone, pagesChosen, captionsOn])

  const startBuild = useCallback(() => {
    build()
    setPhase('preview')
    setMood('thinking')
    setStage(true)
  }, [build])

  const endStage = useCallback(() => {
    setStage(false)
    fire('hop')
    holdMood('celebrate', 2600)
  }, [fire, holdMood])

  // ---- the conversation script ----------------------------------------------------------------------------------------
  const prompt = useCallback((kind: Kind, occ: StoryOccasion): string[] => {
    switch (kind) {
      case 'pages':
        return ['How many pages should it have? Auto fits the book to your photos, so nothing is cut and nothing is empty. You can also choose whether I write captions.']
      case 'template':
        return ['Now the look. Pick a starting design, or let me decide.']
      case 'story':
        return [OCCASION_REPLY[occ], MEMORY_PROMPT[occ]]
      case 'title':
        return ['What should we call your book? Pick one, type your own, or let me choose.']
      case 'size':
        return ['Which size would you like?']
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
      await say(['Hi, I’m Pixie! I’ll turn your photos into a storybook, with captions and layouts done for you.', compact ? 'Let’s start with the photos. Add them from your phone and I’ll keep uploading while we chat.' : 'Let’s start with the photos. Drop them in and I’ll keep uploading them while we chat.'], 'photos')
    })()
  }, [say, fire])

  // answers ------------------------------------------------------------------------------------------------------------
  const photosDone = () => {
    if (!claim()) return
    you(`${photos.length} photo${photos.length === 1 ? '' : 's'} added`)
    holdMood('excited', 1400)
    void (async () => {
      if (editing.current === 'photos') return goNext('photos')
      await say([`${photoReaction(photos.length, effOccasion)} They’ll keep uploading in the background.`])
      await goNext('photos')
    })()
  }
  // the express lane: skip the six questions, keep Pixie's defaults (auto pages, her design and title, current size and cover)
  // and go straight to the photo check, where Build is one tap
  const quickBuild = () => {
    if (!claim()) return
    you('Build it for me')
    holdMood('excited', 1200)
    void (async () => {
      editing.current = null
      await say(['On it! I’ll pick the pages, design and title. You can still change anything in the editor.', ...prompt('review', effOccasion)], 'review')
    })()
  }
  const pickTone = (t: StoryTone) => {
    setTone(t)
    holdMood('excited', 900)
  }
  const sendStory = (text: string) => {
    if (!claim()) return
    you(text)
    setDescription(text)
    holdMood('excited', 1200)
    void (async () => {
      if (!editing.current && captionsOn) await say([TONE_REPLY[tone]])
      await goNext('story')
    })()
  }
  const skipStory = () => {
    if (!claim()) return
    you('Skip, let Pixie write it')
    setDescription('')
    void goNext('story')
  }
  const pickTitle = (t: string, label: string) => {
    if (!claim()) return
    you(label)
    setTitle(t)
    void goNext('title')
  }
  const pickTemplate = (id: TemplateId | undefined) => {
    if (!claim()) return
    const t = TEMPLATES.find((x) => x.id === id)
    you(t ? t.name : 'Let Pixie decide')
    flow.setConfig({ templateId: id })
    void goNext('template')
  }
  const pickSize = (id: SizeId) => {
    if (!claim()) return
    you(SIZES.find((s) => s.id === id)!.label.replace(/"/g, '″'))
    flow.setConfig({ size: id })
    void goNext('size')
  }
  const pickPages = (n: number | 'auto') => {
    if (n === 'auto') setPagesChosen(false)
    else {
      setPagesChosen(true)
      flow.setConfig({ pages: n })
    }
  }
  const pagesDone = () => {
    if (!claim()) return
    you(`${pagesChosen ? `${config.pages} pages` : 'Auto pages'} · ${captionsOn ? 'with captions' : 'no captions'}`)
    holdMood('excited', 1000)
    void goNext('pages')
  }
  const pickCover = (id: CoverId) => {
    if (!claim()) return
    you(COVERS.find((c) => c.id === id)!.label)
    flow.setConfig({ cover: id })
    void goNext('cover')
  }

  const onSend = (text: string) => {
    if (phase === 'story') return sendStory(text)
    if (phase === 'title') return pickTitle(text.trim().slice(0, 40), text)
  }

  const edit = (kind: Kind, label: string) => {
    you(`I’d like to change: ${label.toLowerCase()}`)
    editing.current = kind
    const lines: Partial<Record<Kind, string>> = {
      story: 'Sure, tell me the story again.',
      title: 'New title? Type it below.',
      template: 'Pick another starting design.',
      size: 'Which size would you like instead?',
      pages: 'How many pages, and do you want captions?',
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
      const tall = phase === 'review' || phase === 'pages'
      const target = tall && activeAskId ? document.getElementById(`msg-${activeAskId}`) : null
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' })
      else el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
    }, 90)
    return () => window.clearTimeout(id)
  }, [msgs.length, typing, phase, activeAskId])

  const suggestedTitle = useMemo(() => storyTitle(description, 'Our Story', effOccasion), [description, effOccasion])

  // ---- render ----------------------------------------------------------------------------------------------------------
  const widget = (m: Msg) => {
    if (m.id !== activeAskId) return null
    switch (m.ask) {
      case 'photos':
        return (
          <Reply wide>
            <div className="rounded-3xl bg-white/70 p-4 ring-1 ring-white sm:p-5">
              <UploadBody reading={reading} errors={errors} recommended={20} onFiles={ingest} onPack={addPack} />
              {/* on a phone the photo pill sits here, in the flow, and the footer sticks to the bottom so Continue is always reachable */}
              {compact && <PhotoPill photos={photos} status={pipeline.get} checking={checking} onManage={() => setManage(true)} className="mx-auto mt-4 w-fit max-w-full" />}
              <div className="sticky bottom-0 z-10 -mx-4 mt-4 flex items-center justify-between gap-3 rounded-b-3xl border-t border-[var(--st-peach)]/60 bg-white px-4 py-3 sm:static sm:mx-0 sm:mt-5 sm:bg-transparent sm:p-0 sm:pt-4">
                <p className="text-xs text-foreground/60" aria-live="polite">
                  {photos.length === 0 ? 'Add at least one photo to continue' : waitingCount > 0 ? `${photos.length - waitingCount} of ${photos.length} uploaded…` : `${photos.length} uploaded`}
                </p>
                <div className="flex shrink-0 items-center gap-2">
                  <GhostButton disabled={photos.length === 0 || reading > 0 || editing.current === 'photos'} onClick={quickBuild} className="bg-white px-4 shadow-sm">
                    <Sparkles className="size-4" /> Build now
                  </GhostButton>
                  <PrimaryButton disabled={photos.length === 0 || reading > 0} onClick={photosDone} className="px-6 sm:px-7">
                    Continue
                  </PrimaryButton>
                </div>
              </div>
            </div>
          </Reply>
        )
      case 'pages':
        return (
          <Reply wide>
            <PagesWidget value={config.pages} auto={!pagesChosen} captions={captionsOn} onPages={pickPages} onCaptions={setCaptionsOn} onContinue={pagesDone} />
          </Reply>
        )
      case 'template':
        return (
          <Reply wide>
            <TemplateWidget value={config.templateId} onPick={pickTemplate} />
          </Reply>
        )
      case 'story':
        return (
          <Reply>
            <div className="space-y-3">
              {captionsOn && (
                <div>
                  <p className="mb-1.5 text-xs font-semibold text-foreground/60">How should the captions feel?</p>
                  <div className="flex flex-wrap gap-2">
                    {TONES.map((t) => (
                      <Choice key={t.id} on={tone === t.id} onClick={() => pickTone(t.id)}>
                        <span aria-hidden>{t.emoji}</span> {t.label}
                      </Choice>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <p className="mb-1.5 text-xs font-semibold text-foreground/60">Need a starting point?</p>
                <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                  {MEMORY_EXAMPLES[effOccasion].map((ex, i) => (
                    <Choice key={i} onClick={() => sendStory(ex)} className="rounded-2xl">
                      {ex}
                    </Choice>
                  ))}
                  <Choice onClick={skipStory}>✨ Skip, let Pixie write it</Choice>
                </div>
              </div>
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
      case 'size':
        return (
          <Reply>
            <SizeWidget value={config.size} onPick={pickSize} />
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
              <div className="sticky bottom-0 z-10 -mx-4 mt-5 flex items-center gap-2 rounded-b-3xl bg-white/95 px-4 py-3 backdrop-blur sm:-mx-5 sm:justify-between sm:px-5">
                <GhostButton onClick={() => edit('photos', 'Photos')} aria-label="Add more photos" className="size-11 shrink-0 px-0 sm:size-auto sm:px-5">
                  <ArrowLeft className="size-4" /> <span className="max-sm:sr-only">Add more photos</span>
                </GhostButton>
                <div className="flex min-w-0 flex-1 items-center justify-end gap-2">
                  {flaggedIds.length > 0 && (
                    <button type="button" onClick={() => flow.removePhotos(flaggedIds)} className="inline-flex h-11 shrink-0 items-center gap-2 rounded-full bg-[var(--st-peach)] px-4 text-sm font-semibold text-[var(--st-peach-ink)] transition hover:brightness-95 active:scale-95">
                      <Trash2 className="size-4" /> <span className="sm:hidden">Remove {flaggedIds.length}</span>
                      <span className="max-sm:hidden">Remove suggested ({flaggedIds.length})</span>
                    </button>
                  )}
                  <PrimaryButton
                    disabled={!reports || photos.length === 0}
                    onClick={() => {
                      you('Build my storybook')
                      void startBuild()
                    }}
                    className="min-w-0 flex-1 px-4 sm:flex-none sm:px-7"
                  >
                    <Sparkles className="size-4" /> <span className="truncate"><span className="sm:hidden">Build book</span><span className="max-sm:hidden">Build my storybook</span></span>
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
              {/* only one of the two is ever mounted: a hidden rail would still decode every thumbnail on a phone */}
              {compact ? (
                phase !== 'photos' && phase !== 'review' && <PhotoPill photos={photos} status={pipeline.get} checking={checking} onManage={() => setManage(true)} className="absolute bottom-3 right-3 z-20" />
              ) : (
                <PhotoDock photos={photos} status={pipeline.get} flags={flagSet} checking={checking} onOpen={setViewId} onAdd={() => picker.current?.click()} onManage={() => setManage(true)} />
              )}

              <div ref={scroller} className={`relative z-10 h-full overflow-y-auto overscroll-contain px-3 pb-6 pt-4 sm:px-6 sm:pt-6 ${hasPhotos ? 'min-[1024px]:max-[1279px]:pr-[5.75rem] max-lg:pb-28' : 'max-lg:pb-10'}`}>
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

            {/* on a phone the box only appears when Pixie wants typed text, so the keyboard never covers a question you can tap */}
            {(!compact || inputEnabled) && <Composer enabled={inputEnabled} placeholder={(phase && PLACEHOLDER[phase]) || 'Pick an option above…'} onSend={onSend} />}
          </motion.div>
        ) : (
          <motion.div key="showroom" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, y: 20 }} transition={{ duration: 0.6, ease: SMOOTH }} className={cn('relative z-10 min-h-0 flex-1', !phone && 'overflow-y-auto overscroll-contain')}>
            {!stage && phone && <MobilePreview config={config} spreads={spreads} photos={photos} onAddPhotos={() => edit('photos', 'Photos')} />}
            {!stage && !phone && (
              <div className="mx-auto max-w-4xl space-y-4 px-3 pb-12 pt-6 sm:px-6">
                <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: SMOOTH }} className="flex items-end gap-3">
                  <div className="min-w-0 flex-1">
                    <BotBubble>{PIXIE.preview}</BotBubble>
                  </div>
                </motion.div>
                <div className="space-y-5 rounded-3xl bg-white/70 p-3 ring-1 ring-white sm:p-6">
                  <PreviewBody reveal config={config} spreads={spreads} photos={photos} onAddPhotos={() => edit('photos', 'Photos')} />
                  <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.1, duration: 0.7, ease: SMOOTH }} className="space-y-5">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--st-peach)]/60 pt-4">
                      <PreviewFooter config={config} onBack={() => edit('photos', 'Photos')} />
                    </div>
                  </motion.div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>{stage && <BookStage photos={photos} spreads={spreads} title={config.title} onDone={endStage} light={compact} />}</AnimatePresence>

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
            onRemoveMany={(ids) => flow.removePhotos(ids)}
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
