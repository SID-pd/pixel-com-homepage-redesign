'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Check, HelpCircle, ShieldCheck, Sparkles, Tag, Truck } from 'lucide-react'
import { SiteNav } from '@/components/pixel/site-nav'
import { SiteFooter } from '@/components/pixel/final-cta'
import { CtaLink } from '@/components/pixel/cta-link'
import { SectionHeading } from '@/components/pixel/section-heading'

const bookSizes = [
  {
    name: '8x8 Square Book',
    badge: 'EVERYDAY FAVOURITE',
    popular: false,
    basePrice: '$39.99',
    salePrice: '$19.99',
    discount: '50% OFF',
    description: 'Perfect for everyday moments, weekend trip highlights, and personal memory books.',
    pages: '20 pages included (up to 100 pages)',
    extraPageCost: '$1.50 / additional spread (2 pages)',
    features: [
      'Premium 100lb Luster Archival Paper',
      'Hardcover with Matte Finish',
      'Smart AI Auto-Layout Engine',
      'Holds 20–250+ Photos',
      '100% Satisfaction Guarantee',
    ],
  },
  {
    name: '10x10 Square Book',
    badge: 'MOST POPULAR',
    popular: true,
    basePrice: '$59.99',
    salePrice: '$29.99',
    discount: '50% OFF',
    description: 'Our most popular size for all of life’s big moments, family albums, and travel memories.',
    pages: '20 pages included (up to 120 pages)',
    extraPageCost: '$1.90 / additional spread (2 pages)',
    features: [
      'Ultra-Thick 140lb Layflat Paper Available',
      'Hardcover with Linen / Matte Finish',
      'Smart AI Auto-Layout & Auto-Captioning',
      'Holds 30–350+ Photos',
      'Free Digital e-Book Preview',
      '100% Satisfaction Guarantee',
    ],
  },
  {
    name: '12x12 Deluxe Album',
    badge: 'PREMIUM DELUXE',
    popular: false,
    basePrice: '$79.99',
    salePrice: '$39.99',
    discount: '50% OFF',
    description: 'More room for your favorite high-res photos, weddings, and milestone family heirlooms.',
    pages: '20 pages included (up to 150 pages)',
    extraPageCost: '$2.20 / additional spread (2 pages)',
    features: [
      'Museum-Grade Seamless Layflat Binding',
      'Genuine Italian Leather / Fine Fabric Cover',
      'Smart AI Auto-Layout & Color Enhancements',
      'Holds 40–500+ Photos',
      'Priority Printing & Expedited Shipping Available',
      '100% Lifetime Durability Guarantee',
    ],
  },
]

const pricingFaqs = [
  {
    question: 'How does the 50% OFF promotion work?',
    answer: 'Use promo code FALL50 at checkout to receive 50% OFF any custom photo book size. No minimum order required.',
  },
  {
    question: 'What is included in the base price?',
    answer: 'The base price includes 20 full-color custom pages (10 spreads), your choice of premium cover finish, AI auto-layout assistance, and digital draft preview.',
  },
  {
    question: 'How much do additional pages cost?',
    answer: 'Extra pages are added in 2-page spreads starting at $1.50 per spread for 8x8 books, $1.90 for 10x10 books, and $2.20 for 12x12 albums.',
  },
  {
    question: 'Where are Pixovo photo books printed?',
    answer: 'All Pixovo photo books are printed in our California factory using archival-grade paper and UV-resistant inks that stay vibrant for 100+ years.',
  },
]

