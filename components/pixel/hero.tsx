'use client'

import { useRef, type PointerEvent } from 'react'
import Image from 'next/image'
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from 'motion/react'
import { Check, Sparkles, Star } from 'lucide-react'
import { easeOutExpo } from '@/lib/motion'
import { CtaLink } from './cta-link'
import { useIntroDelay } from './intro-splash'

const headline = [
  { text: 'Your', italic: false },
  { text: 'memories,', italic: false },
  { text: 'beautifully', italic: true },
  { text: 'bound.', italic: false },
]

function useDepth(mx: MotionValue<number>, my: MotionValue<number>, depth: number) {
  const x = useTransform(mx, (v) => v * depth)
  const y = useTransform(my, (v) => v * depth)
  return { x, y }
}

export function Hero() {
  const sectionRef = useRef<HTMLElement>(null)
  const reduceMotion = useReducedMotion()
  const base = useIntroDelay()
  const mx = useSpring(useMotionValue(0), { stiffness: 60, damping: 18 })
  const my = useSpring(useMotionValue(0), { stiffness: 60, damping: 18 })

  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start start', 'end start'] })
  const stageY = useTransform(scrollYProgress, [0, 1], [0, 120])
  const stageRotate = useTransform(scrollYProgress, [0, 1], [0, 6])

  const back = useDepth(mx, my, -10)
  const mid = useDepth(mx, my, 18)
  const front = useDepth(mx, my, 34)
  const tiltX = useTransform(my, [-1, 1], [6, -6])
  const tiltY = useTransform(mx, [-1, 1], [-8, 8])

  function handleMove(e: PointerEvent<HTMLElement>) {
    if (reduceMotion || e.pointerType !== 'mouse') return
    const rect = e.currentTarget.getBoundingClientRect()
    mx.set(((e.clientX - rect.left) / rect.width - 0.5) * 2)
    my.set(((e.clientY - rect.top) / rect.height - 0.5) * 2)
  }

  return (
    <section
      ref={sectionRef}
      onPointerMove={handleMove}
      onPointerLeave={() => {
        mx.set(0)
        my.set(0)
      }}
      aria-labelledby="hero-title"
      className="relative overflow-hidden pt-28 pb-16 md:pt-36 md:pb-24"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[80vh] bg-[radial-gradient(60%_50%_at_70%_30%,oklch(0.9_0.05_60/0.7),transparent_70%),radial-gradient(40%_40%_at_15%_20%,oklch(0.93_0.03_30/0.6),transparent_70%)]"
      />

      <div className="mx-auto grid max-w-6xl items-center gap-14 px-5 md:px-6 lg:grid-cols-[1.05fr_1fr] lg:gap-8">
        <div className="flex flex-col items-start gap-7">
          <motion.span
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: base, ease: easeOutExpo }}
            className="inline-flex items-center gap-2 rounded-full bg-card/70 px-4 py-1.5 text-sm text-foreground/80 shadow-sm ring-1 ring-foreground/5 backdrop-blur"
          >
            Premium Photo Books — Printed in the USA
          </motion.span>

          <h1
            id="hero-title"
            className="text-balance font-serif text-[clamp(2.75rem,6.5vw,5.25rem)] leading-[1.02] tracking-[-0.02em]"
          >
            Every photo has a heart.{' '}
            <em className="font-serif font-normal italic text-accent">Give yours a home.</em>
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: base + 0.45, ease: easeOutExpo }}
            className="max-w-md text-pretty text-lg leading-relaxed text-muted-foreground"
          >
            Upload your photos and let Pixovo design a personalized photo book in minutes. Premium photo book printing, shipped from the USA.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: base + 0.55, ease: easeOutExpo }}
            className="flex flex-wrap items-center gap-3"
          >
            <CtaLink href="/photo-book/" size="lg" magnetic>
              Create Your Photo Book
            </CtaLink>
            <CtaLink href="#products" size="lg" variant="secondary" showArrow={false}>
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

        <motion.div
          style={{ y: reduceMotion ? 0 : stageY, rotate: reduceMotion ? 0 : stageRotate }}
          className="relative mx-auto aspect-[1/1] w-full max-w-[560px] [perspective:1400px]"
        >
          <motion.div
            style={{ x: back.x, y: back.y }}
            initial={{ opacity: 0, scale: 0.9, rotate: -14 }}
            animate={{ opacity: 1, scale: 1, rotate: -9 }}
            transition={{ duration: 1.1, delay: base + 0.35, ease: easeOutExpo }}
            className="absolute left-[2%] top-[6%] w-[38%] rounded-2xl bg-card p-2 pb-8 shadow-float"
          >
            <div className="relative aspect-[4/5] overflow-hidden rounded-lg">
              <Image
                src="/images/photo-travel.png"
                alt="Woman in a straw hat overlooking a coastal town at sunset"
                fill
                sizes="(min-width: 1024px) 220px, 38vw"
                className="object-cover"
              />
            </div>
          </motion.div>

          <motion.div
            style={{ x: back.x, y: back.y }}
            initial={{ opacity: 0, scale: 0.9, rotate: 16 }}
            animate={{ opacity: 1, scale: 1, rotate: 8 }}
            transition={{ duration: 1.1, delay: base + 0.45, ease: easeOutExpo }}
            className="absolute right-[1%] top-[2%] w-[34%] rounded-2xl bg-card p-2 pb-8 shadow-float"
          >
            <div className="relative aspect-[4/5] overflow-hidden rounded-lg">
              <Image
                src="/images/photo-wedding.png"
                alt="Couple laughing while walking through a golden meadow"
                fill
                sizes="(min-width: 1024px) 200px, 34vw"
                className="object-cover"
              />
            </div>
          </motion.div>

          <motion.div
            style={{ x: mid.x, y: mid.y, rotateX: tiltX, rotateY: tiltY }}
            initial={{ opacity: 0, y: 60, rotateX: 25 }}
            animate={{ opacity: 1, y: 0, rotateX: 0 }}
            transition={{ duration: 1.2, delay: base + 0.2, ease: easeOutExpo }}
            className="absolute inset-x-[8%] top-[24%] transform-gpu [transform-style:preserve-3d]"
          >
            <div className="relative aspect-[4/3] overflow-hidden rounded-[1.75rem] shadow-lift ring-1 ring-foreground/5">
              <Image
                src="/images/hero-book.png"
                alt="An open linen photo book showing a family beach holiday spread"
                fill
                priority
                sizes="(min-width: 1024px) 470px, 84vw"
                className="object-cover"
              />
              <div
                aria-hidden
                className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/0 to-white/20"
              />
            </div>
          </motion.div>

          <motion.div
            style={{ x: front.x, y: front.y }}
            initial={{ opacity: 0, scale: 0.85, rotate: 0 }}
            animate={{ opacity: 1, scale: 1, rotate: -4 }}
            transition={{ duration: 1, delay: base + 0.7, ease: easeOutExpo }}
            className="absolute bottom-[4%] left-[0%] w-[30%] rounded-2xl bg-card p-2 pb-7 shadow-lift"
          >
            <div className="relative aspect-square overflow-hidden rounded-lg">
              <Image
                src="/images/photo-baby.png"
                alt="Toddler laughing in a parent's arms in a sunlit kitchen"
                fill
                sizes="(min-width: 1024px) 170px, 30vw"
                className="object-cover"
              />
            </div>
          </motion.div>

          <motion.div
            style={{ x: front.x, y: front.y }}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: base + 1, ease: easeOutExpo }}
            className="absolute bottom-[10%] right-[0%] flex items-center gap-3 rounded-2xl bg-card/80 py-3 pl-3 pr-4 shadow-lift ring-1 ring-foreground/5 backdrop-blur-xl"
          >
            <span className="grid size-9 place-items-center rounded-xl bg-accent text-accent-foreground">
              <Sparkles className="size-4" aria-hidden />
            </span>
            <span className="flex flex-col">
              <span className="text-sm font-medium leading-tight">Smart Auto-Layout</span>
              <span className="text-xs text-muted-foreground">50,000+ Happy Customers</span>
            </span>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
