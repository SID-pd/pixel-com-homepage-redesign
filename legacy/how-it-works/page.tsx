'use client'

import { SiteNav } from '@/components/pixel/site-nav'
import { SiteFooter } from '@/components/pixel/final-cta'
import { HowItWorks } from '@/components/pixel/how-it-works'
import { CtaLink } from '@/components/pixel/cta-link'
import { Check, CloudUpload, Palette, Sparkles, Truck, Wand2 } from 'lucide-react'

export default function HowItWorksPage() {
  return (
    <>
      <SiteNav />
      <main className="min-h-screen bg-background pt-32 sm:pt-40 pb-20 md:pb-28">
        {/* Top Intro Section */}
        <section className="px-4 sm:px-6 md:px-8 text-center max-w-4xl mx-auto mb-12">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-accent mb-4">
            <Sparkles className="size-3.5" />
            Designed for Simplicity
          </span>
          <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-foreground">
            How Pixovo <em className="text-accent">Works</em>
          </h1>
          <p className="mt-4 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            From camera roll to coffee table in four simple steps. No design experience needed — our smart layout assistant handles the heavy lifting while you stay in complete creative control.
          </p>
        </section>

        {/* Core Interactive HowItWorks Component */}
        <HowItWorks />

        {/* Detailed Breakdown Features */}
        <section className="mt-20 max-w-6xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="font-serif text-3xl font-bold text-foreground">Why People Love Creating with Pixovo</h2>
            <p className="text-xs text-muted-foreground mt-2">Built for parents, travelers, couples, and memory keepsakes.</p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-3xl bg-card border border-foreground/10 p-6 shadow-xs">
              <span className="grid size-10 place-items-center rounded-2xl bg-accent/10 text-accent mb-4">
                <Wand2 className="size-5" />
              </span>
              <h3 className="font-serif text-xl font-bold text-foreground">AI Smart Layouts</h3>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                Upload 50 or 500 photos. Our layout engine analyzes timestamps, image quality, and face detection to arrange your book in seconds.
              </p>
            </div>

            <div className="rounded-3xl bg-card border border-foreground/10 p-6 shadow-xs">
              <span className="grid size-10 place-items-center rounded-2xl bg-accent/10 text-accent mb-4">
                <Palette className="size-5" />
              </span>
              <h3 className="font-serif text-xl font-bold text-foreground">Complete Customization</h3>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                Fine-tune every page. Swap photos, adjust margins, choose cover colors, or add personal captions with custom fonts.
              </p>
            </div>

            <div className="rounded-3xl bg-card border border-foreground/10 p-6 shadow-xs">
              <span className="grid size-10 place-items-center rounded-2xl bg-accent/10 text-accent mb-4">
                <Truck className="size-5" />
              </span>
              <h3 className="font-serif text-xl font-bold text-foreground">California Printing</h3>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                Printed in California with archival-grade paper and heavy-duty hardcover binding built to last for generations.
              </p>
            </div>
          </div>

          <div className="mt-16 text-center">
            <CtaLink href="/photo-book/" size="lg">
              Start Your Photo Book Now
            </CtaLink>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  )
}
