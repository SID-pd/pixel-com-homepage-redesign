'use client'

import type { ReactNode } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Flag, Gift, Heart, Lock, Monitor, Plane, Sparkles, Users, Wand2 } from 'lucide-react'
import { IconTile, Section } from '@/components/content/blocks'
import { FaqAccordion } from '@/components/content/faq-accordion'
import { OfferStrip, PriceTag } from '@/components/flow/offer-ui'
import { faqData } from '@/lib/content'
import { SIZES } from '@/lib/flow/catalog'
import { unitPrice } from '@/lib/flow/pricing'
import { cn } from '@/lib/utils'

const FEATURES = [
  { icon: Wand2, title: 'AI-Automated Design', text: 'Upload your photos and the AI designs the full layout automatically: no templates, no blank pages to fill in yourself.' },
  { icon: Flag, title: 'USA-Based Printing', text: 'Every Pixovo photo book is printed and shipped from the USA on premium silk paper, with softcover or hardcover options available.' },
  { icon: Sparkles, title: 'Design Free, Pay to Print', text: 'Build and review your entire photo book before you spend anything. You only pay when you’re ready to order the printed copy.' },
  { icon: Lock, title: 'Your Photos Stay Private', text: 'Photos you upload are used only to create your order and handled according to Pixovo’s Privacy Policy.', href: '/privacy-policy/' },
]

const MOMENTS = [
  { tag: 'Wedding', title: 'Wedding', copy: 'Capture your special day in a beautiful album', image: '/images/Wedding.png', href: '/blog/wedding-photo-book-ideas/' },
  { tag: 'Baby', title: 'Baby', copy: 'Preserve precious first moments forever', image: '/images/Baby.png', href: '/blog/fall-photo-book-ideas/' },
  { tag: 'Family', title: 'Family', copy: 'Chronicle your family’s beautiful journey', image: '/images/Family.png', href: '/blog/fall-photo-book-ideas/' },
  { tag: 'Travel', title: 'Travel', copy: 'Turn adventures into timeless memories', image: '/images/Travel.png', href: '/blog/travel-photo-book-ideas-how-to-turn-trip-photos-into-a-book/' },
]

const OCCASIONS = [
  { icon: Plane, title: 'Travel Photo Books', text: 'Turn a trip’s worth of photos into a book you’ll actually revisit, organized automatically by the AI.', href: '/blog/travel-photo-book-ideas-how-to-turn-trip-photos-into-a-book/' },
  { icon: Heart, title: 'Wedding Photo Books', text: 'From getting-ready shots to the reception, the AI designs your wedding album in the order the day actually happened.', href: '/blog/wedding-photo-book-ideas/' },
  { icon: Users, title: 'Baby & Family Photo Books', text: 'Turn a year, or a lifetime, of family photos into a keepsake, organized month by month or moment by moment.', href: '/blog/fall-photo-book-ideas/' },
  { icon: Gift, title: 'Gift Photo Books', text: 'A photo book gets opened again and again, long after a mug or a frame gets put in a drawer.', href: '/blog/photo-book-gifts-every-occasion/' },
]

/** Plain eyebrow label, no leading dot (this page's reference has none). */
function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn('text-xs font-semibold uppercase tracking-[0.14em] text-accent', className)}>{children}</p>
}

const variants = {
  primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
  accent: 'bg-accent text-accent-foreground hover:brightness-105',
}
const sizes = {
  md: 'h-11 px-5 text-sm',
  lg: 'h-14 px-7 text-base',
}

/** Same visual language as CtaLink, but a real <button> since it triggers the Wizard instead of navigating. */
function StartButton({
  children,
  onClick,
  variant = 'accent',
  size = 'lg',
  className,
}: {
  children: ReactNode
  onClick: () => void
  variant?: keyof typeof variants
  size?: keyof typeof sizes
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group/cta relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full font-medium tracking-tight transition-[background-color,box-shadow,filter] duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.98]',
        variants[variant],
        sizes[size],
        className,
      )}
    >
      <span className="relative z-10">{children}</span>
      <span className="relative z-10 inline-flex size-4 overflow-hidden" aria-hidden>
        <ArrowRight className="size-4 shrink-0 transition-transform duration-300 ease-out group-hover/cta:translate-x-full" />
        <ArrowRight className="absolute size-4 -translate-x-full transition-transform duration-300 ease-out group-hover/cta:translate-x-0" />
      </span>
    </button>
  )
}

