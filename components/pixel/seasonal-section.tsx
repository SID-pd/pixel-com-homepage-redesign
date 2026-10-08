'use client'

import { useRouter } from 'next/navigation'
import { ArrowRight, Gift, Sparkles } from 'lucide-react'
import { formatEnd, type CampaignId } from '@/lib/flow/catalog'
import { flow } from '@/lib/flow/store'
import { useCampaign } from '@/lib/flow/use-campaign'
import { GiftBanner } from './gift-banner'
import { Reveal, RevealItem } from './reveal'
import { CtaLink } from './cta-link'

// Copy per sale. Fall keeps its artwork (GiftBanner); the others share this card so the homepage always matches the calendar in lib/flow/catalog.ts.
const COPY: Record<Exclude<CampaignId, 'fall'>, { kicker: string; title: string; text: string; cta: string }> = {
  holiday: {
    kicker: 'Holiday gifts',
    title: 'Give a gift they’ll open again and again.',
    text: 'A photo book is the most personal present you can give. Make one for family, grandparents or friends, and have it printed and shipped from California.',
    cta: 'Create a holiday gift book',
  },
  newyear: {
    kicker: 'New year, fresh start',
    title: 'Turn last year’s photos into a book.',
    text: 'Your year in review, designed for you automatically. A great way to start January with your best memories in your hands.',
    cta: 'Create your year-in-review',
  },
  spring: {
    kicker: 'Spring refresh',
    title: 'Make room on your camera roll.',
    text: 'Easter, birthdays, new babies: gather the season’s moments into one beautiful book.',
    cta: 'Start a spring photo book',
  },
  summer: {
    kicker: 'Summer memories',
    title: 'Trips, reunions and sunny days, in print.',
    text: 'Turn your vacation photos into a book you’ll actually look at, before the next trip starts.',
    cta: 'Create a summer photo book',
  },
}

/** Homepage seasonal block. It follows the sale calendar, so the banner, deadline and checkout code always agree. */
export function SeasonalSection() {
  const router = useRouter()
  const campaign = useCampaign()

  if (campaign?.id === 'fall') return <GiftBanner campaign={campaign} />

  const copy = campaign ? COPY[campaign.id as Exclude<CampaignId, 'fall'>] : null
  return (
    <section id="gifts" aria-labelledby="gifts-title" className="scroll-mt-24 my-8 px-3 md:px-6">
      <Reveal className="relative mx-auto max-w-6xl overflow-hidden rounded-[2.5rem] bg-secondary px-6 py-14 text-center md:px-16 md:py-20">
        <RevealItem>
          <span className="inline-flex items-center gap-2 rounded-full bg-accent/12 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-accent">
            {campaign ? <Sparkles className="size-3.5" /> : <Gift className="size-3.5" />}
            {campaign ? `${campaign.name} · ${campaign.percent}% off · ends ${formatEnd(campaign.end)}` : 'A gift that lasts'}
          </span>
        </RevealItem>
        <RevealItem>
          <h2 id="gifts-title" className="mx-auto mt-5 max-w-2xl text-balance font-serif text-4xl leading-tight md:text-5xl">
            {copy ? copy.title : 'Give photos a home they’ll be loved in.'}
          </h2>
        </RevealItem>
        <RevealItem>
          <p className="mx-auto mt-4 max-w-xl text-pretty text-muted-foreground">
            {copy
              ? copy.text
              : 'Birthdays, weddings, anniversaries or just because: a printed photo book is a gift people keep. Design is free, and you only pay when you order.'}
          </p>
        </RevealItem>
        <RevealItem className="mt-7 flex flex-wrap items-center justify-center gap-4">
          {campaign ? (
            <button
              type="button"
              onClick={() => {
                flow.setPromo(campaign.code)
                router.push('/photo-book/')
              }}
              className="inline-flex h-14 items-center gap-2 rounded-full bg-accent px-7 text-base font-medium text-accent-foreground transition hover:brightness-105"
            >
              {copy?.cta} <ArrowRight className="size-4" />
            </button>
          ) : (
            <CtaLink href="/photo-book/" variant="accent" size="lg">
              Create a gift photo book
            </CtaLink>
          )}
          {campaign && (
            <span className="rounded-full bg-card px-4 py-2.5 text-xs font-semibold ring-1 ring-foreground/10">
              Code <strong className="font-mono">{campaign.code}</strong> · {campaign.percent}% off, applied for you
            </span>
          )}
        </RevealItem>
      </Reveal>
    </section>
  )
}
