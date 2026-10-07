import type { Metadata } from 'next'
import Link from 'next/link'
import { MessageCircle } from 'lucide-react'
import { CtaBand, JsonLd, MarketingShell, PageHero } from '@/components/content/blocks'
import { FaqAccordion } from '@/components/content/faq-accordion'
import { faqData, faqJsonLd } from '@/lib/content'

export const metadata: Metadata = {
  title: faqData.metaTitle || 'FAQ | Pixovo',
  description: faqData.metaDescription,
  alternates: { canonical: '/faq/' },
}

export default function FaqPage() {
  const all = faqData.groups.flatMap((g) => g.items)
  return (
    <MarketingShell>
      <JsonLd data={faqJsonLd(all)} />
      <PageHero
        align="center"
        eyebrow="Frequently asked questions"
        title={
          <>
            Everything you need to know about <em className="text-accent">Pixovo</em>
          </>
        }
        description="Answers about how our AI photo books work, from design and pricing to sizes, shipping and support."
      />
      <section className="px-5 pb-16 md:px-6 md:pb-24">
        <div className="mx-auto max-w-3xl">
          <FaqAccordion groups={faqData.groups} />

          <div className="mt-14 flex flex-col items-center gap-4 rounded-3xl bg-secondary p-8 text-center">
            <span className="grid size-12 place-items-center rounded-2xl bg-accent/12 text-accent">
              <MessageCircle className="size-6" />
            </span>
            <h2 className="font-serif text-3xl">Still have questions?</h2>
            <p className="max-w-md text-muted-foreground">Our team replies within 24 hours, and usually much sooner.</p>
            <Link
              href="/contact-us/"
              className="inline-flex h-11 items-center rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
            >
              Contact support
            </Link>
          </div>
        </div>
      </section>
      <CtaBand />
    </MarketingShell>
  )
}