export function PhotoBookIntro({ onStart }: { onStart: () => void }) {
  return (
    <>
      <section className="relative overflow-hidden px-5 pb-12 pt-32 sm:pt-40 md:px-6 md:pb-20">
        <div aria-hidden className="pointer-events-none absolute -right-24 top-10 size-[28rem] rounded-full bg-accent/10 blur-3xl" />
        <div className="relative mx-auto max-w-3xl text-center">
          <Eyebrow>AI photo book maker</Eyebrow>
          <h1 className="mt-4 font-serif text-4xl leading-[1.05] tracking-tight sm:text-5xl md:text-6xl">
            Turn your photos into a photo book
            <br className="hidden sm:block" /> <span className="text-accent">designed by AI</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-pretty text-lg leading-relaxed text-muted-foreground">
            Upload your photos. Watch AI design every page automatically. Order a premium photo book, printed and shipped from the USA.
          </p>
          <div className="mt-8 flex justify-center">
            <StartButton onClick={onStart}>Create your photo book</StartButton>
          </div>
        </div>
      </section>

      <Section>
        <div className="mx-auto max-w-3xl text-center">
          <Eyebrow>Made to be opened, not just stored</Eyebrow>
          <h2 className="mt-3 text-balance font-serif text-3xl tracking-tight md:text-5xl">Your photos deserve more than a camera roll</h2>
          <p className="mt-6 text-pretty text-lg leading-relaxed text-muted-foreground">
            Somewhere on your phone are hundreds of photos that never get looked at again. A Pixovo photo book turns them into something you actually hold, open, and pass around, without the hours it normally takes to design one yourself. Upload your photos, and the AI does the rest: grouping, laying out, and designing every page automatically, so the hardest part of making a photo book becomes the fastest.
          </p>
          <div className="mt-8 flex justify-center">
            <StartButton onClick={onStart} variant="primary">
              Start designing free
            </StartButton>
          </div>
        </div>
      </Section>

      <Section tone="soft">
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map(({ icon: Icon, title, text, href }) => (
            <li key={title} className="rounded-3xl border border-foreground/8 bg-card p-6 shadow-xs">
              <IconTile icon={<Icon className="size-6" />} />
              <h3 className="mt-5 text-lg font-semibold">{title}</h3>
              <p className="mt-1.5 text-pretty text-sm text-muted-foreground">
                {text}
                {href && (
                  <>
                    {' '}
                    <Link href={href} className="font-medium text-accent underline-offset-4 hover:underline">
                      Read it
                    </Link>
                  </>
                )}
              </p>
            </li>
          ))}
        </ul>
      </Section>

      <Section>
        <div className="mx-auto mb-10 max-w-2xl text-center md:mb-14">
          <Eyebrow>Simple, transparent pricing</Eyebrow>
          <h2 className="mt-3 text-balance font-serif text-3xl leading-tight tracking-tight md:text-4xl">One price, no surprises at checkout</h2>
          <p className="mt-4 text-pretty text-lg text-muted-foreground">The price you see is the price you pay, with no hidden fees at checkout.</p>
        </div>
        <OfferStrip className="mx-auto mb-8 max-w-2xl" />
        <ul className="grid gap-5 md:grid-cols-3">
          {SIZES.map((s) => {
            const popular = s.id === '10x10'
            return (
              <li key={s.id} className={cn('relative rounded-[2rem] border bg-card p-7 text-center shadow-xs', popular ? 'border-accent ring-1 ring-accent' : 'border-foreground/8')}>
                {popular && <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">Most popular</span>}
                <h3 className="font-serif text-2xl">{s.id === '8x8' ? 'Small' : s.id === '10x10' ? 'Standard' : 'Large'} Photobook</h3>
                <p className="mt-1 text-sm text-muted-foreground">{s.label.replace(/"/g, ' in')} starting at</p>
                <div className="mt-3 flex justify-center">
                  <PriceTag list={unitPrice({ size: s.id, pages: 20, cover: 'softcover' })} size="lg" />
                </div>
              </li>
            )
          })}
        </ul>
        <p className="mt-6 text-center">
          <button type="button" onClick={onStart} className="inline-flex items-center gap-1.5 font-medium text-accent underline-offset-4 hover:underline">
            See full pricing <ArrowRight className="size-4" />
          </button>
        </p>
      </Section>

      <Section tone="soft">
        <div className="mx-auto mb-10 max-w-2xl text-center md:mb-14">
          <Eyebrow>Perfect for every occasion</Eyebrow>
          <h2 className="mt-3 text-balance font-serif text-3xl leading-tight tracking-tight md:text-4xl">Perfect for every life moment</h2>
          <p className="mt-4 text-pretty text-lg text-muted-foreground">Whatever the occasion, your photos become a book that actually gets opened again.</p>
        </div>
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {MOMENTS.map((m) => (
            <li key={m.title} className="group relative aspect-[4/5] overflow-hidden rounded-[2rem] shadow-xs transition hover:-translate-y-1 hover:shadow-float">
              <Image src={m.image} alt="" fill sizes="(min-width:1024px) 280px, 50vw" className="object-cover transition-transform duration-700 group-hover:scale-[1.04]" />
              <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent" />
              <span className="absolute left-4 top-4 rounded-full bg-accent/90 px-3 py-1 text-xs font-semibold text-accent-foreground">{m.tag}</span>
              <div className="absolute inset-x-0 bottom-0 p-5">
                <p className="text-pretty text-base font-semibold text-white">{m.copy}</p>
                <Link href={m.href} className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-white/90 hover:text-white">
                  Explore <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </div>
            </li>
          ))}
        </ul>
      </Section>

      <Section>
        <div className="mx-auto mb-10 max-w-2xl text-center md:mb-14">
          <Eyebrow>A book for every moment</Eyebrow>
          <h2 className="mt-3 text-balance font-serif text-3xl leading-tight tracking-tight md:text-4xl">Built for the moments you actually want to keep</h2>
          <p className="mt-4 text-pretty text-lg text-muted-foreground">Whether it’s a trip, a wedding, a first year, or a gift for someone else, Pixovo’s AI adapts to what the photos are actually of, not a generic template stretched across every occasion.</p>
        </div>
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {OCCASIONS.map(({ icon: Icon, title, text, href }) => (
            <li key={title}>
              <IconTile icon={<Icon className="size-6" />} />
              <h3 className="mt-5 text-lg font-semibold">{title}</h3>
              <p className="mt-1.5 text-pretty text-sm text-muted-foreground">{text}</p>
              <Link href={href} className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-accent hover:underline">
                Explore {title} <ArrowRight className="size-3.5" />
              </Link>
            </li>
          ))}
        </ul>
      </Section>

      <Section tone="soft">
        <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-16">
          <div className="rounded-[2rem] bg-ink p-8 text-ink-foreground sm:p-12">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">Proudly made in the USA</p>
            <h2 className="mt-3 text-balance font-serif text-3xl leading-tight md:text-4xl">Printed, bound, and shipped from the USA</h2>
            <p className="mt-4 text-ink-foreground/75">
              Every Pixovo photo book is produced and shipped from the USA, printed on premium silk paper with softcover or hardcover options, built to be handled, shared, and opened again for years to come.
            </p>
            <Link href="/about-us/" className="mt-6 inline-flex items-center gap-1.5 font-medium text-accent underline-offset-4 hover:underline">
              Learn more <ArrowRight className="size-4" />
            </Link>
          </div>
          <div>
            <IconTile icon={<Monitor className="size-6" />} />
            <p className="mt-5 text-xs font-semibold uppercase tracking-[0.14em] text-accent">No app to download</p>
            <h2 className="mt-3 text-balance font-serif text-3xl leading-tight tracking-tight md:text-4xl">Works right in your browser</h2>
            <p className="mt-4 text-pretty text-lg text-muted-foreground">
              Pixovo runs entirely in your browser, so you can design a photo book from your phone or computer without installing anything. Upload your photos, and the AI takes it from there.
            </p>
            <div className="mt-6">
              <StartButton onClick={onStart}>Start your photo book</StartButton>
            </div>
          </div>
        </div>
      </Section>

      <Section tone="soft">
        <div className="mx-auto mb-10 max-w-2xl text-center md:mb-14">
          <Eyebrow>Photo book FAQs</Eyebrow>
          <h2 className="mt-3 text-balance font-serif text-3xl leading-tight tracking-tight md:text-4xl">Quick answers before you start</h2>
        </div>
        <div className="mx-auto max-w-3xl">
          <FaqAccordion searchable={false} groups={[{ id: 'photobook-intro-faq', title: 'Questions', items: faqData.photobookFaq }]} />
        </div>
      </Section>

      <section className="px-5 pb-16 pt-6 md:px-6 md:pb-24">
        <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[2.5rem] bg-ink px-6 py-14 text-center text-ink-foreground md:px-16 md:py-20">
          <div aria-hidden className="pointer-events-none absolute -top-24 left-1/2 size-[26rem] -translate-x-1/2 rounded-full bg-accent/25 blur-3xl" />
          <div className="relative">
            <h2 className="mx-auto max-w-2xl text-balance font-serif text-3xl leading-tight md:text-5xl">Ready to start?</h2>
            <p className="mx-auto mt-4 max-w-xl text-pretty text-lg text-ink-foreground/75">Upload your photos and see your AI-designed layout in minutes.</p>
            <div className="mt-8 flex justify-center">
              <StartButton onClick={onStart}>Create your photo book</StartButton>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
