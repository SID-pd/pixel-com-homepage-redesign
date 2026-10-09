import Image from 'next/image'
import type { ReactNode } from 'react'
import { Check, ShieldCheck, Truck, Sparkles } from 'lucide-react'
import { SiteNav } from '@/components/pixel/site-nav'
import { SiteFooter } from '@/components/pixel/final-cta'
import { CtaLink } from '@/components/pixel/cta-link'
import { cn } from '@/lib/utils'

/** SiteNav + footer around a marketing/content page. The nav is fixed, so content starts below it. */
export function MarketingShell({ children }: { children: ReactNode }) {
  return (
    <>
      <SiteNav />
      <main id="main" className="alt-sections bg-background">
        {children}
      </main>
      <SiteFooter />
    </>
  )
}

export function JsonLd({ data }: { data: object | object[] }) {
  return (
    <script
      type="application/ld+json"
      // Content is first-party (extracted from our own CMS), so injecting it verbatim is safe.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }}
    />
  )
}

export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p className={cn('inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-accent', className)}>
      <span aria-hidden className="size-1.5 rounded-full bg-accent" />
      {children}
    </p>
  )
}

export function PageHero({
  eyebrow,
  title,
  description,
  actions,
  image,
  imageAlt = '',
  align = 'left',
  children,
}: {
  eyebrow?: string
  title: ReactNode
  description?: ReactNode
  actions?: ReactNode
  image?: string
  imageAlt?: string
  align?: 'left' | 'center'
  children?: ReactNode
}) {
  const center = align === 'center'
  return (
    <section className="bg-hero-bubbles relative overflow-hidden px-5 pb-12 pt-32 sm:pt-40 md:px-6 md:pb-20">
      <div
        className={cn(
          'relative mx-auto grid max-w-6xl items-center gap-10',
          image && !center ? 'lg:grid-cols-[1.1fr_1fr] lg:gap-16' : '',
        )}
      >
        <div className={cn(center && 'mx-auto max-w-3xl text-center')}>
          {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
          <h1 className="mt-4 text-balance font-serif text-4xl leading-[1.05] tracking-tight sm:text-5xl md:text-6xl">{title}</h1>
          {description && (
            <p className={cn('mt-5 max-w-xl text-pretty text-lg leading-relaxed text-muted-foreground', center && 'mx-auto')}>{description}</p>
          )}
          {actions && <div className={cn('mt-8 flex flex-wrap items-center gap-3', center && 'justify-center')}>{actions}</div>}
          {children}
        </div>
        {image && (
          <div className="relative aspect-[4/3] overflow-hidden rounded-[2rem] bg-secondary shadow-float ring-1 ring-foreground/5">
            <Image src={image} alt={imageAlt} fill priority sizes="(min-width:1024px) 520px, 100vw" className="object-cover" />
          </div>
        )}
      </div>
    </section>
  )
}

export function Section({
  eyebrow,
  title,
  description,
  children,
  className,
  tone = 'plain',
  id,
}: {
  eyebrow?: string
  title?: ReactNode
  description?: ReactNode
  children: ReactNode
  className?: string
  tone?: 'plain' | 'soft'
  id?: string
}) {
  return (
    <section id={id} className={cn('scroll-mt-28 px-5 py-14 md:px-6 md:py-20', tone === 'soft' && 'bg-secondary/50', className)}>
      <div className="mx-auto max-w-6xl">
        {(eyebrow || title || description) && (
          <header className="mb-10 max-w-2xl md:mb-14">
            {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
            {title && <h2 className="mt-3 text-balance font-serif text-3xl leading-tight tracking-tight md:text-4xl">{title}</h2>}
            {description && <p className="mt-4 text-pretty text-lg text-muted-foreground">{description}</p>}
          </header>
        )}
        {children}
      </div>
    </section>
  )
}

/** The three promises that remove purchase anxiety; repeated beside every primary CTA. */
export function Reassurance({ className, tone = 'light' }: { className?: string; tone?: 'light' | 'dark' }) {
  const items = [
    { icon: Sparkles, label: 'Design free, pay only to print' },
    { icon: Truck, label: 'Printed & shipped from the USA' },
    { icon: ShieldCheck, label: '100% Happiness Guarantee' },
  ]
  return (
    <ul className={cn('flex flex-wrap items-center gap-x-5 gap-y-2 text-sm', tone === 'dark' ? 'text-white/90' : 'text-muted-foreground', className)}>
      {items.map(({ icon: Icon, label }) => (
        <li key={label} className="inline-flex items-center gap-1.5">
          <Icon className={cn('size-4', tone === 'dark' ? 'text-white' : 'text-accent')} aria-hidden /> {label}
        </li>
      ))}
    </ul>
  )
}

export function CtaBand({
  title = 'Ready to create your photo book?',
  description = 'Upload your photos and see your design in minutes. You only pay when you love it.',
  cta = 'Start your photo book',
  href = '/photo-book/',
}: {
  title?: ReactNode
  description?: ReactNode
  cta?: string
  href?: string
}) {
  return (
    <section className="px-5 pb-16 pt-6 md:px-6 md:pb-24">
      <div className="bg-cta-bubbles relative mx-auto max-w-6xl overflow-hidden rounded-[2.5rem] px-6 py-14 text-center text-white shadow-float md:px-16 md:py-20">
        <div className="relative">
          <h2 className="mx-auto max-w-2xl text-balance font-serif text-3xl leading-tight text-white md:text-5xl">{title}</h2>
          <p className="mx-auto mt-4 max-w-xl text-pretty text-lg text-white/90">{description}</p>
          <div className="mt-8 flex justify-center">
            <CtaLink href={href} variant="primary" size="lg" magnetic>
              {cta}
            </CtaLink>
          </div>
          <Reassurance tone="dark" className="mt-7 justify-center" />
        </div>
      </div>
    </section>
  )
}

export function CheckList({ items, className }: { items: ReactNode[]; className?: string }) {
  return (
    <ul className={cn('space-y-3', className)}>
      {items.map((t, i) => (
        <li key={i} className="flex items-start gap-3">
          <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-accent text-accent-foreground">
            <Check className="size-3" strokeWidth={3} />
          </span>
          <span>{t}</span>
        </li>
      ))}
    </ul>
  )
}

export function IconTile({ icon, className }: { icon: ReactNode; className?: string }) {
  return <span className={cn('grid size-12 place-items-center rounded-2xl bg-accent/12 text-accent', className)}>{icon}</span>
}
