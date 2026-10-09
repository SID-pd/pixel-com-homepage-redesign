# Pixovo "pixel" design system reference

No separate design-token doc exists elsewhere — this file summarizes what's defined in code so new pages stay consistent. Source of truth is always `app/globals.css` + `components/content/blocks.tsx`; update this file if those change.

## Colors — `app/globals.css` (`:root`, OKLCH, light mode only)

| Token | Value | Use |
|---|---|---|
| `background` / `foreground` | warm off-white / near-black ink | page bg / body text |
| `primary` / `primary-foreground` | near-black / off-white | inverse of background |
| `secondary`, `muted` | warm light tan | alternating section bg, muted UI |
| `muted-foreground` | mid gray-brown | secondary text |
| `accent` / `accent-foreground` | **terracotta `oklch(0.63 0.14 42)`** / off-white | brand color — CTAs, links, icons, focus ring |
| `card`, `popover` | near-white | elevated surfaces |
| `ink` / `ink-foreground` | dark / off-white | dark panels (CtaBand, footer) |
| `border`, `input`, `ring` | ink at low opacity | borders / focus |
| `destructive` | red | errors only |
| `mint`, `butter`, `sky`, `rose` | defined but **not wired into `@theme`** — available as raw CSS vars only, not Tailwind classes |

Use Tailwind classes (`bg-accent`, `text-muted-foreground`, etc.) — never hardcode hex/oklch in new components.

## Typography

- One family everywhere: **Poppins** (400/500/600/700), loaded in `app/layout.tsx`, exposed as `--font-poppins`.
- `font-sans`, `font-serif`, `font-display`, `font-heading` all alias Poppins — using any of them is fine, `font-serif` is just a historical name.
- Headings are forced bold: `h1,h2,h3,.font-serif → font-weight:700; letter-spacing:-0.02em`. `h4-h6 → 600`.
- Scale used across existing sections:
  - Hero H1: `text-4xl sm:text-5xl md:text-6xl leading-[1.05] tracking-tight`
  - Section H2: `text-3xl md:text-4xl leading-tight tracking-tight`
  - Body: `text-lg text-muted-foreground leading-relaxed`
  - Eyebrow label: `text-xs font-semibold uppercase tracking-[0.14em] text-accent`

## Spacing & layout

- Page content container: `mx-auto max-w-6xl`
- Section side padding: `px-5 md:px-6`
- Section vertical padding: `py-14 md:py-20`
- Section header block (eyebrow+title+description): `mb-10 md:mb-14`, capped at `max-w-2xl`
- Alternate section backgrounds with `bg-secondary/50` (the `Section` component's `tone="soft"`) instead of a new color

## Radius & shadow

- Base `--radius: 1rem`, scaled tokens: `rounded-sm/md/lg/xl/2xl/3xl/4xl` (via `--radius-*`)
- Cards/images commonly use `rounded-[2rem]` or `rounded-3xl`
- Two shadow tokens: `shadow-float` (card-level), `shadow-lift` (bigger elevation, e.g. big CTAs/panels)

## Reusable section primitives — `components/content/blocks.tsx`

Build new pages out of these instead of hand-rolling markup:

- `MarketingShell` — wraps page content with `SiteNav` (fixed) + `SiteFooter`
- `PageHero` — `{ eyebrow, title, description, actions, image, imageAlt, align }`
- `Section` — `{ eyebrow, title, description, tone: 'plain'|'soft', className, id }`
- `CtaBand` — dark closing CTA band, `{ title, description, cta, href }`
- `Eyebrow`, `Reassurance`, `CheckList`, `IconTile` — small recurring pieces (badges, the 3-item trust row, checklists, icon tiles)

Homepage-specific sections (hero, products, reviews, etc.) live in `components/pixel/*` if you want more visual patterns to copy (tilt cards, marquee/scrolling cards, reveal-on-scroll animation via `reveal.tsx`).

## Buttons / CTAs

- `components/ui/button.tsx` — shadcn `class-variance-authority` button, use its variants rather than ad hoc button styling
- `components/pixel/cta-link.tsx` — `CtaLink` wraps links styled as buttons, has an `accent` variant + `magnetic` hover effect, used for primary CTAs like in `CtaBand`
