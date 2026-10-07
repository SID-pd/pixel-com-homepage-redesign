import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Flag, Lock, Monitor, Sparkles, Wand2 } from 'lucide-react'
import { CtaBand, IconTile, JsonLd, MarketingShell, PageHero, Reassurance, Section } from '@/components/content/blocks'
import { FaqAccordion } from '@/components/content/faq-accordion'
import { CtaLink } from '@/components/pixel/cta-link'
import { faqData, faqJsonLd } from '@/lib/content'
import { SIZES, money } from '@/lib/flow/catalog'
import { unitPrice } from '@/lib/flow/pricing'
import { cn } from '@/lib/utils'

export const metadata: Metadata = {
  title: 'AI Photo Book Maker: Turn Your Photos Into a Photo Book | Pixovo',
  description: 'Upload your photos and let AI design every page. Order a premium photo book, printed and shipped from the USA. Design free, pay only to print.',
  alternates: { canonical: '/photobook/' },
}

const FEATURES = [
  { icon: Wand2, title: 'AI-Automated Design', text: 'Upload your photos and the AI designs the full layout automatically: no templates, no blank pages to fill in yourself.' },
  { icon: Flag, title: 'USA-Based Printing', text: 'Every Pixovo photo book is printed and shipped from the USA on premium silk paper, with softcover or hardcover options available.' },
  { icon: Sparkles, title: 'Design Free, Pay to Print', text: 'Build and review your entire photo book before you spend anything. You only pay when you’re ready to order the printed copy.' },
  { icon: Lock, title: 'Your Photos Stay Private', text: 'Photos you upload are used only to create your order and handled according to Pixovo’s Privacy Policy.', href: '/privacy-policy/' },
]

// The original links pointed at landing pages that were never built; they now go to the matching articles.
const OCCASIONS = [
  { title: 'Travel Photo Books', text: 'Turn a trip’s worth of photos into a book you’ll actually revisit, organized automatically by the AI.', image: '/images/Travel.png', href: '/blog/travel-photo-book-ideas-how-to-turn-trip-photos-into-a-book/' },
  { title: 'Wedding Photo Books', text: 'From getting-ready shots to the reception, the AI designs your wedding album in the order the day actually happened.', image: '/images/Wedding.png', href: '/blog/wedding-photo-book-ideas/' },
  { title: 'Baby & Family Photo Books', text: 'Turn a year, or a lifetime, of family photos into a keepsake, organized month by month or moment by moment.', image: '/images/Family.png', href: '/blog/fall-photo-book-ideas/' },
  { title: 'Gift Photo Books', text: 'A photo book gets opened again and again, long after a mug or a frame gets put in a drawer.', image: '/images/Baby.png', href: '/blog/photo-book-gifts-every-occasion/' },
]

export default function PhotobookLandingPage() {
  return (
    <MarketingShell>
      <JsonLd data={faqJsonLd(faqData.photobookFaq)} />
      <PageHero
        eyebrow="AI photo book maker"
        title={
          <>
            Turn your photos into a photo book <em className="text-accent">designed by AI</em>
          </>
        }
        description="Upload your photos. Watch AI design every page automatically. Order a premium photo book, printed and shipped from the USA."
        image="/images/hero-book.png"
        imageAlt="A Pixovo photo book"
        actions={
          <CtaLink href="/photo-book/" variant="accent" size="lg" magnetic>
            Create your photo book
          </CtaLink>
        }
      >
        <Reassurance className="mt-8" />
      </PageHero>

      <Section>
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">Made to be opened, not just stored</p>
          <h2 className="mt-3 text-balance font-serif text-3xl tracking-tight md:text-5xl">Your photos deserve more than a camera roll</h2>
          <p className="mt-6 text-pretty text-lg leading-relaxed text-muted-foreground">
            Somewhere on your phone are hundreds of photos that never get looked at again. A Pixovo photo book turns them into something you actually hold, open, and pass around, without the hours it normally takes to design one yourself. Upload your photos, and the AI does the rest: grouping, laying out, and designing every page automatically, so the hardest part of making a photo book becomes the fastest.
          </p>
          <div className="mt-8 flex justify-center">
            <CtaLink href="/photo-book/" variant="primary" size="lg">
              Start designing free
            </CtaLink>
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

      <Section eyebrow="Simple, transparent pricing" title="One price, no surprises at checkout" description="The price you see is the price you pay, with no hidden fees at checkout.">
        <ul className="grid gap-5 md:grid-cols-3">
          {SIZES.map((s) => {
            const popular = s.id === '10x10'
            return (
              <li key={s.id} className={cn('relative rounded-[2rem] border bg-card p-7 text-center shadow-xs', popular ? 'border-accent ring-1 ring-accent' : 'border-foreground/8')}>
                {popular && <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">Most popular</span>}
                <h3 className="font-serif text-2xl">{s.id === '8x8' ? 'Small' : s.id === '10x10' ? 'Standard' : 'Large'} Photobook</h3>
                <p className="mt-1 text-sm text-muted-foreground">{s.label.replace(/"/g, ' in')} starting at</p>
                <p className="mt-3 font-serif text-4xl">{money(unitPrice({ size: s.id, pages: 20, cover: 'softcover' }))}</p>
              </li>
            )
          })}
        </ul>
        <p className="mt-6 text-center">
          <Link href="/pricing/" className="inline-flex items-center gap-1.5 font-medium text-accent underline-offset-4 hover:underline">
            See full pricing <ArrowRight className="size-4" />
          </Link>
        </p>
      </Section>

      <Section tone="soft" eyebrow="A book for every moment" title="Built for the moments you actually want to keep" description="Whether it’s a trip, a wedding, a first year, or a gift for someone else, Pixovo’s AI adapts to what the photos are actually of, not a generic template stretched across every occasion.">
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {OCCASIONS.map((o) => (
            <li key={o.title} className="group relative overflow-hidden rounded-[2rem] border border-foreground/8 bg-card shadow-xs transition hover:-translate-y-1 hover:shadow-float">
              <div className="relative aspect-[4/3] bg-secondary">
                <Image src={o.image} alt="" fill sizes="(min-width:1024px) 280px, 50vw" className="object-cover transition-transform duration-700 group-hover:scale-[1.04]" />
              </div>
              <div className="p-5">
                <h3 className="font-serif text-xl">
                  <Link href={o.href} className="after:absolute after:inset-0">
                    {o.title}
                  </Link>
                </h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{o.text}</p>
                <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-accent">
                  Explore <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                </span>
              </div>
            </li>
          ))}
        </ul>
      </Section>

      <Section>
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
              <CtaLink href="/photo-book/" variant="accent">
                Start your photo book
              </CtaLink>
            </div>
          </div>
        </div>
      </Section>

      <Section tone="soft" eyebrow="Photo book FAQs" title="Quick answers before you start">
        <div className="max-w-3xl">
          <FaqAccordion searchable={false} groups={[{ id: 'photobook-faq', title: 'Questions', items: faqData.photobookFaq }]} />
        </div>
      </Section>

      <CtaBand title="Ready to start?" description="Upload your photos and see your AI-designed layout in minutes." cta="Create your photo book" />
    </MarketingShell>
  )
}