export default function PricingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  return (
    <>
      <SiteNav />
      <main className="min-h-screen bg-background pt-36 sm:pt-44 pb-20 md:pb-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 md:px-8">
          
          {/* Hero Heading */}
          <div className="text-center max-w-3xl mx-auto mb-12 md:mb-16">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-accent mb-4">
              <Tag className="size-3.5" />
              Special Autumn Promotion
            </span>
            <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-foreground">
              Simple, Transparent <br /><em className="text-accent">Photo Book Pricing</em>
            </h1>
            <p className="mt-4 text-base sm:text-lg text-muted-foreground leading-relaxed">
              No hidden fees. Premium archival quality printed in California. Use code <strong className="text-foreground font-bold">FALL50</strong> for 50% OFF all sizes.
            </p>
          </div>

          {/* Pricing Cards Grid */}
          <div className="grid gap-8 md:grid-cols-3 items-stretch mb-20">
            {bookSizes.map((book) => (
              <div
                key={book.name}
                className={`relative flex flex-col justify-between rounded-[2.25rem] p-6 sm:p-8 transition-all duration-300 ${
                  book.popular
                    ? 'bg-ink text-ink-foreground shadow-lift ring-2 ring-accent scale-[1.02]'
                    : 'bg-card border border-foreground/10 text-foreground shadow-xs hover:border-foreground/20'
                }`}
              >
                {book.badge && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className={`px-3.5 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider shadow-sm ${
                      book.popular
                        ? 'bg-accent text-accent-foreground'
                        : 'bg-foreground/10 text-foreground'
                    }`}>
                      {book.badge}
                    </span>
                  </div>
                )}

                <div>
                  <div className="mt-2 mb-4">
                    <h3 className="font-serif text-2xl font-bold">{book.name}</h3>
                    <p className={`mt-2 text-xs leading-relaxed ${book.popular ? 'text-ink-foreground/75' : 'text-muted-foreground'}`}>
                      {book.description}
                    </p>
                  </div>

                  {/* Pricing Box */}
                  <div className="my-6 p-4 rounded-2xl bg-foreground/5 flex items-baseline justify-between border border-foreground/10">
                    <div>
                      <span className="text-xs text-muted-foreground line-through block font-medium">
                        {book.basePrice}
                      </span>
                      <span className="text-3xl font-extrabold text-accent">
                        {book.salePrice}
                      </span>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg bg-accent/20 text-accent font-extrabold text-xs">
                      {book.discount}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs mb-6">
                    <p className="font-semibold">{book.pages}</p>
                    <p className={book.popular ? 'text-ink-foreground/60' : 'text-muted-foreground'}>
                      {book.extraPageCost}
                    </p>
                  </div>

                  {/* Features List */}
                  <ul className="space-y-3 text-xs mb-8">
                    {book.features.map((feat) => (
                      <li key={feat} className="flex items-start gap-2.5">
                        <span className="grid size-4 shrink-0 place-items-center rounded-full bg-accent/20 text-accent font-bold text-[10px] mt-0.5">
                          ✓
                        </span>
                        <span className={book.popular ? 'text-ink-foreground/90' : 'text-foreground/80'}>
                          {feat}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                <CtaLink href="/photo-book/" size="lg" className="w-full text-center justify-center">
                  Customize This Size
                </CtaLink>
              </div>
            ))}
          </div>

          {/* Guarantees Strip */}
          <div className="rounded-3xl bg-card border border-foreground/10 p-6 md:p-8 mb-20">
            <div className="grid gap-6 sm:grid-cols-3 text-center">
              <div className="flex flex-col items-center">
                <ShieldCheck className="size-8 text-accent mb-3" />
                <h4 className="font-bold text-sm text-foreground">100% Quality Guarantee</h4>
                <p className="text-xs text-muted-foreground mt-1">If you aren’t thrilled with your book, we will reprint it or refund your order.</p>
              </div>
              <div className="flex flex-col items-center">
                <Truck className="size-8 text-accent mb-3" />
                <h4 className="font-bold text-sm text-foreground">Fast 3–5 Day US Delivery</h4>
                <p className="text-xs text-muted-foreground mt-1">Printed in California and delivered straight to your doorstep.</p>
              </div>
              <div className="flex flex-col items-center">
                <Sparkles className="size-8 text-accent mb-3" />
                <h4 className="font-bold text-sm text-foreground">60-Second AI Draft</h4>
                <p className="text-xs text-muted-foreground mt-1">Drag and drop your photos; our AI creates a beautiful layout automatically.</p>
              </div>
            </div>
          </div>

          {/* FAQ Accordion Section */}
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="font-serif text-3xl font-bold text-foreground">Pricing FAQs</h2>
              <p className="text-xs text-muted-foreground mt-2">Have questions about options, pages, or shipping?</p>
            </div>

            <div className="space-y-4">
              {pricingFaqs.map((faq, i) => (
                <div key={i} className="rounded-2xl bg-card border border-foreground/10 p-5">
                  <button
                    type="button"
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="flex w-full items-center justify-between font-serif text-base font-bold text-foreground text-left"
                  >
                    <span>{faq.question}</span>
                    <span className="text-accent font-bold text-xl ml-2">{openFaq === i ? '−' : '+'}</span>
                  </button>
                  {openFaq === i && (
                    <p className="mt-3 text-xs leading-relaxed text-muted-foreground pt-2 border-t border-foreground/5">
                      {faq.answer}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

        </div>
      </main>
      <SiteFooter />
    </>
  )
}
