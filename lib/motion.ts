import type { Transition, Variants } from 'motion/react'

export const easeOutExpo = [0.16, 1, 0.3, 1] as const

export const spring = { type: 'spring', stiffness: 220, damping: 24, mass: 0.6 } as const satisfies Transition

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: easeOutExpo } },
}

export const stagger = (staggerChildren = 0.08, delayChildren = 0): Variants => ({
  hidden: {},
  show: { transition: { staggerChildren, delayChildren } },
})
