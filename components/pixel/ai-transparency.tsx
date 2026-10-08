'use client'

import { Check, Sparkles, UserCheck, ShieldCheck, Clock, Layers } from 'lucide-react'
import { Reveal, RevealItem } from './reveal'
import { SectionHeading } from './section-heading'

const features = [
  {
    icon: Sparkles,
    title: 'Smart Photo Analysis',
    text: 'AI evaluates photo clarity, faces, emotional beats, and chronological events to pick your best moments.',
  },
  {
    icon: Layers,
    title: 'Automatic Chaptering',
    text: 'Groups your vacation days, wedding moments, or baby milestones into cohesive visual storylines.',
  },
  {
    icon: Clock,
    title: 'Draft in About a Minute',
    text: 'Generates a complete initial album layout in about a minute so you never start from a blank page.',
  },
  {
    icon: UserCheck,
    title: 'YOU Are in Full Control',
    text: 'Review every page, swap photos, adjust captions, or change covers. The AI works for you, not over you.',
  },
]

export function AiTransparency() {
  return (
    <section aria-labelledby="ai-transparency-title" className="px-5 py-16 md:px-6 md:py-24 bg-card/40 border-y border-foreground/5">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="Human-First AI Assistance"
          title={
            <span id="ai-transparency-title">
              Our AI doesn’t replace you. <em className="text-accent">It helps you.</em>
            </span>
          }
          description="We built AI to eliminate the 10+ hours of tedious manual sorting — while leaving every creative decision in your hands."
        />

        <Reveal staggerChildren={0.08} className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {features.map(({ icon: Icon, title, text }) => (
            <RevealItem
              key={title}
              className="flex flex-col gap-4 rounded-3xl bg-background p-6 shadow-sm border border-foreground/[0.06] transition-all duration-300 hover:shadow-md hover:border-foreground/10"
            >
              <div className="flex items-center justify-between">
                <span className="grid size-11 place-items-center rounded-2xl bg-accent/10 text-accent">
                  <Icon className="size-5" />
                </span>
                <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                  <Check className="size-3" /> Verified
                </span>
              </div>
              <div>
                <h3 className="font-serif text-xl font-medium tracking-tight text-foreground">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{text}</p>
              </div>
            </RevealItem>
          ))}
        </Reveal>

        {/* Human Control Callout Banner */}
        <div className="mt-10 flex flex-col md:flex-row items-center justify-between gap-6 rounded-3xl bg-neutral-900 p-6 md:p-8 text-white shadow-xl">
          <div className="flex items-center gap-4">
            <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-amber-400/20 text-amber-400 border border-amber-400/30">
              <ShieldCheck className="size-6" />
            </span>
            <div>
              <h4 className="font-serif text-xl font-medium text-white">Your Memories, Your Rules</h4>
              <p className="mt-1 text-xs md:text-sm text-neutral-400 max-w-xl">
                Photos are processed privately on-device. No data sharing, no public training models, 100% private memory preservation.
              </p>
            </div>
          </div>
          <div className="shrink-0 flex items-center gap-3 bg-neutral-800/80 px-4 py-2.5 rounded-2xl border border-neutral-700/60 text-xs font-semibold text-neutral-200">
            <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
            Instant 60s AI Draft Engine
          </div>
        </div>
      </div>
    </section>
  )
}
