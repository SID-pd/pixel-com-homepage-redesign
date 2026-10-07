'use client'

import Image from 'next/image'
import { SiteNav } from '@/components/pixel/site-nav'
import { SiteFooter } from '@/components/pixel/final-cta'
import { CtaLink } from '@/components/pixel/cta-link'
import { Award, Heart, Leaf, ShieldCheck, Sparkles, Star, Users } from 'lucide-react'

const stats = [
  { label: 'Happy Customers', value: '50,000+' },
  { label: 'Books Printed', value: '120,000+' },
  { label: 'Average Rating', value: '4.9 / 5.0' },
  { label: 'Years Printing', value: '20+ Years' },
]

export default function AboutUsPage() {
  return (
    <>
      <SiteNav />
      <main className="min-h-screen bg-background pt-36 sm:pt-44 pb-20 md:pb-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 md:px-8">
          
          {/* Hero Section */}
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-accent mb-4">
              <Heart className="size-3.5" />
              Our Story & Mission
            </span>
            <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-foreground">
              Transforming Camera Rolls into <br /><em className="text-accent">Keepsakes You’ll Hold</em>
            </h1>
            <p className="mt-4 text-base sm:text-lg text-muted-foreground leading-relaxed">
              Pixovo was founded with a simple goal: to make creating a custom photo book as fast, joyful, and stress-free as taking the photos themselves.
            </p>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 sm:p-8 rounded-3xl bg-ink text-ink-foreground shadow-lift mb-20 text-center">
            {stats.map((stat) => (
              <div key={stat.label} className="p-2">
                <span className="block font-serif text-3xl sm:text-4xl font-extrabold text-accent">
                  {stat.value}
                </span>
                <span className="text-xs text-ink-foreground/75 mt-1 block font-medium">
                  {stat.label}
                </span>
              </div>
            ))}
          </div>

          {/* Story Narrative Grid */}
          <div className="grid gap-12 lg:grid-cols-2 items-center mb-20">
            <div className="space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-accent">California Manufacturing</span>
              <h2 className="font-serif text-3xl sm:text-4xl font-bold text-foreground leading-tight">
                Direct from our Factory to Your Coffee Table
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Unlike online resellers who outsource printing to random third parties, every Pixovo photo book is printed, bound, and inspected under one roof in our Sunnyvale, California factory.
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                With over two decades of precision manufacturing heritage, we combine traditional bookbinding craftsmanship with cutting-edge AI layout software to ensure your memories stay vibrant for 100+ years.
              </p>
              <div className="pt-4">
                <CtaLink href="/photo-book/">
                  Start Your Photo Book Today
                </CtaLink>
              </div>
            </div>

            <div className="relative aspect-[4/3] rounded-[2.5rem] overflow-hidden border border-foreground/10 shadow-lg">
              <Image
                src="/images/factory-tour.png"
                alt="Pixovo California Printing Facility"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
          </div>

          {/* Mission Values Cards */}
          <div className="mb-20">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <h2 className="font-serif text-3xl font-bold text-foreground">Our Core Commitments</h2>
              <p className="text-xs text-muted-foreground mt-2">What guides everything we build and print.</p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-3xl bg-card border border-foreground/10 p-6 shadow-xs">
                <span className="grid size-10 place-items-center rounded-2xl bg-accent/10 text-accent mb-4">
                  <Sparkles className="size-5" />
                </span>
                <h3 className="font-serif text-xl font-bold text-foreground">Human-First AI</h3>
                <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                  Our AI assists with tedious photo selection and layout alignment, but YOU remain the designer with 100% control over every photo, color, and caption.
                </p>
              </div>

              <div className="rounded-3xl bg-card border border-foreground/10 p-6 shadow-xs">
                <span className="grid size-10 place-items-center rounded-2xl bg-accent/10 text-accent mb-4">
                  <Award className="size-5" />
                </span>
                <h3 className="font-serif text-xl font-bold text-foreground">Archival Quality</h3>
                <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                  We print on heavy 100lb Luster and 140lb Layflat stock with acid-free paper and UV-resistant inks that resist fading across generations.
                </p>
              </div>

              <div className="rounded-3xl bg-card border border-foreground/10 p-6 shadow-xs">
                <span className="grid size-10 place-items-center rounded-2xl bg-accent/10 text-accent mb-4">
                  <Leaf className="size-5" />
                </span>
                <h3 className="font-serif text-xl font-bold text-foreground">Sustainable Printing</h3>
                <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                  We use FSC-certified paper, non-toxic soy-based inks, and eco-friendly recyclable packaging to minimize environmental impact.
                </p>
              </div>
            </div>
          </div>

        </div>
      </main>
      <SiteFooter />
    </>
  )
}
