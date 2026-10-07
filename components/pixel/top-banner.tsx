'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Sparkles, ChevronRight, X } from 'lucide-react'

const messages = [
  'Made in California | 20+ Years Precision Manufacturing',
  'Lowest Prices USA | Buy Direct from Our Factory',
  'Fast Turnaround | Order Today, Ship 3–5 Days',
  'Professional Design Team | Free AI Layout Design',
  'Huge Production Capacity | Trusted by Brands Nationwide',
]

export function TopBanner() {
  const [index, setIndex] = useState(0)
  const [isHovered, setIsHovered] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)

  useEffect(() => {
    if (isHovered) return
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % messages.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [isHovered])

  if (isDismissed) return null

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative z-50 w-full bg-neutral-950 px-3 py-1.5 text-neutral-100 shadow-xs border-b border-neutral-800 transition-all duration-300"
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 text-xs md:text-sm font-medium">
        {/* Left Side Message Carousel */}
        <div className="flex items-center gap-2 overflow-hidden py-0.5">
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-accent/20 px-2 py-0.5 text-[11px] font-bold text-accent tracking-wide uppercase">
            <Sparkles className="size-3" />
            Factory Direct
          </span>

          <div className="relative h-5 overflow-hidden flex-1 min-w-[200px] sm:min-w-[340px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
                className="absolute inset-0 flex items-center gap-2 truncate font-sans text-neutral-200"
              >
                <span>{messages[index]}</span>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Right Side Actions: Claim 50% OFF CTA + Dismiss Cross Button */}
        <div className="flex items-center gap-2.5 shrink-0">
          <a
            href="/photo-book/"
            className="inline-flex items-center gap-1 text-xs font-semibold text-accent hover:underline shrink-0"
          >
            <span>Claim 50% OFF</span>
            <ChevronRight className="size-3.5" />
          </a>

          {/* Close / Dismiss Cross (X) Button */}
          <button
            type="button"
            onClick={() => setIsDismissed(true)}
            aria-label="Close banner"
            className="inline-flex size-6 items-center justify-center rounded-full text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors focus:outline-none"
          >
            <X className="size-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}
