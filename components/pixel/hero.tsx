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

function GoogleLogo({ className = 'size-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  )
}

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
      className="relative overflow-hidden pt-28 pb-8 sm:pt-32 md:pt-36 md:pb-12"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[80vh] bg-[radial-gradient(60%_50%_at_70%_30%,oklch(0.9_0.05_60/0.7),transparent_70%),radial-gradient(40%_40%_at_15%_20%,oklch(0.93_0.03_30/0.6),transparent_70%)]"
      />

      <div className="mx-auto grid max-w-6xl items-center gap-14 px-5 md:px-6 lg:grid-cols-[1.05fr_1fr] lg:gap-8">
        <div className="flex flex-col items-start gap-6">
          <h1
            id="hero-title"
            className="font-serif text-[clamp(2.5rem,5.5vw,4.5rem)] leading-[1.05] tracking-[-0.02em] text-foreground max-w-xl"
          >
            Every photo has a heart.{' '}
            <em className="font-serif text-accent block mt-1">
              Give yours a home.
            </em>
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: base + 0.3, ease: easeOutExpo }}
            className="max-w-lg text-pretty text-base sm:text-lg leading-relaxed text-muted-foreground"
          >
            From Sunday family dinners to cross-country road trips, don't let your best moments stay trapped on a screen. Experience seamless AI layout and true American bookbinding quality in minutes.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: base + 0.55, ease: easeOutExpo }}
            className="flex flex-col gap-2.5"
          >
            <div className="flex flex-wrap items-center gap-3">
              <CtaLink href="/photo-book/" size="lg" magnetic>
                Create Your Photo Book
              </CtaLink>
              <CtaLink href="#products" size="lg" variant="secondary" showArrow={false}>
                Explore sizes & pricing
              </CtaLink>
            </div>
          </motion.div>

          <motion.ul
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: base + 0.75 }}
            className="flex flex-wrap items-center gap-x-6 gap-y-3 pt-1 text-sm text-muted-foreground"
          >
            {/* Clean Official Google Rating Badge in Hero */}
            <li className="flex items-center gap-2">
              <a
                href="https://www.google.com/search?q=Pixovo&stick=H4sIAAAAAAAA_-NgU1I1qLAwSElKSzJKTUs1MUszM7C0MqgwMjU3NjFKSTIySjI3skw1X8TKFpBZkV-WDwBRDVDCMgAAAA&hl=en&mat=CQk0NxzWu7hcElcBzAmVZgQcmLTQ9588wX0dgKmZtkzqmi7c250ZVxgyArbiP9uGuvyaK9I1c4VfLseEMozg3ssjRs4hYU41lpPiOmfZ4o1KzJsuvHT0hBVKEkxtnRk-Rsc&authuser=0&ved=1t:350944"
                target="_blank"
                rel="noopener noreferrer"
                title="View Google Customer Reviews"
                className="inline-flex items-center gap-2.5 rounded-full bg-card/90 px-3.5 py-1.5 ring-1 ring-foreground/10 shadow-xs hover:shadow-md hover:scale-105 transition-all text-xs text-foreground group cursor-pointer"
              >
                <GoogleLogo className="size-4 shrink-0" />
                <div className="flex gap-0.5" aria-label="5 out of 5 stars">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="size-3.5 fill-amber-400 text-amber-400" aria-hidden />
                  ))}
                </div>
                <span className="font-bold text-foreground">4.8/5</span>
                <span className="text-muted-foreground">from 50,000+ customers</span>
              </a>
            </li>

            <li className="flex items-center gap-1.5 text-xs sm:text-sm">
              <Check className="size-4 text-accent" aria-hidden />
              Hand Crafted in USA
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
