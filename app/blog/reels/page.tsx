'use client'

import { SiteNav } from '@/components/pixel/site-nav'
import { SiteFooter } from '@/components/pixel/final-cta'
import { ReelsFeedSection } from '@/components/pixel/reels-feed'

export default function BlogReelsPage() {
  return (
    <>
      <SiteNav />
      <main className="min-h-screen bg-background pt-28 pb-20 px-4 md:px-6">
        <div className="mx-auto max-w-6xl">
          {/* Main Interactive Shorts & Reels Feed */}
          <ReelsFeedSection />
        </div>
      </main>
      <SiteFooter />
    </>
  )
}
