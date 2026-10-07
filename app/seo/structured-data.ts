/**
 * JSON-LD structured data, per route.
 *
 * Values come from Pixovo_Meta_Schema_Reference_v2. Every fact here is one that
 * the reference doc verified against live site copy — nothing is estimated.
 *
 * Two things are deliberately omitted, per that doc:
 *   - Product "offers"/price: Google requires price data to be real and current.
 *     Publishing an estimate risks a Search Console structured-data error. Add an
 *     AggregateOffer (lowPrice/highPrice, priceCurrency "USD") once live pricing
 *     is confirmed.
 *   - "aggregateRating": the on-site testimonials are too few and self-hosted to
 *     mark up safely. Pull this from Trustpilot once that integration is live.
 *   - WebSite "SearchAction": only valid if a real on-site search endpoint exists.
 *
 * Rendered by src/app/head.tsx, so these land in the prerendered HTML of each
 * static route rather than appearing only after hydration.
 */

const SITE = "https://pixovo.com";

const ORG_DESCRIPTION =
  "Pixovo is an AI powered photo book company that automatically designs custom square photo books from your uploaded photos, printed and shipped from the USA.";

const PRODUCT_DESCRIPTION =
  "Custom square photo books (8x8, 10x10, 12x12) designed automatically by AI from your uploaded photos, printed and shipped from the USA.";

/** Real address and contact details, taken from the live Contact Us page. */
const POSTAL_ADDRESS = {
  "@type": "PostalAddress",
  addressLocality: "Poway",
  addressRegion: "CA",
  addressCountry: "US",
};

const CONTACT_POINT = {
  "@type": "ContactPoint",
  telephone: "+1-619-701-6222",
  email: "hello@pixovo.com",
  contactType: "customer support",
  areaServed: "US",
  availableLanguage: "English",
};

/**
 * The reference doc notes the ContactPoint and address are worth merging into
 * the main Organization entity rather than living only on the contact page, so
 * this single definition is reused by both.
 */
const ORGANIZATION = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Pixovo",
  url: `${SITE}/`,
  logo: `${SITE}/images/pixovo.png`,
  description: ORG_DESCRIPTION,
  address: POSTAL_ADDRESS,
  contactPoint: CONTACT_POINT,
  sameAs: [
    "https://www.facebook.com/mypixovo/",
    "https://x.com/mypixovo",
    "https://www.instagram.com/mypixovo/",
  ],
};

const WEBSITE = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Pixovo",
  url: `${SITE}/`,
};

const HOME_PRODUCT = {
  "@context": "https://schema.org",
  "@type": "Product",
  name: "Pixovo AI Designed Photo Book",
  description: PRODUCT_DESCRIPTION,
  brand: { "@type": "Brand", name: "Pixovo" },
};

const ABOUT_PAGE = {
  "@context": "https://schema.org",
  "@type": "AboutPage",
  name: "About Pixovo",
  url: `${SITE}/about-us/`,
  mainEntity: {
    "@type": "Organization",
    name: "Pixovo",
    url: `${SITE}/`,
  },
};

/**
 * The four steps mirror the homepage "Create your book in minutes" section,
 * which is the only place this flow is confirmed to exist.
 */
const HOW_TO = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  name: "How to Make a Photo Book With Pixovo",
  step: [
    {
      "@type": "HowToStep",
      position: 1,
      name: "Select Size & Pages",
      text: "Choose your photo book size and page count.",
    },
    {
      "@type": "HowToStep",
      position: 2,
      name: "Upload Your Photos",
      text: "Drag and drop your favorite photos from any device or social media platform.",
    },
    {
      "@type": "HowToStep",
      position: 3,
      name: "Customize With AI",
      text: "The AI analyzes your photos and automatically organizes them into layouts; fine-tune colors, text, or themes.",
    },
    {
      "@type": "HowToStep",
      position: 4,
      name: "Print & Get Delivered",
      text: "Your photobook is printed and delivered to your door.",
    },
  ],
};

const PRICING_PRODUCT = {
  "@context": "https://schema.org",
  "@type": "Product",
  name: "Pixovo Custom Photo Book",
  description:
    "AI designed square photo books available in 8x8, 10x10, and 12x12 sizes, printed and shipped from the USA.",
  brand: { "@type": "Brand", name: "Pixovo" },
};

const CONTACT_PAGE = {
  "@context": "https://schema.org",
  "@type": "ContactPage",
  name: "Contact Pixovo",
  url: `${SITE}/contact-us/`,
  mainEntity: ORGANIZATION,
};

/**
 * Keys are canonical paths (with trailing slash) as produced by
 * canonicalPath() in head.tsx.
 */
const SCHEMA_BY_PATH: Record<string, object[]> = {
  "/": [ORGANIZATION, WEBSITE, HOME_PRODUCT],
  "/about-us/": [ABOUT_PAGE],
  "/how-it-works/": [HOW_TO],
  "/pricing/": [PRICING_PRODUCT],
  "/contact-us/": [CONTACT_PAGE],
};

/** JSON-LD blocks for a canonical path, or an empty array if none apply. */
export const schemaForPath = (path: string): object[] =>
  SCHEMA_BY_PATH[path] ?? [];
