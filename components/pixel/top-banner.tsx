'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useRouter } from 'next/navigation'
import { Sparkles, ChevronRight, X } from 'lucide-react'
import { formatEnd } from '@/lib/flow/catalog'
import { flow } from '@/lib/flow/store'
import { useCampaign } from '@/lib/flow/use-campaign'

// Evergreen messages only — the active sale (if any) already has its own persistent slot on the right,
// so it never needs to repeat here too.
const messages = [
  '20+ Years of Printing Experience',
  'Design free | Pay only when you print',
  'Factory direct | No middlemen, fair prices',
  'Ships in 3–5 business days | From our USA facility',
]

export function TopBanner() {
  const router = useRouter()
  const campaign = useCampaign()
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
      <div className="mx-auto flex max-w-6xl items-center gap-2 text-xs md:text-sm font-medium">
        {/* Left Side Message Carousel */}
        <div className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden py-0.5">
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-accent/20 px-2 py-0.5 text-[11px] font-bold text-accent tracking-wide uppercase">
            <Sparkles className="size-3" />
            Factory Direct
          </span>

          <div className="relative hidden h-5 min-w-0 flex-1 overflow-hidden sm:block">
            <AnimatePresence mode="wait">
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
                className="absolute inset-0 flex items-center"
              >
                <span className="min-w-0 truncate font-sans text-neutral-200">{messages[index]}</span>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Right side: the active sale (auto-applies its code) + dismiss */}
        <div className="flex items-center gap-2.5 shrink-0">
          {campaign ? (
            // The real deadline from the sale calendar; the code stops working on this date.
            <button
              type="button"
              onClick={() => {
                flow.setPromo(campaign.code)
                router.push('/photo-book/')
              }}
              className="inline-flex items-center gap-1 text-xs font-semibold text-accent hover:underline shrink-0"
            >
              <span>
                {campaign.name}: {campaign.percent}% off
                <span className="hidden sm:inline"> · ends {formatEnd(campaign.end)}</span>
              </span>
              <ChevronRight className="size-3.5" />
            </button>
          ) : (
            <a href="/photo-book/" className="inline-flex items-center gap-1 text-xs font-semibold text-accent hover:underline shrink-0">
              <span>Create Your Photo Book</span>
              <ChevronRight className="size-3.5" />
            </a>
          )}

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
