# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

Package manager is pnpm (`packageManager` in package.json; both `pnpm-lock.yaml` and `package-lock.json` exist).

```bash
pnpm dev      # next dev
pnpm build    # next build
pnpm start    # next start
```

There is no lint script and no test runner configured. `next.config.mjs` sets `typescript.ignoreBuildErrors: true` and `images.unoptimized: true`, so `next build` will **not** catch type errors — run `npx tsc --noEmit` to check types.

## Architecture

Pixovo is a custom photo-book e-commerce site (Next.js App Router, React 19, Tailwind CSS v4, TypeScript with `@/*` mapped to the repo root). It is a homepage redesign grafted onto the older Pixovo storefront, so two generations of code coexist:

- **New "pixel" design layer** — `components/pixel/*`, `app/page.tsx`, `app/globals.css`. The homepage is a flat composition of section components (`Hero`, `Products`, `HowItWorks`, `Reviews`, …) wrapped by `SiteNav`/`SiteFooter` (`SiteFooter` is exported from `final-cta.tsx`). Styling is Tailwind v4 with design tokens defined in `app/globals.css` (`@theme inline` mapping to CSS vars), shadcn/`class-variance-authority` UI in `components/ui`, `motion` for animation, and a single font family, **Poppins** (400/500/600/700, same as the live pixovo.com), loaded in `app/layout.tsx` as `--font-poppins`. `--font-sans/serif/display/brand/heading` all alias it, so `font-serif` classes render Poppins. Only the editor route loads extra book-text fonts (`app/photo-book/editor/layout.tsx`).
- **Legacy storefront** — `components/header.tsx`, `components/footer.tsx`, step/modal components, plus the route folders (`photo-book`, `cart`, `checkout`, `order*`, `profile`, `auth`, `blog`, …), many of which are large single-file pages with colocated CSS (e.g. `photo-book/photo-book.css`) and Bootstrap/FontAwesome. Some pages use the legacy `Header`/`Footer`, others use pixel `SiteNav`/`PageShell` — check which a page uses before restyling it. `src/Components` mirrors `components/`; the `@/` alias resolves to the root `components/`, so edit that one.
- **Content pages** (blog, terms, privacy, FAQ, help center, how-it-works, about, pricing, shipping, contact, `/photobook`) are native pixel pages in `app/*` using `components/content/*` (`MarketingShell`, `PageHero`, `Section`, `CtaBand`, `FaqAccordion`, `LegalDocument`, `ArticleView`). `pixovo.cms_page.json` is the **source of truth for the original copy**; `node scripts/extract-content.mjs` turns it into `lib/content/{articles,legal,faq}.json` (typed via `lib/content/index.ts`) with links, images, prices and headings cleaned. Re-run it after editing the JSON, then `node scripts/build-sitemap.mjs`. Never hand-edit the generated JSON. Blog topics/covers are in `lib/content/blog.ts`. Prices on pricing/shipping come from `lib/flow/catalog.ts`. `components/pixel/cms-page-render.tsx` and `lib/cms.ts` are unused legacy.

### Native buy flow (front-end only, mock backend)

`/photo-book` → `/photo-book/editor` → `/cart` → `/checkout` → `/thank-you` (+ `/track-order`) is a native pixel-styled flow with **no backend calls**. It replaced the old iframe/Bootstrap pages; untracked originals are backed up in `legacy/` (excluded from `tsconfig`). `/element-editing` and `components/step1-3.tsx` are the old backend-wired editor and are untouched.

