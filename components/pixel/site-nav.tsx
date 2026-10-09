'use client'

import { useState } from 'react'
import Link from 'next/link'
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from 'motion/react'
import { ChevronDown, Menu, ShoppingBag, Sparkles, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { easeOutExpo } from '@/lib/motion'
import { useCartCount } from '@/lib/flow/store'
import { AccountMenu } from '@/components/flow/account-menu'
import { CtaLink } from './cta-link'
import { PixovoLogo } from './pixovo-logo'
import { TopBanner } from './top-banner'

const links = [
  { label: 'Photolook', href: '/photo-book/' },
  { label: 'How It Works', href: '/how-it-works/' },
  { label: 'Pricing', href: '/pricing/' },
  {
    label: 'Themes',
    href: '/themes/',
    subLinks: [
      { label: 'Wedding & Love', href: '/themes/wedding-photo-book/' },
      { label: 'Baby & Family', href: '/themes/baby-first-year-photo-book/' },
      { label: 'Travel & Vacations', href: '/themes/travel-photo-book/' },
      { label: 'Year in Review & Milestones', href: '/themes/year-in-review-photo-book/' },
    ],
  },
  {
    label: 'Resources',
    href: '/blog/',
    subLinks: [
      { label: 'Blogs', href: '/blog/' },
      { label: 'FAQ’s Page', href: '/faq/' },
      { label: 'Reel & Video Guide', href: '/blog/reels/' },
      { label: 'About Us', href: '/about-us/' },
      { label: 'Contact Us', href: '/contact-us/' },
    ],
  },
]

const STORY_HREF = '/photo-book/?story=1'

/** Dedicated Story Mode entry: icon-only on phones/tablets, icon + label on wide screens so the bar stays uncluttered. */
function StoryModeNavButton() {
  return (
    <Link
      href={STORY_HREF}
      aria-label="Story Mode: let AI build your photo book"
      title="Story Mode: let AI build your photo book"
      className="group relative inline-flex h-9 shrink-0 items-center justify-center gap-1.5 overflow-hidden rounded-full bg-[linear-gradient(110deg,#c4553a,#e08a3c_45%,#c4553a)] bg-[length:200%_100%] px-2.5 text-xs font-semibold text-white shadow-sm transition-all duration-300 hover:bg-right hover:shadow-md active:scale-95 xl:px-3.5"
    >
      <Sparkles className="size-4" aria-hidden />
      <span className="hidden xl:inline">Story Mode</span>
      <span className="hidden rounded-full bg-white/25 px-1.5 py-px text-[9px] font-bold uppercase tracking-wider xl:inline">AI</span>
    </Link>
  )
}

export function SiteNav() {
  const { scrollY } = useScroll()
  const [scrolled, setScrolled] = useState(false)
  const [hidden, setHidden] = useState(false)
  const [open, setOpen] = useState(false)
  // which dropdown is open (by label); one shared boolean made Themes and Resources open together
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  // mobile menu: one expandable group at a time, all collapsed by default so the list stays short
  const [mobileGroup, setMobileGroup] = useState<string | null>(null)
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
                    onMouseEnter={() => setOpenMenu(link.label)}
                    onMouseLeave={() => setOpenMenu((m) => (m === link.label ? null : m))}
                  >
                    <Link
                      href={link.href}
                      className="inline-flex items-center gap-1 rounded-full px-3 py-2 text-xs font-medium text-foreground/80 transition-colors hover:bg-foreground/5 hover:text-foreground"
                    >
                      <span>{link.label}</span>
                      <ChevronDown className={cn("size-3.5 transition-transform duration-200", openMenu === link.label && "rotate-180")} />
                    </Link>

                    <AnimatePresence>
                      {openMenu === link.label && (
                        <motion.div
                          initial={{ opacity: 0, y: 6, scale: 0.97 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 6, scale: 0.97 }}
                          transition={{ duration: 0.15, ease: 'easeOut' }}
                          className="absolute left-0 top-full pt-1.5 w-64 z-50"
                        >
                          <div className="rounded-2xl bg-card p-1.5 shadow-float ring-1 ring-foreground/10 backdrop-blur-xl flex flex-col">
                            {link.subLinks.map((sub) => (
                              <Link
                                key={sub.label}
                                href={sub.href}
                                className="whitespace-nowrap rounded-xl px-3 py-2 text-xs font-medium text-foreground/80 hover:bg-foreground/5 hover:text-foreground transition-colors"
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

            <StoryModeNavButton />

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
              className="mx-auto mt-2 max-h-[calc(100dvh-8.5rem)] max-w-6xl origin-top overflow-y-auto overscroll-contain rounded-3xl bg-card p-3 shadow-float ring-1 ring-foreground/5 backdrop-blur-xl lg:hidden"
            >
              <Link
                href={STORY_HREF}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-2xl bg-[linear-gradient(110deg,#c4553a,#e08a3c)] px-4 py-2.5 text-white shadow-sm"
              >
                <Sparkles className="size-4 shrink-0" aria-hidden />
                <span className="min-w-0 flex-1 truncate text-sm font-semibold">Story Mode</span>
                <span className="rounded-full bg-white/25 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">AI</span>
              </Link>
              <ul className="mt-2 divide-y divide-foreground/6">
                {links.map((link) => {
                  const expanded = mobileGroup === link.label
                  return (
                    <li key={link.label}>
                      {link.subLinks ? (
                        <>
                          <button
                            type="button"
                            aria-expanded={expanded}
                            aria-controls={`m-${link.label}`}
                            onClick={() => setMobileGroup(expanded ? null : link.label)}
                            className="flex w-full items-center justify-between px-3 py-3 text-left text-base font-semibold"
                          >
                            <span>{link.label}</span>
                            <ChevronDown className={cn('size-4 text-muted-foreground transition-transform duration-200', expanded && 'rotate-180')} />
                          </button>
                          {expanded && (
                            <div id={`m-${link.label}`} className="mb-2 grid gap-0.5 rounded-2xl bg-secondary/60 p-1.5">
                              {link.subLinks.map((sub) => (
                                <Link
                                  key={sub.label}
                                  href={sub.href}
                                  onClick={() => setOpen(false)}
                                  className="rounded-xl px-3 py-2.5 text-sm text-foreground/80 transition-colors hover:bg-card hover:text-foreground"
                                >
                                  {sub.label}
                                </Link>
                              ))}
                            </div>
                          )}
                        </>
                      ) : (
                        <Link href={link.href} onClick={() => setOpen(false)} className="block px-3 py-3 text-base font-semibold">
                          {link.label}
                        </Link>
                      )}
                    </li>
                  )
                })}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Mobile Floating Action Button (FAB) */}
      <div className={cn("fixed bottom-5 right-4 z-40 sm:hidden", open && "hidden")}>
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
