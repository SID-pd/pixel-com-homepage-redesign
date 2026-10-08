'use client'

import Image from 'next/image'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { Gift, Package, ShoppingBag } from 'lucide-react'
import { PACKAGING, SIZES, money, type PackagingId } from '@/lib/flow/catalog'
import { flow } from '@/lib/flow/store'
import type { BookConfig } from '@/lib/flow/types'
import { cn } from '@/lib/utils'
import { RadioCard, RadioDot } from './radio-card'

const ICONS: Record<PackagingId, React.ReactNode> = {
  basic: <Package className="size-5" />,
  gift: <Gift className="size-5" />,
  bag: <ShoppingBag className="size-5" />,
}

/** Mandatory final-step choice. The summary card's preview reacts to it straight away. */
export function PackagingPicker({ packaging }: { packaging?: PackagingId }) {
  return (
    <fieldset className="rounded-3xl border border-foreground/8 bg-card p-5 shadow-xs sm:p-6">
      <legend className="sr-only">Choose your packaging</legend>
      <h2 className="text-lg font-semibold tracking-tight">How should we pack it?</h2>
      <p className="mt-1 text-sm text-muted-foreground">Pick one to continue. You’ll see it on your book in the preview.</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {PACKAGING.map((p) => {
          const checked = packaging === p.id
          return (
            <RadioCard key={p.id} name="packaging" value={p.id} checked={checked} onChange={() => flow.setConfig({ packaging: p.id })} className="p-4">
              <div className="flex items-start justify-between gap-2">
                <span className={cn('grid size-10 place-items-center rounded-xl', checked ? 'bg-accent text-accent-foreground' : 'bg-secondary text-muted-foreground')}>
                  {ICONS[p.id]}
                </span>
                <RadioDot checked={checked} />
              </div>
              <p className="mt-3 font-semibold">{p.label}</p>
              <p className="mt-0.5 text-xs leading-snug text-muted-foreground">{p.blurb}</p>
              <p className="mt-2 text-sm font-semibold">{p.price ? `+${money(p.price)}` : 'Free'}</p>
            </RadioCard>
          )
        })}
      </div>
    </fieldset>
  )
}

function GiftWrapArt() {
  return (
    <svg viewBox="0 0 200 200" className="size-full" role="img" aria-label="Book wrapped in linen gift paper with a ribbon">
      <defs>
        <pattern id="linen" width="4" height="4" patternUnits="userSpaceOnUse">
          <rect width="4" height="4" fill="#e4d6bd" />
          <path d="M0 0h4M0 2h4" stroke="#d6c6a8" strokeWidth="0.6" />
          <path d="M0 0v4M2 0v4" stroke="#ebdfc9" strokeWidth="0.5" />
        </pattern>
      </defs>
      <ellipse cx="100" cy="176" rx="68" ry="8" fill="#000" opacity=".12" />
      <rect x="34" y="40" width="132" height="132" rx="5" fill="url(#linen)" stroke="#c9b894" />
      <path d="M34 40l10 9h112l10-9" fill="#d9c9aa" opacity=".6" />
      <path d="M166 40v132" stroke="#00000014" strokeWidth="6" />
      <rect x="92" y="40" width="16" height="132" fill="#b4472b" />
      <rect x="34" y="98" width="132" height="16" fill="#b4472b" />
      <rect x="92" y="40" width="16" height="132" fill="#fff" opacity=".1" />
      <path d="M100 98c-26-30-46-22-40-8s28 12 40 8z" fill="#c4553a" stroke="#8f3520" strokeWidth="1.2" />
      <path d="M100 98c26-30 46-22 40-8s-28 12-40 8z" fill="#c4553a" stroke="#8f3520" strokeWidth="1.2" />
      <path d="M100 100c-8 14-18 26-28 30M100 100c8 14 18 26 28 30" stroke="#8f3520" strokeWidth="5" strokeLinecap="round" fill="none" />
      <circle cx="100" cy="100" r="7" fill="#a63f25" />
      <g transform="rotate(10 150 70)">
        <rect x="132" y="58" width="34" height="22" rx="3" fill="#fbf7ee" stroke="#c9b894" />
        <circle cx="137" cy="63" r="1.8" fill="#c9b894" />
        <text x="149" y="73" fontSize="7" textAnchor="middle" fill="#6b5a3e">
          For you
        </text>
      </g>
    </svg>
  )
}

function CarryBagArt() {
  return (
    <svg viewBox="0 0 200 200" className="size-full" role="img" aria-label="Paper carry bag with rope handles">
      <ellipse cx="100" cy="184" rx="64" ry="7" fill="#000" opacity=".12" />
      <path d="M72 62c0-34 56-34 56 0" fill="none" stroke="#5a4630" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M44 62h112l8 118H36z" fill="#d8bf93" stroke="#b79b6a" />
      <path d="M156 62l8 118h-26l-8-118z" fill="#000" opacity=".08" />
      <path d="M44 62h112" stroke="#b79b6a" strokeWidth="2" />
      <circle cx="72" cy="70" r="3" fill="#7a6240" />
      <circle cx="128" cy="70" r="3" fill="#7a6240" />
      <rect x="70" y="112" width="60" height="30" rx="3" fill="#fbf7ee" opacity=".92" />
      <text x="100" y="131" fontSize="11" textAnchor="middle" fill="#8a573a" fontWeight="600">
        pixovo
      </text>
    </svg>
  )
}

/** Live product preview: the photo book, wrapped or bagged according to the packaging choice. */
export function BookPreviewWithPackaging({ config }: { config: BookConfig }) {
  const size = SIZES.find((s) => s.id === config.size)!
  const reduce = useReducedMotion()
  const p = config.packaging
  const enter = reduce ? { opacity: 0 } : { opacity: 0, y: 14, scale: 0.94 }

  return (
    <div className="relative mt-4 aspect-[4/3] overflow-hidden rounded-2xl bg-secondary">
      <motion.div
        animate={{ opacity: p === 'gift' ? 0 : 1, scale: p === 'bag' ? 0.62 : 1, x: p === 'bag' ? '-14%' : 0, y: p === 'bag' ? '-12%' : 0 }}
        transition={{ type: 'spring', stiffness: 160, damping: 20 }}
        className="absolute inset-0"
      >
        <Image src={size.image} alt={`${size.label} photo book`} fill sizes="320px" className="object-contain p-3" />
      </motion.div>

      <AnimatePresence mode="wait">
        {p === 'gift' && (
          <motion.div key="gift" initial={enter} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.94 }} transition={{ duration: 0.3 }} className="absolute inset-0 p-3">
            <GiftWrapArt />
          </motion.div>
        )}
        {p === 'bag' && (
          <motion.div key="bag" initial={enter} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.94 }} transition={{ duration: 0.3 }} className="absolute bottom-1 right-[6%] top-[22%] aspect-square">
            <CarryBagArt />
          </motion.div>
        )}
      </AnimatePresence>

      <span className="absolute left-2.5 top-2.5 rounded-full bg-card/90 px-2.5 py-1 text-[11px] font-semibold shadow-xs backdrop-blur">
        {p ? PACKAGING.find((x) => x.id === p)!.label : 'Choose packaging in the last step'}
      </span>
    </div>
  )
}
