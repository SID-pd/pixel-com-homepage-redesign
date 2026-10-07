'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { ChevronDown, Search, SearchX } from 'lucide-react'
import { plain, type FaqGroup } from '@/lib/content'
import { cn } from '@/lib/utils'

/**
 * Searchable FAQ. Psychology notes: nine long categories overwhelm, so the pills let people narrow to one;
 * search catches the "I know what I want to ask" majority; the first question is open so the page never
 * looks like a wall of closed boxes; an empty search offers a human instead of a dead end.
 */
export function FaqAccordion({ groups, searchable = true }: { groups: FaqGroup[]; searchable?: boolean }) {
  const [query, setQuery] = useState('')
  const [active, setActive] = useState<string>('all')
  const [open, setOpen] = useState<string | null>(groups[0]?.items[0] ? `${groups[0].id}-0` : null)

  const q = query.trim().toLowerCase()
  const visible = useMemo(
    () =>
      groups
        .filter((g) => active === 'all' || g.id === active)
        .map((g) => ({
          ...g,
          items: g.items
            .map((item, i) => ({ ...item, key: `${g.id}-${i}` }))
            .filter((item) => !q || item.q.toLowerCase().includes(q) || plain(item.a).toLowerCase().includes(q)),
        }))
        .filter((g) => g.items.length),
    [groups, active, q],
  )
  const total = visible.reduce((n, g) => n + g.items.length, 0)

  return (
    <div>
      {searchable && (
        <div className="relative">
          <label htmlFor="faq-search" className="sr-only">
            Search questions
          </label>
          <Search className="pointer-events-none absolute left-5 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <input
            id="faq-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search: shipping time, sizes, refunds…"
            className="h-14 w-full rounded-full border border-foreground/10 bg-card pl-13 pr-5 text-base shadow-xs outline-none transition focus:border-accent focus:ring-4 focus:ring-accent/15"
            style={{ paddingLeft: '3.25rem' }}
          />
        </div>
      )}

      {groups.length > 1 && (
        <div role="tablist" aria-label="Question categories" className="-mx-5 mt-5 flex gap-2 overflow-x-auto px-5 pb-2 [scrollbar-width:none] md:mx-0 md:flex-wrap md:px-0 [&::-webkit-scrollbar]:hidden">
          {[{ id: 'all', title: 'All' }, ...groups].map((g) => (
            <button
              key={g.id}
              type="button"
              role="tab"
              aria-selected={active === g.id}
              onClick={() => setActive(g.id)}
              className={cn(
                'shrink-0 rounded-full px-4 py-2 text-sm font-medium transition',
                active === g.id ? 'bg-foreground text-background' : 'bg-secondary text-foreground/75 hover:bg-foreground/10',
              )}
            >
              {g.title}
            </button>
          ))}
        </div>
      )}

      <p className="sr-only" role="status" aria-live="polite">
        {total} question{total === 1 ? '' : 's'} shown
      </p>

      {total === 0 ? (
        <div className="mt-10 rounded-3xl border border-dashed border-foreground/15 bg-card/60 p-10 text-center">
          <SearchX className="mx-auto size-8 text-muted-foreground" aria-hidden />
          <p className="mt-3 font-medium">No answers match “{query}”.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            A real person usually replies within 24 hours.{' '}
            <Link href="/contact-us/" className="font-medium text-accent underline-offset-4 hover:underline">
              Ask us directly
            </Link>
            .
          </p>
        </div>
      ) : (
        <div className="mt-8 space-y-10">
          {visible.map((g) => (
            <section key={g.id} id={g.id} aria-labelledby={`${g.id}-h`} className="scroll-mt-28">
              <h2 id={`${g.id}-h`} className="mb-4 font-serif text-3xl tracking-tight">
                {g.title}
              </h2>
              <ul className="space-y-3">
                {g.items.map((item) => {
                  const isOpen = open === item.key || !!q
                  return (
                    <li key={item.key} className={cn('rounded-2xl border bg-card transition-shadow', isOpen ? 'border-accent/40 shadow-float' : 'border-foreground/8 hover:shadow-xs')}>
                      <h3>
                        <button
                          type="button"
                          aria-expanded={isOpen}
                          aria-controls={`${item.key}-a`}
                          onClick={() => setOpen(open === item.key ? null : item.key)}
                          className="flex w-full items-center justify-between gap-4 rounded-2xl px-5 py-4 text-left text-base font-semibold sm:px-6 sm:py-5 sm:text-lg"
                        >
                          <span>{item.q}</span>
                          <ChevronDown className={cn('size-5 shrink-0 text-accent transition-transform duration-300', isOpen && 'rotate-180')} aria-hidden />
                        </button>
                      </h3>
                      <div
                        id={`${item.key}-a`}
                        role="region"
                        className={cn('grid transition-[grid-template-rows] duration-300 ease-out', isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]')}
                      >
                        <div className="overflow-hidden">
                          <div className="prose-legal px-5 pb-5 sm:px-6 sm:pb-6" dangerouslySetInnerHTML={{ __html: item.a }} />
                        </div>
                      </div>
                    </li>
                  )
                })}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
