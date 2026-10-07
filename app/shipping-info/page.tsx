import type { Metadata } from 'next'
import Link from 'next/link'
import { AlertTriangle, Mail, MapPin, PackageCheck, Truck } from 'lucide-react'
import { CheckList, CtaBand, MarketingShell, PageHero, Section } from '@/components/content/blocks'
import { SHIPPING, money } from '@/lib/flow/catalog'

export const metadata: Metadata = {
  title: 'Shipping Information: Delivery Times, Packaging & Tracking | Pixovo',
  description: 'Most Pixovo photobooks arrive in 5–10 working days (3–6 with express). See packaging, tracking and delivery coverage.',
  alternates: { canonical: '/shipping-info/' },
}

const TRACK = ['Dispatched', 'In Transit', 'Out for Delivery', 'Delivered']

export default function ShippingInfoPage() {
  const [standard, express] = SHIPPING
  return (
    <MarketingShell>
      <PageHero
        eyebrow="Shipping information"
        title={
          <>
            Fast, safe &amp; reliable delivery for <em className="text-accent">your photobooks</em>
          </>
        }
        description="Get your photobook delivered safely and on time. Here’s everything you need to know about shipping, delivery timelines, packaging, and tracking."
      />

      <Section eyebrow="1" title="Delivery timelines">
        <div className="grid gap-5 md:grid-cols-2">
          <article className="rounded-[2rem] border border-foreground/8 bg-card p-7 shadow-xs">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-3xl">Standard Delivery</h3>
              <span className="rounded-full bg-secondary px-3 py-1 text-sm font-semibold">{money(standard.price)}</span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">Free on orders over {money(standard.freeOver)}</p>
            <CheckList
              className="mt-5"
              items={['Most orders arrive within 5–10 working days depending on your location.', 'Includes printing, quality checks, binding, and packaging time.']}
            />
          </article>
          <article className="rounded-[2rem] border border-accent bg-accent/[0.04] p-7 shadow-xs ring-1 ring-accent">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-3xl">Express Delivery</h3>
              <span className="rounded-full bg-accent px-3 py-1 text-sm font-semibold text-accent-foreground">from {money(express.price)}</span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">Choose it at checkout</p>
            <CheckList
              className="mt-5"
              items={['Available at checkout for faster processing and priority shipment.', 'Expected delivery within 3–6 working days.']}
            />
          </article>
        </div>
        <p className="mt-5 text-sm text-muted-foreground">Delivery timelines may vary slightly during festivals, peak seasons, or promotional periods.</p>
      </Section>

      <Section tone="soft">
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">2</p>
            <h2 className="mt-3 font-serif text-3xl tracking-tight md:text-4xl">Packaging &amp; protection</h2>
            <p className="mt-4 text-lg text-muted-foreground">Your photobook is packaged with:</p>
            <CheckList className="mt-5" items={['Thick protective outer box', 'Water-resistant wrapping', 'Corner protection for damage-free delivery', 'Tamper-proof seal']} />
            <p className="mt-6 flex items-start gap-2.5 rounded-2xl bg-card p-4 text-sm text-muted-foreground">
              <PackageCheck className="mt-0.5 size-5 shrink-0 text-accent" /> Designed to ensure your memories reach you safe, crisp, and perfect.
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">3</p>
            <h2 className="mt-3 font-serif text-3xl tracking-tight md:text-4xl">Order tracking</h2>
            <p className="mt-4 text-lg text-muted-foreground">Once your photobook is dispatched you receive an email and can monitor your shipment status anytime.</p>
            <ol className="mt-6 grid grid-cols-4 gap-2" aria-label="Tracking stages">
              {TRACK.map((t, i) => (
                <li key={t} className="text-center">
                  <span className="mx-auto grid size-11 place-items-center rounded-full bg-accent font-semibold text-accent-foreground">{i + 1}</span>
                  <span className="mt-2 block text-xs font-medium sm:text-sm">{t}</span>
                </li>
              ))}
            </ol>
            <p className="mt-6 text-sm text-muted-foreground">
              If you face issues with tracking, our support team is always here to assist.{' '}
              <Link href="/track-order/" className="font-medium text-accent underline-offset-4 hover:underline">
                Track my order
              </Link>
            </p>
          </div>
        </div>
      </Section>

      <Section>
        <div className="grid gap-5 md:grid-cols-2">
          <article className="rounded-[2rem] border border-foreground/8 bg-card p-7 shadow-xs">
            <MapPin className="size-7 text-accent" />
            <p className="mt-4 text-xs font-semibold uppercase tracking-[0.14em] text-accent">4</p>
            <h3 className="font-serif text-3xl">Delivery coverage</h3>
            <p className="mt-3 text-muted-foreground">We currently ship across:</p>
            <CheckList className="mt-4" items={['All major USA cities & towns', 'Selected remote locations depending on courier availability']} />
            <p className="mt-4 text-sm text-muted-foreground">International shipping coming soon!</p>
          </article>
          <article className="rounded-[2rem] border border-foreground/8 bg-card p-7 shadow-xs">
            <AlertTriangle className="size-7 text-accent" />
            <p className="mt-4 text-xs font-semibold uppercase tracking-[0.14em] text-accent">5</p>
            <h3 className="font-serif text-3xl">Shipping delays</h3>
            <p className="mt-3 text-muted-foreground">Delays may occur due to:</p>
            <ul className="mt-4 space-y-2 text-muted-foreground">
              {['Courier partner constraints', 'Extreme weather', 'Incorrect address', 'High-volume seasons (Christmas, New Year)'].map((d) => (
                <li key={d} className="flex items-start gap-3">
                  <span className="mt-2.5 size-1.5 shrink-0 rounded-full bg-accent" /> {d}
                </li>
              ))}
            </ul>
            <p className="mt-4 text-sm text-muted-foreground">If your order is delayed beyond the expected window, please contact us and we’ll help right away.</p>
          </article>
        </div>

        <div className="mt-8 flex flex-col items-start gap-4 rounded-[2rem] bg-secondary p-7 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <span className="grid size-12 place-items-center rounded-2xl bg-card text-accent">
              <Truck className="size-6" />
            </span>
            <div>
              <h3 className="font-semibold">Need help with shipping?</h3>
              <p className="text-sm text-muted-foreground">Our team is here to support you.</p>
            </div>
          </div>
          <a href="mailto:support@pixovo.com" className="inline-flex h-11 items-center gap-2 rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground transition hover:bg-primary/90">
            <Mail className="size-4" /> support@pixovo.com
          </a>
        </div>
      </Section>

      <CtaBand title="Ready when you are" description="Design is free. Pick express at checkout if you’re short on time." />
    </MarketingShell>
  )
}
