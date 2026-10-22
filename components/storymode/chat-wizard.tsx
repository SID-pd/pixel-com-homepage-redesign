'use client'

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'motion/react'
import { curtain } from '@/components/flow/page-curtain'
import { BookStage } from '@/components/story/book-stage'
import { BotBubble, Reply, TypingBubble, UserBubble } from '@/components/story/chat-ui'
import { Companion, type PixieCue } from '@/components/story/companion'
import { PhotoDock, PhotoPill, PhotoViewer } from '@/components/story/photo-dock'
import { PhotoManager } from '@/components/story/photo-manager'
import { PreviewBody, PreviewFooter } from '@/components/story/preview-step'
import { usePhotoPipeline } from '@/components/story/scrapbook'
import { PrimaryButton, StageBackdrop } from '@/components/story/stage-parts'
import { StoryHeader } from '@/components/story/story-header'
import { useMediaQuery } from '@/components/story/use-media'
import { DropOverlay, UploadBody, useIngest, useStageDrop } from '@/components/story/upload-step'
import { COVERS, SIZES, TEMPLATES, type TemplateId } from '@/lib/flow/catalog'
import { askCompanion } from '@/lib/flow/mock-api'
import { analyzePhotos, isSuggestedRemoval, type PhotoReport } from '@/lib/flow/photo-check'
import { flow, getState, useFlow } from '@/lib/flow/store'
import { captionsFor, orderPhotos } from '@/lib/flow/story'
import type { Mood } from '@/lib/flow/story-chat'
import { OCCASION_FOR_TAG, describe } from '@/lib/flow/story-questions'
import type { Draft } from '@/lib/flow/types'
import { cn } from '@/lib/utils'
import { ReviewDialog } from './review-dialog'
import { SetupCard } from './setup-card'

// /storymode, chat first: the whole page is the conversation. Size, pages, cover, template and Pixie's follow-up questions,
// photos, the photo check and the preview all happen as turns inside it.
type Kind = 'setup' | 'photos' | 'review' | 'preview'
type Msg = { id: string; from: 'bot' | 'user'; text?: string; ask?: Kind }

const MAX_PER_PAGE = 4
const STAGES = ['Your book', 'Photos', 'Review', 'Preview'] as const
const STAGE_OF: Record<Kind, number> = { setup: 0, photos: 1, review: 2, preview: 3 }
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

export function ChatWizard() {
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
  return <Wizard draft={draft} />
}

