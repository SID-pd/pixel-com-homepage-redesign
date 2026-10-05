'use client'

import { useRef, type PointerEvent, type ReactNode } from 'react'
import Link from 'next/link'
import { motion, useMotionValue, useReducedMotion, useSpring } from 'motion/react'
import { ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

type CtaLinkProps = {
  href: string
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'light' | 'accent'
  size?: 'md' | 'lg'
  magnetic?: boolean
  showArrow?: boolean
  className?: string
}

const variants = {
  primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
  accent: 'bg-accent text-accent-foreground hover:brightness-105',
  light: 'bg-ink-foreground text-ink hover:bg-white',
  secondary:
    'bg-card/60 text-foreground ring-1 ring-inset ring-foreground/10 backdrop-blur-md hover:bg-card hover:ring-foreground/20',
}

const sizes = {
  md: 'h-11 px-5 text-sm',
  lg: 'h-14 px-7 text-base',
}

export function CtaLink({
  href,
  children,
  variant = 'primary',
  size = 'md',
  magnetic = false,
  showArrow = true,
  className,
}: CtaLinkProps) {
  const ref = useRef<HTMLDivElement>(null)
  const reduceMotion = useReducedMotion()
  const x = useSpring(useMotionValue(0), { stiffness: 250, damping: 18, mass: 0.4 })
  const y = useSpring(useMotionValue(0), { stiffness: 250, damping: 18, mass: 0.4 })

  function handleMove(e: PointerEvent<HTMLDivElement>) {
    if (!magnetic || reduceMotion || e.pointerType !== 'mouse' || !ref.current) return
    const rect = ref.current.getBoundingClientRect()
    x.set((e.clientX - (rect.left + rect.width / 2)) * 0.25)
    y.set((e.clientY - (rect.top + rect.height / 2)) * 0.35)
  }

  function reset() {
    x.set(0)
    y.set(0)
  }

  return (
    <motion.div ref={ref} style={{ x, y }} onPointerMove={handleMove} onPointerLeave={reset} className="inline-flex">
      <Link
        href={href}
        className={cn(
          'group/cta relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full font-medium tracking-tight transition-[background-color,box-shadow,filter] duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.98]',
          variants[variant],
          sizes[size],
          className,
        )}
      >
        <span className="relative z-10">{children}</span>
        {showArrow && (
          <span className="relative z-10 inline-flex size-4 overflow-hidden" aria-hidden>
            <ArrowRight className="size-4 shrink-0 transition-transform duration-300 ease-out group-hover/cta:translate-x-full" />
            <ArrowRight className="absolute size-4 -translate-x-full transition-transform duration-300 ease-out group-hover/cta:translate-x-0" />
          </span>
        )}
      </Link>
    </motion.div>
  )
}
