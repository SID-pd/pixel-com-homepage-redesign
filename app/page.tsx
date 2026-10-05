import { IntroSplash } from '@/components/pixel/intro-splash'
import { SiteNav } from '@/components/pixel/site-nav'
import { Hero } from '@/components/pixel/hero'
import { ValueStrip } from '@/components/pixel/value-strip'
import { Products } from '@/components/pixel/products'
import { HowItWorks } from '@/components/pixel/how-it-works'
import { CoverStudio } from '@/components/pixel/cover-studio'
import { Templates } from '@/components/pixel/templates'
import { GiftBanner } from '@/components/pixel/gift-banner'
import { Reviews } from '@/components/pixel/reviews'
import { FinalCta, SiteFooter } from '@/components/pixel/final-cta'

export default function Page() {
  return (
    <>
      <IntroSplash />
      <SiteNav />
      <main>
        <Hero />
        <ValueStrip />
        <Products />
        <HowItWorks />
        <CoverStudio />
        <Templates />
        <GiftBanner />
        <Reviews />
        <FinalCta />
      </main>
      <SiteFooter />
    </>
  )
}
