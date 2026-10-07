import Link from 'next/link'
import { Mail } from 'lucide-react'
import type { LegalDoc } from '@/lib/content'
import { CtaBand, MarketingShell } from './blocks'
import { TocNav } from './toc-nav'

export function LegalDocument({ doc, other }: { doc: LegalDoc; other: { href: string; label: string } }) {
  const eyebrow = doc.slug === 'terms' ? 'Legal · Terms' : 'Legal · Privacy'
  return (
    <MarketingShell>
      <section className="px-5 pb-8 pt-32 sm:pt-40 md:px-6">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">{eyebrow}</p>
          <h1 className="mt-3 font-serif text-4xl tracking-tight md:text-6xl">{doc.title}</h1>
          <p className="mt-4 max-w-2xl text-lg text-muted-foreground">{doc.intro}</p>
          <p className="mt-6 inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-2 text-sm text-muted-foreground">
            Plain-language summary: you own your photos, we only use them to make your book, and you can always reach a person.
          </p>
        </div>
      </section>

      <section className="px-5 pb-16 pt-6 md:px-6 md:pb-24">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-14">
          <aside className="lg:sticky lg:top-28 lg:self-start">
            <TocNav numbered items={doc.sections.map((s) => ({ id: s.id, label: s.title }))} title="Sections" />
          </aside>
          <div className="min-w-0 space-y-4">
            {doc.sections.map((s) => (
              <article key={s.id} id={s.id} className="scroll-mt-28 rounded-3xl border border-foreground/8 bg-card p-6 shadow-xs sm:p-8">
                <div className="flex items-start gap-4">
                  <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-accent/12 font-serif text-lg text-accent">{s.n}</span>
                  <div className="min-w-0 flex-1">
                    <h2 className="font-serif text-2xl tracking-tight sm:text-3xl">{s.title}</h2>
                    <div className="prose-legal mt-3" dangerouslySetInnerHTML={{ __html: s.html }} />
                  </div>
                </div>
              </article>
            ))}

            <div className="flex flex-col items-start gap-4 rounded-3xl bg-secondary p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
              <div>
                <p className="font-semibold">Something unclear? Ask us. A person will answer.</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Read the {other.label.toLowerCase()} too:{' '}
                  <Link href={other.href} className="font-medium text-accent underline-offset-4 hover:underline">
                    {other.label}
                  </Link>
                </p>
              </div>
              <a
                href="mailto:support@pixovo.com"
                className="inline-flex h-11 shrink-0 items-center gap-2 rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
              >
                <Mail className="size-4" /> support@pixovo.com
              </a>
            </div>
          </div>
        </div>
      </section>
      <CtaBand />
    </MarketingShell>
  )
}
