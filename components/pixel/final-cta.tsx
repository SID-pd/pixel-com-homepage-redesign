'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Send } from 'lucide-react'
import { CtaLink } from './cta-link'
import { Reveal, RevealItem } from './reveal'
import { PixovoLogo } from './pixovo-logo'

function FacebookIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 320 512" fill="currentColor" {...props}>
      <path d="M279.14 288l14.22-92.66h-88.91v-60.13c0-25.35 12.42-50.06 52.24-50.06h40.42V6.26S260.43 0 225.36 0c-73.22 0-121.08 44.38-121.08 124.72v70.62H22.89V288h81.39v224h100.17V288z" />
    </svg>
  )
}

function TwitterXIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 512 512" fill="currentColor" {...props}>
      <path d="M389.2 48h70.6L305.6 224.2 487 464H345L233.7 318.6 106.5 464H35.8L200.7 275.5 26.8 48H172.4L272.9 180.9 389.2 48zM364.4 421.8h39.1L151.1 88h-42L364.4 421.8z" />
    </svg>
  )
}

function InstagramIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 448 512" fill="currentColor" {...props}>
      <path d="M224.1 141c-63.6 0-114.9 51.3-114.9 114.9s51.3 114.9 114.9 114.9S339 319.5 339 255.9 287.7 141 224.1 141zm0 189.6c-41.1 0-74.7-33.5-74.7-74.7s33.5-74.7 74.7-74.7 74.7 33.5 74.7 74.7-33.6 74.7-74.7 74.7zm146.4-194.3c0 14.9-12 26.8-26.8 26.8-14.9 0-26.8-12-26.8-26.8s12-26.8 26.8-26.8 26.8 12 26.8 26.8zm76.1 27.2c-1.7-35.9-9.9-67.7-36.2-93.9-26.2-26.2-58-34.4-93.9-36.2-37-2.1-147.9-2.1-184.9 0-35.8 1.7-67.6 9.9-93.9 36.1s-34.4 58-36.2 93.9c-2.1 37-2.1 147.9 0 184.9 1.7 35.9 9.9 67.7 36.2 93.9s58 34.4 93.9 36.2c37 2.1 147.9 2.1 184.9 0 35.9-1.7 67.7-9.9 93.9-36.2 26.2-26.2 34.4-58 36.2-93.9 2.1-37 2.1-147.8 0-184.8zM398.8 388c-7.8 19.6-22.9 34.7-42.6 42.6-29.5 11.7-99.5 9-132.1 9s-102.7 2.6-132.1-9c-19.6-7.8-34.7-22.9-42.6-42.6-11.7-29.5-9-99.5-9-132.1s-2.6-102.7 9-132.1c7.8-19.6 22.9-34.7 42.6-42.6 29.5-11.7 99.5-9 132.1-9s102.7-2.6 132.1 9c19.6 7.8 34.7 22.9 42.6 42.6 11.7 29.5 9 99.5 9 132.1s2.7 102.7-9 132.1z" />
    </svg>
  )
}

export function FinalCta() {
  return (
    <section id="start" aria-labelledby="start-title" className="scroll-mt-24 px-5 pb-10 pt-8 md:px-6">
      <Reveal className="relative mx-auto flex max-w-6xl flex-col items-center gap-7 overflow-hidden rounded-[2.5rem] bg-secondary px-6 py-20 text-center md:py-28">
        <div aria-hidden className="pointer-events-none absolute -left-10 top-10 hidden w-40 -rotate-12 rounded-2xl bg-card p-2 pb-6 shadow-float md:block">
          <div className="relative aspect-[4/5] overflow-hidden rounded-lg">
            <Image src="/images/photo-wedding.png" alt="" fill sizes="160px" className="object-cover" />
          </div>
        </div>
        <div aria-hidden className="pointer-events-none absolute -right-8 bottom-10 hidden w-44 rotate-12 rounded-2xl bg-card p-2 pb-6 shadow-float md:block">
          <div className="relative aspect-square overflow-hidden rounded-lg">
            <Image src="/images/photo-baby.png" alt="" fill sizes="176px" className="object-cover" />
          </div>
        </div>

        <RevealItem>
          <h2 id="start-title" className="text-balance font-serif text-5xl leading-[0.95] md:text-7xl">
            Start Creating Your <br /><em className="text-accent">Photo Book Today</em>
          </h2>
        </RevealItem>
        <RevealItem>
          <p className="max-w-md text-pretty text-lg text-muted-foreground">
            Join thousands of happy customers who have transformed their memories into beautiful, lasting photo books.
          </p>
        </RevealItem>
        <RevealItem className="flex flex-wrap justify-center gap-3">
          <CtaLink href="/photo-book/" size="lg" magnetic={false} showArrow={false}>
            Create Your Photo Book
          </CtaLink>
          <CtaLink href="/pricing/" size="lg" variant="secondary" magnetic={false} showArrow={false}>
            View Pricing
          </CtaLink>
        </RevealItem>
      </Reveal>
    </section>
  )
}