function Wizard({ draft }: { draft: Draft }) {
  const router = useRouter()
  const wide = useWide()
  // phones and tablets: no live mascot, no full-screen build scene, a pill instead of the photo rail
  const compact = !useMediaQuery('(min-width: 1024px)')
  const { config, photos, spreads } = draft

  const [msgs, setMsgs] = useState<Msg[]>([])
  const [typing, setTyping] = useState(false)
  const [phase, setPhase] = useState<Kind | null>(null)
  const [mood, setMood] = useState<Mood>('idle')
  const [cue, setCue] = useState<PixieCue | undefined>()
  const [picked, setPicked] = useState(!!draft.config.templateId)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [reports, setReports] = useState<Record<string, PhotoReport> | null>(null)
  const [checking, setChecking] = useState({ active: false, done: 0, total: 0 })
  const [marked, setMarked] = useState<Set<string>>(new Set())
  const [stage, setStage] = useState(false)
  const [viewId, setViewId] = useState<string | null>(null)
  const [manage, setManage] = useState(false)
  const [ignored] = useState<Set<string>>(new Set())

  const pipeline = usePhotoPipeline(photos)
  const { reading, errors, ingest, addPack } = useIngest(photos)
  const dropping = useStageDrop(ingest, phase === 'photos' && !stage)

  const alive = useRef(true)
  const seq = useRef(0)
  const cueId = useRef(0)
  const moodTimer = useRef<number | null>(null)
  const started = useRef(false)
  const editing = useRef(false)
  const decided = useRef(false)
  const scroller = useRef<HTMLDivElement>(null)
  const picker = useRef<HTMLInputElement>(null)

  useEffect(() => {
    alive.current = true
    return () => {
      alive.current = false
      if (moodTimer.current) window.clearTimeout(moodTimer.current)
    }
  }, [])

  const min = config.pages
  const max = config.pages * MAX_PER_PAGE
  const tpl = TEMPLATES.find((t) => t.id === config.templateId)
  const tag = tpl?.tag ?? 'none'

  // ---- Pixie's body language ---------------------------------------------------------------------------------------------
  const fire = useCallback((type: PixieCue['type']) => setCue({ type, id: ++cueId.current }), [])
  const holdMood = useCallback((m: Mood, ms: number) => {
    if (moodTimer.current) window.clearTimeout(moodTimer.current)
    setMood(m)
    moodTimer.current = window.setTimeout(() => alive.current && setMood('idle'), ms)
  }, [])

  const push = useCallback((m: Omit<Msg, 'id'>) => setMsgs((all) => [...all, { ...m, id: `m${++seq.current}` }]), [])

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

  // ---- background photo check ----------------------------------------------------------------------------------------------
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

  // ---- build the book and show it ----------------------------------------------------------------------------------------------
  const proceed = useCallback(() => {
    const d = getState().draft
    if (!d) return
    const t = TEMPLATES.find((x) => x.id === d.config.templateId)
    const tg = t?.tag ?? 'none'
    const { description, title: fromAnswers } = describe(tg, answers)
    const bookTitle = fromAnswers || t?.name || 'Our Story'
    const order = orderPhotos(d.photos).map((p) => p.id)
    const pages = d.config.pages
    flow.rebuildStory({ order, captions: {}, title: bookTitle, pages })
    const lead = (getState().draft?.spreads ?? [])
      .filter((s) => s.kind !== 'cover')
      .map((s) => s.items.find((i) => i.type === 'photo' && i.photoId)?.photoId)
      .filter(Boolean) as string[]
    const lines = captionsFor(description, Math.max(lead.length, 1), OCCASION_FOR_TAG[tg] ?? 'general', 'warm')
    const map: Record<string, string> = {}
    lead.forEach((id, i) => (map[id] = lines[i % lines.length]))
    flow.rebuildStory({ order, captions: map, title: bookTitle, pages })
    setPhase('preview')
    setStage(true)
    setMood('thinking')
  }, [answers])

  const endStage = useCallback(() => {
    setStage(false)
    fire('hop')
    holdMood('celebrate', 2600)
  }, [fire, holdMood])

  // ---- the conversation --------------------------------------------------------------------------------------------------------
  useEffect(() => {
    if (started.current) return
    started.current = true
    void (async () => {
      await wait(1150)
      fire('wave')
      await wait(450)
      await say(['Hi, I’m Pixie! Let’s make your photo book together.', 'Here’s everything about your book in one place. Set what you like and leave the rest, then press Continue.'], 'setup')
    })()
  }, [say, fire])

  const toPhotos = useCallback(() => {
    return say([`Now your photos. You’ll need at least ${min} for ${config.pages} pages (up to ${max}). They upload quietly while you carry on.`], 'photos')
  }, [say, min, max, config.pages])

  const pickTemplate = (id: TemplateId | undefined) => {
    flow.setConfig({ templateId: id })
    setAnswers({})
    setPicked(true)
    holdMood('excited', 1000)
  }

  const finishSetup = () => {
    const size = SIZES.find((x) => x.id === config.size)!.label.replace(/[″"]/g, '').replace('×', 'x')
    const cover = COVERS.find((c) => c.id === config.cover)!.label
    const told = Object.values(answers).filter((v) => v.trim())
    you([`${size}`, `${config.pages} pages`, cover, tpl ? tpl.name : 'No template', ...told].join(' · '))
    holdMood('excited', 1200)
    void say(told.length ? ['Lovely, that helps me write captions that sound like your story.'] : ['Great, that’s your book set up.']).then(toPhotos)
  }

  const photosDone = () => {
    you(`${photos.length} photos`)
    holdMood('excited', 1200)
    decided.current = false
    void say([editing.current ? 'Let me look them over again.' : 'Lovely! Let me take a look through them.'], 'review')
    editing.current = false
  }

  const backToPhotos = () => {
    editing.current = true
    you('Back to my photos')
    void say(['Add or remove photos here, then press Continue.'], 'photos')
  }

  // photo check result, once the review step is open
  useEffect(() => {
    if (phase !== 'review') {
      decided.current = false
      return
    }
    if (!reports || decided.current || stage) return
    decided.current = true
    const flagged = photos.filter((p) => reports[p.id]?.issues.length && !ignored.has(p.id))
    if (flagged.length === 0) {
      void say(['All your photos look good. Building your book…']).then(() => proceed())
      return
    }
    setMarked(new Set(photos.filter((p) => reports[p.id] && (reports[p.id].duplicateOf || isSuggestedRemoval(reports[p.id]))).map((p) => p.id)))
    void say([`${flagged.length} photo${flagged.length === 1 ? '' : 's'} worth a look. Choose what to keep, nothing is removed until you continue.`])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, reports])

  const applyAndContinue = () => {
    you('Continue')
    marked.forEach((id) => flow.removePhoto(id))
    setMarked(new Set())
    void say(['Building your book…']).then(() => proceed())
  }

  // cheer when every upload has landed
  const cheered = useRef(false)
  useEffect(() => {
    if (!photos.length) return
    if (pipeline.allReady && reading === 0) {
      if (!cheered.current && phase !== 'preview') {
        cheered.current = true
        fire('hop')
        holdMood('excited', 1100)
      }
    } else cheered.current = false
  }, [photos.length, pipeline.allReady, reading, phase, fire, holdMood])

  // ---- scrolling -----------------------------------------------------------------------------------------------------------
  const activeAskId = useMemo(() => {
    for (let i = msgs.length - 1; i >= 0; i--) if (msgs[i].ask && msgs[i].ask === phase) return msgs[i].id
    return null
  }, [msgs, phase])

  useEffect(() => {
    const el = scroller.current
    if (!el) return
    const id = window.setTimeout(() => {
      const target = (phase === 'review' || phase === 'setup') && activeAskId ? document.getElementById(`msg-${activeAskId}`) : null
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' })
      else el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
    }, 90)
    return () => window.clearTimeout(id)
  }, [msgs.length, typing, phase, activeAskId])

  // ---- render ---------------------------------------------------------------------------------------------------------------------
  const photoOk = photos.length >= min && photos.length <= max && pipeline.allReady && reading === 0
  const waiting = photos.filter((p) => pipeline.get(p.id).state !== 'ready').length

  const widget = (m: Msg) => {
    if (m.id !== activeAskId) return null
    switch (m.ask) {
      case 'setup':
        return (
          <Reply wide>
            <SetupCard config={config} picked={picked} answers={answers} onTemplate={pickTemplate} onAnswer={(id, text) => setAnswers((a) => ({ ...a, [id]: text }))} onContinue={finishSetup} />
          </Reply>
        )
      case 'photos':
        return (
          <Reply wide>
            <div className="rounded-3xl bg-white/70 p-4 ring-1 ring-white sm:p-5">
              <UploadBody reading={reading} errors={errors} recommended={min} onFiles={ingest} onPack={addPack} />
              <div className="mt-5 flex flex-col gap-3 border-t border-[var(--st-peach)]/60 pt-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-xs text-foreground/65" aria-live="polite">
                  <p>
                    {photos.length - waiting} of at least {min} photos{waiting > 0 ? ` · uploading ${waiting}…` : photos.length > 0 ? ' · all uploaded' : ''}
                  </p>
                  {photos.length > max && <p className="mt-0.5 text-[#c0392b]">That’s more than {config.pages} pages can hold. Remove some or choose more pages.</p>}
                  {photos.length > 0 && photos.length < min && <p className="mt-0.5">Add {min - photos.length} more to continue.</p>}
                </div>
                <PrimaryButton disabled={!photoOk} onClick={photosDone} className="w-full sm:w-auto">
                  Continue
                </PrimaryButton>
              </div>
            </div>
          </Reply>
        )
      case 'review':
        return (
          <Reply wide>
            {reports && photos.some((p) => reports[p.id]?.issues.length) ? (
              <ReviewDialog
                inline
                photos={photos}
                reports={reports}
                marked={marked}
                minPhotos={min}
                onSetMarked={setMarked}
                onOpen={setViewId}
                onUploadMore={backToPhotos}
                onContinue={applyAndContinue}
                onBack={() => {}}
              />
            ) : (
              <p className="rounded-2xl bg-[var(--st-lilac)]/55 px-4 py-3 text-sm font-medium text-[var(--st-lilac-ink)]" aria-live="polite">
                {checking.total ? `Checking your photos… ${checking.done}/${checking.total}` : 'Waiting for your photos to finish uploading…'}
              </p>
            )}
          </Reply>
        )
      default:
        return null
    }
  }

  const showroom = phase === 'preview'
  const pixie = (size: number, intro = false) => <Companion intro={intro} size={size} mood={typing ? 'thinking' : mood} cue={cue} />
  const hasPhotos = photos.length > 0
  const SMOOTH = [0.4, 0, 0.2, 1] as const
  const at = phase ? STAGE_OF[phase] : 0

  return (
    <div className="relative flex h-dvh flex-col overflow-hidden text-[var(--st-ink)]">
      <StageBackdrop />
      <div className="relative z-30">
        <StoryHeader onExit={() => curtain.go(router, '/', 'Heading home…')} />
      </div>

      {!compact && (
        <div className="pointer-events-none absolute bottom-3 left-6 z-20">
          <div className="pointer-events-auto">{pixie(wide ? 132 : 56, true)}</div>
        </div>
      )}

      <AnimatePresence mode="wait" initial={false}>
        {!showroom ? (
          <motion.div key="chat" initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -26, scale: 0.985 }} transition={{ duration: 0.7, ease: SMOOTH }} className="relative z-10 flex min-h-0 flex-1 flex-col">
            {/* where we are, as a slim line, not a separate screen */}
            <ol aria-label="Progress" className="relative z-20 mx-auto flex w-full max-w-4xl shrink-0 items-center gap-2 px-4 pb-1 pt-3 sm:px-6">
              {STAGES.map((s, i) => (
                <li key={s} aria-current={i === at ? 'step' : undefined} className="min-w-0 flex-1">
                  <span className={cn('block h-1 rounded-full transition-colors duration-500', i <= at ? 'bg-[#d4673f]' : 'bg-[#16324f]/12')} />
                  <span className={cn('mt-1 block truncate text-[11px] font-semibold', i === at ? 'text-[#d4673f]' : 'text-[#16324f]/45')}>{s}</span>
                </li>
              ))}
            </ol>

            <main className="relative min-h-0 flex-1">
              {compact ? (
                <PhotoPill photos={photos} status={pipeline.get} checking={checking} onManage={() => setManage(true)} className="absolute bottom-3 right-3 z-20" />
              ) : (
                <PhotoDock photos={photos} status={pipeline.get} flags={new Set(photos.filter((p) => reports?.[p.id]?.issues.length).map((p) => p.id))} checking={checking} onOpen={setViewId} onAdd={() => picker.current?.click()} onManage={() => setManage(true)} />
              )}

              <div ref={scroller} className={cn('relative z-10 h-full overflow-y-auto overscroll-contain px-3 pb-6 pt-3 sm:px-6', hasPhotos && 'min-[1024px]:max-[1279px]:pr-[5.75rem]', 'max-lg:pb-24')}>
                <div className="mx-auto flex max-w-4xl flex-col gap-3">
                  {msgs.map((m) => (
                    <div key={m.id} id={`msg-${m.id}`} className="scroll-mt-3 space-y-3">
                      {m.from === 'bot' ? <BotBubble>{m.text}</BotBubble> : <UserBubble>{m.text}</UserBubble>}
                      {widget(m)}
                    </div>
                  ))}
                  {typing && <TypingBubble />}
                </div>
              </div>
            </main>

          </motion.div>
        ) : (
          <motion.div key="showroom" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, y: 20 }} transition={{ duration: 0.6, ease: SMOOTH }} className="relative z-10 min-h-0 flex-1 overflow-y-auto overscroll-contain">
            {!stage && (
              <div className="mx-auto max-w-5xl space-y-4 px-3 pb-12 pt-4 sm:px-6 sm:pt-6">
                <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: SMOOTH }} className="flex items-end gap-3 max-sm:hidden">
                  {!wide && <div className="shrink-0">{pixie(60)}</div>}
                  <div className="min-w-0 flex-1">
                    <BotBubble avatar={wide}>Ta-da! Here’s your storybook. Look through it, then head to checkout or tweak it first.</BotBubble>
                  </div>
                </motion.div>
                <div className="rounded-[2rem] bg-white/75 p-4 ring-1 ring-white max-sm:bg-transparent max-sm:p-0 max-sm:ring-0 sm:p-8">
                  <PreviewBody reveal config={config} spreads={spreads} photos={photos} onAddPhotos={backToPhotos} />
                  <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-[#eee7db] pt-5 max-sm:mt-4 max-sm:border-0 max-sm:pt-0">
                    <PreviewFooter config={config} onBack={backToPhotos} />
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>{stage && <BookStage photos={photos} spreads={spreads} title={config.title} onDone={endStage} light={compact} />}</AnimatePresence>

      <DropOverlay show={dropping} />

      <input ref={picker} type="file" accept="image/*" multiple className="sr-only" aria-hidden tabIndex={-1} onChange={(e) => { void ingest(Array.from(e.target.files ?? [])); e.target.value = '' }} />

      <AnimatePresence>
        {manage && !showroom && (
          <PhotoManager photos={photos} status={pipeline.get} reports={reports} ignored={ignored} onOpen={setViewId} onRemoveMany={(ids) => ids.forEach((id) => flow.removePhoto(id))} onKeep={() => {}} onUndoKeep={() => {}} onAdd={() => picker.current?.click()} onClose={() => setManage(false)} />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {viewId && !showroom && <PhotoViewer photos={photos} id={viewId} status={pipeline.get} reports={reports} onNav={setViewId} onRemove={(id) => flow.removePhoto(id)} onClose={() => setViewId(null)} />}
      </AnimatePresence>
    </div>
  )
}
