import type { Metadata } from 'next'
import { JsonLd } from '@/components/content/blocks'
import { COVERS, SIZES } from '@/lib/flow/catalog'
import { unitPrice } from '@/lib/flow/pricing'
import { IntroSplash } from '@/components/pixel/intro-splash'
import { SiteNav } from '@/components/pixel/site-nav'
import { Hero } from '@/components/pixel/hero'
import { ValueStrip } from '@/components/pixel/value-strip'
import { Products } from '@/components/pixel/products'
import { HowItWorks } from '@/components/pixel/how-it-works'
import { FactoryTour } from '@/components/pixel/factory-tour'
import { CoverStudio } from '@/components/pixel/cover-studio'
import { Templates } from '@/components/pixel/templates'
import { SeasonalSection } from '@/components/pixel/seasonal-section'
import { AppPromo } from '@/components/pixel/app-promo'
import { Reviews } from '@/components/pixel/reviews'
import { FinalCta, SiteFooter } from '@/components/pixel/final-cta'

export const metadata: Metadata = {
  title: 'Premium Custom Photo Books Made in the USA | Pixovo',
  description:
    'Design a premium custom photo book with smart auto-layout. Design free, pay only to print. Printed and shipped from our California factory.',
  alternates: { canonical: '/' },
  openGraph: { url: '/', title: 'Premium Custom Photo Books Made in the USA | Pixovo' },
}

const SITE = 'https://pixovo.com'

// Structured data uses only facts we can stand behind: no rating, no review count. Prices are LIST prices (what anyone pays
// without a sale code), so the markup never disagrees with the page. Sale prices live in the sale calendar (lib/flow/catalog.ts).
const organization = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Pixovo',
  url: SITE,
  logo: `${SITE}/images/pixovo-logo.png`,
  description: 'Custom photo books designed with smart auto-layout and printed and shipped from our California factory.',
  address: { '@type': 'PostalAddress', addressLocality: 'Poway', addressRegion: 'CA', postalCode: '92064', addressCountry: 'US' },
  contactPoint: [
    { '@type': 'ContactPoint', contactType: 'customer support', telephone: '+1-619-701-6222', email: 'hello@pixovo.com', areaServed: 'US', availableLanguage: 'English' },
  ],
  sameAs: ['https://www.facebook.com/mypixovo/', 'https://www.instagram.com/mypixovo/', 'https://x.com/mypixovo'],
}

const website = { '@context': 'https://schema.org', '@type': 'WebSite', name: 'Pixovo', url: SITE }

const products = SIZES.map((s) => ({
  '@context': 'https://schema.org',
  '@type': 'Product',
  name: `${s.label.replace(/"/g, ' in')} Custom Photo Book`.replace('×', 'x'),
  description: `A custom ${s.label.replace(/"/g, ' in')} square photo book, printed and shipped from California. Softcover or hardcover, 20 to 100 pages.`,
  image: `${SITE}${s.image}`,
  brand: { '@type': 'Brand', name: 'Pixovo' },
  offers: {
    '@type': 'AggregateOffer',
    priceCurrency: 'USD',
    lowPrice: unitPrice({ size: s.id, pages: 20, cover: COVERS[1].id }).toFixed(2),
    highPrice: unitPrice({ size: s.id, pages: 100, cover: COVERS[0].id }).toFixed(2),
    availability: 'https://schema.org/InStock',
    url: `${SITE}/photo-book/?size=${s.id}`,
    seller: { '@type': 'Organization', name: 'Pixovo' },
  },
}))

export default function Page() {
  return (
    <>
      <JsonLd data={[organization, website, ...products]} />
      <IntroSplash />
      <SiteNav />
      <main className="space-y-8 md:space-y-12">
        <Hero />
        <ValueStrip />
        <Products />
        <SeasonalSection />
        <HowItWorks />
        <FactoryTour />
        <CoverStudio />
        <Templates />
        <AppPromo />
        <Reviews />
        <FinalCta />
      </main>
      <SiteFooter />
    </>
  )
}
