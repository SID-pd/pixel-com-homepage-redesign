import type { Metadata } from 'next'
import Link from 'next/link'
import { Mail, MapPin, MessageCircle, Truck } from 'lucide-react'
import { JsonLd, MarketingShell, PageHero } from '@/components/content/blocks'
import { FaqAccordion } from '@/components/content/faq-accordion'
import { faqData, faqJsonLd } from '@/lib/content'

export const metadata: Metadata = {
  title: 'Pixovo Help Center | Orders, Shipping, Payments & Returns',
  description: 'Instant answers about placing an order, shipping, payments, returns, your account and our photobooks, or reach our support team.',
  alternates: { canonical: '/help-center/' },
}

const QUICK = [
  { href: '/track-order/', icon: MapPin, title: 'Track my order', text: 'Status from printing to your door' },
  { href: '/shipping-info/', icon: Truck, title: 'Shipping info', text: 'Timelines, packaging and coverage' },
  { href: '/faq/', icon: MessageCircle, title: 'Full FAQ', text: 'All 30 questions, searchable' },
]

export default function HelpCenterPage() {
  const groups = faqData.helpGroups
  return (
    <MarketingShell>
      <JsonLd data={faqJsonLd(groups.flatMap((g) => g.items))} />
      <PageHero
        align="center"
        eyebrow="Support & assistance"
        title={
          <>
            How can we <em className="text-accent">help?</em>
          </>
        }
        description="We’re here to help. Find instant answers to your questions or reach our friendly support team anytime."
      />

      <section className="px-5 pb-8 md:px-6">
        <ul className="mx-auto grid max-w-4xl gap-4 sm:grid-cols-3">
          {QUICK.map(({ href, icon: Icon, title, text }) => (
            <li key={href}>
              <Link href={href} className="flex h-full items-start gap-3.5 rounded-3xl border border-foreground/8 bg-card p-5 shadow-xs transition hover:-translate-y-0.5 hover:shadow-float">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent/12 text-accent">
                  <Icon className="size-5" />
                </span>
                <span>
                  <span className="block font-semibold">{title}</span>
                  <span className="text-sm text-muted-foreground">{text}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="px-5 pb-16 pt-8 md:px-6 md:pb-24">
        <div className="mx-auto max-w-3xl">
          <FaqAccordion groups={groups} />

          <div className="mt-14 rounded-3xl bg-ink p-8 text-center text-ink-foreground sm:p-10">
            <h2 className="font-serif text-3xl sm:text-3xl">Still need help?</h2>
            <p className="mx-auto mt-2 max-w-md text-ink-foreground/75">Our friendly support team is always ready to assist you. Just send us a message.</p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <a href="mailto:support@pixovo.com" className="inline-flex h-12 items-center gap-2 rounded-full bg-accent px-6 text-sm font-medium text-accent-foreground transition hover:brightness-105">
                <Mail className="size-4" /> support@pixovo.com
              </a>
              <Link href="/contact-us/" className="inline-flex h-12 items-center rounded-full px-6 text-sm font-medium ring-1 ring-inset ring-white/25 transition hover:bg-white/10">
                Use the contact form
              </Link>
            </div>
          </div>
        </div>
      </section>
    </MarketingShell>
  )
}