- `lib/flow/` holds everything: `catalog.ts` (sizes, **prices**, covers, templates, shipping, promos — the one place to correct pricing), `pricing.ts`, `layouts.ts` (spread layouts + `autoBuild`), `store.ts` (single `useSyncExternalStore` store: draft/cart/orders/user, persisted to localStorage; uploaded photo data in IndexedDB via `images.ts`; undo/redo history), `mock-api.ts` (the one seam to swap for `apiCall()` when the backend exists).
- UI is in `components/flow/*` (wizard, cart, checkout, thank-you) and `components/flow/editor/*` (canvas, panels, inspector). The editor shows **one page at a time** (left or right half of a spread, or the cover); items keep spread coordinates and `EditorCanvas` just windows into them (`side` prop, `PageSide`). Pages are opened from the **All pages** view (`PagesPanel`: a right-hand panel on desktop/tablet, a full-screen overview on mobile with Pages ↔ page navigation); there is no free prev/next flipping. The editor uses one tree with three modes chosen by `use-media.ts`: **desktop** = light tool rail + left tool/inspector panel (photos, layouts, text tools, …) + centre (Undo/Redo/Add Pages/Clear Pages/Delete Pages toolbar, spread with the active page outlined, spread navigator + zoom + hand tool) + right pages strip (`pages-sidebar.tsx`: list/grid, drag to reorder, ••• menu); tablet = slide-over panel; mobile = All pages screen ↔ single page with bottom sheet. Text styling lives in `text-tools.tsx`.
- Accounts (mock): `lib/flow/auth.ts` (salted-hash registry in localStorage + modal state), one `AuthModal` mounted in `app/providers.tsx` and opened anywhere with `openAuth(mode, {email, reason})`; `AccountMenu` is the header user icon; `/account` lists orders. Swap `mockSignIn/mockSignUp/mockRequestReset` in `mock-api.ts` for the real endpoints later. The legacy `sign-in-modal.tsx`/`sign-up-modal.tsx` and `ModalContext` are unused by the new pages.
- **Prices and sales** (one place: `lib/flow/catalog.ts`): `SIZES`/`COVERS` hold **list prices** (20-page softcover $39.99 / $59.99 / $79.99). `CAMPAIGNS` is the dated sale calendar (FALL50, HOLIDAY50, NEWYEAR50, SPRING50, SUMMER50, each 50% off between real start/end dates, US Pacific). `checkPromo()` is the only validator (checkout, cart, banner), so a code genuinely stops working on its end date; never show a deadline that is not in this calendar. Add next year's rows before they lapse. Every surface that shows a price uses `components/flow/offer-ui.tsx` (`PriceTag` list+sale+OFF badge, `LinePrice` for applied codes, `OfferStrip`, `OfferCtaLink` which adds `?promo=CODE`). The homepage top banner, product cards and seasonal section (`seasonal-section.tsx`) follow the active campaign via `lib/flow/use-campaign.ts`. Do not publish rating, review-count or competitor-price claims (see the unproven-claims rule below).
- **SEO/claims rules agreed with the owner:** history = California factory since 2003, Pixovo is its brand; guarantee wording "love it or we'll make it right"; delivery = ships out within 3–5 business days, delivered in 5–10 working days (express 3–6); AI wording = smart auto-layout in about a minute (no photo scoring claims until the AI backend exists); no rating/"50,000+"/"67% cheaper"/competitor tables. Homepage metadata and Organization/WebSite/Product schema are in `app/page.tsx` (list prices only, no ratings).
- Deep links: `/photo-book/?size=10x10` and `/photo-book/?template=<id>` (template ids in `catalog.ts`; the homepage `Templates` section uses the same data).
- Books are modelled as a cover + spreads (2 pages each) with items positioned in percent of the spread; page count is derived from the spread count.

### Data / backend layer

- `app/api/service/*` is the client-side API layer (not Next route handlers despite the path): `api-service.ts` exposes `apiCall()` against `NEXT_PUBLIC_API_URL`, attaching a Bearer token from encrypted local storage (`user` or `guest_user`, via `storage.ts`), with a 30s abort timeout and a retry for stale guest tokens. `cart-service.ts`, `guest.ts`, `pdf-storage.ts`, `strapi.ts` build on it. `strapi.ts` is a near-duplicate that talks to Strapi using `NEXT_PUBLIC_STRAPI_URL` / `NEXT_PUBLIC_STRAPI_API_TOKEN`.
- `app/api/pixie/route.ts` is the only real route handler: a Node-runtime proxy to Groq for the "Pixie" AI chat widget (`components/AIOrderChat`), keeping `GROQ_API_KEY` server-side and grounding answers in live catalog data fetched from the backend.
- Global client state lives in `app/context/*` (User, Loader, Modal, Logo), composed in `app/providers.tsx` (`ClientProviders`, which also wraps `GoogleOAuthProvider`) and mounted from `app/layout.tsx`.

### Environment variables

No `.env` example is committed (`.env*.local` is gitignored). Variables referenced in code: `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_BASE_URL`, `NEXT_PUBLIC_GOOGLE_CLIENT_ID`, `NEXT_PUBLIC_FACEBOOK_APP_ID`, `NEXT_PUBLIC_STRAPI_URL`, `NEXT_PUBLIC_STRAPI_API_TOKEN`, `NEXT_PUBLIC_PAYPAL_CLIENT_ID`, `NEXT_PUBLIC_AUTH_NET_*` / `NEXT_PUBLIC_AUTHORIZE_NET_*` (Authorize.net), and server-only `GROQ_API_KEY` / `GROQ_MODEL`.

### Misc

- The repo root holds large `.mp4` files and `reels_feed.html` used for hero/reels media; they are untracked working assets, not source.
- The intro splash is gated by `sessionStorage('pixovo-intro')` via an inline script in `app/layout.tsx` that sets `data-intro-seen` on `<html>`.
