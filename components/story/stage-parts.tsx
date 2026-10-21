'use client'

import { cn } from '@/lib/utils'

/**
 * The one surface everything sits on: soft colour washes over a dotted scrapbook table.
 * Static radial gradients (no blur filters, no animated layers) so scrolling and Pixie's animation stay smooth.
 */
export function StageBackdrop() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 bg-[var(--st-cream)] [background-image:radial-gradient(60vmax_50vmax_at_0%_0%,rgba(255,220,198,0.85),transparent_70%),radial-gradient(50vmax_45vmax_at_100%_10%,rgba(231,222,254,0.8),transparent_70%),radial-gradient(55vmax_45vmax_at_30%_105%,rgba(207,241,227,0.75),transparent_70%),radial-gradient(40vmax_35vmax_at_105%_100%,rgba(255,240,181,0.7),transparent_70%)]"
    >
      <div className="absolute inset-0 [background-image:radial-gradient(rgba(150,100,60,0.13)_1px,transparent_1px)] [background-size:24px_24px]" />
    </div>
  )
}

export function PrimaryButton({ children, className, ...p }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      {...p}
      className={cn('inline-flex h-12 items-center justify-center gap-2 rounded-full bg-accent px-7 text-[15px] font-semibold text-accent-foreground shadow-[0_10px_24px_-12px_rgba(11,162,141,0.8)] transition enabled:hover:brightness-105 enabled:active:scale-[0.97] disabled:opacity-45', className)}
    >
      {children}
    </button>
  )
}

export function GhostButton({ children, className, ...p }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type="button" {...p} className={cn('inline-flex h-11 items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold text-foreground/70 transition hover:bg-white hover:text-foreground disabled:opacity-40', className)}>
      {children}
    </button>
  )
}
