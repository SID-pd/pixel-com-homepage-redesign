'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { Check, LayoutTemplate, Sparkles } from 'lucide-react'
import { COVERS, PAGE_COUNTS, SIZES, TEMPLATES, type CoverId, type SizeId, type TemplateId } from '@/lib/flow/catalog'
import { GENERATING_STEPS } from '@/lib/flow/story-chat'
import { cn } from '@/lib/utils'
import { Choice } from './chat-ui'
import { PrimaryButton } from './stage-parts'

const card = (on: boolean) =>
  cn('relative overflow-hidden rounded-2xl bg-white text-left ring-1 transition active:scale-[0.98]', on ? 'ring-2 ring-[var(--st-peach-ink)]' : 'ring-[var(--st-peach)] hover:ring-[var(--st-peach-ink)]/45')

function Tick() {
  return (
    <span className="absolute right-1.5 top-1.5 grid size-5 place-items-center rounded-full bg-[var(--st-ink)] text-white">
      <Check className="size-3" strokeWidth={3} />
    </span>
  )
}

/** Starting design: a scrollable strip of cards. Pixie highlights the one that fits the story. */
export function TemplateWidget({ value, recommended, onPick }: { value?: TemplateId; recommended?: TemplateId; onPick: (id: TemplateId | undefined) => void }) {
  return (
    <div className="-mx-1 flex snap-x gap-3 overflow-x-auto px-1 pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <button type="button" onClick={() => onPick(undefined)} aria-pressed={!value} className={cn(card(!value), 'w-36 shrink-0 snap-start')}>
        <span className="grid aspect-[4/3] place-items-center bg-[var(--st-cream)] text-[var(--st-peach-ink)]">
          <LayoutTemplate className="size-6" />
        </span>
        <span className="block px-3 py-2 text-xs font-semibold">Let Pixie decide</span>
        {!value && <Tick />}
      </button>
      {TEMPLATES.map((t) => (
        <button key={t.id} type="button" onClick={() => onPick(t.id as TemplateId)} aria-pressed={value === t.id} className={cn(card(value === t.id), 'w-36 shrink-0 snap-start')}>
          <span className="relative block aspect-[4/3] bg-[var(--st-cream)]">
            <Image src={t.image} alt="" fill sizes="144px" className="object-cover" />
            {recommended === t.id && <span className="absolute bottom-1.5 left-1.5 inline-flex items-center gap-1 rounded-full bg-[var(--st-butter)] px-2 py-0.5 text-[10px] font-bold text-[#7a5b00]">⭐ Pixie’s pick</span>}
          </span>
          <span className="block px-3 py-2">
            <span className="block truncate text-xs font-semibold">{t.name}</span>
            <span className="block text-[10px] text-foreground/50">{t.tag}</span>
          </span>
          {value === t.id && <Tick />}
        </button>
      ))}
    </div>
  )
}

export function SizeWidget({ value, onPick }: { value: SizeId; onPick: (id: SizeId) => void }) {
  return (
    <div className="grid grid-cols-1 gap-2.5 min-[480px]:grid-cols-3">
      {SIZES.map((s) => (
        <button key={s.id} type="button" onClick={() => onPick(s.id)} aria-pressed={value === s.id} className={cn(card(value === s.id), 'min-h-11 p-3 pr-9')}>
          <span className="block text-sm font-semibold">{s.label}</span>
          <span className="mt-0.5 block text-[11px] leading-snug text-foreground/55">{s.blurb}</span>
          {value === s.id && <Tick />}
        </button>
      ))}
    </div>
  )
}

export function PagesWidget({ value, auto, captions, onPages, onCaptions, onContinue }: { value: number; auto: boolean; captions: boolean; onPages: (n: number | 'auto') => void; onCaptions: (on: boolean) => void; onContinue: () => void }) {
  return (
    <div className="space-y-4 rounded-3xl bg-white/70 p-4 ring-1 ring-white">
      <div>
        <p className="mb-2 text-xs font-semibold text-foreground/60">Pages</p>
        <div className="flex flex-wrap gap-2">
          <Choice on={auto} onClick={() => onPages('auto')}>
            <span className="inline-flex items-center gap-1.5">
              <Sparkles className="size-3.5" aria-hidden /> Auto
            </span>
          </Choice>
          {PAGE_COUNTS.map((n) => (
            <Choice key={n} on={!auto && value === n} onClick={() => onPages(n)} className="tabular-nums">
              {n} pages
            </Choice>
          ))}
        </div>
      </div>
      <div>
        <p className="mb-2 text-xs font-semibold text-foreground/60">Captions</p>
        <div className="flex flex-wrap gap-2">
          <Choice on={captions} onClick={() => onCaptions(true)} hint="Pixie writes one under each page">
            With captions
          </Choice>
          <Choice on={!captions} onClick={() => onCaptions(false)} hint="Photos only">
            No captions
          </Choice>
        </div>
      </div>
      <PrimaryButton onClick={onContinue} className="w-full sm:w-auto">
        Continue
      </PrimaryButton>
    </div>
  )
}

export function CoverWidget({ value, onPick }: { value: CoverId; onPick: (id: CoverId) => void }) {
  return (
    <div className="grid grid-cols-1 gap-2.5 min-[480px]:grid-cols-2">
      {COVERS.map((c) => (
        <button key={c.id} type="button" onClick={() => onPick(c.id)} aria-pressed={value === c.id} className={cn(card(value === c.id), 'min-h-11 p-3 pr-9')}>
          <span className="block text-sm font-semibold">{c.label}</span>
          <span className="mt-0.5 block text-[11px] leading-snug text-foreground/55">{c.blurb}</span>
          {value === c.id && <Tick />}
        </button>
      ))}
    </div>
  )
}

/** Inline "Pixie is arranging your story" card. Runs once, then calls onDone. */
export function BuildCard({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0)
  useEffect(() => {
    const per = 430
    const ts = GENERATING_STEPS.map((_, i) => window.setTimeout(() => setStep(i + 1), (i + 1) * per))
    const end = window.setTimeout(onDone, GENERATING_STEPS.length * per + 450)
    return () => {
      ts.forEach(window.clearTimeout)
      window.clearTimeout(end)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const pct = Math.round((Math.min(step, GENERATING_STEPS.length) / GENERATING_STEPS.length) * 100)
  return (
    <div className="rounded-3xl bg-white p-5 shadow-[0_10px_30px_-18px_rgba(90,55,30,0.5)]" aria-live="polite">
      <ul className="space-y-2">
        {GENERATING_STEPS.map((label, i) => {
          const done = step > i
          const active = step === i
          return (
            <li key={label} className={cn('flex items-center gap-3 text-sm transition-opacity', done || active ? 'opacity-100' : 'opacity-35')}>
              <span className={cn('grid size-5 shrink-0 place-items-center rounded-full', done ? 'bg-[var(--st-mint)] text-[var(--st-mint-ink)]' : active ? 'bg-[var(--st-lilac)] text-[var(--st-lilac-ink)]' : 'bg-foreground/8')}>
                {done ? <Check className="size-3" strokeWidth={3} /> : active ? <span className="pixie-dot size-1.5 rounded-full bg-current" /> : null}
              </span>
              <span className={cn(done && 'text-foreground/55')}>{label}</span>
            </li>
          )
        })}
      </ul>
      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-[var(--st-cream)]" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Building your story">
        <div className="h-full rounded-full bg-gradient-to-r from-[var(--st-peach-ink)] to-[var(--st-lilac-ink)] transition-[width] duration-500 ease-out" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}
