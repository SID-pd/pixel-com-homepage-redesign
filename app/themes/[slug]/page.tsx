import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronRight } from 'lucide-react'
import { CheckList, CtaBand, JsonLd, MarketingShell, PageHero, Reassurance, Section } from '@/components/content/blocks'
import { PostCardView } from '@/components/content/blog-ui'
import { FaqAccordion } from '@/components/content/faq-accordion'
import { OfferStrip, PriceTag } from '@/components/flow/offer-ui'
import { CtaLink } from '@/components/pixel/cta-link'
import { SITE_URL, faqJsonLd, getArticle } from '@/lib/content'
import { toCard } from '@/lib/content/blog'
import { THEMES, getTheme } from '@/lib/content/themes'
import { unitPrice } from '@/lib/flow/pricing'

type Props = { params: Promise<{ slug: string }> }

export const dynamicParams = false

export function generateStaticParams() {
  return THEMES.map((t) => ({ slug: t.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const t = getTheme((await params).slug)
  if (!t) return {}
  const url = `/themes/${t.slug}/`
  return {
    title: t.metaTitle,
    description: t.metaDescription,
    keywords: t.keywords,
    alternates: { canonical: url },
    openGraph: { type: 'website', title: t.metaTitle, description: t.metaDescription, url, images: [t.image] },
    twitter: { card: 'summary_large_image', title: t.metaTitle, description: t.metaDescription, images: [t.image] },
  }
}

export default async function ThemePage({ params }: Props) {
  const t = getTheme((await params).slug)
  if (!t) notFound()

  const url = `${SITE_URL}/themes/${t.slug}/`
  const startHref = t.templateId ? `/photo-book/?template=${t.templateId}` : `/photo-book/?size=${t.size}`
  const listPrice = unitPrice({ size: t.size, pages: 20, cover: 'softcover' })
  const short = t.nav.split(' &')[0]
  const posts = t.articles
    .map((s) => getArticle(s))
    .filter((a): a is NonNullable<typeof a> => !!a)
    .map(toCard)
  const others = THEMES.filter((x) => x.slug !== t.slug)

  const structured = [
    {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      '@id': url,
      url,
      name: t.metaTitle,
      description: t.metaDescription,
      isPartOf: { '@type': 'WebSite', name: 'Pixovo', url: SITE_URL },
      about: t.primaryKeyword,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
        { '@type': 'ListItem', position: 2, name: 'Themes', item: `${SITE_URL}/themes/` },
        { '@type': 'ListItem', position: 3, name: t.nav, item: url },
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'HowTo',
      name: t.flowTitle,
      step: t.flow.map((text, i) => ({ '@type': 'HowToStep', position: i + 1, text })),
    },
    faqJsonLd(t.faq),
  ]

  return (
    <MarketingShell>
      <JsonLd data={structured} />
      <PageHero
        eyebrow={t.eyebrow}
        title={
          <>
            {t.h1[0]} <em className="text-accent">{t.h1[1]}</em>
          </>
        }
        description={t.lead}
        image={t.image}
        imageAlt={t.imageAlt}
        actions={
          <>
            <CtaLink href={startHref} variant="accent" size="lg" magnetic>
              Start your {short.toLowerCase()} book
            </CtaLink>
            <span className="inline-flex items-baseline gap-2 text-sm text-muted-foreground">
              From <PriceTag list={listPrice} size="sm" />
            </span>
          </>
        }
      >
        <nav aria-label="Breadcrumb" className="mt-6 flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground">
            Home
          </Link>
          <ChevronRight className="size-3.5" aria-hidden />
          <Link href="/themes/" className="hover:text-foreground">
            Themes
          </Link>
          <ChevronRight className="size-3.5" aria-hidden />
          <span aria-current="page" className="text-foreground/80">
            {t.nav}
          </span>
        </nav>
        <Reassurance className="mt-6" />
      </PageHero>

      <Section eyebrow="Page ideas" title={t.ideasTitle}>
        <OfferStrip className="mb-8" />
        <ol className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {t.ideas.map((idea, i) => (
            <li key={idea.title} className="rounded-3xl border border-foreground/8 bg-card p-6 shadow-xs">
              <span className="grid size-9 place-items-center rounded-full bg-accent/12 text-sm font-semibold text-accent">{i + 1}</span>
              <h3 className="mt-4 font-serif text-xl tracking-tight">{idea.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{idea.text}</p>
            </li>
          ))}
        </ol>
      </Section>

      <Section tone="soft" eyebrow="How it works" title={t.flowTitle}>
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <ol className="space-y-4">
            {t.flow.map((step, i) => (
              <li key={step} className="flex gap-4 rounded-2xl bg-card p-5 shadow-xs">
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-foreground text-sm font-semibold text-background">{i + 1}</span>
                <p className="text-muted-foreground">{step}</p>
              </li>
            ))}
          </ol>
          <div>
            <h3 className="font-serif text-2xl tracking-tight">{t.whyTitle}</h3>
            <CheckList className="mt-5" items={t.why} />
            <div className="mt-8">
              <CtaLink href={startHref} variant="accent" magnetic>
                Start designing
              </CtaLink>
            </div>
          </div>
        </div>
      </Section>

      <Section eyebrow="Make it better" title="Three tips before you start">
        <div className="grid gap-5 md:grid-cols-3">
          {t.tips.map((tip) => (
            <article key={tip.title} className="rounded-3xl bg-secondary p-6">
              <h3 className="font-serif text-xl tracking-tight">{tip.title}</h3>
              <p className="mt-2 text-muted-foreground">{tip.text}</p>
            </article>
          ))}
        </div>
      </Section>

      <Section tone="soft" eyebrow="Questions" title={`${short} photo book FAQ`}>
        <div className="max-w-3xl">
          <FaqAccordion groups={[{ id: 'theme-faq', title: 'Questions', items: t.faq }]} searchable={false} />
        </div>
      </Section>

      {posts.length > 0 && (
        <Section eyebrow="Keep reading" title="From the Pixovo blog">
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((p) => (
              <li key={p.slug} className="flex">
                <div className="w-full">
                  <PostCardView post={p} />
                </div>
              </li>
            ))}
          </ul>
        </Section>
      )}

      <Section eyebrow="More themes" title="Find a theme for every occasion">
        <ul className="grid gap-5 sm:grid-cols-3">
          {others.map((o) => (
            <li key={o.slug}>
              <Link href={`/themes/${o.slug}/`} className="group block overflow-hidden rounded-3xl border border-foreground/8 bg-card transition hover:-translate-y-1 hover:shadow-float">
                <div className="relative aspect-[16/10] bg-secondary">
                  <Image src={o.image} alt="" fill sizes="(min-width:640px) 33vw, 100vw" className="object-cover" />
                </div>
                <div className="p-5">
                  <p className="font-serif text-xl tracking-tight">{o.nav}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{o.blurb}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </Section>

      <CtaBand title={`Ready to make your ${t.primaryKeyword}?`} cta="Start your photo book" href={startHref} />
    </MarketingShell>
  )
}
