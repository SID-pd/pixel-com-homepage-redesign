import Image from 'next/image'
import Link from 'next/link'
import { ChevronRight, Clock } from 'lucide-react'
import { CtaLink } from '@/components/pixel/cta-link'
import { SITE_URL, faqJsonLd, type Article } from '@/lib/content'
import { coverOf, formatDate, relatedCards, topicOf } from '@/lib/content/blog'
import { CtaBand, JsonLd, MarketingShell, Reassurance } from './blocks'
import { FaqAccordion } from './faq-accordion'
import { PostCardView, ReadingProgress, ShareButtons } from './blog-ui'
import { TocNav } from './toc-nav'

function InlineCta({ title, text }: { title: string; text: string }) {
  return (
    <aside className="not-prose my-10 overflow-hidden rounded-3xl bg-ink p-6 text-ink-foreground sm:p-8">
      <p className="font-serif text-2xl leading-snug sm:text-3xl">{title}</p>
      <p className="mt-2 text-ink-foreground/75">{text}</p>
      <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-3">
        <CtaLink href="/photo-book/" variant="accent">
          Start your photo book
        </CtaLink>
        <Reassurance tone="dark" className="text-xs" />
      </div>
    </aside>
  )
}

export function ArticleView({ article }: { article: Article }) {
  const topic = topicOf(article)
  const cover = coverOf(article)
  const related = relatedCards(article.slug, 3)
  const hasFaq = article.faq.length > 0
  // Most bodies already carry their own FAQ heading right before the accordion; only add one when missing.
  const faqHeading = article.headings.find((h) => /frequently asked|faq/i.test(h.text))
  const toc = [...article.headings.map((h) => ({ id: h.id, label: h.text })), ...(hasFaq && !faqHeading ? [{ id: 'faq', label: 'Frequently asked questions' }] : [])]

  const url = `${SITE_URL}/blog/${article.slug}/`
  const original = article.jsonLd
  const hasFaqLd = original.some((d) => d['@type'] === 'FAQPage')
  const structured = [
    {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: article.title,
      description: article.metaDescription,
      image: `${SITE_URL}${cover}`,
      datePublished: article.createdAt,
      dateModified: article.updatedAt ?? article.createdAt,
      author: { '@type': 'Organization', name: 'Pixovo Team' },
      publisher: { '@type': 'Organization', name: 'Pixovo', logo: { '@type': 'ImageObject', url: `${SITE_URL}/images/pixovo-logo.png` } },
      mainEntityOfPage: url,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
        { '@type': 'ListItem', position: 2, name: 'Blog', item: `${SITE_URL}/blog/` },
        { '@type': 'ListItem', position: 3, name: article.title, item: url },
      ],
    },
    ...original,
    ...(hasFaq && !hasFaqLd ? [faqJsonLd(article.faq)] : []),
  ]

  return (
    <MarketingShell>
      <JsonLd data={structured} />
      <ReadingProgress />

      <header className="px-5 pb-8 pt-32 sm:pt-40 md:px-6">
        <div className="mx-auto max-w-3xl">
          <nav aria-label="Breadcrumb" className="mb-6 flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
            <Link href="/" className="hover:text-foreground">
              Home
            </Link>
            <ChevronRight className="size-3.5" aria-hidden />
            <Link href="/blog/" className="hover:text-foreground">
              Blog
            </Link>
            <ChevronRight className="size-3.5" aria-hidden />
            <span className="line-clamp-1 text-foreground/80" aria-current="page">
              {topic}
            </span>
          </nav>
          <span className="inline-flex rounded-full bg-accent/12 px-3 py-1 text-xs font-semibold text-accent">{topic}</span>
          <h1 className="mt-4 text-balance font-serif text-3xl leading-[1.1] tracking-tight sm:text-4xl md:text-5xl">{article.title}</h1>
          {article.subtitle && <p className="mt-4 text-pretty text-xl text-muted-foreground">{article.subtitle}</p>}
          <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-2">
              <span className="grid size-8 place-items-center rounded-full bg-foreground text-xs font-semibold text-background">P</span>
              <span className="font-medium text-foreground">{article.author}</span>
            </span>
            <span>{formatDate(article.createdAt)}</span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="size-4" /> {article.readMinutes} min read
            </span>
          </div>
        </div>
      </header>

      <div className="px-5 md:px-6">
        <div className="relative mx-auto aspect-[16/9] max-w-5xl overflow-hidden rounded-[2rem] bg-secondary shadow-float">
          <Image src={cover} alt={article.heroAlt} fill priority sizes="(min-width:1024px) 1024px, 100vw" className="object-cover" />
        </div>
      </div>

      <div className="px-5 pb-16 pt-12 md:px-6 md:pb-24">
        <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-14">
          <aside className="lg:sticky lg:top-28 lg:self-start">
            <TocNav items={toc} title="In this article" />
          </aside>

          <div id="article-body" className="min-w-0">
            {article.parts.map((part, i) => {
              if (part.type === 'html') return <div key={i} className="prose-pixovo" dangerouslySetInnerHTML={{ __html: part.html }} />
              if (part.type === 'cta') return <InlineCta key={i} title={part.title} text={part.text} />
              return (
                <section key={i} id={faqHeading ? undefined : 'faq'} className="scroll-mt-28 py-2">
                  {!faqHeading && <h2 className="mb-5 font-serif text-3xl tracking-tight md:text-3xl">Frequently asked questions</h2>}
                  <FaqAccordion searchable={false} groups={[{ id: 'article-faq', title: 'Questions', items: article.faq }]} />
                </section>
              )
            })}

            <div className="mt-12 flex flex-col gap-5 border-y border-foreground/10 py-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <span className="grid size-12 place-items-center rounded-full bg-foreground font-serif text-lg text-background">P</span>
                <div>
                  <p className="font-semibold">Written by the {article.author}</p>
                  <p className="text-sm text-muted-foreground">Photo book makers and AI design people, based in the USA.</p>
                </div>
              </div>
              <ShareButtons title={article.title} />
            </div>
          </div>
        </div>
      </div>

      <section className="bg-secondary/50 px-5 py-14 md:px-6 md:py-20" aria-labelledby="related-h">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 flex items-end justify-between">
            <h2 id="related-h" className="font-serif text-3xl tracking-tight md:text-3xl">
              Keep reading
            </h2>
            <Link href="/blog/" className="text-sm font-medium text-accent underline-offset-4 hover:underline">
              All articles
            </Link>
          </div>
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((p) => (
              <li key={p.slug} className="flex">
                <div className="w-full">
                  <PostCardView post={p} />
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <CtaBand
        title="Turn your photos into a book you'll actually open"
        description="Upload, let the AI design it, and only pay when you love it. Most people finish in minutes."
      />
    </MarketingShell>
  )
}
