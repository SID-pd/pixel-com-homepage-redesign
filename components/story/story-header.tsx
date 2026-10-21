'use client'

import Link from 'next/link'
import { ArrowLeft, Sparkles, ShieldCheck } from 'lucide-react'
import { PixovoLogo } from '@/components/pixel/pixovo-logo'
import { CartBadgeLink } from '@/components/flow/flow-shell'
import { AccountMenu } from '@/components/flow/account-menu'

export function StoryHeader({ onExit }: { onExit?: () => void }) {
  return (
    <header className="sticky top-0 z-40 border-b border-foreground/8 bg-background/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <div className="flex items-center gap-3 sm:gap-4">
          <Link href="/" aria-label="Pixovo home" className="shrink-0">
            <PixovoLogo className="[&_img]:h-8 sm:[&_img]:h-9" />
          </Link>
          <div className="hidden h-5 w-px bg-foreground/15 sm:block" aria-hidden />
          <div className="flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-accent/20 bg-accent/10 px-2.5 py-1 text-xs font-semibold text-accent">
            <Sparkles className="size-3.5" aria-hidden />
            <span>Story Mode</span>
            <span className="rounded-full bg-accent px-1.5 py-px text-[9px] font-bold uppercase tracking-wider text-white">
              AI
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 sm:gap-5">
          <div className="hidden items-center gap-1.5 text-xs text-muted-foreground md:inline-flex">
            <ShieldCheck className="size-4 text-accent" />
            <span>Printed & shipped in the USA</span>
          </div>

          <div className="flex items-center gap-2">
            <AccountMenu />
            <CartBadgeLink />
            {onExit ? (
              <button
                type="button"
                onClick={onExit}
                className="ml-1 inline-flex items-center gap-1 text-xs font-medium sm:ml-2 text-muted-foreground transition hover:text-foreground"
              >
                <ArrowLeft className="size-3.5" /> Exit
              </button>
            ) : (
              <Link
                href="/"
                className="ml-1 inline-flex items-center gap-1 text-xs font-medium sm:ml-2 text-muted-foreground transition hover:text-foreground"
              >
                <ArrowLeft className="size-3.5" /> Home
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
