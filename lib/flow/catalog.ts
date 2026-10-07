// Single source of truth for sizes, prices, covers, templates, shipping and promos.
// Prices are placeholders derived from the design mockup (12x12 / 20pp / hardcover = $49.99,
// +$20 per extra 20 pages). Correct them here and the whole flow follows.

export type SizeId = '8x8' | '10x10' | '12x12'
/** Presets are 20-100 in steps of 20; the editor may add or remove single spreads (2 pages), so any even number 20-100 is valid. */
export type PageCount = number
export type CoverId = 'hardcover' | 'softcover'

export const SIZES: { id: SizeId; label: string; blurb: string; base: number; step: number; image: string }[] = [
  { id: '8x8', label: '8" × 8"', blurb: 'Perfect for everyday moments', base: 29.99, step: 12, image: '/images/8.5x8.5-inches-photobook.png' },
  { id: '10x10', label: '10" × 10"', blurb: 'Our most popular size', base: 39.99, step: 16, image: '/images/10x10-inches-photobook.png' },
  { id: '12x12', label: '12" × 12"', blurb: 'Great for big stories', base: 49.99, step: 20, image: '/images/12x12-inches-photobook.png' },
]

export const PAGE_COUNTS: PageCount[] = [20, 40, 60, 80, 100]
export const MIN_PAGES = 20
export const MAX_PAGES = 100

export const COVERS: { id: CoverId; label: string; blurb: string; adjust: number }[] = [
  { id: 'hardcover', label: 'Hardcover', blurb: 'Durable and premium with a luxurious finish.', adjust: 0 },
  { id: 'softcover', label: 'Softcover', blurb: 'Lightweight and budget-friendly.', adjust: -10 },
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

export const PROMOS: Record<string, { label: string; percent: number }> = {
  PIXOVO10: { label: '10% off', percent: 10 },
  WELCOME15: { label: '15% off your first book', percent: 15 },
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
