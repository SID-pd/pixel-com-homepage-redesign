// Single source of truth for sizes, prices, covers, templates, shipping and promos.
// SIZES/COVERS hold LIST prices (what the site shows). The 50% campaign codes below bring a 20-page softcover
// to $19.99 / $29.99 / $39.99. Correct prices here and the whole flow follows.

export type SizeId = '8x8' | '10x10' | '12x12'
/** Presets are 20-100 in steps of 20; the editor may add or remove single spreads (2 pages), so any even number 20-100 is valid. */
export type PageCount = number
export type CoverId = 'hardcover' | 'softcover'

export const SIZES: { id: SizeId; label: string; blurb: string; base: number; step: number; image: string }[] = [
  { id: '8x8', label: '8" × 8"', blurb: 'Perfect for everyday moments', base: 59.99, step: 24, image: '/images/8.5x8.5-inches-photobook.png' },
  { id: '10x10', label: '10" × 10"', blurb: 'Our most popular size', base: 79.99, step: 32, image: '/images/10x10-inches-photobook.png' },
  { id: '12x12', label: '12" × 12"', blurb: 'Great for big stories', base: 99.99, step: 40, image: '/images/12x12-inches-photobook.png' },
]

export const PAGE_COUNTS: PageCount[] = [20, 40, 60, 80, 100]
export const MIN_PAGES = 20
export const MAX_PAGES = 100

export const COVERS: { id: CoverId; label: string; blurb: string; adjust: number }[] = [
  { id: 'hardcover', label: 'Hardcover', blurb: 'Durable and premium with a luxurious finish.', adjust: 0 },
  { id: 'softcover', label: 'Softcover', blurb: 'Lightweight and budget-friendly.', adjust: -20 },
]

export type PackagingId = 'basic' | 'gift' | 'bag'

/** Final-step packaging choice (mandatory: the customer picks one). All options are free (price kept so a paid add-on can be switched on here). */
export const PACKAGING: { id: PackagingId; label: string; blurb: string; price: number }[] = [
  { id: 'basic', label: 'Basic packaging', blurb: 'Protective box, ready to ship.', price: 0 },
  { id: 'gift', label: 'Gift wrap', blurb: 'Wrapped in linen paper with a ribbon and gift tag.', price: 0 },
  { id: 'bag', label: 'Carry bag', blurb: 'A sturdy paper carry bag with rope handles.', price: 0 },
]

export const MATERIALS = [
  { id: 'linen', label: 'Linen', color: '#d8cab2' },
  { id: 'charcoal', label: 'Charcoal', color: '#3b3733' },
  { id: 'leather', label: 'Leather', color: '#8a573a' },
  { id: 'sage', label: 'Sage', color: '#97a38b' },
] as const
export type MaterialId = (typeof MATERIALS)[number]['id']

export const TEMPLATES = [
  { id: 'gallery', name: 'Gallery', tag: 'Minimal', pages: 40, image: '/images/template-minimal.png', tagBg: '#FFC5C5', bg: '#ffffff', layouts: ['full-right', 'pair', 'duo-stack'] },
  { id: 'road-trip', name: 'Road Trip', tag: 'Travel', pages: 60, image: '/images/template-collage.png', tagBg: '#BCEEFA', bg: '#f6f1e7', layouts: ['hero-3', 'grid-4', 'pair', 'grid-6'] },
  { id: 'ever-after', name: 'Ever After', tag: 'Wedding', pages: 80, image: '/images/template-classic.png', tagBg: '#FCF876', bg: '#fbf5ea', layouts: ['pair', 'full-right', 'hero-3'] },
  { id: 'field-notes', name: 'Field Notes', tag: 'Journal', pages: 40, image: '/images/template-journal.png', tagBg: '#DCD3FF', bg: '#f3efe6', layouts: ['duo-stack', 'grid-4', 'pair'] },
  { id: 'our-year', name: 'Our Year', tag: 'Family', pages: 60, image: '/images/hero-book.png', tagBg: '#FFC5C5', bg: '#fdf6f0', layouts: ['grid-6', 'hero-3', 'pair'] },
  { id: 'wide-open', name: 'Wide Open', tag: 'Landscape', pages: 20, image: '/images/product-photobook.png', tagBg: '#BCEEFA', bg: '#eef2f1', layouts: ['full-right', 'duo-stack', 'pair'] },
]
export type TemplateId = (typeof TEMPLATES)[number]['id']

export const SHIPPING = [
  { id: 'standard', label: 'Standard', eta: '5–10 working days', price: 5.99, freeOver: 75 },
  { id: 'express', label: 'Express', eta: '3–6 working days', price: 12.99, freeOver: Infinity },
] as const
export type ShippingId = (typeof SHIPPING)[number]['id']

// Evergreen codes (testing / support use). They are never advertised.
export const PROMOS: Record<string, { label: string; percent: number }> = {
  PIXOVO10: { label: '10% off', percent: 10 },
  WELCOME15: { label: '15% off your first book', percent: 15 },
}

/**
 * Seasonal sale calendar: the single source for the top banner, product cards, homepage seasonal section and
 * checkout. A code only works between start and end (inclusive, US Pacific time), so the deadline shown to
 * customers is always the real one. Dates are YYYY-MM-DD; add next year's rows before they lapse.
 */
