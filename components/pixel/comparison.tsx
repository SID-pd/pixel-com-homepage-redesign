'use client'

import { Check, X, ShieldCheck, RefreshCw, DollarSign, Clock } from 'lucide-react'
import { Reveal, RevealItem } from './reveal'
import { SectionHeading } from './section-heading'
import { CtaLink } from './cta-link'

const comparisonPoints = [
  {
    feature: 'Manufacturing & Fulfillment',
    traditional: 'Overseas factories (2–3 week shipping)',
    pixovo: '100% USA California factory (3–5 day shipping)',
  },
  {
    feature: 'Starting Price',
    traditional: 'High middleman markups ($50–$60)',
    pixovo: 'Direct factory pricing $39.99 ($19.99 with 50% OFF)',
  },
  {
    feature: 'Design Process',
    traditional: '10+ hours manual drag-and-drop templates',
    pixovo: '60-second smart AI layout generator',
  },
  {
    feature: 'Quality Assurance',
    traditional: 'Basic automated printing with high defect rates',
    pixovo: '12-point manual inspection & archival paper',
  },
  {
    feature: 'Satisfaction Guarantee',
    traditional: 'Restocking fees & strict return policies',
    pixovo: '100% Free reprint or 30-day full refund',
  },
]

const guarantees = [
  {
    icon: RefreshCw,
    title: 'Not Happy? We Reprint Free',
    text: 'If there is any print imperfection, binding flaw, or damage during shipping, we instantly send a replacement at $0 cost.',
  },
  {
    icon: DollarSign,
    title: '30-Day Money Back Promise',
    text: 'If you aren’t thrilled with your custom photo book, return it within 30 days for a complete 100% refund.',
  },
  {
    icon: Clock,
    title: 'Late Delivery? $10 Credit',
    text: 'We respect your timelines. If your package arrives after our estimated delivery window, we credit $10 back to your account.',
  },
  {
    icon: ShieldCheck,
    title: '100% On-Device Privacy',
    text: 'Your uploaded photos are processed securely with 256-bit SSL encryption and are never sold or shared with third parties.',
  },
]

export function ComparisonSection() {
  return (
    <section aria-labelledby="comparison-title" className="px-5 py-10 md:px-6 md:py-16">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="Why Pixovo Is Different"
          title={
            <span id="comparison-title">
              Traditional Photo Books vs. <em className="text-accent">The Pixovo Standard</em>
            </span>
          }
          description="See why over 50,000 memory makers switched from legacy photo book services."
        />

        {/* Comparison Table / Card View */}
        <Reveal className="mt-12 overflow-hidden rounded-3xl bg-background border border-foreground/10 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-foreground/10 bg-neutral-900 text-white p-5 font-semibold text-xs md:text-sm">
            <div>Feature</div>
            <div className="text-neutral-400">Traditional Competitors</div>
            <div className="text-amber-400 font-bold flex items-center gap-1.5">
              <span>★</span> Pixovo Factory Direct
            </div>
          </div>

          <div className="divide-y divide-foreground/[0.06]">
            {comparisonPoints.map((row) => (
              <div key={row.feature} className="grid grid-cols-1 md:grid-cols-3 gap-3 p-5 text-xs md:text-sm transition-colors hover:bg-foreground/[0.02]">
                <div className="font-serif font-medium text-foreground">{row.feature}</div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <span className="grid size-5 place-items-center rounded-full bg-red-500/10 text-red-500 shrink-0">
                    <X className="size-3" />
                  </span>
                  {row.traditional}
                </div>
                <div className="flex items-center gap-2 font-semibold text-foreground">
                  <span className="grid size-5 place-items-center rounded-full bg-emerald-500/10 text-emerald-500 shrink-0">
                    <Check className="size-3" />
                  </span>
                  {row.pixovo}
                </div>
              </div>
            ))}
          </div>
        </Reveal>

        {/* Guarantees Box */}
        <div className="mt-16">
          <h3 className="text-center font-serif text-2xl font-medium md:text-3xl text-foreground">
            Our No-Risk Customer Guarantee
          </h3>
          <p className="mt-2 text-center text-xs md:text-sm text-muted-foreground">
            Zero risk. Complete peace of mind on every order.
          </p>

          <Reveal staggerChildren={0.06} className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {guarantees.map(({ icon: Icon, title, text }) => (
              <RevealItem
                key={title}
                className="flex flex-row items-start gap-3.5 rounded-2xl bg-card p-4 md:p-5 border border-foreground/[0.06] shadow-sm transition-all duration-300 hover:shadow-md"
              >
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-accent/10 text-accent mt-0.5">
                  <Icon className="size-4.5" />
                </span>
                <div className="flex flex-col min-w-0">
                  <h4 className="font-sans font-semibold text-base text-foreground leading-snug">{title}</h4>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{text}</p>
                </div>
              </RevealItem>
            ))}
          </Reveal>
        </div>

        {/* Bottom CTA Button */}
        <div className="mt-10 flex justify-center">
          <CtaLink href="/photo-book/" size="lg" showArrow={false}>
            Start Creating Your Photo Book
          </CtaLink>
        </div>
      </div>
    </section>
  )
}
