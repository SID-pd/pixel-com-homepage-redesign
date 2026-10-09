'use client'

import { useRef } from 'react'
import Image from 'next/image'
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from 'motion/react'
import {
  Download,
  Flame,
  Layers,
  Smartphone,
  Sparkles,
  Zap,
} from 'lucide-react'
import { easeOutExpo } from '@/lib/motion'
import { SectionHeading } from './section-heading'
import { Reveal, RevealItem } from './reveal'

const appFeatures = [
  {
    icon: Zap,
    title: 'Instant Camera Roll Sync',
    text: 'Select 100+ photos directly from your phone in one tap.',
    color: '#58B2C4',
  },
  {
    icon: Layers,
    title: 'Touch-Optimized Editor',
    text: 'Pinch to zoom, swap spreads with a swipe, preview in 3D.',
    color: '#FBE58B',
  },
  {
    icon: Flame,
    title: 'Auto-Save & Express Checkout',
    text: 'Seamless progress sync. Order with Apple Pay or Google Pay.',
    color: '#DC8A97',
  },
]

export function AppPromo() {
  const sectionRef = useRef<HTMLElement>(null)
  const reduceMotion = useReducedMotion()

  // Mouse tilt tracking
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  const springConfig = { stiffness: 70, damping: 20 }
  const tiltX = useSpring(useTransform(mouseY, [-0.5, 0.5], [10, -10]), springConfig)
  const tiltY = useSpring(useMotionValue(0), springConfig)

  // Scroll driven 3D sweet-spot animation
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  })

  // Sweet spot scroll transformations
  const scrollRotateY = useTransform(scrollYProgress, [0.15, 0.5, 0.85], [-18, 0, 18])
  const scrollX = useTransform(scrollYProgress, [0.15, 0.5, 0.85], [-30, 0, 30])
  const scrollScale = useTransform(scrollYProgress, [0.2, 0.5, 0.8], [0.96, 1.02, 0.97])
  const infoOpacity = useTransform(scrollYProgress, [0.3, 0.45, 0.8], [0, 1, 1])
  const infoY = useTransform(scrollYProgress, [0.3, 0.45], [20, 0])

  function handleMouseMove(e: React.PointerEvent<HTMLDivElement>) {
    if (reduceMotion || e.pointerType !== 'mouse') return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width - 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5
    mouseX.set(x)
    mouseY.set(y)
    tiltY.set(x * 20)
  }

  function handleMouseLeave() {
    mouseX.set(0)
    mouseY.set(0)
    tiltY.set(0)
  }

  return (
    <section
      ref={sectionRef}
      id="app"
      aria-labelledby="app-promo-title"
      className="scroll-mt-24 px-4 py-10 md:px-6 md:py-16"
    >
      <div className="mx-auto max-w-5xl rounded-3xl bg-secondary/80 px-5 py-8 shadow-float ring-1 ring-foreground/5 backdrop-blur-xl md:px-10 md:py-12">
        <SectionHeading
          eyebrow="Pixovo Mobile App"
          title={
            <span id="app-promo-title">
              Design on the go. <em className="text-accent">Memories in your pocket.</em>
            </span>
          }
          description="Upload photos straight from your camera roll, auto-layout your photo book in seconds, and order directly from iOS or Android."
        />

        <div className="mt-8 grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center lg:gap-10">
          {/* Scaled-Down 3D Interactive Rotating Phone Stage */}
          <div
            onPointerMove={handleMouseMove}
            onPointerLeave={handleMouseLeave}
            className="relative flex items-center justify-center py-2 [perspective:1000px]"
          >
            {/* Background Radial Glow */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,oklch(0.88_0.08_160/0.35),transparent_65%)]"
            />

            {/* Scaled-down 3D Phone Container (~210px width) */}
            <motion.div
              style={{
                x: reduceMotion ? 0 : scrollX,
                rotateY: reduceMotion ? 0 : scrollRotateY,
                rotateX: reduceMotion ? 0 : tiltX,
                scale: reduceMotion ? 1 : scrollScale,
              }}
              className="relative aspect-[9/18] w-[210px] transform-gpu rounded-[2.25rem] bg-ink p-2.5 shadow-lift ring-4 ring-ink/20 sm:w-[225px] [transform-style:preserve-3d]"
            >
              {/* Dynamic Island / Notch */}
              <div aria-hidden className="absolute left-1/2 top-4 z-30 h-3.5 w-20 -translate-x-1/2 rounded-full bg-ink" />

              {/* Mobile Screen Mockup */}
              <div className="relative flex h-full w-full flex-col overflow-hidden rounded-[1.85rem] bg-background text-foreground shadow-inner">
                {/* Mobile Header Bar */}
                <div className="flex items-center justify-between border-b px-3 pb-1.5 pt-5 text-[11px] font-semibold text-foreground/80">
                  <span className="flex items-center gap-1">
                    <Smartphone className="size-3 text-accent" />
                    Pixovo App
                  </span>
                  <span className="rounded-full bg-accent/15 px-1.5 py-0.5 text-[9px] text-accent font-medium">
                    v2.4 Live
                  </span>
                </div>

                {/* Mobile Screen Content */}
                <div className="flex flex-1 flex-col gap-2 p-2.5 overflow-hidden">
                  <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg bg-card shadow-sm">
                    <Image
                      src="/images/choose_your_size_2.webp"
                      alt="Pixovo mobile book editor preview"
                      fill
                      sizes="220px"
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    <span className="absolute bottom-1.5 left-1.5 rounded-md bg-card/85 px-1.5 py-0.5 text-[9px] font-medium text-foreground backdrop-blur">
                      10x10 Square Book
                    </span>
                  </div>

                  {/* Photo Grid Selector Simulation */}
                  <div className="grid grid-cols-3 gap-1 pt-0.5">
                    {['/images/photo-wedding.png', '/images/photo-travel.png', '/images/photo-baby.png'].map(
                      (src, i) => (
                        <div key={i} className="relative aspect-square overflow-hidden rounded-md">
                          <Image src={src} alt="" fill sizes="70px" className="object-cover" />
                        </div>
                      ),
                    )}
                  </div>

                  {/* Mobile Action Bar */}
                  <div className="mt-auto flex items-center justify-between rounded-lg bg-card p-2 shadow-sm ring-1 ring-foreground/5">
                    <div className="flex items-center gap-1.5">
                      <span className="grid size-6 place-items-center rounded-md bg-accent text-accent-foreground">
                        <Sparkles className="size-3" />
                      </span>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-medium leading-tight">Auto-Designed</span>
                        <span className="text-[8px] text-muted-foreground">32 pages · 140 photos</span>
                      </div>
                    </div>
                    <span className="rounded-md bg-primary px-2 py-0.5 text-[9px] font-medium text-primary-foreground">
                      Order
                    </span>
                  </div>
                </div>
              </div>

              {/* Floating 3D Badge Right */}
              <motion.div
                style={{ opacity: infoOpacity, y: infoY }}
                className="absolute -right-8 bottom-16 z-40 hidden flex-col gap-0.5 rounded-xl bg-card/90 p-2 shadow-float ring-1 ring-foreground/5 backdrop-blur-xl md:flex [transform:translateZ(35px)]"
              >
                <div className="flex items-center gap-1 text-[11px] font-semibold text-foreground">
                  <Download className="size-3 text-accent" />
                  <span>Free Download</span>
                </div>
                <span className="text-[9px] text-muted-foreground">iOS & Android</span>
              </motion.div>
            </motion.div>
          </div>

          {/* App Features & Download Buttons Column */}
          <div className="flex flex-col gap-5">
            <Reveal className="flex flex-col gap-3" staggerChildren={0.1}>
              {appFeatures.map((feat) => {
                const Icon = feat.icon
                return (
                  <RevealItem
                    key={feat.title}
                    className="group flex gap-3.5 rounded-xl bg-card p-3.5 shadow-sm ring-1 ring-foreground/5 transition-all duration-300 hover:shadow-md hover:ring-foreground/10"
                  >
                    <span
                      className="grid size-9 shrink-0 place-items-center rounded-lg transition-transform duration-300 group-hover:scale-105"
                      style={{ background: `${feat.color}25`, color: feat.color }}
                    >
                      <Icon className="size-4.5" />
                    </span>
                    <div className="flex flex-col gap-0.5">
                      <h3 className="text-sm font-semibold tracking-tight">{feat.title}</h3>
                      <p className="text-xs leading-relaxed text-muted-foreground">{feat.text}</p>
                    </div>
                  </RevealItem>
                )
              })}
            </Reveal>

            {/* Store Badges & Download Options */}
            <div className="mt-1 flex flex-col gap-2.5 border-t pt-4">
              <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Get the Pixovo app today
              </span>
              <div className="flex flex-wrap items-center gap-2.5">
                {/* Apple App Store Button */}
                <a
                  href="https://pixovo.com/"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2.5 rounded-xl bg-ink px-4 py-2.5 text-ink-foreground shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-float"
                >
                  <AppleIcon className="size-5 shrink-0 fill-current" />
                  <div className="flex flex-col text-left">
                    <span className="text-[9px] font-medium uppercase tracking-wider text-ink-foreground/70">
                      Download on the
                    </span>
                    <span className="text-xs font-semibold leading-tight">App Store</span>
                  </div>
                </a>

                {/* Google Play Store Button */}
                <a
                  href="https://pixovo.com/"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2.5 rounded-xl bg-card px-4 py-2.5 text-foreground ring-1 ring-foreground/10 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-float"
                >
                  <GooglePlayIcon className="size-5 shrink-0" />
                  <div className="flex flex-col text-left">
                    <span className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground">
                      GET IT ON
                    </span>
                    <span className="text-xs font-semibold leading-tight">Google Play</span>
                  </div>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function AppleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.64c.66-.8 1.11-1.92.99-3.04-.96.04-2.12.64-2.8 1.44-.61.71-1.15 1.86-.99 2.96 1.07.08 2.14-.56 2.8-1.36z" />
    </svg>
  )
}

function GooglePlayIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M3.609 1.814A2.37 2.37 0 0 0 3 3.487v17.026c0 .66.23 1.25.609 1.673l10.183-10.183L3.609 1.814z"
        fill="#00D2FF"
      />
      <path
        d="M17.067 8.725l-3.275 3.275 3.275 3.275 3.58-2.045c.9-.514.9-1.946 0-2.46l-3.58-2.045z"
        fill="#FFC107"
      />
      <path
        d="M13.792 12L3.609 1.814c.22-.244.52-.404.861-.404.28 0 .54.09.76.24l11.837 6.765-3.275 3.585z"
        fill="#00F076"
      />
      <path
        d="M13.792 12l3.275 3.585-11.837 6.765c-.22.15-.48.24-.76.24-.341 0-.641-.16-.861-.404L13.792 12z"
        fill="#FF3D00"
      />
    </svg>
  )
}