export const CAMPAIGNS = [
  { id: 'fall', name: 'Fall Sale', code: 'FALL50', percent: 50, start: '2026-10-01', end: '2026-11-15' },
  { id: 'holiday', name: 'Holiday Sale', code: 'HOLIDAY50', percent: 50, start: '2026-11-16', end: '2026-12-10' },
  { id: 'newyear', name: 'New Year Sale', code: 'NEWYEAR50', percent: 50, start: '2027-01-01', end: '2027-01-31' },
  { id: 'spring', name: 'Spring Sale', code: 'SPRING50', percent: 50, start: '2027-03-01', end: '2027-04-30' },
  { id: 'summer', name: 'Summer Sale', code: 'SUMMER50', percent: 50, start: '2027-06-01', end: '2027-08-31' },
] as const
export type Campaign = (typeof CAMPAIGNS)[number]
export type CampaignId = Campaign['id']

/** Today's date (YYYY-MM-DD) in the business's time zone. */
export const todayPT = (now: Date = new Date()) => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Los_Angeles' }).format(now)

export function activeCampaign(today: string = todayPT()): Campaign | null {
  return CAMPAIGNS.find((c) => c.start <= today && today <= c.end) ?? null
}

/** "Nov 15" */
export const formatEnd = (iso: string) =>
  new Date(`${iso}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

export type PromoCheck =
  | { ok: true; percent: number; label: string }
  | { ok: false; error: string }

export function checkPromo(code: string, today: string = todayPT()): PromoCheck {
  const key = code.trim().toUpperCase()
  const evergreen = PROMOS[key]
  if (evergreen) return { ok: true, percent: evergreen.percent, label: evergreen.label }
  const c = CAMPAIGNS.find((x) => x.code === key)
  if (!c) return { ok: false, error: 'That code isn’t valid. Check the spelling and try again.' }
  if (today < c.start) return { ok: false, error: `${c.code} starts on ${formatEnd(c.start)}.` }
  if (today > c.end) return { ok: false, error: `${c.code} ended on ${formatEnd(c.end)}.` }
  return { ok: true, percent: c.percent, label: `${c.percent}% off · ${c.name}` }
}

/** Price after a campaign discount, rounded in cents exactly like checkout does (so $39.99 → $19.99). */
export const salePrice = (list: number, percent: number) => {
  const cents = Math.round(list * 100)
  return (cents - Math.ceil((cents * percent) / 100)) / 100
}

export const TAX_RATE = 0.06 // mock flat estimate; real tax comes from the backend later

export const SAMPLE_PHOTOS = [
  { name: 'Family.png', src: '/images/Family.png' },
  { name: 'Travel.png', src: '/images/Travel.png' },
  { name: 'Wedding.png', src: '/images/Wedding.png' },
  { name: 'Baby.png', src: '/images/Baby.png' },
  { name: 'travel-adventure.png', src: '/images/travel-adventure.png' },
  { name: 'wedding-elegance.png', src: '/images/wedding-elegance.png' },
  { name: 'travel-inner.png', src: '/images/travel_photobook_idea_inner.png' },
  { name: 'travel-outer.png', src: '/images/travel_photobook_idea_outer.png' },
  { name: 'about-hero.png', src: '/images/about_us_hero_image.png' },
  { name: 'template-classic.png', src: '/images/template-classic.png' },
  { name: 'template-journal.png', src: '/images/template-journal.png' },
  { name: 'template-collage.png', src: '/images/template-collage.png' },
]

export const STICKERS = ['❤️', '⭐', '🌿', '🎉', '☀️', '🌸', '✈️', '📍', '🎂', '🐾', '👶', '💍', '🌊', '🏔️', '📸', '✨']

// 'Modern' is the site font. The other three are optional text styles for the printed book; their webfonts load only inside the editor (app/photo-book/editor/layout.tsx) and degrade to system fonts elsewhere.
export const FONTS = [
  { id: 'sans', label: 'Modern', css: 'var(--font-poppins), system-ui, sans-serif' },
  { id: 'serif', label: 'Classic', css: 'var(--font-instrument), Georgia, serif' },
  { id: 'display', label: 'Elegant', css: 'var(--font-playfair), Georgia, serif' },
  { id: 'brand', label: 'Playful', css: 'var(--font-fredoka), system-ui, sans-serif' },
] as const

export const BACKGROUNDS = ['#ffffff', '#faf6ef', '#f3ece0', '#fde8e4', '#e6f0ee', '#e9e6f5', '#fdf3c8', '#2a2623']

export const FILTERS = [
  { id: 'none', label: 'None', css: '' },
  { id: 'natural', label: 'Natural', css: 'saturate(1.08) contrast(1.03)' },
  { id: 'vivid', label: 'Vivid', css: 'saturate(1.45) contrast(1.08)' },
  { id: 'warm', label: 'Warm', css: 'sepia(0.22) saturate(1.2) hue-rotate(-8deg)' },
  { id: 'mono', label: 'Mono', css: 'grayscale(1) contrast(1.1)' },
  { id: 'fade', label: 'Fade', css: 'contrast(0.88) brightness(1.08) saturate(0.85)' },
] as const

export const money = (n: number) => `$${n.toFixed(2)}`