export function SiteFooter() {
  const [email, setEmail] = useState('')
  const [subscribed, setSubscribed] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (email) setSubscribed(true)
  }

  return (
    <footer className="w-full bg-black text-white pt-10 pb-8 rounded-t-[2.5rem] md:rounded-t-[3.5rem] overflow-hidden font-sans">
      <div className="mx-auto max-w-[1280px] px-6 md:px-10 lg:px-12">
        {/* 4-Column Responsive Grid based on dev.pixovo.com (Brand, Quick Links, Support, Stay Inspired) */}
        <div className="grid gap-8 py-6 md:py-8 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr] border-b border-neutral-800">
          {/* Brand Column */}
          <div className="flex flex-col gap-4 sm:col-span-2 md:col-span-1">
            <Link href="/" aria-label="Pixovo Home" className="inline-block text-white">
              <PixovoLogo />
            </Link>
            <p className="text-xs font-medium leading-relaxed text-neutral-400 max-w-sm">
              Transform your memories into beautiful photo books using our AI-powered design platform. Creating lasting memories has never been easier.
            </p>
            {/* Social Icons */}
            <ul className="flex items-center gap-3 pt-1">
              <li>
                <a
                  href="https://www.facebook.com/mypixovo/"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Facebook"
                  className="grid size-9 place-items-center rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-300 transition-all duration-300 ease-[cubic-bezier(0.3,1,0.3,1)] hover:bg-white hover:text-black hover:-translate-y-0.5"
                >
                  <FacebookIcon className="size-3.5" />
                </a>
              </li>
              <li>
                <a
                  href="https://x.com/mypixovo"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="X (Twitter)"
                  className="grid size-9 place-items-center rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-300 transition-all duration-300 ease-[cubic-bezier(0.3,1,0.3,1)] hover:bg-white hover:text-black hover:-translate-y-0.5"
                >
                  <TwitterXIcon className="size-3.5" />
                </a>
              </li>
              <li>
                <a
                  href="https://www.instagram.com/mypixovo/"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Instagram"
                  className="grid size-9 place-items-center rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-300 transition-all duration-300 ease-[cubic-bezier(0.3,1,0.3,1)] hover:bg-white hover:text-black hover:-translate-y-0.5"
                >
                  <InstagramIcon className="size-3.5" />
                </a>
              </li>
            </ul>
          </div>

          {/* Quick Links Column */}
          <div className="flex flex-col gap-3">
            <h4 className="text-xs font-bold tracking-wider text-white uppercase">Quick Links</h4>
            <ul className="flex flex-col gap-2 text-xs font-medium text-neutral-400">
              <li>
                <Link href="/about-us/" className="transition-all duration-300 hover:text-white hover:translate-x-1 inline-block">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/how-it-works/" className="transition-all duration-300 hover:text-white hover:translate-x-1 inline-block">
                  How It Works
                </Link>
              </li>
              <li>
                <Link href="/pricing/" className="transition-all duration-300 hover:text-white hover:translate-x-1 inline-block">
                  Pricing
                </Link>
              </li>
              <li className="flex flex-col gap-1">
                <Link href="/themes/" className="transition-all duration-300 hover:text-white hover:translate-x-1 inline-block font-semibold text-white/90">
                  Themes
                </Link>
                <div className="pl-3 flex flex-col gap-1 border-l border-neutral-800">
                  <Link href="/themes/wedding-photo-book/" className="text-[11px] text-neutral-400 transition-all duration-300 hover:text-amber-400 hover:translate-x-1 inline-block">
                    • Wedding &amp; Love
                  </Link>
                  <Link href="/themes/baby-first-year-photo-book/" className="text-[11px] text-neutral-400 transition-all duration-300 hover:text-amber-400 hover:translate-x-1 inline-block">
                    • Baby &amp; Family
                  </Link>
                  <Link href="/themes/travel-photo-book/" className="text-[11px] text-neutral-400 transition-all duration-300 hover:text-amber-400 hover:translate-x-1 inline-block">
                    • Travel &amp; Vacations
                  </Link>
                  <Link href="/themes/year-in-review-photo-book/" className="text-[11px] text-neutral-400 transition-all duration-300 hover:text-amber-400 hover:translate-x-1 inline-block">
                    • Year in Review
                  </Link>
                </div>
              </li>
              {/* Blog with subcategories (Text Based & Reel Based) */}
              <li className="flex flex-col gap-1">
                <Link href="/blog/" className="transition-all duration-300 hover:text-white hover:translate-x-1 inline-block font-semibold text-white/90">
                  Blog
                </Link>
                <div className="pl-3 flex flex-col gap-1 border-l border-neutral-800">
                  <Link href="/blog/text/" className="text-[11px] text-neutral-400 transition-all duration-300 hover:text-amber-400 hover:translate-x-1 inline-block">
                    • Text Based
                  </Link>
                  <Link href="/blog/reels/" className="text-[11px] text-neutral-400 transition-all duration-300 hover:text-amber-400 hover:translate-x-1 inline-block">
                    • Reel Based
                  </Link>
                </div>
              </li>
              <li>
                <Link href="/help-center/" className="transition-all duration-300 hover:text-white hover:translate-x-1 inline-block">
                  Help Center
                </Link>
              </li>
            </ul>
          </div>

          {/* Support Column */}
          <div className="flex flex-col gap-3">
            <h4 className="text-xs font-bold tracking-wider text-white uppercase">Support</h4>
            <ul className="flex flex-col gap-2 text-xs font-medium text-neutral-400">
              <li>
                <Link href="/contact-us/" className="transition-all duration-300 hover:text-white hover:translate-x-1 inline-block">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/shipping-info/" className="transition-all duration-300 hover:text-white hover:translate-x-1 inline-block">
                  Shipping Info
                </Link>
              </li>
              <li>
                <Link href="/privacy-policy/" className="transition-all duration-300 hover:text-white hover:translate-x-1 inline-block">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms/" className="transition-all duration-300 hover:text-white hover:translate-x-1 inline-block">
                  Terms and Conditions
                </Link>
              </li>
            </ul>
          </div>

          {/* Stay Inspired Column (Newsletter) */}
          <div className="flex flex-col gap-3">
            <h4 className="text-xs font-bold tracking-wider text-white uppercase">Stay Inspired</h4>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Get ideas, special offers and tips for your next photo book.
            </p>
            <form onSubmit={handleSubmit} className="flex flex-col gap-2 pt-1 w-full max-w-sm">
              <div className="relative flex items-center rounded-full bg-white p-1 shadow-sm overflow-hidden border border-white/20 focus-within:ring-2 focus-within:ring-white/40 transition-all duration-300">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  aria-label="Email"
                  required
                  className="min-w-0 flex-1 bg-transparent px-3.5 py-1 text-xs font-medium text-neutral-900 outline-none placeholder:text-neutral-500"
                />
                <button
                  type="submit"
                  aria-label="Subscribe"
                  className="grid size-8 shrink-0 place-items-center rounded-full bg-black text-white transition-all duration-300 hover:scale-105 active:scale-95 hover:bg-neutral-800"
                >
                  <Send className="size-3.5" />
                </button>
              </div>
              {subscribed && (
                <span className="px-2 text-[11px] font-semibold text-emerald-400">
                  ✓ Thank you for subscribing!
                </span>
              )}
            </form>
          </div>
        </div>

        {/* Bottom Copyright Bar */}
        <div className="pt-4 text-center text-xs font-medium text-neutral-400">
          © 2026 Pixovo. All rights reserved. Made with ❤ for memory makers.
        </div>
      </div>
    </footer>
  )
}
