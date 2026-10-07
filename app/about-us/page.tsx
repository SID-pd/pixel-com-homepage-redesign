import type { Metadata } from 'next'
import Image from 'next/image'
import { Gift, Heart, Package, Sparkles, Truck } from 'lucide-react'
import { CtaBand, IconTile, MarketingShell, PageHero, Section } from '@/components/content/blocks'

export const metadata: Metadata = {
  title: 'About Pixovo: More Than a Book, It’s Your Story',
  description: 'Pixovo helps people across the USA turn their favorite moments into premium photobooks that feel personal, meaningful and timeless.',
  alternates: { canonical: '/about-us/' },
}

const img = (f: string) => encodeURI(`/images/${f}`)

const PILLARS = [
  { icon: Heart, title: 'Memories First', text: 'Every book we create exists to honor your stories: big moments, small moments, and everything in between.' },
  { icon: Package, title: 'Beautifully Crafted', text: 'From premium paper quality to durable binding, each photobook is thoughtfully produced to last for generations.' },
  { icon: Gift, title: 'Made for Gifting', text: 'Birthdays, holidays, weddings, anniversaries: our photobooks make the most meaningful gifts.' },
  { icon: Sparkles, title: 'Simplified Experience', text: 'No complicated tools. No design skills required. Just upload your photos, review, and order.' },
  { icon: Truck, title: 'Delivered with Care', text: 'Your book is packaged securely and shipped quickly, arriving ready to be gifted or displayed.' },
]

export default function AboutUsPage() {
  return (
    <MarketingShell>
      <PageHero
        eyebrow="About Pixovo"
        title={
          <>
            More than a book. <em className="text-accent">It’s your story.</em>
          </>
        }
        description="At Pixovo, we believe your memories deserve more than a phone screen. They deserve to be held, shared, gifted, and cherished for years to come."
        image={img('about_us_hero_image.webp')}
        imageAlt="A family looking through a Pixovo photobook"
      />

      <Section>
        <div className="grid items-start gap-12 lg:grid-cols-2 lg:gap-20">
          <div className="space-y-12">
            <div>
              <h2 className="font-serif text-3xl tracking-tight md:text-4xl">Our Beginning</h2>
              <div className="mt-5 space-y-4 text-lg leading-relaxed text-muted-foreground">
                <p>What started as a simple idea, “let’s make it effortless for anyone to turn photos into a beautiful storybook”, quickly became our mission.</p>
                <p>Today, Pixovo helps people across the USA preserve their favorite moments in premium photobooks that feel personal, meaningful, and timeless.</p>
              </div>
            </div>
            <div>
              <h2 className="font-serif text-3xl tracking-tight md:text-4xl">Why We Started</h2>
              <div className="mt-5 space-y-4 text-lg leading-relaxed text-muted-foreground">
                <p>Life moves fast. Photos pile up. Moments get lost in camera rolls.</p>
                <p>We wanted to bring back the joy of holding memories in your hands: something real, something lasting, something you can revisit again and again.</p>
                <p>Pixovo was built for people who love capturing life and want a simple, beautiful way to keep their stories alive.</p>
              </div>
            </div>
          </div>
          <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] bg-secondary shadow-float lg:sticky lg:top-28">
            <Image src={img('About us first image.webp')} alt="Pixovo photobooks on a table" fill sizes="(min-width:1024px) 520px, 100vw" className="object-cover" />
          </div>
        </div>
      </Section>

      <Section tone="soft" eyebrow="What we stand for" title="Five promises behind every book">
        <div className="grid items-stretch gap-6 lg:grid-cols-[1fr_1.5fr]">
          <div className="relative min-h-72 overflow-hidden rounded-[2rem] bg-secondary shadow-float">
            <Image src={img('About us page second image.webp')} alt="" fill sizes="(min-width:1024px) 420px, 100vw" className="object-cover" />
          </div>
          <ul className="grid gap-4 sm:grid-cols-2">
            {PILLARS.map(({ icon: Icon, title, text }) => (
              <li key={title} className="rounded-3xl border border-foreground/8 bg-card p-6 shadow-xs">
                <IconTile icon={<Icon className="size-6" />} />
                <h3 className="mt-4 text-lg font-semibold">{title}</h3>
                <p className="mt-1.5 text-pretty text-sm text-muted-foreground">{text}</p>
              </li>
            ))}
            <li className="rounded-3xl bg-ink p-6 text-ink-foreground">
              <h3 className="font-serif text-2xl">Made With Love</h3>
              <p className="mt-2 text-sm text-ink-foreground/75">Every photobook is carefully crafted to preserve your memories in a timeless and meaningful way.</p>
              <p className="mt-3 text-sm font-medium text-accent">Every book is a keepsake, made with pride and care.</p>
            </li>
          </ul>
        </div>
      </Section>

      <Section>
        <div className="grid gap-6 md:grid-cols-2">
          <article className="rounded-[2rem] border border-foreground/8 bg-card p-8 shadow-xs sm:p-10">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">Where we’re going</p>
            <h2 className="mt-3 font-serif text-3xl tracking-tight">Our Mission</h2>
            <p className="mt-4 text-pretty text-lg leading-relaxed text-muted-foreground">
              To help people preserve their memories effortlessly and beautifully through high-quality photobooks that celebrate life’s most meaningful moments.
            </p>
          </article>
          <article className="rounded-[2rem] border border-foreground/8 bg-card p-8 shadow-xs sm:p-10">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">What we’re building</p>
            <h2 className="mt-3 font-serif text-3xl tracking-tight">Our Vision</h2>
            <p className="mt-4 text-pretty text-lg leading-relaxed text-muted-foreground">
              To become America’s most loved destination for printed memories, where every book tells a story worth sharing.
            </p>
          </article>
        </div>
        <div className="relative mt-8 aspect-[21/9] overflow-hidden rounded-[2rem] bg-secondary">
          <Image src={img('about_us_bottom_image.webp')} alt="" fill sizes="(min-width:1024px) 1100px, 100vw" className="object-cover" />
        </div>
      </Section>

      <CtaBand title="Join us in celebrating your story" description="Your memories deserve more. Turn them into something real, something beautiful, something you can hold forever." cta="Create your book" />
    </MarketingShell>
  )
}
