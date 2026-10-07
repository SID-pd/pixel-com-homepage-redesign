'use client'

import Image from 'next/image'
import Link from 'next/link'
import { BookOpen, LogOut, Package, UserRound } from 'lucide-react'
import { MarketingShell } from '@/components/content/blocks'
import { openAuth } from '@/lib/flow/auth'
import { SIZES, money } from '@/lib/flow/catalog'
import { mockSignOut } from '@/lib/flow/mock-api'
import { useFlow } from '@/lib/flow/store'
import { FlowButton, FlowLink } from './flow-button'

const fmt = (t: number) => new Date(t).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

export function AccountView() {
  const { hydrated, user, orders, draft } = useFlow()

  if (!hydrated) {
    return (
      <MarketingShell>
        <div className="mx-auto h-96 max-w-3xl animate-pulse rounded-3xl bg-secondary/60 pt-40" />
      </MarketingShell>
    )
  }

  if (!user) {
    return (
      <MarketingShell>
        <section className="px-5 pb-24 pt-36 sm:pt-44">
          <div className="mx-auto max-w-md rounded-[2rem] border border-foreground/8 bg-card p-10 text-center shadow-xs">
            <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-accent/12 text-accent">
              <UserRound className="size-7" />
            </span>
            <h1 className="mt-5 text-2xl font-semibold tracking-tight">Sign in to your account</h1>
            <p className="mt-2 text-muted-foreground">See your orders, pick up a book you started, and reorder in one tap.</p>
            <div className="mt-6 flex flex-col gap-3">
              <FlowButton variant="accent" size="lg" onClick={() => openAuth('signin')}>
                Sign in
              </FlowButton>
              <FlowButton variant="secondary" size="lg" onClick={() => openAuth('signup')}>
                Create an account
              </FlowButton>
            </div>
            <p className="mt-5 text-xs text-muted-foreground">No account needed to order.</p>
          </div>
        </section>
      </MarketingShell>
    )
  }

  const mine = orders.filter((o) => o.contact.email.toLowerCase() === user.email.toLowerCase())

  return (
    <MarketingShell>
      <section className="px-5 pb-24 pt-32 sm:pt-40 md:px-6">
        <div className="mx-auto max-w-4xl">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">My account</p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Hi, {user.name.split(' ')[0] || 'there'}</h1>
              <p className="mt-1 text-muted-foreground">{user.email}</p>
            </div>
            <FlowButton variant="secondary" onClick={() => mockSignOut()}>
              <LogOut className="size-4" /> Sign out
            </FlowButton>
          </div>

          {draft && draft.photos.length > 0 && (
            <div className="mt-8 flex flex-col gap-4 rounded-3xl bg-ink p-6 text-ink-foreground sm:flex-row sm:items-center sm:justify-between sm:p-8">
              <div className="flex items-center gap-4">
                <span className="grid size-12 place-items-center rounded-2xl bg-white/10 text-accent">
                  <BookOpen className="size-6" />
                </span>
                <div>
                  <p className="font-semibold">You have a book in progress</p>
                  <p className="text-sm text-ink-foreground/70">
                    “{draft.config.title}” · {draft.photos.length} photos · {draft.config.pages} pages
                  </p>
                </div>
              </div>
              <FlowLink href="/photo-book/" variant="accent" arrow>
                Pick up where you left off
              </FlowLink>
            </div>
          )}

          <h2 className="mb-4 mt-12 text-xl font-semibold">Your orders</h2>
          {mine.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-foreground/15 p-10 text-center">
              <Package className="mx-auto size-8 text-muted-foreground" />
              <p className="mt-3 font-medium">No orders yet</p>
              <p className="mt-1 text-sm text-muted-foreground">Your first photo book is a few minutes away.</p>
              <FlowLink href="/photo-book/" variant="accent" className="mt-5">
                Create a photo book
              </FlowLink>
            </div>
          ) : (
            <ul className="space-y-4">
              {mine.map((o) => (
                <li key={o.id} className="rounded-3xl border border-foreground/8 bg-card p-5 shadow-xs sm:p-6">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold">Order {o.id}</p>
                      <p className="text-sm text-muted-foreground">Placed {fmt(o.createdAt)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{money(o.totals.total)}</p>
                      <Link href="/track-order/" className="text-sm font-medium text-accent underline-offset-4 hover:underline">
                        Track order
                      </Link>
                    </div>
                  </div>
                  <ul className="mt-4 flex flex-wrap gap-4 border-t border-foreground/8 pt-4">
                    {o.items.map((i) => (
                      <li key={i.id} className="flex items-center gap-3">
                        <span className="relative size-14 shrink-0 overflow-hidden rounded-xl bg-secondary">
                          <Image src={i.thumb} alt="" fill sizes="56px" unoptimized className="object-cover" />
                        </span>
                        <span className="text-sm">
                          <span className="block font-medium">{i.title}</span>
                          <span className="text-muted-foreground">
                            {SIZES.find((s) => s.id === i.config.size)!.label} · {i.config.pages} pages · Qty {i.qty}
                          </span>
                        </span>
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </MarketingShell>
  )
}
