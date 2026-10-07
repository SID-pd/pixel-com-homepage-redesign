import { IntroSplash } from '@/components/pixel/intro-splash'
import { SiteNav } from '@/components/pixel/site-nav'
import { Hero } from '@/components/pixel/hero'
import { ValueStrip } from '@/components/pixel/value-strip'
import { Products } from '@/components/pixel/products'
import { HowItWorks } from '@/components/pixel/how-it-works'
import { FactoryTour } from '@/components/pixel/factory-tour'
import { CoverStudio } from '@/components/pixel/cover-studio'
import { Templates } from '@/components/pixel/templates'
import { GiftBanner } from '@/components/pixel/gift-banner'
import { AppPromo } from '@/components/pixel/app-promo'
import { Reviews } from '@/components/pixel/reviews'
import { FinalCta, SiteFooter } from '@/components/pixel/final-cta'

export default function Page() {
  return (
    <>
      <IntroSplash />
      <SiteNav />
      <main className="space-y-8 md:space-y-12">
        <Hero />
        <ValueStrip />
        <Products />
        <GiftBanner />
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
