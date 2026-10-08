import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { CtaBand, JsonLd, MarketingShell, PageHero, Section } from '@/components/content/blocks'
import { SITE_URL } from '@/lib/content'
import { THEMES } from '@/lib/content/themes'

export const metadata: Metadata = {
  title: 'Photo Book Themes & Occasions | Pixovo',
  description:
    'Find a photo book for every occasion: wedding, baby’s first year, travel and vacations, and year in review family yearbooks. Custom, auto-laid out and printed in the USA.',
  alternates: { canonical: '/themes/' },
}

export default function ThemesPage() {
  const structured = [
    {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: 'Photo book themes and occasions',
      url: `${SITE_URL}/themes/`,
      hasPart: THEMES.map((t) => ({ '@type': 'WebPage', name: t.metaTitle, url: `${SITE_URL}/themes/${t.slug}/` })),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
        { '@type': 'ListItem', position: 2, name: 'Themes', item: `${SITE_URL}/themes/` },
      ],
    },
  ]
  return (
    <MarketingShell>
      <JsonLd data={structured} />
      <PageHero
        align="center"
        eyebrow="Themes & occasions"
        title={
          <>
            A photo book for every <em className="text-accent">story you want to keep</em>
          </>
        }
        description="Weddings, new babies, trips and the whole year. Pick a theme for ideas, page layouts and a head start on your book."
      />
      <Section>
        <ul className="grid gap-6 sm:grid-cols-2">
          {THEMES.map((t) => (
            <li key={t.slug}>
              <Link
                href={`/themes/${t.slug}/`}
                className="group flex h-full flex-col overflow-hidden rounded-[2rem] border border-foreground/8 bg-card transition hover:-translate-y-1 hover:shadow-float"
              >
                <div className="relative aspect-[16/10] bg-secondary">
                  <Image src={t.image} alt={t.imageAlt} fill sizes="(min-width:640px) 50vw, 100vw" className="object-cover transition-transform duration-700 group-hover:scale-[1.03]" />
                </div>
                <div className="flex flex-1 flex-col p-6">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">{t.eyebrow}</p>
                  <h2 className="mt-2 font-serif text-2xl tracking-tight">{t.primaryKeyword.replace(/^./, (c) => c.toUpperCase())}</h2>
                  <p className="mt-2 flex-1 text-muted-foreground">{t.blurb}</p>
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-accent">
                    Explore ideas <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </Section>
      <CtaBand />
    </MarketingShell>
  )
}
