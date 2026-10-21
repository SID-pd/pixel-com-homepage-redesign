import type { StoryOccasion, StoryTone } from './story'

// Story Mode conversation script (front-end only). The companion is scripted today; askCompanion() in mock-api.ts is the
// seam where a real LLM replies later. Everything the UI needs (copy, chips, inference) lives here so the components
// stay presentational.

export type Phase = 'occasion' | 'memory' | 'tone' | 'photos' | 'favorite' | 'title' | 'generating' | 'review'

/** The four steps of the Story Mode studio. */
export type Step = 1 | 2 | 3 | 4
export const STEPS: { id: Step; label: string; short: string }[] = [
  { id: 1, label: 'Your story & book', short: 'Setup' },
  { id: 2, label: 'Add photos', short: 'Photos' },
  { id: 3, label: 'Check photos', short: 'Review' },
  { id: 4, label: 'Preview & order', short: 'Preview' },
]

export const PHASE_ORDER: Phase[] = ['occasion', 'memory', 'tone', 'photos', 'favorite', 'title', 'generating', 'review']

export type Mood = 'idle' | 'talking' | 'thinking' | 'excited' | 'celebrate' | 'inspecting'

export const OCCASIONS: { id: StoryOccasion; label: string; emoji: string; color: string }[] = [
  { id: 'travel', label: 'A trip or vacation', emoji: '✈️', color: 'var(--st-mint)' },
  { id: 'wedding', label: 'A wedding or love story', emoji: '💍', color: 'var(--st-peach)' },
  { id: 'family', label: 'Baby, kids & family', emoji: '👶', color: 'var(--st-butter)' },
  { id: 'milestone', label: 'A milestone or celebration', emoji: '🎓', color: 'var(--st-lilac)' },
  { id: 'year-in-review', label: 'My year in review', emoji: '📅', color: 'var(--st-mint)' },
]

export const TONES: { id: StoryTone; label: string; blurb: string; emoji: string }[] = [
  { id: 'warm', label: 'Warm & heartfelt', blurb: 'Gentle, sincere captions', emoji: '🧡' },
  { id: 'playful', label: 'Playful & fun', blurb: 'Light, cheeky, smiley', emoji: '🎈' },
  { id: 'poetic', label: 'Poetic & dreamy', blurb: 'Soft, lyrical lines', emoji: '🌙' },
  { id: 'minimal', label: 'Short & simple', blurb: 'A few clean words', emoji: '✏️' },
]

const KEYWORDS: [StoryOccasion, RegExp][] = [
  ['wedding', /wedding|bride|groom|married|honeymoon|engage|anniversar|love story|couple/i],
  ['travel', /trip|travel|vacation|holiday|road ?trip|beach|flight|abroad|adventure|hike|camping|city break/i],
  ['family', /baby|newborn|toddler|kid|child|family|grand(ma|pa|parent)|mom|dad|son|daughter|first year/i],
  ['milestone', /graduat|birthday|retire|promotion|milestone|party|celebrat|new home|baby shower/i],
  ['year-in-review', /year|months?|2026|2025|season|recap|highlights/i],
]

export function inferOccasion(text: string): StoryOccasion {
  return KEYWORDS.find(([, re]) => re.test(text))?.[0] ?? 'general'
}

export const OCCASION_REPLY: Record<StoryOccasion, string> = {
  travel: 'Ooh, a trip! I love a good adventure story.',
  wedding: 'A love story. Those are my favorite to tell.',
  family: 'Family moments are the ones that grow the fastest. Let’s keep them.',
  milestone: 'A celebration! Let’s make it a keepsake.',
  'year-in-review': 'A whole year in one book. That’s a lot of good days.',
  general: 'Every memory deserves a story. Let’s tell this one.',
}

export const MEMORY_PROMPT: Record<StoryOccasion, string> = {
  travel: 'Tell me a little about it: where did you go, who was with you, and what made it special?',
  wedding: 'Tell me about the day: who was there, and what moment do you replay most?',
  family: 'Tell me about them: who’s in the pictures, and what do you want to remember?',
  milestone: 'What are we celebrating, and who showed up for it?',
  'year-in-review': 'What were the highlights of your year? A few lines is perfect.',
  general: 'Tell me about it in a few lines: who, where and what made it special.',
}

export const MEMORY_EXAMPLES: Record<StoryOccasion, string[]> = {
  travel: ['Our first family trip to the coast. Sandcastles, sunset dinners, the best week of the summer.', 'A long weekend in the mountains with my best friends.'],
  wedding: ['Our wedding day in the garden. The vows, the dancing, and Grandma crying happy tears.', 'Our first year of marriage in photos.'],
  family: ['Baby’s first year. Tiny hands, first smile, first steps.', 'Weekend adventures with the kids.'],
  milestone: ['Maya’s graduation day. All the hard work, finally paid off.', 'Dad’s 60th birthday surprise party.'],
  'year-in-review': ['Our 2026: a new home, a big trip and lots of Sunday dinners.', 'A year of little everyday joys.'],
  general: ['A perfect weekend with the people I love.', 'The little moments from this season.'],
}

export const TONE_REPLY: Record<StoryTone, string> = {
  warm: 'Warm and heartfelt it is.',
  playful: 'Playful it is! Let’s have some fun with the captions.',
  poetic: 'Poetic and dreamy. Beautiful choice.',
  minimal: 'Short and simple. Sometimes less says more.',
}

/** What the companion says when photos have all finished processing. */
export function photoReaction(count: number, occasion: StoryOccasion): string {
  const n = count === 1 ? 'one photo' : `${count} photos`
  const lines: Record<StoryOccasion, string> = {
    travel: `${n}, and I can already feel the sunshine.`,
    wedding: `${n}. I can tell how special this day was.`,
    family: `${n} of smiles. These are going to be so good together.`,
    milestone: `${n} of pure pride. Love it.`,
    'year-in-review': `${n} spanning a whole year. Nice!`,
    general: `${n}. Lovely.`,
  }
  return lines[occasion]
}

export const FAVORITE_PROMPT = 'One more thing, and it’s optional: what was your favorite moment? I’ll weave it into the captions.'
export const PHOTOS_PROMPT = 'Now the fun part. Drop your photos here, or try a sample set to see how it works. They can arrive in any order, I’ll sort the story out.'

/** What Pixie says on each step. */
export const PIXIE = {
  setup: 'Let’s set up your book! Tell me the story, pick a look and a size. You can change anything later.',
  setupGo: 'Great start. Now let’s add your photos.',
  upload: 'Drop your photos anywhere on the table. I’ll take it from there.',
  uploadMore: (n: number) => `${n} on the table so far. Add as many as you like.`,
  uploadReady: (n: number, occasion: StoryOccasion) => photoReaction(n, occasion) + ' Ready when you are!',
  scanning: 'Let me look through them… checking for duplicates and anything blurry.',
  allClear: 'All clear! Every photo looks great.',
  found: (n: number) => (n === 1 ? 'I found one photo worth a look.' : `I found ${n} photos worth a look.`),
  building: 'Arranging your story, one page at a time…',
  preview: 'Ta-da! Here’s your storybook. Flip through it, then order it or fine-tune it in the editor.',
} as const

export const GENERATING_STEPS = [
  'Sorting your moments into a natural story flow',
  'Choosing a rhythm for each spread',
  'Writing captions in your voice',
  'Designing the layouts',
  'Adding the finishing touches',
]

export function bookPages(photoCount: number): number {
  const spreads = Math.ceil(photoCount / 2.2)
  const pages = Math.max(20, Math.min(100, spreads * 2))
  return pages % 2 === 0 ? pages : pages + 1
}
