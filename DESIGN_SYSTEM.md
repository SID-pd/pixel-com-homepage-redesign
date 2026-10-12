# Pixovo "pixel" design system reference

No separate design-token doc exists elsewhere — this file summarizes what's defined in code so new pages stay consistent. Source of truth is always `app/globals.css` + `components/content/blocks.tsx`; update this file if those change.

## Colors — `app/globals.css` (`:root`, light mode only)

Exact hex values copied from live pixovo.com (`demo.css` `--demo-*` tokens), so the redesign matches the production brand.

| Token | Value | Use |
|---|---|---|
| `background` | cream `#f7f4f0` | page bg, cream bands |
| `card`, `popover` | white `#ffffff` | cards, white bands, footer |
| `foreground`, `primary` | navy `#16324f` | headings, body text, primary (navy) buttons |
| `primary-foreground` | cream `#f7f4f0` | text on navy |
| `secondary`, `muted` | warm light tan | subtle fills, muted UI |
| `muted-foreground` | `#5a6b7b` | paragraphs, footer links |
| `accent` / `accent-foreground` | **teal `#0ba28d`** / white | brand color — highlights, links, icons, focus ring |
| `border` / `input` | `#ece4d6` / `#e3dccd` | borders, inputs |
| `ring` | teal `#0ba28d` | focus |
| `ink` / `ink-foreground` | dark / off-white | dark panels (How It Works, blog article CTA box) |
| `destructive` | red | errors only |
| `mint`, `butter`, `sky`, `rose` | `#d6e7d2`, `#f6e2a8`, `#cfe3ec`, `#d98a86` | raw CSS vars (intro splash confetti), not Tailwind classes |
| `brand-teal-dark` | `#166358` | teal hover |
| `brand-cta` | `#17998a` | teal CTA cards |
| `brand-story` | `#f8efe7` | warm story band |
| `brand-cream-2`, `brand-pink` | `#f6efe1`, `#f3d6d6` | extra live-site surfaces |
| `brand-star`, `brand-star-empty` | `#f5b100`, `#e2ddd0` | review stars |

`brand-*` tokens are mapped in `@theme inline`, so `bg-brand-cta`, `bg-brand-story` etc. work. Don't name new tokens `--pix-*`: that prefix belongs to the Pixie chat widget (`components/AIOrderChat`).

Use Tailwind classes (`bg-accent`, `text-muted-foreground`, etc.) — never hardcode hex/oklch in new components. No orange/terracotta outside the seasonal autumn section.

### Background utilities (`globals.css`)

- `bg-hero-bubbles` — cream with pixovo.com's pastel hero circles (smaller set under 768px). Used by the homepage hero and `PageHero`.
- `bg-cta-bubbles` — teal `#17998a` with translucent white circles. Used by the homepage final CTA card and `CtaBand`.
- `alt-sections` — on a `<main>`, makes its direct `<section>` children alternate cream (odd) / white (even). `MarketingShell` sets it, so content pages alternate automatically.

## Typography

- One family everywhere: **Poppins** (400/500/600/700), loaded in `app/layout.tsx`, exposed as `--font-poppins`.
- `font-sans`, `font-serif`, `font-display`, `font-heading` all alias Poppins — using any of them is fine, `font-serif` is just a historical name.
- Headings are forced bold: `h1,h2,h3,.font-serif → font-weight:700; letter-spacing:-0.02em`. `h4-h6 → 600`.
- Sizes match the old pixovo.com site (smaller than the first redesign):
  - Hero H1 (homepage + `PageHero`): `text-[36px] md:text-[45px] leading-[1.08]`
  - Section H2 (`SectionHeading`, seasonal): `text-[30px] md:text-[40px] leading-[1.1]`; content-page `Section` H2: `text-3xl md:text-4xl`
  - CTA H2: `md:text-[44px]`
  - Step titles (How It Works): `text-xl md:text-2xl`
  - Hero paragraph: `text-lg` (18px); section intro paragraphs: `text-base` (16px), `text-muted-foreground leading-relaxed`
  - Eyebrow label: `text-xs font-semibold uppercase tracking-[0.14em] text-accent`

## Spacing & layout

- Page content container: `mx-auto max-w-6xl`
- Section side padding: `px-5 md:px-6`
- **Homepage:** vertical spacing comes only from the full-width bands in `app/page.tsx` (`py-10 md:py-14`). Section components don't add their own outer `py`/`my`; when two sections share a band, the second adds `pt-12 md:pt-16` (Products, Cover studio).
- **Content pages:** `Section` is `py-12 md:py-16`; its header block is `mb-8 md:mb-10`, capped at `max-w-2xl`. `PageHero` bottom `pb-10 md:pb-14` (top padding clears the fixed nav). `CtaBand` card `py-12 md:py-16`.
- Heading block gaps: eyebrow → title → description `gap-3`; hero column `gap-4`.
- Card grids: `gap-5 md:gap-6`, `mt-8` below the section heading.
- Section backgrounds alternate cream / white like pixovo.com. On content pages this is automatic (`alt-sections` on `MarketingShell`), so `Section`'s `tone` prop no longer changes the color. On the homepage, `app/page.tsx` wraps sections in full-width `flow-root` bands (cream, white, cream, white, story `#f8efe7`, …).

## Radius & shadow

- Base `--radius: 1rem`, scaled tokens: `rounded-sm/md/lg/xl/2xl/3xl/4xl` (via `--radius-*`)
- Cards/images commonly use `rounded-[2rem]` or `rounded-3xl`
- Two shadow tokens: `shadow-float` (card-level), `shadow-lift` (bigger elevation, e.g. big CTAs/panels)

## Reusable section primitives — `components/content/blocks.tsx`

Build new pages out of these instead of hand-rolling markup:

- `MarketingShell` — wraps page content with `SiteNav` (fixed) + `SiteFooter` (light: white, top border, navy headings, teal hovers)
- `PageHero` — `{ eyebrow, title, description, actions, image, imageAlt, align }`, on `bg-hero-bubbles`
- `Section` — `{ eyebrow, title, description, tone, className, id }` (background comes from `alt-sections`)
- `CtaBand` — teal bubble CTA card (`bg-cta-bubbles`, white text, navy button), `{ title, description, cta, href }`
- `Eyebrow`, `Reassurance`, `CheckList`, `IconTile` — small recurring pieces (badges, the 3-item trust row, checklists, icon tiles)

Homepage-specific sections (hero, products, reviews, etc.) live in `components/pixel/*` if you want more visual patterns to copy (tilt cards, marquee/scrolling cards, reveal-on-scroll animation via `reveal.tsx`).

## Buttons / CTAs

- `components/ui/button.tsx` — shadcn `class-variance-authority` button, use its variants rather than ad hoc button styling
- `components/pixel/cta-link.tsx` — `CtaLink` wraps links styled as buttons, variants `primary` (navy), `accent` (teal), `secondary`, `light`, + `magnetic` hover effect; use `primary` on teal backgrounds
