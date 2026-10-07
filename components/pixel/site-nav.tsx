'use client'

import { useState } from 'react'
import Link from 'next/link'
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from 'motion/react'
import { ChevronDown, Menu, ShoppingBag, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { easeOutExpo } from '@/lib/motion'
import { useCartCount } from '@/lib/flow/store'
import { AccountMenu } from '@/components/flow/account-menu'
import { CtaLink } from './cta-link'
import { PixovoLogo } from './pixovo-logo'
import { TopBanner } from './top-banner'

const links = [
  { label: 'Photobook', href: '/photo-book/' },
  { label: 'How It Works', href: '/how-it-works/' },
  { label: 'Pricing', href: '/pricing/' },
  {
    label: 'Blog',
    href: '/blog/',
    subLinks: [
      { label: 'All Articles', href: '/blog/' },
      { label: 'Photobook Ideas', href: '/blog/ideas/' },
      { label: 'Reels & Video Guides', href: '/blog/reels/' },
      { label: 'Stories & Articles', href: '/blog/text/' },
      { label: 'How-To Guides', href: '/blog/how-to/' },
    ],
  },
  { label: 'About Us', href: '/about-us/' },
  { label: 'Contact Us', href: '/contact-us/' },
]

export function SiteNav() {
  const { scrollY } = useScroll()
  const [scrolled, setScrolled] = useState(false)
  const [hidden, setHidden] = useState(false)
  const [open, setOpen] = useState(false)
  const [blogDropdownOpen, setBlogDropdownOpen] = useState(false)
  const cartCount = useCartCount()

  useMotionValueEvent(scrollY, 'change', (latest) => {
    const prev = scrollY.getPrevious() ?? 0
    setScrolled(latest > 24)
    setHidden(latest > 400 && latest > prev && !open)
  })

  return (
    <motion.header
      animate={{ y: hidden ? -140 : 0 }}
      transition={{ duration: 0.45, ease: easeOutExpo }}
      className="fixed inset-x-0 top-0 z-50 flex flex-col"
    >
      <TopBanner />
      <div className="px-3 pt-2 md:px-6 md:pt-3">
        <nav
          aria-label="Primary"
          className={cn(
            'mx-auto flex h-14 max-w-6xl items-center justify-between rounded-full pl-4 pr-2 transition-all duration-500',
            scrolled || open
              ? 'bg-card/90 shadow-float ring-1 ring-foreground/10 backdrop-blur-xl border border-foreground/5'
              : 'bg-background/20 backdrop-blur-xs ring-0 border-transparent',
          )}
        >
          <Link href="/" aria-label="Pixovo home" className="rounded-full focus-visible:outline-2 focus-visible:outline-offset-4 shrink-0">
            <PixovoLogo />
          </Link>

          <ul className="hidden items-center gap-0.5 lg:flex">
            {links.map((link) => {
              if (link.subLinks) {
                return (
                  <li
                    key={link.label}
                    className="relative"
                    onMouseEnter={() => setBlogDropdownOpen(true)}
                    onMouseLeave={() => setBlogDropdownOpen(false)}
                  >
                    <Link
                      href={link.href}
                      className="inline-flex items-center gap-1 rounded-full px-3 py-2 text-xs font-medium text-foreground/80 transition-colors hover:bg-foreground/5 hover:text-foreground"
                    >
                      <span>{link.label}</span>
                      <ChevronDown className={cn("size-3.5 transition-transform duration-200", blogDropdownOpen && "rotate-180")} />
                    </Link>

                    <AnimatePresence>
                      {blogDropdownOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 6, scale: 0.97 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 6, scale: 0.97 }}
                          transition={{ duration: 0.15, ease: 'easeOut' }}
                          className="absolute left-0 top-full pt-1.5 w-48 z-50"
                        >
                          <div className="rounded-2xl bg-card p-1.5 shadow-float ring-1 ring-foreground/10 backdrop-blur-xl flex flex-col">
                            {link.subLinks.map((sub) => (
                              <Link
                                key={sub.label}
                                href={sub.href}
                                className="rounded-xl px-3 py-2 text-xs font-medium text-foreground/80 hover:bg-foreground/5 hover:text-foreground transition-colors"
                              >
                                {sub.label}
                              </Link>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </li>
                )
              }

              return (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="relative rounded-full px-3 py-2 text-xs font-medium text-foreground/80 transition-colors hover:bg-foreground/5 hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              )
            })}
          </ul>

          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            {/* Sign in / account menu */}
            <AccountMenu />

            {/* Cart Icon Button with Badge */}
            <Link
              href="/cart/"
              aria-label={cartCount ? `Shopping cart, ${cartCount} item${cartCount === 1 ? '' : 's'}` : 'Shopping cart'}
              className="group relative grid size-9 place-items-center rounded-full text-foreground/80 transition-colors hover:bg-foreground/5 hover:text-foreground"
            >
              <div className="relative">
                <ShoppingBag className="size-4.5 text-foreground/80 transition-transform duration-200 group-hover:scale-110" />
                {cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 flex min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-extrabold leading-4 text-accent-foreground shadow-sm">
                    {cartCount}
                  </span>
                )}
              </div>
            </Link>

            {/* Desktop / Tablet CTA Button */}
            <CtaLink href="/photo-book/" className="hidden sm:inline-flex h-9 px-3.5 text-xs font-semibold" showArrow={false}>
              Create Your Photo Book
            </CtaLink>

            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-controls="mobile-menu"
              aria-label={open ? 'Close menu' : 'Open menu'}
              className="ml-0.5 grid size-9 place-items-center rounded-full transition-colors hover:bg-foreground/5 lg:hidden"
            >
              {open ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </nav>

        <AnimatePresence>
          {open && (
            <motion.div
              id="mobile-menu"
              initial={{ opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ duration: 0.3, ease: easeOutExpo }}
              className="mx-auto mt-2 max-w-6xl origin-top rounded-3xl bg-card/95 p-4 shadow-float ring-1 ring-foreground/5 backdrop-blur-xl lg:hidden"
            >
              <ul className="flex flex-col gap-1">
                {links.map((link, i) => (
                  <motion.li
                    key={link.label}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.04 * i, duration: 0.3 }}
                  >
                    <Link
                      href={link.href}
                      onClick={() => setOpen(false)}
                      className="flex items-center justify-between rounded-2xl px-4 py-3 font-serif text-xl transition-colors hover:bg-foreground/5"
                    >
                      <span>{link.label}</span>
                    </Link>

                    {link.subLinks && (
                      <div className="pl-4 pr-2 py-1 flex flex-col gap-1 border-l-2 border-accent/30 my-1 ml-4">
                        {link.subLinks.map((sub) => (
                          <Link
                            key={sub.label}
                            href={sub.href}
                            onClick={() => setOpen(false)}
                            className="text-xs text-muted-foreground hover:text-foreground py-1.5 px-2 rounded-lg hover:bg-foreground/5"
                          >
                            {sub.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Mobile Floating Action Button (FAB) */}
      <div className="fixed bottom-5 right-4 z-40 sm:hidden">
        <Link
          href="/photo-book/"
          className="flex items-center gap-2 rounded-full bg-accent px-4 py-3 text-xs font-bold text-accent-foreground shadow-2xl ring-2 ring-background/20 transition-transform active:scale-95"
        >
          <span>Create Photo Book</span>
          <span className="grid size-5 place-items-center rounded-full bg-accent-foreground/15">→</span>
        </Link>
      </div>
    </motion.header>
  )
}
