import articlesJson from './articles.json'
import faqJson from './faq.json'
import legalJson from './legal.json'

// Typed access to content extracted from pixovo.cms_page.json by scripts/extract-content.mjs.
// Re-run `node scripts/extract-content.mjs` after changing the JSON; never edit the generated *.json by hand.

export type ArticlePart =
  | { type: 'html'; html: string }
  | { type: 'cta'; title: string; text: string }
  | { type: 'faq' }

export type Article = {
  slug: string
  title: string
  tag: string
  author: string
  dateLabel: string
  createdAt: string | null
  updatedAt: string | null
  metaTitle: string
  metaDescription: string
  ogImage: string
  subtitle: string
  heroImage: string
  heroAlt: string
  parts: ArticlePart[]
  faq: { q: string; a: string }[]
  headings: { id: string; text: string }[]
  words: number
  readMinutes: number
  jsonLd: Record<string, unknown>[]
}

export type LegalDoc = {
  slug: 'terms' | 'privacy-policy'
  title: string
  intro: string
  metaTitle: string
  metaDescription: string
  updatedAt: string | null
  sections: { n: number; id: string; title: string; html: string }[]
}

export type FaqGroup = { id: string; title: string; items: { q: string; a: string }[] }
export type FaqData = {
  title: string
  metaTitle: string
  metaDescription: string
  groups: FaqGroup[]
  helpGroups: FaqGroup[]
  photobookFaq: { q: string; a: string }[]
}

export const articles = articlesJson as unknown as Article[]
export const legalDocs = legalJson as unknown as LegalDoc[]
export const faqData = faqJson as unknown as FaqData

export const getArticle = (slug: string) => articles.find((a) => a.slug === slug)
export const getLegal = (slug: LegalDoc['slug']) => legalDocs.find((d) => d.slug === slug)!

/** Plain text of an HTML answer, for JSON-LD and search. */
export const plain = (html: string) =>
  html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#39;|&rsquo;/g, '’')
    .replace(/&quot;/g, '"')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

export const SITE_URL = 'https://pixovo.com'

export function faqJsonLd(items: { q: string; a: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((i) => ({
      '@type': 'Question',
      name: i.q,
      acceptedAnswer: { '@type': 'Answer', text: plain(i.a) },
    })),
  }
}
