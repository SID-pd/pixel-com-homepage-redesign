'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { LogOut, Package, ShoppingBag, User, UserRound } from 'lucide-react'
import { openAuth } from '@/lib/flow/auth'
import { mockSignOut } from '@/lib/flow/mock-api'
import { useFlow } from '@/lib/flow/store'
import { cn } from '@/lib/utils'

/** The user icon in the header: opens sign-in when signed out, an account menu when signed in. */
export function AccountMenu({ className, align = 'right' }: { className?: string; align?: 'left' | 'right' }) {
  const { user, hydrated } = useFlow()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false)
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const base = cn(
    'grid size-9 place-items-center rounded-full text-foreground/80 transition-colors hover:bg-foreground/5 hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2',
    className,
  )

  if (!hydrated || !user) {
    return (
      <button type="button" aria-label="Sign in" title="Sign in" onClick={() => openAuth('signin')} className={base}>
        <User className="size-4.5" />
      </button>
    )
  }

  const initial = (user.name || user.email).trim()[0]?.toUpperCase() ?? '?'
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label="Account menu"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={cn(base, 'bg-accent text-sm font-semibold text-accent-foreground hover:bg-accent/90 hover:text-accent-foreground')}
      >
        {initial}
      </button>
      {open && (
        <div role="menu" className={cn('absolute top-full z-[70] mt-2 w-64 rounded-2xl bg-card p-1.5 shadow-lift ring-1 ring-foreground/10', align === 'right' ? 'right-0' : 'left-0')}>
          <div className="px-3 py-2.5">
            <p className="truncate text-sm font-semibold">{user.name || 'Your account'}</p>
            <p className="truncate text-xs text-muted-foreground">{user.email}</p>
          </div>
          <div className="my-1 h-px bg-foreground/8" />
          {[
            { href: '/account/', icon: UserRound, label: 'My account & orders' },
            { href: '/track-order/', icon: Package, label: 'Track an order' },
            { href: '/cart/', icon: ShoppingBag, label: 'Cart' },
          ].map(({ href, icon: Icon, label }) => (
            <Link key={href} role="menuitem" href={href} onClick={() => setOpen(false)} className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm transition hover:bg-foreground/5">
              <Icon className="size-4 text-muted-foreground" /> {label}
            </Link>
          ))}
          <button
            type="button"
            role="menuitem"
            onClick={async () => {
              setOpen(false)
              await mockSignOut()
            }}
            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-destructive transition hover:bg-destructive/8"
          >
            <LogOut className="size-4" /> Sign out
          </button>
        </div>
      )}
    </div>
  )
}
