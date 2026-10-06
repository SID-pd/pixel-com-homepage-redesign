'use client'

import { useRef } from 'react'
import { motion } from 'motion/react'
import { Check, Star } from 'lucide-react'
import { easeOutExpo } from '@/lib/motion'
import { CtaLink } from './cta-link'
import { useIntroDelay } from './intro-splash'

export function Hero() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const base = useIntroDelay()

  return (
    <section
      aria-labelledby="hero-title"
      className="relative overflow-hidden pt-28 pb-16 md:pt-36 md:pb-24 bg-background"
    >
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 md:px-6 lg:grid-cols-[1.02fr_1.08fr] lg:gap-10">
        {/* Left Copy Column */}
        <div className="flex flex-col items-start gap-7">
          <motion.span
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: base, ease: easeOutExpo }}
            className="inline-flex items-center gap-2 rounded-full bg-card px-4 py-1.5 text-sm font-medium text-foreground/80 shadow-sm"
          >
            <span className="flex size-2 rounded-full bg-accent animate-pulse" />
            Rated #1 Photo Book Brand — Printed in the USA
          </motion.span>

          <h1
            id="hero-title"
            className="text-balance font-serif text-[clamp(2.75rem,6.5vw,5.25rem)] leading-[1.02] tracking-[-0.02em]"
          >
            Bring your favorite memories to life.{' '}
            <em className="font-serif font-normal italic text-accent">Beautifully bound.</em>
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: base + 0.45, ease: easeOutExpo }}
            className="max-w-md text-pretty text-lg leading-relaxed text-muted-foreground"
          >
            Upload your photos and let Pixovo design a personalized lay-flat photo book in minutes. Premium photo printing shipped fast from the USA.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: base + 0.55, ease: easeOutExpo }}
            className="flex flex-wrap items-center gap-3"
          >
            <CtaLink href="/photo-book/" size="lg" magnetic={false} showArrow={false}>
              Create Your Photo Book
            </CtaLink>
            <CtaLink href="#products" size="lg" variant="secondary" magnetic={false} showArrow={false}>
              Explore sizes & pricing
            </CtaLink>
          </motion.div>

          <motion.ul
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: base + 0.75 }}
            className="flex flex-wrap items-center gap-x-6 gap-y-3 pt-2 text-sm text-muted-foreground"
          >
            <li className="flex items-center gap-2">
              <span className="flex" aria-hidden>
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="size-4 fill-accent text-accent" />
                ))}
              </span>
              <span>
                <strong className="font-medium text-foreground">4.8/5</strong> from 50,000+ customers
              </span>
            </li>
            <li className="flex items-center gap-1.5">
              <Check className="size-4 text-accent" aria-hidden />
              100% Satisfaction Guaranteed · Printed in USA
            </li>
          </motion.ul>
        </div>

        {/* Right Video Showcase Stage - Seamlessly Color Blended & Borderless */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: base + 0.2, ease: easeOutExpo }}
          className="relative mx-auto w-full max-w-[620px] flex items-center justify-center"
        >
          <div className="relative aspect-[16/10] w-full overflow-hidden rounded-3xl bg-transparent">
            <video
              ref={videoRef}
              src="/videos/hero-bg.mp4"
              autoPlay
              loop
              muted
              playsInline
              className="size-full object-cover mix-blend-multiply"
            />
          </div>
        </motion.div>
      </div>
    </section>
  )
}
