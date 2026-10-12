# Tasks — assigned by Mihir (2026-10-12)

Working list of tasks assigned today. Checking off as each is completed; notes capture anything that needs clarification before starting.

- [ ] **GMB reviews** — "we want gmb reviews for them find out the way or fake rev..."
  Find a way to get Google My Business reviews for Pixovo.
  ⚠️ Note: `CLAUDE.md`'s agreed claims policy explicitly forbids publishing unverified ratings/review counts on the site. Need to clarify with Mihir whether this means pursuing **real** reviews (outreach/process) — fabricating reviews isn't something I'll implement.

- [x] **Add and merge this section** — done
  Merged the "AI Photo Book Maker" hero block and the "Your photos deserve more than a camera roll" block on the `/photo-book` intro page into one full-width cinematic hero (`components/flow/photo-book-intro.tsx`), using `public/images/photo-book-hero-banner.jpg` (compressed from 11MB to 170KB) as the background with a dark gradient + dim overlay. Single CTA, no duplicate headings.

- [x] **Blog page banner redesign** — done
  The blog page (and its 3 topic sub-pages: ideas/how-to/text) had no visual banner at all — just plain text, and the `description` prop was being passed in but silently never rendered (bug). Replaced the bare header with the shared `PageHero` component (`components/content/blog-collection.tsx`), same pattern used on about-us/pricing/etc: pastel bubble background, eyebrow, title, and now the description actually shows. Used the existing `hero-book.png` image as the side photo since no new banner asset was supplied — can swap for a dedicated blog image if you drop one in Downloads.

- [x] **Cover Studio color labels** — done
  Fixed a bigger issue found while scoping this: the section named options as fabric types ("Oat Linen", "Cognac Leather") but the real product (`lib/flow/catalog.ts`) only offers Hardcover/Softcover — no fabric choice exists. Renamed all 4 swatches to color-only names (Oat/Charcoal/Cognac/Sage), updated the section description and "Cover material" → "Cover color" legend to drop the fabric claim, updated the CTA button text, and removed the "170gsm" spec (also not a real claim) — grid adjusted from 3 to 2 columns (`components/pixel/cover-studio.tsx`).

- [ ] **Main banner CTA URL**
  Change the destination URL of the "Create Your Photo Book" button on the main hero banner.
  Need the new target URL from Mihir.

- [x] **Remove "California" from the website** — done
  Audited every live file (`.tsx`, content JSON/TS data). Fixed 9 files: `hero.tsx`, `how-it-works.tsx`, `factory-tour.tsx` (5 spots, incl. the matching "since 2003" claim), `comparison.tsx`, `gift-banner.tsx`, `seasonal-section.tsx`, `app/layout.tsx`, `app/page.tsx` (metadata + per-product JSON-LD), and `lib/content/themes.ts`. Also fixed one blog article's "Quick Snapshot" claim by editing the real source (`pixovo.cms_page.json`) and re-running `extract-content.mjs` + `build-sitemap.mjs`, not hand-editing the generated JSON.
  Deliberately left untouched: (1) `legacy/*` and `src/Components/*` — dead code, not part of the live build; (2) the Organization schema's `addressRegion: 'CA'` in `app/page.tsx` — that's a literal business address field, not a marketing claim; (3) the privacy policy's "courts of California" jurisdiction clause — a legal disclosure, not a factory claim; (4) two competitor mentions in the "Best Online Photo Book Services" blog post (Mixbook/Zazzle HQ in Redwood City, CA) — factual third-party info, not about Pixovo.

- [ ] **Font change and size change**
  General font/size adjustment — need clarification: which section(s), and what the new font/sizes should be.

---
*Source: task list screenshot from project management tool, assigned by Mihir, 2026-10-12.*
