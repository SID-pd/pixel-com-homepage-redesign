'use client'

import Link from 'next/link'
import type { ReactNode } from 'react'
import { ArrowLeft, Lock, ShoppingBag } from 'lucide-react'
import { PixovoLogo } from '@/components/pixel/pixovo-logo'
import { useCartCount } from '@/lib/flow/store'
import { AccountMenu } from './account-menu'
import { cn } from '@/lib/utils'

export function CartBadgeLink({ className }: { className?: string }) {
  const count = useCartCount()
  return (
    <Link
      href="/cart/"
      aria-label={count ? `Cart, ${count} item${count === 1 ? '' : 's'}` : 'Cart, empty'}
      className={cn(
        'relative grid size-10 place-items-center rounded-full ring-1 ring-inset ring-foreground/10 transition hover:bg-foreground/5',
        className,
      )}
    >
      <ShoppingBag className="size-[18px]" />
      {count > 0 && (
        <span className="absolute -right-1 -top-1 grid min-w-5 place-items-center rounded-full bg-accent px-1 text-[11px] font-semibold leading-5 text-accent-foreground">
          {count}
        </span>
      )}
    </Link>
  )
}

/** Compact, distraction-free header for the buy flow (wizard, cart, checkout). */
export function FlowHeader({
  back,
  secure,
  children,
}: {
  back?: { href: string; label: string }
  secure?: boolean
  children?: ReactNode
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-foreground/8 bg-background/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:px-6">
        <Link href="/" aria-label="Pixovo home" className="shrink-0">
          <PixovoLogo className="[&_img]:h-9" />
        </Link>
        {back && (
          <Link
            href={back.href}
            className="ml-1 hidden items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground sm:inline-flex"
          >
            <ArrowLeft className="size-4" /> {back.label}
          </Link>
        )}
        <div className="ml-auto flex items-center gap-3">
          {children}
          {secure && (
            <span className="hidden items-center gap-1.5 text-xs font-medium text-muted-foreground sm:inline-flex">
              <Lock className="size-3.5" /> Secure checkout
            </span>
          )}
          <AccountMenu />
          <CartBadgeLink />
        </div>
      </div>
    </header>
  )
}

export function FlowShell({ header, children, className }: { header: ReactNode; children: ReactNode; className?: string }) {
  return (
    <div className="min-h-dvh bg-background">
      {header}
      <main className={cn('mx-auto w-full max-w-6xl px-4 pb-32 pt-6 sm:px-6 sm:pt-8 lg:pb-16', className)}>{children}</main>
    </div>
  )
}
