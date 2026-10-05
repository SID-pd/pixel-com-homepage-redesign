'use client'

import { useState } from 'react'
import Link from 'next/link'
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from 'motion/react'
import { Menu, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { easeOutExpo } from '@/lib/motion'
import { CtaLink } from './cta-link'
import { PixovoLogo } from './pixovo-logo'

const links = [
  { label: 'Photobook', href: '/photo-book/' },
  { label: 'About Us', href: '/about-us/' },
  { label: 'How It Works', href: '/how-it-works/' },
  { label: 'Pricing', href: '/pricing/' },
  { label: 'Contact Us', href: '/contact-us/' },
]

export function SiteNav() {
  const { scrollY } = useScroll()
  const [scrolled, setScrolled] = useState(false)
  const [hidden, setHidden] = useState(false)
  const [open, setOpen] = useState(false)

  useMotionValueEvent(scrollY, 'change', (latest) => {
    const prev = scrollY.getPrevious() ?? 0
    setScrolled(latest > 24)
    setHidden(latest > 400 && latest > prev && !open)
  })

  return (
    <motion.header
      animate={{ y: hidden ? -120 : 0 }}
      transition={{ duration: 0.45, ease: easeOutExpo }}
      className="fixed inset-x-0 top-0 z-50 px-3 pt-3 md:px-6 md:pt-4"
    >
      <nav
        aria-label="Primary"
        className={cn(
          'mx-auto flex h-14 max-w-6xl items-center justify-between rounded-full pl-5 pr-2 transition-[background-color,box-shadow,backdrop-filter] duration-500',
          scrolled || open
            ? 'bg-card/75 shadow-float ring-1 ring-foreground/5 backdrop-blur-xl'
            : 'bg-transparent',
        )}
      >
        <Link href="/" aria-label="Pixovo home" className="rounded-full focus-visible:outline-2 focus-visible:outline-offset-4">
          <PixovoLogo />
        </Link>

        <ul className="hidden items-center gap-1 lg:flex">
          {links.map((link) => (
            <li key={link.label}>
              <Link
                href={link.href}
                className="relative rounded-full px-4 py-2 text-sm text-foreground/70 transition-colors hover:bg-foreground/5 hover:text-foreground"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-1">
          <Link
            href="#"
            className="hidden rounded-full px-4 py-2 text-sm text-foreground/70 transition-colors hover:text-foreground sm:inline-flex"
          >
            Sign in
          </Link>
          <CtaLink href="/photo-book/" className="h-10 px-4" showArrow={false}>
            Create Your Photo Book
          </CtaLink>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? 'Close menu' : 'Open menu'}
            className="ml-1 grid size-10 place-items-center rounded-full transition-colors hover:bg-foreground/5 lg:hidden"
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
            className="mx-auto mt-2 max-w-6xl origin-top rounded-3xl bg-card/90 p-3 shadow-float ring-1 ring-foreground/5 backdrop-blur-xl lg:hidden"
          >
            <ul className="flex flex-col">
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
                    className="flex rounded-2xl px-4 py-3.5 font-serif text-2xl transition-colors hover:bg-foreground/5"
                  >
                    {link.label}
                  </Link>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  )
}
