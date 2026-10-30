import type { Item, Photo, Spread } from './types'
import { uid } from './layouts'

// Story Mode (front-end only). This is the seam for the future AI backend: generateStory() in mock-api.ts is the one
// call to replace. Until then the "story" is produced locally, deterministically, from what the customer wrote:
//   - photos keep their upload order (or sort by filename when names look sequential, e.g. IMG_0001...)
//   - the title and captions are built from the customer's own description, so nothing is invented about the photos.

export type StoryOccasion = 'travel' | 'wedding' | 'family' | 'milestone' | 'year-in-review' | 'general'
export type StoryTone = 'warm' | 'playful' | 'poetic' | 'minimal'

export interface StoryOptions {
  description: string
  occasion?: StoryOccasion
  tone?: StoryTone
  title?: string
}

const STOP = new Set('a an and the of to in on at for with our my we i is was were it this that from by as be are'.split(' '))

const clean = (s: string) => s.replace(/\s+/g, ' ').trim()
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

/** Natural-flow ordering: keep upload order unless filenames are clearly sequential camera names. */
export function orderPhotos(photos: Photo[]): Photo[] {
  const sequential = photos.length > 1 && photos.every((p) => /\d{3,}/.test(p.name))
  if (!sequential) return photos
  return [...photos].sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }))
}

/** Pull short, human phrases out of the customer's description. */
export function phrases(description: string): string[] {
  return clean(description)
    .split(/(?<=[.!?])\s+|[;\n]+|,\s+(?=and |then |but )/i)
    .map((p) => clean(p.replace(/[.!?]+$/, '')))
    .filter((p) => p.length > 3)
}

const DEFAULT_TITLES: Record<StoryOccasion, string> = {
  travel: 'The Journey',
  wedding: 'Our Wedding Story',
  family: 'Our Family Moments',
  milestone: 'A Milestone Celebration',
  'year-in-review': 'Year in Review',
  general: 'Our Story',
}

export function storyTitle(description: string, fallback = 'Our Story', occasion: StoryOccasion = 'general'): string {
  const first = phrases(description)[0]
  if (!first) return DEFAULT_TITLES[occasion] || fallback
  const words = first.split(' ')
  if (words.length <= 8) return cap(first)
  const keys = words.filter((w) => !STOP.has(w.toLowerCase())).slice(0, 4)
  return cap(keys.join(' ')) || DEFAULT_TITLES[occasion] || fallback
}

const OCCASION_LINES: Record<StoryOccasion, string[]> = {
  travel: [
    'Where the journey took us',
    'Chasing golden horizons',
    'Unplanned detours and best memories',
    'The view from where we stood',
    'Wandering without a map',
    'A place we’ll always remember',
    'Sunsets that took our breath away',
  ],
  wedding: [
    'The beginning of forever',
    'Surrounded by everyone we love',
    'In your eyes, our whole world',
    'Laughter, tears, and dancing into the night',
    'Promised in front of everyone',
    'Our favorite moment of the day',
    'To have and to hold, from this day forward',
  ],
  family: [
    'The joyful chaos of everyday life',
    'Growing together, hand in hand',
    'Little moments that matter most',
    'Our greatest adventure is family',
    'Laughter around the kitchen table',
    'Time flies, but these memories stay',
    'Side by side through it all',
  ],
  milestone: [
    'A milestone worth celebrating',
    'Look how far we’ve come',
    'Here’s to new beginnings',
    'Cheering for every single step',
    'A proud day we’ll never forget',
    'Making big memories',
    'The best is yet to come',
  ],
  'year-in-review': [
    'Chapter by chapter, month by month',
    'Highlights from an unforgettable year',
    'The seasons change, memories remain',
    'Everyday magic of this past year',
    'Looking back with so much gratitude',
    'A year full of life and love',
  ],
  general: [
    'Moments we never want to forget',
    'Just the way we remember it',
    'A little piece of the story',
    'Together, in the best of ways',
    'One of our favorites',
    'Days we’ll talk about for years',
  ],
}

const TONE_LINES: Record<StoryTone, string[]> = {
  warm: [
    'Moments we never want to forget',
    'Just the way we remember it',
    'A little piece of the story',
    'Together, in the best of ways',
    'One of our favorites',
  ],
  playful: [
    'Never a dull moment',
    'Pure joy in a single frame',
    'Peak chaos, peak happiness',
    '10/10 would do it again',
    'Caught having the best time',
    'Smiles that say everything',
  ],
  poetic: [
    'Where light and memory meet',
    'A quiet grace in passing hours',
    'Etched in golden light',
    'Held in memory, always',
    'Stillness in a fast-moving world',
  ],
  minimal: [
    'The details',
    'Present moment',
    'Frame by frame',
    'In the scene',
    'As it happened',
  ],
}

export function captionsFor(
  description: string,
  count: number,
  occasion: StoryOccasion = 'general',
  tone: StoryTone = 'warm',
): string[] {
  const ph = phrases(description).map(cap)
  const occasionPool = OCCASION_LINES[occasion] || OCCASION_LINES.general
  const tonePool = TONE_LINES[tone] || TONE_LINES.warm
  // Merge tone and occasion pools
  const backupPool = [...occasionPool, ...tonePool]

  const pool = ph.length ? ph : backupPool
  const out: string[] = []
  for (let i = 0; i < count; i++) {
    out.push(pool[i % pool.length])
  }

  // Interleave the curated lines once customer's own phrases have all been used.
  if (ph.length && count > ph.length) {
    for (let i = ph.length; i < count; i += 2) {
      out[i] = backupPool[(i / 2) % backupPool.length]
    }
  }
  return out
}

/** A handful of ready-made caption ideas to pick from; `round` rotates which ones come up so "More ideas" gives fresh lines. */
export function captionIdeas(round = 0, count = 4, tone?: StoryTone): string[] {
  const tones = tone ? [tone] : (Object.keys(TONE_LINES) as StoryTone[])
  const pool = [...new Set(tones.flatMap((t) => TONE_LINES[t]).concat(OCCASION_LINES.general))]
  return Array.from({ length: Math.min(count, pool.length) }, (_, k) => pool[(round * count + k) % pool.length])
}

export function captionItem(text: string): Item {
  return { id: uid('c'), type: 'text', x: 10, y: 93, w: 80, h: 6, rotation: 0, text, font: 'sans', color: '#5a504a', size: 20, align: 'center', italic: true }
}

/** Add a caption under every spread that holds at least one photo. */
export function withCaptions(spreads: Spread[], captions: string[]): Spread[] {
  let n = 0
  return spreads.map((s) => {
    if (s.kind === 'cover') return s
    if (!s.items.some((i) => i.type === 'photo' && i.photoId)) return s
    return { ...s, items: [...s.items, captionItem(captions[n++] ?? '')].filter((i) => i.type !== 'text' || i.text) }
  })
}


/**
 * Story Mode captions belong to photos, not pages: a spread shows the caption of its first photo. Re-running this after a
 * reorder or edit keeps every caption with its photo. Existing caption boxes (ids start with "c_") are replaced.
 */
export function applyPhotoCaptions(spreads: Spread[], captions: Record<string, string>): Spread[] {
  return spreads.map((s) => {
    if (s.kind === 'cover') return s
    const items = s.items.filter((i) => !(i.type === 'text' && i.id.startsWith('c_')))
    const first = items.find((i) => i.type === 'photo' && i.photoId)
    const text = first?.photoId ? captions[first.photoId]?.trim() : ''
    return { ...s, items: text ? [...items, captionItem(text)] : items }
  })
}
