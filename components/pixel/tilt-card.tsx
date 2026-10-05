'use client'

import { useRef, type PointerEvent, type ReactNode } from 'react'
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from 'motion/react'
import { cn } from '@/lib/utils'

type TiltCardProps = {
  children: ReactNode
  className?: string
  intensity?: number
  lift?: number
}

export function TiltCard({ children, className, intensity = 7, lift = 6 }: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null)
  const reduceMotion = useReducedMotion()
  const px = useMotionValue(0.5)
  const py = useMotionValue(0.5)
  const springCfg = { stiffness: 180, damping: 18, mass: 0.5 }
  const rotateX = useSpring(useTransform(py, [0, 1], [intensity, -intensity]), springCfg)
  const rotateY = useSpring(useTransform(px, [0, 1], [-intensity, intensity]), springCfg)
  const glareX = useTransform(px, [0, 1], ['0%', '100%'])
  const glareY = useTransform(py, [0, 1], ['0%', '100%'])
  const glare = useMotionTemplate`radial-gradient(600px circle at ${glareX} ${glareY}, oklch(1 0 0 / 0.22), transparent 45%)`

  function handleMove(e: PointerEvent<HTMLDivElement>) {
    if (reduceMotion || e.pointerType !== 'mouse' || !ref.current) return
    const rect = ref.current.getBoundingClientRect()
    px.set((e.clientX - rect.left) / rect.width)
    py.set((e.clientY - rect.top) / rect.height)
  }

  function handleLeave() {
    px.set(0.5)
    py.set(0.5)
  }

  return (
    <motion.div
      ref={ref}
      onPointerMove={handleMove}
      onPointerLeave={handleLeave}
      whileHover={reduceMotion ? undefined : { y: -lift }}
      transition={{ type: 'spring', stiffness: 260, damping: 22 }}
      style={{ rotateX, rotateY, transformPerspective: 1100 }}
      className={cn('group relative transform-gpu', className)}
    >
      {children}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-10 rounded-[inherit] opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{ background: glare }}
      />
    </motion.div>
  )
}
