import type { Item, Photo, Spread } from './types'
import { uid } from './layouts'

// Story Mode (front-end only). This is the seam for the future AI backend: generateStory() in mock-api.ts is the one
// call to replace. Until then the "story" is produced locally, deterministically, from what the customer wrote:
//   - photos keep their upload order (or sort by filename when names look sequential, e.g. IMG_0001...)
//   - the title and captions are built from the customer's own description, so nothing is invented about the photos.

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
function phrases(description: string): string[] {
  return clean(description)
    .split(/(?<=[.!?])\s+|[;\n]+|,\s+(?=and |then |but )/i)
    .map((p) => clean(p.replace(/[.!?]+$/, '')))
    .filter((p) => p.length > 3)
}

export function storyTitle(description: string, fallback: string): string {
  const first = phrases(description)[0]
  if (!first) return fallback
  const words = first.split(' ')
  if (words.length <= 8) return cap(first)
  const keys = words.filter((w) => !STOP.has(w.toLowerCase())).slice(0, 4)
  return cap(keys.join(' ')) || fallback
}

const WARM = ['Moments we never want to forget', 'Just the way we remember it', 'A little piece of the story', 'Together, in the best of ways', 'One of our favorites']

export function captionsFor(description: string, count: number): string[] {
  const ph = phrases(description).map(cap)
  const pool = ph.length ? ph : WARM
  const out: string[] = []
  for (let i = 0; i < count; i++) out.push(pool[i % pool.length] + (ph.length ? '' : ''))
  // Interleave the warm lines once the customer's own phrases have all been used.
  if (ph.length && count > ph.length) for (let i = ph.length; i < count; i += 2) out[i] = WARM[(i / 2) % WARM.length]
  return out
}

function captionItem(text: string): Item {
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
