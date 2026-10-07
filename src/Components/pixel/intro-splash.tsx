'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { animate, motion, useMotionTemplate, useMotionValue } from 'motion/react'
import { cn } from '@/lib/utils'
import { logoDots } from './pixovo-logo'

const INTRO_KEY = 'pixovo-intro'
const BURST_AT = 1450
const REVEAL_AT = 1900
export const INTRO_HERO_DELAY = 2.05

const letters = 'Pixovo'.split('')
const dotSpread = ['-1.6em', '-0.55em', '0.55em', '1.6em']
const dotDrop = ['-1.2em', '-1.8em', '-1.4em', '-2em']
const burstColors = ['var(--rose)', 'var(--sky)', 'var(--butter)', 'var(--mint)']
const revealEase = [0.76, 0, 0.24, 1] as const

export function useIntroDelay() {
  const [delay] = useState(() =>
    typeof document === 'undefined' || document.documentElement.dataset.introSeen ? 0 : INTRO_HERO_DELAY,
  )
  return delay
}

export function IntroSplash() {
  const [stage, setStage] = useState<'logo' | 'burst' | 'done'>('logo')
  const exiting = useRef(false)
  const hole = useMotionValue(0)
  const mask = useMotionTemplate`radial-gradient(circle at 50% 50%, transparent ${hole}vmax, #000 calc(${hole}vmax + 1px))`

  const finish = useCallback(() => {
    const root = document.documentElement
    root.dataset.introSeen = '1'
    root.style.overflow = ''
    try {
      sessionStorage.setItem(INTRO_KEY, '1')
    } catch {}
    setStage('done')
  }, [])

  const reveal = useCallback(
    (duration: number) => {
      if (exiting.current) return
      exiting.current = true
      setStage('burst')
      animate(hole, 76, { duration, ease: revealEase, onComplete: finish })
    },
    [finish, hole],
  )

  useEffect(() => {
    const root = document.documentElement
    if (root.dataset.introSeen) {
      setStage('done')
      return
    }
    root.style.overflow = 'hidden'
    const burstTimer = window.setTimeout(() => setStage('burst'), BURST_AT)
    const revealTimer = window.setTimeout(() => reveal(0.85), REVEAL_AT)
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') reveal(0.55)
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.clearTimeout(burstTimer)
      window.clearTimeout(revealTimer)
      window.removeEventListener('keydown', onKey)
      root.style.overflow = ''
    }
  }, [reveal])

  if (stage === 'done') return null

  const bursting = stage === 'burst'

  return (
    <motion.div
      className="intro-overlay fixed inset-0 z-[100] overflow-hidden bg-background"
      style={{ maskImage: mask, WebkitMaskImage: mask }}
      onClick={() => reveal(0.55)}
    >
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(45%_40%_at_50%_50%,oklch(0.93_0.04_90/0.8),transparent_70%)]"
      />

      <div aria-hidden className="absolute inset-0 grid place-items-center">
        <motion.div
          animate={bursting ? { scale: 0.88, opacity: 0.6 } : { scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: revealEase }}
          className="flex flex-col items-center gap-[0.55em] text-[clamp(3.5rem,13vw,8.5rem)]"
        >
          <span className="relative inline-flex items-center px-[0.32em] py-[0.12em] font-brand font-semibold leading-none tracking-[-0.01em] text-logo-ink">
            <span className="absolute inset-0 flex items-center justify-center">
              {logoDots.map((color, i) => (
                <motion.span
                  key={color}
                  initial={{ scale: 0, x: dotSpread[i], y: dotDrop[i] }}
                  animate={{ scale: 1, x: 0, y: 0 }}
                  transition={{
                    scale: { type: 'spring', bounce: 0.55, duration: 0.75, delay: 0.08 + i * 0.08 },
                    y: { type: 'spring', bounce: 0.5, duration: 0.8, delay: 0.08 + i * 0.08 },
                    x: { duration: 0.9, delay: 0.32 + i * 0.04, ease: [0.16, 1, 0.3, 1] },
                  }}
                  className={cn('size-[1.12em] shrink-0 rounded-full shadow-[0_0.08em_0.25em_-0.08em_oklch(0.3_0.03_250/0.25)]', i > 0 && '-ml-[0.2em]')}
                  style={{ background: color }}
                />
              ))}
            </span>
            <span className="relative flex">
              {letters.map((ch, i) => (
                <span key={i} className="inline-block overflow-hidden pb-[0.06em]">
                  <motion.span
                    className="inline-block"
                    initial={{ y: '110%', rotate: 10 }}
                    animate={{ y: 0, rotate: 0 }}
                    transition={{ type: 'spring', bounce: 0.4, duration: 0.7, delay: 0.62 + i * 0.05 }}
                  >
                    {ch}
                  </motion.span>
                </span>
              ))}
            </span>
          </span>

          <motion.span
            initial={{ opacity: 0, y: 8, letterSpacing: '0.5em' }}
            animate={{ opacity: 1, y: 0, letterSpacing: '0.28em' }}
            transition={{ duration: 0.8, delay: 0.95, ease: [0.16, 1, 0.3, 1] }}
            className="font-sans text-[0.13em] font-medium uppercase text-logo-ink/60"
          >
            Memories, made joyful
          </motion.span>
        </motion.div>
      </div>

      {burstColors.map((color, i) => (
        <motion.span
          key={color}
          aria-hidden
          initial={{ scale: 0 }}
          animate={bursting ? { scale: 1 } : { scale: 0 }}
          transition={{ duration: 0.75, delay: i * 0.07, ease: revealEase }}
          className="absolute left-[calc(50%-76vmax)] top-[calc(50%-76vmax)] size-[152vmax] rounded-full"
          style={{ background: color }}
        />
      ))}

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          reveal(0.55)
        }}
        className="absolute bottom-6 right-6 rounded-full bg-foreground/5 px-4 py-2 text-xs font-medium text-foreground/60 backdrop-blur transition-colors hover:bg-foreground/10 hover:text-foreground"
      >
        Skip intro
      </button>
    </motion.div>
  )
}
