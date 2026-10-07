'use client'

import { useEffect, useState } from 'react'
import { ChevronDown, List } from 'lucide-react'
import { cn } from '@/lib/utils'

export type TocItem = { id: string; label: string }

/** Table of contents with scroll-spy: a sticky rail on desktop, a collapsible "On this page" on mobile. */
export function TocNav({ items, title = 'On this page', numbered }: { items: TocItem[]; title?: string; numbered?: boolean }) {
  const [active, setActive] = useState(items[0]?.id ?? '')
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const els = items.map((i) => document.getElementById(i.id)).filter((e): e is HTMLElement => !!e)
    if (!els.length) return
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible[0]) setActive(visible[0].target.id)
      },
      { rootMargin: '-96px 0px -65% 0px', threshold: 0 },
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [items])

  const list = (
    <ol className="space-y-0.5">
      {items.map((it, i) => (
        <li key={it.id}>
          <a
            href={`#${it.id}`}
            onClick={() => setOpen(false)}
            aria-current={active === it.id ? 'location' : undefined}
            className={cn(
              'flex items-start gap-2.5 rounded-xl px-3 py-2 text-sm transition',
              active === it.id ? 'bg-accent/10 font-semibold text-foreground' : 'text-muted-foreground hover:bg-foreground/5 hover:text-foreground',
            )}
          >
            {numbered && <span className="mt-px w-5 shrink-0 tabular-nums text-accent">{i + 1}</span>}
            <span>{it.label}</span>
          </a>
        </li>
      ))}
    </ol>
  )

  return (
    <nav aria-label={title}>
      <div className="lg:hidden">
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="flex w-full items-center justify-between rounded-2xl border border-foreground/10 bg-card px-4 py-3 text-sm font-semibold"
        >
          <span className="inline-flex items-center gap-2">
            <List className="size-4 text-accent" /> {title}
          </span>
          <ChevronDown className={cn('size-4 transition-transform', open && 'rotate-180')} />
        </button>
        {open && <div className="mt-2 rounded-2xl border border-foreground/10 bg-card p-2">{list}</div>}
      </div>
      <div className="hidden lg:block">
        <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">{title}</p>
        {list}
      </div>
    </nav>
  )
}
