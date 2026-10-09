'use client'

import Image from 'next/image'
import { cn } from '@/lib/utils'
import { Reveal, RevealItem } from './reveal'

const trustFactors = [
  {
    image: '/images/trust-flag.svg',
    circleBg: 'bg-red-100',
    badge: 'LOCAL & TRUSTED',
    badgeBg: 'bg-red-50',
    badgeText: 'text-red-600',
    underline: 'bg-red-500',
    title: 'Made in USA',
    text: '20+ years of printing experience.',
  },
  {
    image: '/images/trust-price.svg',
    circleBg: 'bg-emerald-100',
    badge: 'GREAT VALUE',
    badgeBg: 'bg-emerald-50',
    badgeText: 'text-emerald-700',
    underline: 'bg-emerald-500',
    title: 'Fair Prices',
    text: 'Direct from manufacturer.',
  },
  {
    image: '/images/trust-shipping.svg',
    circleBg: 'bg-blue-100',
    badge: 'FAST & RELIABLE',
    badgeBg: 'bg-blue-50',
    badgeText: 'text-blue-700',
    underline: 'bg-blue-500',
    title: 'Ships Out Fast',
    text: 'Printed & shipped within 3–5 business days.',
  },
  {
    image: '/images/trust-design.svg',
    circleBg: 'bg-purple-100',
    badge: 'NO EXTRA COST',
    badgeBg: 'bg-purple-50',
    badgeText: 'text-purple-700',
    underline: 'bg-purple-500',
    title: 'Free Smart Layout',
    text: 'Design free, pay only to print.',
  },
  {
    image: '/images/trust-rank.svg',
    circleBg: 'bg-amber-100',
    badge: 'OUR PROMISE',
    badgeBg: 'bg-amber-50',
    badgeText: 'text-amber-700',
    underline: 'bg-amber-500',
    title: 'Premium Quality',
    text: '100% satisfaction promise.',
  },
]

export function ValueStrip() {
  return (
    <section aria-label="Why Pixovo" className="px-4 md:px-6 my-10 md:my-16">
      <Reveal staggerChildren={0.08} className="mx-auto grid max-w-6xl grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5 md:gap-5">
        {trustFactors.map((item) => (
          <RevealItem
            key={item.title}
            className="group flex flex-col items-center gap-3 rounded-3xl border border-foreground/8 bg-card px-4 py-6 text-center shadow-xs transition-all duration-300 hover:-translate-y-1 hover:shadow-float"
          >
            <div className="relative">
              {/* decorative sparkle ticks */}
              <span aria-hidden className={cn('absolute -right-3 -top-1 h-2.5 w-0.5 rotate-12 rounded-full transition-transform duration-500 group-hover:rotate-45', item.underline)} />
              <span aria-hidden className={cn('absolute -right-4 top-2.5 h-2 w-0.5 rotate-[50deg] rounded-full transition-transform duration-500 group-hover:rotate-90', item.underline)} />
              <span aria-hidden className={cn('absolute -right-1 -top-3 h-1.5 w-0.5 rotate-[-10deg] rounded-full transition-transform duration-500 group-hover:rotate-12', item.underline)} />

              <div className="relative grid size-16 place-items-center md:size-[4.5rem]">
                <div className={cn('absolute inset-0 rounded-full shadow-sm transition-transform duration-500 ease-out group-hover:scale-105', item.circleBg)} />
                <div className="relative z-10 h-16 w-24 md:h-20 md:w-28">
                  <Image src={item.image} alt="" fill sizes="112px" className="object-contain drop-shadow-sm" />
                </div>
              </div>
            </div>

            <span className={cn('rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wide', item.badgeBg, item.badgeText)}>
              {item.badge}
            </span>

            <div className="flex flex-col items-center gap-1">
              <h3 className="font-sans text-sm font-bold text-foreground md:text-base">{item.title}</h3>
              <p className="max-w-[11rem] text-xs leading-snug text-muted-foreground">{item.text}</p>
            </div>

            <span className={cn('h-0.5 w-8 rounded-full', item.underline)} aria-hidden />
          </RevealItem>
        ))}
      </Reveal>
    </section>
  )
}
