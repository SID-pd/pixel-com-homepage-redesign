'use client'

import Image from 'next/image'
import { MapPin, PenTool, ShieldCheck, Tag, Truck } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Reveal, RevealItem } from './reveal'

const trustFactors = [
  {
    image: '/images/trust/usa-flag.jpg',
    icon: MapPin,
    accentBg: 'bg-red-500',
    title: 'Made in USA',
    text: 'California factory since 2003.',
  },
  {
    image: '/images/trust/price-tag.jpg',
    icon: Tag,
    accentBg: 'bg-emerald-500',
    title: 'Fair Prices',
    text: 'Direct from manufacturer.',
  },
  {
    image: '/images/trust/delivery-van.jpg',
    icon: Truck,
    accentBg: 'bg-blue-500',
    title: 'Ships Out Fast',
    text: 'Printed & shipped within 3–5 business days.',
  },
  {
    image: '/images/trust/laptop-design.jpg',
    icon: PenTool,
    accentBg: 'bg-purple-500',
    title: 'Free Smart Layout',
    text: 'Design free, pay only to print.',
  },
  {
    image: '/images/trust/gold-medal.jpg',
    icon: ShieldCheck,
    accentBg: 'bg-amber-500',
    title: 'Premium Quality',
    text: '100% satisfaction promise.',
  },
]

export function ValueStrip() {
  return (
    <section aria-label="Why Pixovo" className="px-4 md:px-6 my-10 md:my-16">
      <Reveal
        staggerChildren={0.08}
        className="mx-auto grid max-w-6xl grid-cols-2 gap-x-6 gap-y-12 sm:grid-cols-3 md:grid-cols-5 md:divide-x md:divide-foreground/10"
      >
        {trustFactors.map((item) => {
          const Icon = item.icon
          return (
            <RevealItem key={item.title} className="group flex flex-col items-center gap-4 px-2 text-center">
              <div className="relative">
                {/* decorative accent ticks */}
                <span
                  aria-hidden
                  className={cn(
                    'absolute -left-2 -top-1 h-3 w-0.5 -rotate-12 rounded-full transition-transform duration-500 group-hover:-rotate-45',
                    item.accentBg,
                  )}
                />
                <span
                  aria-hidden
                  className={cn(
                    'absolute left-3 -top-3.5 h-2.5 w-0.5 rotate-6 rounded-full transition-transform duration-500 group-hover:rotate-45',
                    item.accentBg,
                  )}
                />
                <span
                  aria-hidden
                  className={cn(
                    'absolute left-7 -top-2.5 h-2 w-0.5 rotate-[30deg] rounded-full transition-transform duration-500 group-hover:rotate-90',
                    item.accentBg,
                  )}
                />

                <div
                  className="relative size-24 overflow-hidden shadow-md transition-transform duration-500 ease-out group-hover:scale-105 group-hover:-rotate-2 md:size-28"
                  style={{ borderRadius: '63% 37% 54% 46% / 43% 37% 63% 57%' }}
                >
                  <Image src={item.image} alt="" fill sizes="(min-width: 768px) 112px, 96px" className="object-cover" />
                </div>

                <span
                  className={cn(
                    'absolute -bottom-1.5 -right-1.5 grid size-9 place-items-center rounded-full text-white shadow-md ring-4 ring-background transition-transform duration-500 group-hover:scale-110',
                    item.accentBg,
                  )}
                >
                  <Icon className="size-4" aria-hidden />
                </span>
              </div>

              <div className="flex flex-col items-center gap-1">
                <h3 className="font-sans text-sm font-bold text-foreground md:text-base">{item.title}</h3>
                <p className="max-w-[11rem] text-xs leading-snug text-muted-foreground">{item.text}</p>
              </div>

              <span className={cn('h-0.5 w-8 rounded-full', item.accentBg)} aria-hidden />
            </RevealItem>
          )
        })}
      </Reveal>
    </section>
  )
}
