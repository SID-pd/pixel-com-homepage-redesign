'use client'

import { motion, useReducedMotion } from 'motion/react'

const BITS = ['💛', '✨', '🧡', '✨', '💜', '🤍', '✨', '💛', '🧡', '✨']

/** A brief, quiet shower of hearts and sparkles. About 2.5 seconds, pointer-transparent, transform/opacity only. */
export function Celebration({ delay = 0.15 }: { delay?: number }) {
  const reduce = useReducedMotion()
  if (reduce) return null
  return (
    <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 z-20 h-64 overflow-hidden">
      {BITS.map((b, i) => (
        <motion.span
          key={i}
          className="absolute text-lg"
          style={{ left: `${6 + i * 9.5}%`, top: '70%' }}
          initial={{ opacity: 0, y: 0, scale: 0.5, rotate: 0 }}
          animate={{ opacity: [0, 1, 0], y: -(120 + (i % 4) * 30), scale: 1, rotate: (i % 2 ? 1 : -1) * 25 }}
          transition={{ duration: 2.2, delay: delay + i * 0.1, ease: 'easeOut' }}
        >
          {b}
        </motion.span>
      ))}
    </div>
  )
}
