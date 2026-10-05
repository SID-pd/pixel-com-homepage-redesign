import Image from 'next/image'
import Link from 'next/link'
import { CtaLink } from './cta-link'
import { Reveal, RevealItem } from './reveal'
import { PixovoLogo } from './pixovo-logo'

const footerLinks = [
  {
    title: 'Quick Links',
    links: [
      { label: 'About Us', href: '/about-us/' },
      { label: 'How It Works', href: '/how-it-works/' },
      { label: 'Pricing', href: '/pricing/' },
      { label: 'Blog', href: '/blog/' },
      { label: 'Help Center', href: '/help-center/' },
    ],
  },
  {
    title: 'Support',
    links: [
      { label: 'Contact Us', href: '/contact-us/' },
      { label: 'Shipping Info', href: '/shipping-info/' },
      { label: 'Privacy Policy', href: '/privacy-policy/' },
      { label: 'Terms and Conditions', href: '/terms/' },
    ],
  },
]

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
            Join over 50,000 happy customers who have transformed their memories into beautiful, lasting photo books.
          </p>
        </RevealItem>
        <RevealItem className="flex flex-wrap justify-center gap-3">
          <CtaLink href="/photo-book/" size="lg" magnetic>
            Create Your Photo Book
          </CtaLink>
          <CtaLink href="/pricing/" size="lg" variant="secondary" showArrow={false}>
            View Pricing
          </CtaLink>
        </RevealItem>
      </Reveal>
    </section>
  )
}

export function SiteFooter() {
  return (
    <footer className="px-5 pb-10 pt-12 md:px-6">
      <div className="mx-auto flex max-w-6xl flex-col gap-12">
        <div className="grid gap-10 md:grid-cols-[1.5fr_repeat(2,1fr)]">
          <div className="flex flex-col gap-4">
            <PixovoLogo />
            <p className="max-w-xs text-sm text-muted-foreground">
              Transform your memories into beautiful photo books using our instant smart design platform. Creating lasting memories has never been easier.
            </p>
          </div>
          {footerLinks.map((col) => (
            <nav key={col.title} aria-label={col.title}>
              <h3 className="text-sm font-medium">{col.title}</h3>
              <ul className="mt-4 flex flex-col gap-2.5">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link href={l.href} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
        <div className="flex flex-col justify-between gap-4 border-t pt-6 text-xs text-muted-foreground sm:flex-row">
          <p>© 2026 Pixovo. All rights reserved. Made with ❤ for memory makers.</p>
          <div className="flex gap-5">
            <Link href="/privacy-policy/" className="hover:text-foreground">Privacy Policy</Link>
            <Link href="/terms/" className="hover:text-foreground">Terms</Link>
            <Link href="/contact-us/" className="hover:text-foreground">Contact Us</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
