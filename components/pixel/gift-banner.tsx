'use client'

import { useRef } from 'react'
import Image from 'next/image'
import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react'
import { Sparkles, ArrowRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { formatEnd, type Campaign } from '@/lib/flow/catalog'
import { flow } from '@/lib/flow/store'
import { Reveal, RevealItem } from './reveal'

/* 1. Realistic SVG Leaf Components with Gradients & Vein Details */

function MapleLeaf({ className, id = 'maple1', startColor = '#c2410c', endColor = '#ea580c' }: { className?: string; id?: string; startColor?: string; endColor?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={`maple-grad-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={startColor} />
          <stop offset="100%" stopColor={endColor} />
        </linearGradient>
      </defs>
      <path
        d="M50 4 C53 22, 60 25, 78 20 C 70 34, 72 38, 92 42 C 76 52, 78 58, 88 74 C 70 68, 62 74, 58 92 L 50 78 L 42 92 C 38 74, 30 68, 12 74 C 22 58, 24 52, 8 42 C 28 38, 30 34, 22 20 C 40 25, 47 22, 50 4 Z"
        fill={`url(#maple-grad-${id})`}
      />
      {/* Leaf Veins */}
      <path d="M50 78 L50 25 M50 60 L70 40 M50 60 L30 40 M50 45 L65 30 M50 45 L35 30" stroke="#fef08a" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
      <path d="M50 78 L50 96" stroke="#7c2d12" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

function OakLeaf({ className, id = 'oak1', startColor = '#f59e0b', endColor = '#d97706' }: { className?: string; id?: string; startColor?: string; endColor?: string }) {
  return (
    <svg viewBox="0 0 100 120" className={className} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={`oak-grad-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={startColor} />
          <stop offset="100%" stopColor={endColor} />
        </linearGradient>
      </defs>
      <path
        d="M50 5 C 62 15, 66 22, 58 32 C 72 35, 78 45, 62 55 C 80 62, 82 76, 62 86 C 68 96, 58 105, 50 102 C 42 105, 32 96, 38 86 C 18 76, 20 62, 38 55 C 22 45, 28 35, 42 32 C 34 22, 38 15, 50 5 Z"
        fill={`url(#oak-grad-${id})`}
      />
      {/* Leaf Veins */}
      <path d="M50 102 L50 20 M50 80 L65 68 M50 80 L35 68 M50 60 L62 48 M50 60 L38 48 M50 40 L58 30 M50 40 L42 30" stroke="#fef9c3" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
      <path d="M50 102 L50 116" stroke="#78350f" strokeWidth="3.5" strokeLinecap="round" />
    </svg>
  )
}

function BirchLeaf({ className, id = 'birch1', startColor = '#eab308', endColor = '#ca8a04' }: { className?: string; id?: string; startColor?: string; endColor?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={`birch-grad-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={startColor} />
          <stop offset="100%" stopColor={endColor} />
        </linearGradient>
      </defs>
      <path
        d="M50 8 C 65 25, 82 45, 75 70 C 68 85, 55 88, 50 88 C 45 88, 32 85, 25 70 C 18 45, 35 25, 50 8 Z"
        fill={`url(#birch-grad-${id})`}
      />
      <path d="M50 88 L50 20 M50 70 L65 55 M50 70 L35 55 M50 50 L62 38 M50 50 L38 38" stroke="#fef08a" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
      <path d="M50 88 L50 98" stroke="#713f12" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

/* 2. Floating Leaves Configuration around Framed Card */

const floatingLeaves = [
  { type: 'maple', id: 'm1', top: '-6%', right: '4%', size: 'w-24 h-24 md:w-32 md:h-32', startColor: '#b91c1c', endColor: '#ea580c', delay: 0, duration: 7, rotate: 18 },
  { type: 'oak', id: 'o1', top: '12%', left: '-4%', size: 'w-20 h-24 md:w-28 md:h-32', startColor: '#f59e0b', endColor: '#b45309', delay: 1, duration: 8.5, rotate: -22 },
  { type: 'birch', id: 'b1', bottom: '15%', left: '-3%', size: 'w-16 h-16 md:w-22 md:h-22', startColor: '#eab308', endColor: '#d97706', delay: 0.5, duration: 6, rotate: 35 },
  { type: 'maple', id: 'm2', bottom: '-8%', right: '6%', size: 'w-28 h-28 md:w-36 md:h-36', startColor: '#dc2626', endColor: '#f97316', delay: 1.5, duration: 9, rotate: -15 },
  { type: 'oak', id: 'o2', bottom: '-5%', left: '25%', size: 'w-18 h-22 md:w-24 md:h-28', startColor: '#fbbf24', endColor: '#d97706', delay: 0.8, duration: 7.5, rotate: 45 },
  { type: 'birch', id: 'b2', top: '-4%', left: '30%', size: 'w-14 h-14 md:w-20 md:h-20', startColor: '#facc15', endColor: '#ca8a04', delay: 1.2, duration: 8, rotate: -10 },
]

export function GiftBanner({ campaign }: { campaign: Campaign }) {
  const router = useRouter()
  const ref = useRef<HTMLDivElement>(null)
  const reduceMotion = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const imageY = useTransform(scrollYProgress, [0, 1], ['-8%', '8%'])

  return (
    <section id="gifts" aria-labelledby="gifts-title" className="scroll-mt-24 px-3 md:px-6 my-8">
      {/* Main Outer Division: Rich Terracotta/Warm Walnut Background with Sunbeam Rays */}
      <div
        ref={ref}
        className="relative mx-auto flex min-h-[580px] max-w-7xl items-center justify-center overflow-hidden rounded-[2.5rem] bg-[#2a1711] p-4 md:p-12 lg:p-16 shadow-2xl border border-amber-900/30"
      >
        {/* Editorial Background Image with Warm Sunlight Blend */}
        <motion.div style={{ y: reduceMotion ? 0 : imageY }} className="absolute inset-[-10%_0]">
          <Image
            src="/images/autumn-gift-banner.jpg"
            alt="Warm autumn photobook scene with falling maple leaves"
            fill
            sizes="100vw"
            className="object-cover opacity-75 mix-blend-overlay"
            priority
          />
        </motion.div>

        {/* Terracotta Sunray Gradient Background Layer */}
        <div
          aria-hidden
          className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(245,158,11,0.25),transparent_60%),radial-gradient(ellipse_at_bottom_right,rgba(185,28,28,0.3),transparent_70%),linear-gradient(135deg,rgba(42,23,17,0.92),rgba(24,14,10,0.96))]"
        />

        {/* Diagonal Sunbeam Lighting Ray (Inspired by Image 3) */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-20 -left-20 h-[140%] w-[60%] rotate-45 bg-gradient-to-r from-amber-200/10 via-amber-100/5 to-transparent blur-2xl"
        />

        {/* 3D Floating Autumn Leaves (Inspired by Images 1 & 3) */}
        {!reduceMotion &&
          floatingLeaves.map((leaf) => {
            const LeafComp = leaf.type === 'maple' ? MapleLeaf : leaf.type === 'oak' ? OakLeaf : BirchLeaf
            return (
              <motion.div
                key={leaf.id}
                initial={{ y: 0, x: 0, rotate: leaf.rotate }}
                animate={{
                  y: [0, -16, 0, 10, 0],
                  x: [0, 8, -6, 4, 0],
                  rotate: [leaf.rotate, leaf.rotate + 14, leaf.rotate - 10, leaf.rotate],
                }}
                transition={{
                  duration: leaf.duration,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: leaf.delay,
                }}
                style={{
                  position: 'absolute',
                  top: leaf.top,
                  bottom: leaf.bottom,
                  left: leaf.left,
                  right: leaf.right,
                }}
                className="pointer-events-none z-30 filter drop-shadow-[0_12px_16px_rgba(0,0,0,0.5)]"
              >
                <LeafComp id={leaf.id} className={leaf.size} startColor={leaf.startColor} endColor={leaf.endColor} />
              </motion.div>
            )
          })}

        {/* Central Framed Card (Inspired by Image 2 - Clean High-Contrast Text Box) */}
        <Reveal className="relative z-20 mx-auto w-full max-w-3xl overflow-hidden rounded-[2rem] bg-white/95 p-8 text-neutral-900 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.6)] backdrop-blur-xl border-4 border-amber-500/20 md:p-12 lg:p-14">
          {/* Subtle Inner Double Border Frame (Inspired by Image 2) */}
          <div className="pointer-events-none absolute inset-3.5 rounded-[1.4rem] border border-amber-800/15" />

          <div className="flex flex-col items-center text-center gap-5 relative z-10">
            {/* Top Tag & Discount Badge */}
            <RevealItem>
              <div className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-amber-900 border border-amber-300 shadow-sm">
                <Sparkles className="size-3.5 text-amber-700" />
                {campaign.name} · {campaign.percent}% off · ends {formatEnd(campaign.end)}
              </div>
            </RevealItem>

            {/* Script & Serif Emotional Headline */}
            <RevealItem>
              <div className="flex flex-col items-center">
                <span className="font-serif text-2xl md:text-3xl text-amber-800 tracking-tight">
                  As seasons change,
                </span>
                <h2 id="gifts-title" className="mt-1 font-serif text-4xl font-bold leading-[1.05] md:text-6xl tracking-tight text-neutral-900">
                  Some moments stay <span className="text-amber-700 underline decoration-amber-300 underline-offset-8">warm forever.</span>
                </h2>
              </div>
            </RevealItem>

            {/* Clean Emotional Description */}
            <RevealItem>
              <p className="max-w-xl text-pretty text-sm md:text-base text-neutral-700 leading-relaxed font-normal">
                As golden autumn leaves fall and cool crisp air settles in, gather your favorite memories of this year into a luxury hardcover photo book. Arrives gift-wrapped in warm linen with a handwritten card.
              </p>
            </RevealItem>

            {/* Call to Action Button & Promo Code */}
            <RevealItem className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-3 w-full">
              <button
                type="button"
                onClick={() => {
                  flow.setPromo(campaign.code)
                  router.push('/photo-book/')
                }}
                className="inline-flex w-full items-center justify-center rounded-full bg-amber-900 px-8 py-3.5 text-base font-medium text-white shadow-lg transition-all duration-300 hover:scale-105 hover:bg-amber-800 sm:w-auto"
              >
                Create Your Autumn Gift Book <ArrowRight className="ml-2 inline size-4" />
              </button>

              <div className="flex items-center gap-2 text-xs font-semibold text-amber-950 bg-amber-50 px-4 py-2.5 rounded-full border border-amber-200 shadow-xs">
                <span>Code</span>
                <strong className="font-mono text-amber-900 bg-amber-200/80 px-2 py-0.5 rounded border border-amber-300">
                  {campaign.code}
                </strong>
                <span>{campaign.percent}% off, applied for you</span>
              </div>
            </RevealItem>

            {/* Included Free Gift Perks Bar */}
            <RevealItem className="w-full pt-4 border-t border-neutral-200/80 mt-2">
              <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-medium text-neutral-600">
                <span className="flex items-center gap-1.5 text-amber-900 font-semibold">
                  ✓ Free Linen Gift Wrapping
                </span>
                <span className="hidden sm:inline text-neutral-300">•</span>
                <span className="flex items-center gap-1.5 text-amber-900 font-semibold">
                  ✓ Optional Handwritten Card
                </span>
                <span className="hidden md:inline text-neutral-300">•</span>
                <span className="flex items-center gap-1.5 text-amber-900 font-semibold">
                  ✓ Printed & Shipped from California USA
                </span>
              </div>
            </RevealItem>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
