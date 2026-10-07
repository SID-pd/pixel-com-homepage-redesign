'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Lock, Minus, Pencil, Plus, ShieldCheck, ShoppingBag, Trash2, Truck } from 'lucide-react'
import { COVERS, SHIPPING, SIZES, money } from '@/lib/flow/catalog'
import { cartTotals } from '@/lib/flow/pricing'
import { flow, useFlow } from '@/lib/flow/store'
import { FlowButton, FlowLink } from './flow-button'
import { FlowHeader, FlowShell } from './flow-shell'
import { PromoBox, TotalsBlock } from './totals'

export function CartView() {
  const router = useRouter()
  const { hydrated, cart, promo, shipping } = useFlow()
  const totals = cartTotals(cart, shipping, promo)
  const ship = SHIPPING.find((s) => s.id === shipping)!
  const freeLeft = Math.max(0, ship.freeOver - (totals.subtotal - totals.discount))

  if (!hydrated) {
    return (
      <FlowShell header={<FlowHeader back={{ href: '/photo-book/', label: 'Keep creating' }} />}>
        <div className="h-72 animate-pulse rounded-3xl bg-secondary/60" />
      </FlowShell>
    )
  }

  if (cart.length === 0) {
    return (
      <FlowShell header={<FlowHeader back={{ href: '/', label: 'Home' }} />}>
        <div className="mx-auto max-w-md rounded-3xl border border-foreground/8 bg-card p-10 text-center shadow-xs">
          <span className="mx-auto grid size-16 place-items-center rounded-3xl bg-accent/12 text-accent">
            <ShoppingBag className="size-8" />
          </span>
          <h1 className="mt-5 text-2xl font-semibold tracking-tight">Your cart is empty</h1>
          <p className="mt-2 text-muted-foreground">Make your first photo book in about five minutes. No account needed.</p>
          <FlowLink href="/photo-book/" variant="accent" size="lg" arrow className="mt-6">
            Create a photo book
          </FlowLink>
        </div>
      </FlowShell>
    )
  }

  return (
    <FlowShell header={<FlowHeader back={{ href: '/photo-book/', label: 'Make another book' }} secure />}>
      <h1 className="mb-6 text-2xl font-semibold tracking-tight sm:text-3xl">
        Your cart <span className="text-lg font-normal text-muted-foreground">({cart.reduce((n, i) => n + i.qty, 0)})</span>
      </h1>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-8">
        <ul className="space-y-4">
          {cart.map((item) => {
            const size = SIZES.find((s) => s.id === item.config.size)!
            const cover = COVERS.find((c) => c.id === item.config.cover)!
            return (
              <li key={item.id} className="flex gap-4 rounded-3xl border border-foreground/8 bg-card p-4 shadow-xs sm:gap-5 sm:p-5">
                <div className="relative size-24 shrink-0 overflow-hidden rounded-2xl bg-secondary sm:size-32">
                  <Image src={item.thumb} alt={`Cover of ${item.title}`} fill sizes="128px" unoptimized className="object-cover" />
                </div>
                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="truncate font-semibold">{item.title || 'Untitled book'}</h2>
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        {size.label} · {item.config.pages} pages · {cover.label}
                      </p>
                      <p className="text-xs text-muted-foreground">{item.photoCount} photos</p>
                    </div>
                    <p className="font-semibold">{money(item.unitPrice * item.qty)}</p>
                  </div>

                  <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-2 pt-3">
                    <div className="inline-flex items-center rounded-full ring-1 ring-inset ring-foreground/12">
                      <button
                        type="button"
                        aria-label="Decrease quantity"
                        disabled={item.qty <= 1}
                        onClick={() => flow.setQty(item.id, item.qty - 1)}
                        className="grid size-9 place-items-center rounded-full transition hover:bg-foreground/6 disabled:opacity-35"
                      >
                        <Minus className="size-4" />
                      </button>
                      <span className="w-8 text-center text-sm font-medium tabular-nums" aria-live="polite" aria-label={`Quantity ${item.qty}`}>
                        {item.qty}
                      </span>
                      <button
                        type="button"
                        aria-label="Increase quantity"
                        onClick={() => flow.setQty(item.id, item.qty + 1)}
                        className="grid size-9 place-items-center rounded-full transition hover:bg-foreground/6"
                      >
                        <Plus className="size-4" />
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        flow.editCartItem(item.id)
                        router.push('/photo-book/editor/')
                      }}
                      className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground"
                    >
                      <Pencil className="size-3.5" /> Edit book
                    </button>
                    <button
                      type="button"
                      onClick={() => flow.removeFromCart(item.id)}
                      className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-destructive"
                    >
                      <Trash2 className="size-3.5" /> Remove
                    </button>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>

        <aside className="h-fit space-y-4 rounded-3xl border border-foreground/8 bg-card p-5 shadow-xs lg:sticky lg:top-24">
          <h2 className="font-semibold">Order summary</h2>
          <PromoBox promo={promo} />
          <TotalsBlock totals={totals} shippingNote={ship.label} />
          {freeLeft > 0 && totals.shipping > 0 && (
            <p className="flex items-center gap-2 rounded-xl bg-secondary px-3 py-2 text-xs text-muted-foreground">
              <Truck className="size-4 shrink-0" /> Add {money(freeLeft)} more for free standard shipping.
            </p>
          )}
          <FlowButton variant="accent" size="lg" arrow className="w-full" onClick={() => router.push('/checkout/')}>
            Checkout
          </FlowButton>
          <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
            <Lock className="size-3.5" /> No account needed to order
          </p>
          <ul className="space-y-2 border-t border-foreground/8 pt-4 text-xs text-muted-foreground">
            <li className="flex items-center gap-2">
              <ShieldCheck className="size-4 shrink-0 text-accent" /> 100% Happiness Guarantee: love it or we’ll remake it
            </li>
            <li className="flex items-center gap-2">
              <Truck className="size-4 shrink-0 text-accent" /> Printed &amp; shipped from the USA
            </li>
          </ul>
          <Link href="/photo-book/" className="block text-center text-sm text-accent hover:underline">
            Make another book
          </Link>
        </aside>
      </div>
    </FlowShell>
  )
}
