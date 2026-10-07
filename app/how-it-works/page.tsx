import type { Metadata } from 'next'
import Image from 'next/image'
import { Gift, Heart, Package, Rocket, ShieldCheck, Sparkles } from 'lucide-react'
import { CtaBand, CheckList, IconTile, JsonLd, MarketingShell, PageHero, Reassurance, Section } from '@/components/content/blocks'
import { FaqAccordion } from '@/components/content/faq-accordion'
import { Testimonials } from '@/components/content/testimonials'
import { CtaLink } from '@/components/pixel/cta-link'
import { faqData, faqJsonLd } from '@/lib/content'

export const metadata: Metadata = {
  title: 'How Pixovo Works: Create a Photo Book in 4 Steps',
  description: 'Choose a size, upload your photos, let AI design the pages, then get your photobook delivered. Design free, pay only to print.',
  alternates: { canonical: '/how-it-works/' },
}

const img = (f: string) => encodeURI(`/images/${f}`)

// Titles and sentences are the originals; step 1 now describes what the real flow does (size, pages, cover)
// and the original "drag and drop" sentence moved to step 2 where it belongs.
const STEPS = [
  { title: 'Select Size & Pages', text: 'Pick your size, page count and cover. The price updates live as you choose, so there are no surprises later.', image: 'How it work five image.webp' },
  { title: 'Upload Your Photos', text: 'Simply drag and drop your favorite photos from any device or social media platform.', image: 'how it work four image.webp' },
  { title: 'Customize With AI', text: 'Our smart AI analyzes your photos and automatically organizes them into beautiful layouts. Fine-tune colors, add text, or let our AI suggest the perfect theme for your story.', image: 'customize_with_ai.webp' },
  { title: 'Print & Get Delivered', text: 'Get your photobook delivered to your door or share your memories with loved ones.', image: 'how it work page six image.webp' },
]

const BENEFITS = [
  { icon: Sparkles, title: 'Simple from start to finish', text: 'No designing needed. Upload your photos and we’ll handle the rest.' },
  { icon: Package, title: 'Premium print quality', text: 'Vibrant colors, smooth pages, and durable binding that stands the test of time.' },
  { icon: Rocket, title: 'Fast & reliable delivery', text: 'Printed, packed, and shipped with care directly to your doorstep.' },
  { icon: Gift, title: 'Perfect for gifting', text: 'Birthdays, anniversaries, weddings, baby moments, and more. Makes every occasion special.' },
  { icon: Heart, title: 'Preserve every memory', text: 'Turn your favorite moments into timeless keepsakes you’ll cherish forever.' },
  { icon: ShieldCheck, title: '100% satisfaction guaranteed', text: 'Love your book or we’ll make it right, no questions asked.' },
]

export default function HowItWorksPage() {
  const faq = faqData.groups.find((g) => g.id === 'how-it-works')!
  return (
    <MarketingShell>
      <JsonLd data={faqJsonLd(faq.items)} />
      <PageHero
        eyebrow="How it works"
        title={
          <>
            Create your photobook in <em className="text-accent">4 easy steps</em>
          </>
        }
        description="Turn your favorite photos into a beautifully printed storybook: simple, fast, and made to last."
        image={img('How it work first image.webp')}
        imageAlt="A Pixovo photo book being opened"
        actions={
          <>
            <CtaLink href="/photo-book/" variant="accent" size="lg" magnetic>
              Start creating
            </CtaLink>
            <span className="text-sm text-muted-foreground">Takes about 5 minutes. No account needed.</span>
          </>
        }
      >
        <Reassurance className="mt-8" />
      </PageHero>

      <Section eyebrow="How it works" title="Four simple steps to create something beautiful.">
        <ol className="grid gap-6 md:grid-cols-2">
          {STEPS.map((s, i) => (
            <li key={s.title} className="group overflow-hidden rounded-[2rem] border border-foreground/8 bg-card shadow-xs transition hover:shadow-float">
              <div className="relative aspect-[16/10] bg-secondary">
                <Image src={img(s.image)} alt="" fill sizes="(min-width:768px) 520px, 100vw" className="object-cover transition-transform duration-700 group-hover:scale-[1.03]" />
                <span className="absolute left-5 top-5 grid size-11 place-items-center rounded-full bg-background font-serif text-xl shadow-float">{i + 1}</span>
              </div>
              <div className="p-6 sm:p-8">
                <h3 className="font-serif text-3xl tracking-tight">{s.title}</h3>
                <p className="mt-2 text-pretty text-muted-foreground">{s.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </Section>

      <Section tone="soft" eyebrow="Why Pixovo?" title="We make creating photobooks effortless, beautiful, and memorable.">
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {BENEFITS.map(({ icon: Icon, title, text }) => (
            <li key={title} className="rounded-3xl border border-foreground/8 bg-card p-6 shadow-xs">
              <IconTile icon={<Icon className="size-6" />} />
              <h3 className="mt-5 text-lg font-semibold">{title}</h3>
              <p className="mt-1.5 text-pretty text-muted-foreground">{text}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section>
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <div className="relative aspect-[4/3] overflow-hidden rounded-[2rem] bg-secondary shadow-float">
            <Image src={img('How it work pahe thitd image.webp')} alt="Close-up of a printed Pixovo photobook" fill sizes="(min-width:1024px) 520px, 100vw" className="object-cover" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">What you get</p>
            <h2 className="mt-3 text-balance font-serif text-3xl leading-tight tracking-tight md:text-4xl">
              Every photobook is crafted with premium materials and attention to detail.
            </h2>
            <CheckList
              className="mt-7"
              items={['Premium matte or glossy print', 'Durable, long-lasting binding', 'Beautifully arranged layouts', 'Elegant protective packaging', 'Fast processing & easy reorders']}
            />
          </div>
        </div>
      </Section>

      <Section tone="soft" eyebrow="Loved by memory keepers everywhere" title="Join thousands of happy customers who trust Pixovo with their precious memories.">
        <Testimonials />
      </Section>

      <Section eyebrow="Questions before you start?" title="The quick answers">
        <div className="max-w-3xl">
          <FaqAccordion groups={[faq]} searchable={false} />
        </div>
      </Section>

      <CtaBand title="Ready to create your photobook?" description="Make your memories last a lifetime, beautifully printed and made just for you." cta="Start creating" />
    </MarketingShell>
  )
}
