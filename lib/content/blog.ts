import { articles, type Article } from './index'

export type Topic = 'Guides' | 'Ideas' | 'How-To'
export const TOPICS: Topic[] = ['Guides', 'Ideas', 'How-To']

// The CMS tags every article "Guides", which makes filtering useless. Topic and card cover are editorial decisions kept here.
// Covers fall back to existing files in /public/images because several images referenced by the CMS were never uploaded.
const META: Record<string, { topic: Topic; cover: string }> = {
  'make-photo-book-from-phone-photos': { topic: 'How-To', cover: '/images/how_to_make_photo_book_outer.png' },
  'ai-photo-book-vs-traditional-photo-book': { topic: 'Guides', cover: '/images/ai_photo_book_vs_traditional_photobook_outer.png' },
  'photo-book-sizes-guide': { topic: 'How-To', cover: '/images/12x12-inches-photobook.png' },
  'wedding-photo-book-ideas': { topic: 'Ideas', cover: '/images/wedding-elegance.png' },
  'what-is-an-ai-photo-book-maker-how-it-works-and-whether-its-worth-it': { topic: 'Guides', cover: '/images/what_is_ai_photo_book_outer.png' },
  'photo-book-gifts-every-occasion': { topic: 'Ideas', cover: '/images/product-photobook.png' },
  'travel-photo-book-ideas-how-to-turn-trip-photos-into-a-book': { topic: 'Ideas', cover: '/images/travel_photobook_idea_outer.png' },
  'fall-photo-book-ideas': { topic: 'Ideas', cover: '/images/autumn-gift-banner.jpg' },
}

export type PostCard = {
  slug: string
  title: string
  summary: string
  topic: Topic
  cover: string
  date: string
  isoDate: string
  readMinutes: number
}

export const formatDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : ''

export function topicOf(a: Article): Topic {
  return META[a.slug]?.topic ?? 'Guides'
}
export function coverOf(a: Article): string {
  return a.heroImage || META[a.slug]?.cover || '/images/product-photobook.png'
}

export function toCard(a: Article): PostCard {
  return {
    slug: a.slug,
    title: a.title,
    summary: a.metaDescription,
    topic: topicOf(a),
    cover: META[a.slug]?.cover ?? coverOf(a),
    date: formatDate(a.createdAt),
    isoDate: a.createdAt ?? '',
    readMinutes: a.readMinutes,
  }
}

// Newest first = last entry in the CMS export on top (the export is in publishing order; the dates in it are not reliable).
export const allCards = (): PostCard[] => [...articles].reverse().map(toCard)

export function relatedCards(slug: string, n = 3): PostCard[] {
  const me = articles.find((a) => a.slug === slug)
  if (!me) return []
  const t = topicOf(me)
  return allCards()
    .filter((c) => c.slug !== slug)
    .sort((a, b) => Number(b.topic === t) - Number(a.topic === t))
    .slice(0, n)
}
