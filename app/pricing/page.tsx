import type { Metadata } from 'next'
import { Gift, Heart, Layout, Rocket, ShieldCheck, Sparkles } from 'lucide-react'
import { CtaBand, CheckList, IconTile, JsonLd, MarketingShell, PageHero, Reassurance, Section } from '@/components/content/blocks'
import { FaqAccordion } from '@/components/content/faq-accordion'
import { PriceCalculator } from '@/components/content/price-calculator'
import { OfferCtaLink, OfferStrip, PriceTag } from '@/components/flow/offer-ui'
import { CtaLink } from '@/components/pixel/cta-link'
import { faqData, faqJsonLd } from '@/lib/content'
import { COVERS, SHIPPING, SIZES, money } from '@/lib/flow/catalog'
import { unitPrice } from '@/lib/flow/pricing'
import { cn } from '@/lib/utils'

export const metadata: Metadata = {
  title: 'Photo Book Pricing: Simple, Transparent Prices | Pixovo',
  description: 'See exactly what a Pixovo photo book costs by size, page count and cover. No hidden fees. Design free, pay only to print.',
  alternates: { canonical: '/pricing/' },
}

const TIER_NAMES: Record<string, string> = { '8x8': 'Small Photobook', '10x10': 'Standard Photobook', '12x12': 'Large Photobook' }
const WHY = [
  { icon: Sparkles, title: 'Simple, effortless creation', text: 'Intuitive design tools make creating your photobook a breeze' },
  { icon: ShieldCheck, title: 'Exceptional print & binding quality', text: 'Premium materials and professional-grade printing' },
  { icon: Gift, title: 'Perfect for gifting any occasion', text: 'Thoughtful presents that will be cherished forever' },
  { icon: Layout, title: 'Modern, clean storytelling layouts', text: 'Beautiful designs that let your photos shine' },
  { icon: Rocket, title: 'Fast & secure delivery', text: 'Careful packaging and reliable shipping' },
  { icon: Heart, title: 'Trusted by thousands of customers', text: 'Create lasting memories with a photobook experience people love' },
]

export default function PricingPage() {
  const faq = faqData.groups.find((g) => g.id === 'pricing')!
  const hard = COVERS.find((c) => c.id === 'hardcover')!
  const soft = COVERS.find((c) => c.id === 'softcover')!
  const standard = SHIPPING[0]
  const express = SHIPPING[1]

  return (
    <MarketingShell>
      <JsonLd data={faqJsonLd(faq.items)} />
      <PageHero
        align="center"
        eyebrow="Pricing"
        title={
          <>
            Beautiful photobooks, <em className="text-accent">simple pricing.</em>
          </>
        }
        description="Transparent pricing with premium quality, made to last for generations. The price you see is the price you pay."
        actions={
          <CtaLink href="/photo-book/" variant="accent" size="lg" magnetic>
            Start creating
          </CtaLink>
        }
      >
        <Reassurance className="mt-8 justify-center" />
      </PageHero>

      <Section>
        <OfferStrip className="mb-8" />
        <ul className="grid items-stretch gap-6 md:grid-cols-3">
          {SIZES.map((s) => {
            const popular = s.id === '10x10'
            const from = unitPrice({ size: s.id, pages: 20, cover: 'softcover' })
            return (
              <li
                key={s.id}
                className={cn(
                  'relative flex flex-col rounded-[2rem] border bg-card p-7 shadow-xs transition hover:shadow-float',
                  popular ? 'border-accent ring-1 ring-accent md:-mt-3 md:pb-10 md:pt-10' : 'border-foreground/8',
                )}
              >
                {popular && <span className="absolute -top-3 left-7 rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">Most popular</span>}
                <h3 className="font-serif text-3xl tracking-tight">{TIER_NAMES[s.id]}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{s.label.replace(/"/g, ' in')} starting at</p>
                <div className="mt-4"><PriceTag list={from} size="lg" /></div>
                <CheckList className="mt-6 flex-1 text-sm" items={['20 premium silk pages', 'Softcover or hardcover upgrade', 'High-quality Photobook']} />
                <OfferCtaLink href={`/photo-book/?size=${s.id}`} variant={popular ? 'accent' : 'secondary'} className="mt-8 w-full">
                  Start creating
                </OfferCtaLink>
              </li>
            )
          })}
        </ul>
      </Section>

      <Section tone="soft" eyebrow="Price your exact book" title="See your price before you start">
        <PriceCalculator />
      </Section>

      <Section eyebrow="Add extra pages" title="Add more space for your memories.">
        <ul className="grid gap-5 sm:grid-cols-3">
          {SIZES.map((s) => (
            <li key={s.id} className="rounded-3xl border border-foreground/8 bg-card p-6 text-center shadow-xs">
              <p className="text-sm text-muted-foreground">{s.label.replace(/"/g, ' in').replace('×', 'x')}</p>
              <div className="mt-2 flex justify-center"><PriceTag list={s.step / 20} size="lg" /></div>
              <p className="mt-1 text-sm text-muted-foreground">per extra page</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section tone="soft">
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">Included with every photobook</p>
            <h2 className="mt-3 text-balance font-serif text-3xl tracking-tight md:text-4xl">Every photobook is crafted with care and attention to detail.</h2>
            <CheckList
              className="mt-7"
              items={['Premium matte or glossy print', 'Durable, long-lasting binding', 'Beautifully arranged layouts', 'Elegant protective packaging', 'Fast processing & easy reorders', 'Perfect gift for every occasion']}
            />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">Add-on options</p>
            <h2 className="mt-3 text-balance font-serif text-3xl tracking-tight md:text-4xl">Make it even more special.</h2>
            <ul className="mt-7 space-y-3">
              {[
                { name: 'Hardcover', price: <PriceTag list={hard.adjust === 0 ? -soft.adjust : hard.adjust} size="sm" prefix="+" />, note: 'Premium hardcover protection for your memories' },
                { name: 'Softcover', price: 'Lowest price', note: 'Lightweight and budget-friendly' },
                { name: `${express.label} shipping`, price: `from ${money(express.price)}`, note: `Get your photobook faster (${express.eta})` },
                { name: `${standard.label} shipping`, price: money(standard.price), note: `Free on orders over ${money(standard.freeOver)} (${standard.eta})` },
              ].map((a) => (
                <li key={a.name} className="flex items-center justify-between gap-4 rounded-2xl border border-foreground/8 bg-card p-5">
                  <div>
                    <p className="font-semibold">{a.name}</p>
                    <p className="text-sm text-muted-foreground">{a.note}</p>
                  </div>
                  <span className="shrink-0 font-semibold text-accent">{a.price}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Section>

      <Section eyebrow="Why choose Pixovo?" title="We’re committed to helping you preserve your precious memories with quality and care.">
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {WHY.map(({ icon: Icon, title, text }) => (
            <li key={title} className="rounded-3xl border border-foreground/8 bg-card p-6 shadow-xs">
              <IconTile icon={<Icon className="size-6" />} />
              <h3 className="mt-4 text-lg font-semibold">{title}</h3>
              <p className="mt-1.5 text-muted-foreground">{text}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section tone="soft" eyebrow="Pricing questions" title="Before you decide">
        <div className="max-w-3xl">
          <FaqAccordion groups={[faq]} searchable={false} />
        </div>
      </Section>

      <CtaBand title="Ready to create your photobook?" description="Your memories deserve more than a screen. Turn them into a storybook today." cta="Start creating" />
    </MarketingShell>
  )
}
