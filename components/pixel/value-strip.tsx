'use client'

import {
  Award,
  CheckCircle2,
  Clock,
  DollarSign,
  HeartHandshake,
  ShieldCheck,
  Sparkles,
  Star,
  Truck,
  Wand2,
} from 'lucide-react'
import { Reveal, RevealItem } from './reveal'

function UsaFlagIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 36 24" className={className} xmlns="http://www.w3.org/2000/svg">
      <rect width="36" height="24" fill="#B22234" rx="2" />
      <rect y="1.85" width="36" height="1.85" fill="#FFFFFF" />
      <rect y="5.54" width="36" height="1.85" fill="#FFFFFF" />
      <rect y="9.23" width="36" height="1.85" fill="#FFFFFF" />
      <rect y="12.92" width="36" height="1.85" fill="#FFFFFF" />
      <rect y="16.61" width="36" height="1.85" fill="#FFFFFF" />
      <rect y="20.3" width="36" height="1.85" fill="#FFFFFF" />
      <rect width="14.4" height="12.92" fill="#3C3B6E" rx="1" />
      <circle cx="2.5" cy="2.5" r="0.6" fill="#FFFFFF" />
      <circle cx="7.2" cy="2.5" r="0.6" fill="#FFFFFF" />
      <circle cx="11.9" cy="2.5" r="0.6" fill="#FFFFFF" />
      <circle cx="4.8" cy="6.4" r="0.6" fill="#FFFFFF" />
      <circle cx="9.5" cy="6.4" r="0.6" fill="#FFFFFF" />
      <circle cx="2.5" cy="10.3" r="0.6" fill="#FFFFFF" />
      <circle cx="7.2" cy="10.3" r="0.6" fill="#FFFFFF" />
      <circle cx="11.9" cy="10.3" r="0.6" fill="#FFFFFF" />
    </svg>
  )
}

const trustFactors = [
  {
    isUsa: true,
    metric: 'PROUDLY USA',
    title: 'Made in USA',
    text: 'California factory since 2003',
    badgeBg: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
  },
  {
    icon: DollarSign,
    metric: 'FACTORY DIRECT',
    title: 'Fair Prices',
    text: 'Direct from manufacturer',
    badgeBg: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
    iconColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  },
  {
    icon: Truck,
    metric: '3–5 DAYS',
    title: 'Ships Out Fast',
    text: 'Printed & shipped within 3–5 business days',
    badgeBg: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20',
    iconColor: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  },
  {
    icon: Wand2,
    metric: '$0 FREE',
    title: 'Free Smart Layout',
    text: 'Design free, pay only to print',
    badgeBg: 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20',
    iconColor: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
  },
  {
    icon: Award,
    metric: 'SINCE 2003',
    title: '20+ Years',
    text: 'Printing experience you can trust',
    badgeBg: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
    iconColor: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  },
  {
    icon: CheckCircle2,
    metric: 'GUARANTEED',
    title: 'Premium Quality',
    text: '100% satisfaction promise',
    badgeBg: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
    iconColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  },
]

export function ValueStrip() {
  return (
    <section aria-label="Why Pixovo" className="px-4 md:px-6 my-6 md:my-8">
      <Reveal
        staggerChildren={0.05}
        className="mx-auto grid max-w-6xl grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4"
      >
        {trustFactors.map(({ isUsa, icon: Icon, metric, title, text, badgeBg, iconColor }) => (
          <RevealItem
            key={title}
            className="group flex flex-col justify-between gap-2.5 rounded-2xl bg-card p-4 border border-foreground/[0.08] shadow-xs transition-all duration-300 hover:shadow-md hover:border-foreground/15 hover:-translate-y-0.5"
          >
            {/* Top Row: Icon Container & Tag Badge */}
            <div className="flex items-center justify-between gap-1">
              <div
                className={`grid size-9 shrink-0 place-items-center rounded-xl transition-transform duration-300 group-hover:scale-105 ${
                  iconColor || 'bg-accent/10 text-accent'
                }`}
              >
                {isUsa ? (
                  <UsaFlagIcon className="w-6 h-4 rounded shadow-xs" />
                ) : (
                  Icon && <Icon className="size-4.5" aria-hidden />
                )}
              </div>
              <span className={`text-[9px] md:text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full border ${badgeBg}`}>
                {metric}
              </span>
            </div>

            {/* Bottom Content: Title & Text */}
            <div className="mt-1">
              <h3 className="font-sans font-semibold text-sm md:text-base text-foreground tracking-tight leading-snug">
                {title}
              </h3>
              <p className="mt-0.5 text-[11px] text-muted-foreground leading-snug font-normal">
                {text}
              </p>
            </div>
          </RevealItem>
        ))}
      </Reveal>
    </section>
  )
}
