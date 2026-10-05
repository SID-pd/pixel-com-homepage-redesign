'use client'

import { useRef } from 'react'
import Image from 'next/image'
import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react'
import { Gift } from 'lucide-react'
import { CtaLink } from './cta-link'
import { Reveal, RevealItem } from './reveal'

export function GiftBanner() {
  const ref = useRef<HTMLDivElement>(null)
  const reduceMotion = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const imageY = useTransform(scrollYProgress, [0, 1], ['-12%', '12%'])
  const cardY = useTransform(scrollYProgress, [0, 1], [60, -60])

  return (
    <section id="gifts" aria-labelledby="gifts-title" className="scroll-mt-24 px-3 md:px-6">
      <div
        ref={ref}
        className="relative mx-auto flex min-h-[560px] max-w-7xl items-end overflow-hidden rounded-[2.5rem] bg-ink text-ink-foreground md:min-h-[640px] md:items-center"
      >
        <motion.div style={{ y: reduceMotion ? 0 : imageY }} className="absolute inset-[-12%_0]">
          <Image
            src="/images/promo-season.png"
            alt="A linen-wrapped photo book gift beside a candle on a walnut table"
            fill
            sizes="100vw"
            className="object-cover"
          />
        </motion.div>
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-t from-ink via-ink/60 to-ink/10 md:bg-gradient-to-r md:from-ink/90 md:via-ink/50 md:to-transparent"
        />

        <Reveal className="relative flex max-w-xl flex-col items-start gap-5 p-7 md:p-16">
          <RevealItem>
            <span className="inline-flex items-center gap-2 rounded-full bg-ink-foreground/10 px-3 py-1.5 text-xs font-medium uppercase tracking-[0.16em] backdrop-blur">
              <Gift className="size-3.5 text-accent" aria-hidden />
              Father&apos;s Day · June 21
            </span>
          </RevealItem>
          <RevealItem>
            <h2 id="gifts-title" className="text-balance font-serif text-5xl leading-[0.98] md:text-7xl">
              The gift he&apos;ll <em className="text-accent">actually</em> keep.
            </h2>
          </RevealItem>
          <RevealItem>
            <p className="max-w-md text-pretty text-lg text-ink-foreground/75">
              Order by June 14 for guaranteed delivery. Every book arrives gift-wrapped in linen, with a handwritten note
              if you&apos;d like.
            </p>
          </RevealItem>
          <RevealItem className="flex flex-wrap items-center gap-3 pt-2">
            <CtaLink href="#start" variant="light" size="lg" magnetic>
              Shop Father&apos;s Day
            </CtaLink>
            <span className="text-sm text-ink-foreground/70">
              Use <strong className="font-mono text-ink-foreground">DAD25</strong> for 25% off
            </span>
          </RevealItem>
        </Reveal>

        <motion.div
          style={{ y: reduceMotion ? 0 : cardY }}
          className="absolute right-10 top-12 hidden w-56 rotate-3 rounded-2xl bg-card/90 p-4 text-foreground shadow-lift backdrop-blur-xl lg:block"
        >
          <span className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Included free</span>
          <p className="mt-2 font-serif text-2xl leading-tight">Linen gift wrap & a handwritten card</p>
        </motion.div>
      </div>
    </section>
  )
}
