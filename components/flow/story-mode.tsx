'use client'

import { useState } from 'react'
import { Sparkles } from 'lucide-react'
import { generateStory } from '@/lib/flow/mock-api'
import { cn } from '@/lib/utils'

/**
 * Story Mode: the one-tap "let AI place everything" path. Styled apart from the regular buttons on purpose so it
 * reads as its own exclusive mode. Wording stays within the agreed AI claims (smart auto-layout, about a minute).
 */
export function StoryModeButton({
  onClick,
  disabled,
  loading,
  label = 'Try Story Mode',
  className,
}: {
  onClick: () => void
  disabled?: boolean
  loading?: boolean
  label?: string
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        'group relative inline-flex h-12 shrink-0 items-center justify-center gap-2 overflow-hidden rounded-full px-6 text-sm font-semibold text-white shadow-float transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50',
        'bg-[linear-gradient(110deg,#c4553a,#e08a3c_45%,#c4553a)] bg-[length:200%_100%] hover:bg-right focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
        className,
      )}
    >
      <Sparkles className={cn('size-4', loading && 'animate-pulse')} aria-hidden />
      <span>{loading ? 'Building your story…' : label}</span>
      <span className="rounded-full bg-white/25 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">AI</span>
    </button>
  )
}

export function StoryModeBanner({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-4 rounded-3xl border border-accent/25 bg-[linear-gradient(120deg,oklch(0.97_0.03_60),oklch(0.96_0.04_40))] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
      <div className="min-w-0">
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-accent">
          <Sparkles className="size-3.5" aria-hidden /> Story Mode · Exclusive
        </p>
        <h2 className="mt-1 text-lg font-semibold tracking-tight">Turn your photos into a complete, personalized book</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Describe your memory, upload your photos, and Pixovo organizes the moments, builds a natural story flow, writes captions and
          designs the layouts. Review and customize everything before you save or print.
        </p>
      </div>
      {children}
    </div>
  )
}

/** Step-2 Story Mode: describe the memory, then one tap builds the whole book. */
export function StoryModePanel({ photoCount, onDone }: { photoCount: number; onDone: () => void }) {
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  async function run() {
    setBusy(true)
    await generateStory(text)
    onDone()
  }
  return (
    <section aria-label="Story Mode" className="rounded-3xl border border-accent/25 bg-[linear-gradient(120deg,oklch(0.97_0.03_60),oklch(0.96_0.04_40))] p-5 sm:p-6">
      <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-accent">
        <Sparkles className="size-3.5" aria-hidden /> Story Mode · Exclusive
      </p>
      <h2 className="mt-1 text-lg font-semibold tracking-tight">Describe your memory, we build the book</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Tell us the story in a few lines. We put your photos in a natural order, write captions from your words and design every page. You can
        change anything afterwards.
      </p>
      <label htmlFor="story-text" className="sr-only">
        Describe your memory
      </label>
      <textarea
        id="story-text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
        maxLength={600}
        placeholder="e.g. Our first family trip to the coast. Sandcastles with the kids. Sunset dinners. The best week of the summer."
        className="mt-4 w-full resize-none rounded-2xl border border-foreground/10 bg-card p-4 text-sm outline-none transition focus:border-accent focus:ring-4 focus:ring-accent/15"
      />
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">{photoCount === 0 ? 'Upload your photos above to continue.' : `${photoCount} photo${photoCount === 1 ? '' : 's'} ready.`}</p>
        <StoryModeButton disabled={photoCount === 0} loading={busy} label="Create my story book" onClick={run} />
      </div>
    </section>
  )
}
