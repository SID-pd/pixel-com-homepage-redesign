'use client'

import { HeartHandshake, ShieldCheck, Sparkles, Star, Wand2 } from 'lucide-react'
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

const values = [
  {
    isUsa: true,
    metric: 'PROUDLY',
    title: 'Made in the USA',
    text: 'Printed & shipped from California',
    badgeBg: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
  },
  {
    icon: Wand2,
    metric: '60 SECONDS',
    title: 'Smart AI Layouts',
    text: 'Auto-organized, human controlled',
    badgeBg: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
  },
  {
    icon: Star,
    metric: '50,000+',
    title: '5-Star Reviews',
    text: '4.9/5 Rating on Trustpilot',
    badgeBg: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
    iconFill: 'fill-amber-500 text-amber-500',
  },
  {
    icon: HeartHandshake,
    metric: '100% GUARANTEE',
    title: 'Love It Promise',
    text: 'Free reprint or 30-day money back',
    badgeBg: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
    iconColor: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10',
  },
]

export function ValueStrip() {
  return (
    <section aria-label="Why Pixovo" className="px-5 md:px-6 my-8">
      <Reveal
        staggerChildren={0.06}
        className="mx-auto grid max-w-6xl grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {values.map(({ isUsa, icon: Icon, metric, title, text, badgeBg, iconFill, iconColor }) => (
          <RevealItem
            key={title}
            className="group flex flex-col justify-between gap-3 rounded-2xl bg-card p-5 border border-foreground/[0.08] shadow-xs transition-all duration-300 hover:shadow-md hover:border-foreground/15 hover:-translate-y-0.5"
          >
            {/* Top Row: Distinctive Icon Container & Tag Badge */}
            <div className="flex items-center justify-between">
              <div
                className={`grid size-10 shrink-0 place-items-center rounded-xl transition-transform duration-300 group-hover:scale-105 ${
                  iconColor || 'bg-accent/10 text-accent'
                }`}
              >
                {isUsa ? (
                  <UsaFlagIcon className="w-7 h-4.5 rounded shadow-xs" />
                ) : (
                  Icon && <Icon className={`size-5 ${iconFill || ''}`} aria-hidden />
                )}
              </div>
              <span className={`text-[10px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-full border ${badgeBg}`}>
                {metric}
              </span>
            </div>

            {/* Bottom Content: Title & Text */}
            <div className="mt-1">
              <h3 className="font-sans font-semibold text-base text-foreground tracking-tight leading-snug">
                {title}
              </h3>
              <p className="mt-1 text-xs text-muted-foreground leading-normal font-normal">
                {text}
              </p>
            </div>
          </RevealItem>
        ))}
      </Reveal>
    </section>
  )
}
