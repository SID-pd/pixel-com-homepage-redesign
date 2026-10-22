'use client'

import { useState, type ReactNode } from 'react'
import { SendHorizonal } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PixieAvatar } from './companion'

/** A bot line: tiny flat avatar + bubble. New messages rise in with a single CSS animation. */
export function BotBubble({ children, avatar = true }: { children: ReactNode; avatar?: boolean }) {
  return (
    <div className="st-rise flex items-end gap-2.5">
      <span className="mb-1 w-[34px] shrink-0">{avatar && <PixieAvatar size={34} />}</span>
      <p className="max-w-[min(34rem,88%)] whitespace-pre-line rounded-[1.4rem] rounded-bl-md bg-white px-4 py-2.5 text-[15px] leading-relaxed text-[var(--st-ink)] shadow-[0_4px_14px_-8px_rgba(90,55,30,0.5)]">{children}</p>
    </div>
  )
}

export function UserBubble({ children }: { children: ReactNode }) {
  return (
    <div className="st-rise flex justify-end">
      <p className="max-w-[min(30rem,85%)] whitespace-pre-line rounded-[1.4rem] rounded-br-md bg-[var(--st-peach)] px-4 py-2.5 text-[15px] leading-relaxed text-[var(--st-ink)]">{children}</p>
    </div>
  )
}

export function TypingBubble() {
  return (
    <div className="st-rise flex items-end gap-2.5" aria-label="Pixie is typing">
      <span className="mb-1 w-[34px] shrink-0">
        <PixieAvatar size={34} />
      </span>
      <span className="inline-flex gap-1 rounded-[1.4rem] rounded-bl-md bg-white px-4 py-3.5 shadow-[0_4px_14px_-8px_rgba(90,55,30,0.5)]">
        {[0, 1, 2].map((i) => (
          <span key={i} className="pixie-dot size-1.5 rounded-full bg-[var(--st-lilac-ink)]" style={{ animationDelay: `${i * 0.15}s` }} />
        ))}
      </span>
    </div>
  )
}

/** Answers Pixie is waiting for: tap one, or type your own below. */
export function Choice({ children, on, onClick, hint, className }: { children: ReactNode; on?: boolean; onClick: () => void; hint?: string; className?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className={cn(
        'inline-flex min-h-11 items-center gap-2 rounded-full px-4 py-2 text-left text-sm font-medium transition active:scale-[0.97]',
        on ? 'bg-[var(--st-ink)] text-white' : 'bg-white text-[var(--st-ink)] ring-1 ring-[var(--st-peach)] hover:ring-[var(--st-peach-ink)]/45',
        className,
      )}
    >
      <span>
        {children}
        {hint && <span className={cn('block text-[11px] font-normal', on ? 'text-white/70' : 'text-foreground/55')}>{hint}</span>}
      </span>
    </button>
  )
}

/** Indents widgets under the bot avatar so they read as part of Pixie's turn. */
export function Reply({ children, wide }: { children: ReactNode; wide?: boolean }) {
  return <div className={cn('st-rise pl-[44px]', wide && 'pl-0 sm:pl-[44px]')}>{children}</div>
}

export function Composer({
  enabled,
  placeholder,
  onSend,
  lead,
}: {
  enabled: boolean
  placeholder: string
  onSend: (t: string) => void
  /** live Pixie on small screens, where there is no room beside the feed */
  lead?: ReactNode
}) {
  const [draft, setDraft] = useState('')
  const submit = () => {
    const t = draft.trim()
    if (!t || !enabled) return
    setDraft('')
    onSend(t)
  }
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        submit()
      }}
      className="relative z-20 shrink-0 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 sm:px-6 sm:pb-5"
    >
      <div className="mx-auto flex max-w-3xl items-end gap-2">
        {lead}
        <div className={cn('flex min-w-0 flex-1 items-end gap-2 rounded-[1.6rem] bg-white p-1.5 pl-4 shadow-[0_10px_30px_-16px_rgba(90,55,30,0.55)] ring-1 transition', enabled ? 'ring-[var(--st-peach)] focus-within:ring-2 focus-within:ring-[var(--st-peach-ink)]/50' : 'opacity-75 ring-transparent')}>
          <label htmlFor="story-input" className="sr-only">
            Message Pixie
          </label>
          <textarea
            id="story-input"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                submit()
              }
            }}
            rows={1}
            maxLength={500}
            disabled={!enabled}
            placeholder={placeholder}
            className="max-h-32 min-h-11 flex-1 resize-none bg-transparent py-3 text-[15px] outline-none placeholder:text-foreground/40 [field-sizing:content]"
          />
          <button type="submit" disabled={!enabled || !draft.trim()} aria-label="Send" className="grid size-11 shrink-0 place-items-center rounded-full bg-[var(--st-ink)] text-white transition enabled:hover:scale-105 enabled:active:scale-95 disabled:opacity-30">
            <SendHorizonal className="size-4" />
          </button>
        </div>
      </div>
    </form>
  )
}
