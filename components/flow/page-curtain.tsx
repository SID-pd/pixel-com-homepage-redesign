'use client'

import { useEffect, useSyncExternalStore } from 'react'
import { usePathname } from 'next/navigation'
import { motion } from 'motion/react'

// A soft curtain that carries the customer from one page to the next, so leaving Story Mode (checkout, cart, editor, home)
// is a continuous movement instead of a hard cut. It lives in the root providers, so it survives the route change:
//   closing -> a cream wash grows from where they tapped
//   waiting -> it holds while the next page loads
//   opening -> it fades away on the new page

type Phase = 'idle' | 'closing' | 'waiting' | 'opening'
type State = { phase: Phase; label: string; x: number; y: number; from: string }

let state: State = { phase: 'idle', label: '', x: 0, y: 0, from: '' }
const subs = new Set<() => void>()
const set = (p: Partial<State>) => {
  state = { ...state, ...p }
  subs.forEach((f) => f())
}
const subscribe = (cb: () => void) => {
  subs.add(cb)
  return () => subs.delete(cb)
}

type Push = { push: (href: string) => void }

export const curtain = {
  /** Play the closing wash, navigate, then reveal the next page. `origin` is where the tap happened (defaults to centre). */
  go(router: Push, to: string, label: string, origin?: { x: number; y: number }) {
    if (state.phase !== 'idle') return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    set({ phase: 'closing', label, x: origin?.x ?? window.innerWidth / 2, y: origin?.y ?? window.innerHeight / 2, from: window.location.pathname })
    window.setTimeout(
      () => {
        router.push(to)
        set({ phase: 'waiting' })
        // never trap the customer behind the curtain
        window.setTimeout(() => state.phase === 'waiting' && set({ phase: 'opening' }), 6000)
      },
      reduce ? 60 : 900,
    )
  },
}

export function TransitionCurtain() {
  const s = useSyncExternalStore(
    subscribe,
    () => state,
    () => state,
  )
  const pathname = usePathname()

  useEffect(() => {
    if (s.phase !== 'waiting') return
    const arrived = pathname.replace(/\/$/, '') !== s.from.replace(/\/$/, '')
    if (!arrived) return
    const t = window.setTimeout(() => set({ phase: 'opening' }), 350)
    return () => window.clearTimeout(t)
  }, [s.phase, pathname, s.from])

  useEffect(() => {
    if (s.phase !== 'opening') return
    const t = window.setTimeout(() => set({ phase: 'idle' }), 800)
    return () => window.clearTimeout(t)
  }, [s.phase])

  if (s.phase === 'idle') return null
  const at = `${s.x}px ${s.y}px`
  return (
    <motion.div
      role="status"
      aria-live="polite"
      initial={{ clipPath: `circle(0px at ${at})`, opacity: 1 }}
      animate={s.phase === 'opening' ? { clipPath: `circle(160vmax at ${at})`, opacity: 0 } : { clipPath: `circle(160vmax at ${at})`, opacity: 1 }}
      transition={s.phase === 'opening' ? { duration: 0.7, ease: [0.4, 0, 0.2, 1] } : { duration: 0.85, ease: [0.65, 0, 0.35, 1] }}
      className="fixed inset-0 z-[100] grid place-items-center bg-[#fdf6ec] [background-image:radial-gradient(60vmax_50vmax_at_20%_0%,rgba(255,220,198,0.9),transparent_70%),radial-gradient(50vmax_45vmax_at_100%_20%,rgba(231,222,254,0.85),transparent_70%),radial-gradient(55vmax_45vmax_at_40%_110%,rgba(207,241,227,0.8),transparent_70%)]"
    >
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: s.phase === 'opening' ? 0 : 1, y: 0 }} transition={{ duration: 0.5, delay: s.phase === 'closing' ? 0.35 : 0 }} className="text-center">
        <p className="text-xl font-semibold tracking-tight text-[#3b2f2a]">{s.label}</p>
        <div className="mt-3 flex justify-center gap-1.5" aria-hidden>
          {[0, 1, 2].map((i) => (
            <motion.span key={i} className="size-2 rounded-full bg-[#b4532a]" animate={{ y: [0, -5, 0], opacity: [0.4, 1, 0.4] }} transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15 }} />
          ))}
        </div>
      </motion.div>
    </motion.div>
  )
}
