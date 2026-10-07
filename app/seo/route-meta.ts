/**
 * Per-route title and description, from Pixovo_Meta_Schema_Reference_v2.
 *
 * These are FALLBACKS. seoData from the API always wins (see head.tsx), so the
 * CMS-driven [slug] pages — how-it-works, pricing, about-us, faq, help-center,
 * shipping-info, terms — keep whatever the database supplies and are absent from
 * the map below on purpose. They receive schema only.
 *
 * Why they are still worth having: seoData is populated in a useEffect after the
 * API responds, so it is not in the prerendered HTML of a static export. A
 * crawler that does not execute JS previously saw the same generic title on every
 * URL. These entries put the correct copy in the served HTML for the routes that
 * have no CMS record of their own.
 *
 * House style: no hyphens and no pipe characters in titles or descriptions —
 * "Word | Word" and "Word — Word" separators read as machine generated. Use
 * ordinary prose and commas instead. Keep titles under ~60 characters and
 * descriptions under ~155 so neither is truncated in search results.
 */

export interface RouteMeta {
  title: string;
  description: string;
}

/**
 * Site-wide fallback, used when a route has no entry below and the API has not
 * returned SEO data yet. Previously "Create Your Photobook - Pixovo AI Photo
 * Books", which contained a hyphen and was emitted identically on every page.
 */
export const DEFAULT_META: RouteMeta = {
  // 56 chars
  title: "Pixovo AI Photo Book Maker for Custom Square Photo Books",
  // 143 chars. "50,000+ customers" and USA printing are live on-page claims.
  description:
    "Upload your photos and let Pixovo's AI design a custom square photo book in minutes. Loved by 50,000+ customers. Printed in the USA. Start free.",
};

const ROUTE_META: Record<string, RouteMeta> = {
  "/": DEFAULT_META,

  // 40 chars / 134 chars. Address and reply window are real, from the live page.
  "/contact-us/": {
    title: "Contact the Pixovo Customer Support Team",
    description:
      "Reach the Pixovo team by phone, email, or contact form. Based in Poway, CA, we reply within 24 hours to help with your photo book order.",
  },

  // 51 chars / 122 chars.
  "/blog/": {
    title: "Photo Book Tips, Guides and Inspiration from Pixovo",
    description:
      "Guides, tips, and real ideas for making a photo book you'll actually finish, from AI design basics to occasion inspiration.",
  },
};

/** Fallback meta for a canonical path, defaulting to the site-wide copy. */
export const metaForPath = (path: string): RouteMeta =>
  ROUTE_META[path] ?? DEFAULT_META;
