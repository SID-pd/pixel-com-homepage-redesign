'use client'

import { useEffect, useId, useRef, useState } from 'react'
import type { Mood } from '@/lib/flow/story-chat'
import { cn } from '@/lib/utils'

export type PixieCue = { type: 'hop' | 'nod' | 'wave' | 'tilt'; id: number }

const FILL_BOX = { transformBox: 'fill-box' } as const

/**
 * Pixie, a soft 3D-style SVG character.
 *
 * Performance rules (this replaced a laggier version):
 *  - no SVG blur filters: highlights, blush and shadow are baked into gradients
 *  - no always-on spring/JS loops: eye tracking writes two CSS variables from one rAF-throttled listener
 *  - idle is only a slow CSS "breathe" and an occasional CSS blink (both compositor transforms)
 *  - everything else is trigger based: `cue` plays a one-shot Web Animation (hop, nod, wave, tilt) and `mood` flips a pose
 *    (talking mouth, thinking gaze, scanning eyes, happy eyes) only while that mood is active
 *  - respects prefers-reduced-motion
 */
export function Companion({ mood = 'idle', cue, size = 120, className, intro = false }: { mood?: Mood; cue?: PixieCue; size?: number; className?: string; intro?: boolean }) {
  const uid = useId().replace(/:/g, '')
  const root = useRef<HTMLDivElement>(null)
  const armR = useRef<SVGGElement>(null)
  const shadow = useRef<SVGEllipseElement>(null)
  const [giggle, setGiggle] = useState(0)
  const [sparks, setSparks] = useState(false)

  const [reduce, setReduce] = useState(false)
  useEffect(() => setReduce(window.matchMedia('(prefers-reduced-motion: reduce)').matches), [])

  // eye tracking: CSS variables only, no React re-render
  useEffect(() => {
    const el = root.current
    if (!el || reduce) return
    let raf = 0
    let x = 0
    let y = 0
    const apply = () => {
      raf = 0
      const r = el.getBoundingClientRect()
      const px = Math.max(-1, Math.min(1, (x - (r.left + r.width / 2)) / 380))
      const py = Math.max(-1, Math.min(1, (y - (r.top + r.height / 2)) / 320))
      el.style.setProperty('--px', px.toFixed(3))
      el.style.setProperty('--py', py.toFixed(3))
    }
    const move = (e: PointerEvent) => {
      x = e.clientX
      y = e.clientY
      if (!raf) raf = requestAnimationFrame(apply)
    }
    window.addEventListener('pointermove', move, { passive: true })
    return () => {
      window.removeEventListener('pointermove', move)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [reduce])

  // entrance: drops in from above, squashes on landing, hops once, settles, with a burst of sparkles
  useEffect(() => {
    if (!intro) return
    const el = root.current
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    el.animate(
      [
        { opacity: 0, transform: 'translateY(-160px) scale(.7,.7) rotate(-14deg)' },
        { opacity: 1, transform: 'translateY(6px) scale(1.1,.88) rotate(3deg)', offset: 0.5 },
        { transform: 'translateY(-32px) scale(.97,1.06) rotate(-3deg)', offset: 0.7 },
        { transform: 'translateY(0) scale(1.04,.96) rotate(1deg)', offset: 0.88 },
        { opacity: 1, transform: 'none' },
      ],
      { duration: 1200, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'backwards' },
    )
    const on = window.setTimeout(() => setSparks(true), 560)
    const off = window.setTimeout(() => setSparks(false), 2000)
    return () => {
      window.clearTimeout(on)
      window.clearTimeout(off)
    }
  }, [intro])

  // one-shot cues
  const play = (type: PixieCue['type']) => {
    const el = root.current
    if (!el || reduce) return
    if (type === 'hop') {
      el.animate(
        [
          { transform: 'translateY(0) scale(1,1)' },
          { transform: 'translateY(3px) scale(1.04,.94)', offset: 0.16 },
          { transform: 'translateY(-22px) scale(.98,1.04)', offset: 0.5 },
          { transform: 'translateY(0) scale(1.03,.96)', offset: 0.82 },
          { transform: 'translateY(0) scale(1,1)' },
        ],
        { duration: 640, easing: 'cubic-bezier(.3,.7,.4,1)' },
      )
      shadow.current?.animate([{ transform: 'scale(1)', opacity: 1 }, { transform: 'scale(.7)', opacity: 0.55, offset: 0.5 }, { transform: 'scale(1)', opacity: 1 }], { duration: 640, easing: 'ease-in-out' })
    } else if (type === 'nod') {
      el.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(4px) scale(1.01,.985)', offset: 0.4 }, { transform: 'translateY(0)' }], { duration: 360, easing: 'ease-in-out' })
    } else if (type === 'tilt') {
      el.animate([{ transform: 'rotate(0)' }, { transform: 'rotate(-5deg) translateX(-2px)', offset: 0.45 }, { transform: 'rotate(0)' }], { duration: 480, easing: 'ease-in-out' })
    } else if (type === 'wave') {
      armR.current?.animate(
        [{ transform: 'rotate(0)' }, { transform: 'rotate(-52deg)', offset: 0.2 }, { transform: 'rotate(-26deg)', offset: 0.4 }, { transform: 'rotate(-52deg)', offset: 0.6 }, { transform: 'rotate(-26deg)', offset: 0.8 }, { transform: 'rotate(0)' }],
        { duration: 1000, easing: 'ease-in-out' },
      )
    }
  }

  useEffect(() => {
    if (cue) play(cue.type)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cue?.id])

  useEffect(() => {
    if (!giggle) return
    play('hop')
    play('wave')
    const t = window.setTimeout(() => setGiggle(0), 1200)
    return () => window.clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [giggle])

  const happy = mood === 'celebrate' || mood === 'excited' || giggle > 0
  const talking = mood === 'talking' && !happy
  const open = talking || happy
  const thinking = mood === 'thinking'
  const scanning = mood === 'inspecting'

  const eye = (cx: number) => (
    <g>
      <ellipse cx={cx} cy={142} rx={11.5} ry={12.5} fill={`url(#${uid}eye)`} />
      <circle cx={cx - 3.6} cy={137.5} r={3.6} fill="#fff" opacity={0.95} />
      <circle cx={cx + 3.4} cy={146} r={1.7} fill="#fff" opacity={0.75} />
    </g>
  )

  return (
    <div
      ref={root}
      role="img"
      aria-label="Pixie, your storyteller"
      onClick={() => setGiggle((g) => g + 1)}
      className={cn('relative shrink-0 cursor-pointer select-none [will-change:transform]', className)}
      style={{ width: size, height: size * 1.12, ['--px' as string]: 0, ['--py' as string]: 0 }}
    >
      <svg viewBox="0 0 240 270" className="size-full overflow-visible" aria-hidden>
        <defs>
          <radialGradient id={`${uid}body`} cx="0.34" cy="0.26" r="0.9">
            <stop offset="0" stopColor="#ffffff" />
            <stop offset="0.45" stopColor="#fff8f2" />
            <stop offset="0.8" stopColor="#f6e2d3" />
            <stop offset="1" stopColor="#e9c7b0" />
          </radialGradient>
          <linearGradient id={`${uid}shade`} x1="0" y1="0.5" x2="0" y2="1">
            <stop offset="0" stopColor="#d9906c" stopOpacity="0" />
            <stop offset="1" stopColor="#d9906c" stopOpacity="0.34" />
          </linearGradient>
          <linearGradient id={`${uid}band`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#fbc0a2" />
            <stop offset="1" stopColor="#e88a64" />
          </linearGradient>
          <radialGradient id={`${uid}cup`} cx="0.35" cy="0.3" r="0.9">
            <stop offset="0" stopColor="#ffcdb3" />
            <stop offset="0.55" stopColor="#f09672" />
            <stop offset="1" stopColor="#d4704a" />
          </radialGradient>
          <radialGradient id={`${uid}eye`} cx="0.4" cy="0.35" r="0.8">
            <stop offset="0" stopColor="#4d3d39" />
            <stop offset="1" stopColor="#120e0d" />
          </radialGradient>
          <radialGradient id={`${uid}ground`} cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor="#8a5436" stopOpacity="0.38" />
            <stop offset="1" stopColor="#8a5436" stopOpacity="0" />
          </radialGradient>
          {/* baked highlights and blush: radial fades instead of blur filters */}
          <radialGradient id={`${uid}glow`} cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor="#fff" stopOpacity="0.95" />
            <stop offset="1" stopColor="#fff" stopOpacity="0" />
          </radialGradient>
          <radialGradient id={`${uid}blush`} cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor="#ff8f7a" stopOpacity="0.7" />
            <stop offset="1" stopColor="#ff8f7a" stopOpacity="0" />
          </radialGradient>
        </defs>

        <ellipse ref={shadow} cx={120} cy={254} rx={66} ry={10} fill={`url(#${uid}ground)`} style={{ ...FILL_BOX, transformOrigin: '50% 50%' }} />

        {/* breathing wraps everything but the shadow */}
        <g className={cn(!reduce && 'pixie-breathe')} style={{ ...FILL_BOX, transformOrigin: '50% 100%', transform: 'rotate(calc(var(--px) * 2.5deg))' }}>
          <ellipse cx={88} cy={238} rx={25} ry={15} fill={`url(#${uid}body)`} />
          <ellipse cx={152} cy={238} rx={25} ry={15} fill={`url(#${uid}body)`} />

          <g style={{ ...FILL_BOX, transformOrigin: '60% 12%' }}>
            <ellipse cx={42} cy={184} rx={16} ry={30} transform="rotate(14 42 184)" fill={`url(#${uid}body)`} />
          </g>
          <g ref={armR} style={{ ...FILL_BOX, transformOrigin: '40% 12%', transform: thinking ? 'rotate(-30deg)' : undefined, transition: 'transform .35s ease-out' }}>
            <ellipse cx={198} cy={184} rx={16} ry={30} transform="rotate(-14 198 184)" fill={`url(#${uid}body)`} />
          </g>

          <path d="M120 62 C168 62 204 104 204 158 C204 210 170 238 120 238 C70 238 36 210 36 158 C36 104 72 62 120 62 Z" fill={`url(#${uid}body)`} />
          <path d="M120 62 C168 62 204 104 204 158 C204 210 170 238 120 238 C70 238 36 210 36 158 C36 104 72 62 120 62 Z" fill={`url(#${uid}shade)`} />
          <ellipse cx={86} cy={98} rx={34} ry={20} transform="rotate(-32 86 98)" fill={`url(#${uid}glow)`} />

          {/* face: shifts slightly with the pointer for parallax */}
          <g style={{ transform: 'translate(calc(var(--px) * 6px), calc(var(--py) * 3px))', transition: 'transform .2s ease-out' }}>
            <ellipse cx={66} cy={168} rx={22} ry={15} fill={`url(#${uid}blush)`} />
            <ellipse cx={174} cy={168} rx={22} ry={15} fill={`url(#${uid}blush)`} />

            {happy ? (
              <g fill="none" stroke="#1a1210" strokeWidth={4.5} strokeLinecap="round">
                <path d="M80 146 Q92 128 104 146" />
                <path d="M136 146 Q148 128 160 146" />
              </g>
            ) : (
              <g style={{ transform: thinking ? 'translate(-5px,-5px)' : 'translate(calc(var(--px) * 5px), calc(var(--py) * 4px))', transition: 'transform .22s ease-out' }}>
                <g className={cn(scanning && !reduce && 'pixie-scan')}>
                  <g className={cn(!reduce && 'pixie-blink')} style={{ ...FILL_BOX, transformOrigin: '50% 50%' }}>
                    {eye(92)}
                    {eye(148)}
                  </g>
                </g>
              </g>
            )}

            {open ? (
              <g className={cn(talking && !reduce && 'pixie-talk')} style={{ ...FILL_BOX, transformOrigin: '50% 30%', transform: happy ? undefined : undefined }}>
                <path d="M106 158 Q120 186 134 158 Q120 164 106 158 Z" fill="#6b2f28" />
                <path d="M112 172 Q120 178 128 172 Q120 168 112 172 Z" fill="#ff8f86" />
              </g>
            ) : (
              <path d={thinking ? 'M110 164 Q120 166 130 164' : 'M106 160 Q120 173 134 160'} fill="none" stroke="#1a1210" strokeWidth={3.4} strokeLinecap="round" />
            )}
          </g>

          {/* headphones */}
          <path d="M46 140 C40 24 200 24 194 140" fill="none" stroke={`url(#${uid}band)`} strokeWidth={11} strokeLinecap="round" />
          <path d="M58 100 C70 52 170 52 182 100" fill="none" stroke="#fff" strokeWidth={3} strokeLinecap="round" opacity={0.35} />
          <ellipse cx={42} cy={148} rx={16} ry={27} fill={`url(#${uid}cup)`} />
          <ellipse cx={46} cy={148} rx={9} ry={19} fill="#d4704a" opacity={0.35} />
          <ellipse cx={37} cy={138} rx={7} ry={12} fill={`url(#${uid}glow)`} opacity={0.7} />
          <circle cx={36} cy={150} r={2.6} fill="#fff" opacity={0.9} />
          <ellipse cx={198} cy={148} rx={16} ry={27} fill={`url(#${uid}cup)`} />
          <ellipse cx={194} cy={148} rx={9} ry={19} fill="#d4704a" opacity={0.35} />
        </g>
      </svg>

      {sparks && (
        <span aria-hidden className="pointer-events-none absolute left-1/2 top-[45%]">
          {Array.from({ length: 8 }).map((_, n) => {
            const a = (n / 8) * Math.PI * 2
            const r = size * 0.62
            return (
              <span key={n} className="pixie-spark absolute text-sm" style={{ ['--dx' as string]: `${Math.cos(a) * r}px`, ['--dy' as string]: `${Math.sin(a) * r}px`, animationDelay: `${n * 0.04}s` }}>
                ✨
              </span>
            )
          })}
        </span>
      )}

      {thinking && (
        <span className="absolute -right-1 top-0 flex gap-0.5 rounded-full bg-white px-1.5 py-1 shadow-sm" aria-hidden>
          {[0, 1, 2].map((i) => (
            <span key={i} className={cn('size-1 rounded-full bg-[var(--st-lilac-ink)]', !reduce && 'pixie-dot')} style={{ animationDelay: `${i * 0.15}s` }} />
          ))}
        </span>
      )}
      {mood === 'inspecting' && size >= 80 && (
        <span className="absolute -top-1 right-2 text-lg" aria-hidden>
          🔍
        </span>
      )}
    </div>
  )
}

/** Flat, tiny Pixie for chat bubbles: no gradients, no listeners, no animation. */
export function PixieAvatar({ size = 34, className }: { size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 240 270" width={size} height={size * 1.12} className={cn('shrink-0', className)} aria-hidden>
      <path d="M46 140 C40 24 200 24 194 140" fill="none" stroke="#f09672" strokeWidth={13} strokeLinecap="round" />
      <path d="M120 62 C168 62 204 104 204 158 C204 210 170 238 120 238 C70 238 36 210 36 158 C36 104 72 62 120 62 Z" fill="#fff4ea" stroke="#f0d6c4" strokeWidth={4} />
      <ellipse cx={42} cy={148} rx={16} ry={27} fill="#ee9470" />
      <ellipse cx={198} cy={148} rx={16} ry={27} fill="#ee9470" />
      <ellipse cx={66} cy={168} rx={15} ry={10} fill="#ffb3a1" opacity={0.7} />
      <ellipse cx={174} cy={168} rx={15} ry={10} fill="#ffb3a1" opacity={0.7} />
      <ellipse cx={92} cy={142} rx={11} ry={12} fill="#1a1210" />
      <ellipse cx={148} cy={142} rx={11} ry={12} fill="#1a1210" />
      <circle cx={88} cy={137} r={3.4} fill="#fff" />
      <circle cx={144} cy={137} r={3.4} fill="#fff" />
      <path d="M106 160 Q120 173 134 160" fill="none" stroke="#1a1210" strokeWidth={4} strokeLinecap="round" />
    </svg>
  )
}
