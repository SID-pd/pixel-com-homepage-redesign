'use client'

import { useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { CheckCircle2, Mail, PartyPopper } from 'lucide-react'
import { openAuth } from '@/lib/flow/auth'
import { mockSignUp } from '@/lib/flow/mock-api'
import { useFlow } from '@/lib/flow/store'
import { FlowButton, FlowLink } from './flow-button'
import { FlowHeader, FlowShell } from './flow-shell'
import { OrderReceipt, OrderTimeline, deliveryWindow } from './order-parts'

export function ThankYouView() {
  const id = useSearchParams().get('order')
  const { hydrated, orders, user } = useFlow()
  const order = orders.find((o) => o.id === id) ?? (id ? undefined : orders[0])

  const [pw, setPw] = useState('')
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  if (!hydrated) {
    return (
      <FlowShell header={<FlowHeader />}>
        <div className="h-72 animate-pulse rounded-3xl bg-secondary/60" />
      </FlowShell>
    )
  }

  if (!order) {
    return (
      <FlowShell header={<FlowHeader back={{ href: '/', label: 'Home' }} />}>
        <div className="mx-auto max-w-md rounded-3xl border border-foreground/8 bg-card p-10 text-center shadow-xs">
          <h1 className="text-2xl font-semibold tracking-tight">We couldn’t find that order</h1>
          <p className="mt-2 text-muted-foreground">Look it up with your order number and email instead.</p>
          <FlowLink href="/track-order/" variant="accent" size="lg" arrow className="mt-6">
            Track an order
          </FlowLink>
        </div>
      </FlowShell>
    )
  }

  const first = order.contact.firstName

  return (
    <FlowShell header={<FlowHeader />} className="max-w-3xl">
      <div className="text-center">
        <span className="mx-auto grid size-16 place-items-center rounded-full bg-[oklch(0.94_0.06_150)] text-[oklch(0.45_0.12_150)]">
          <CheckCircle2 className="size-9" />
        </span>
        <h1 className="mt-5 font-serif text-4xl tracking-tight sm:text-5xl">
          Thank you{first ? `, ${first}` : ''}!
        </h1>
        <p className="mx-auto mt-3 max-w-md text-muted-foreground">
          Your order <strong className="text-foreground">{order.id}</strong> is confirmed. A receipt is on its way to{' '}
          <strong className="text-foreground">{order.contact.email}</strong>.
        </p>
        <p className="mt-1 text-sm text-muted-foreground">Estimated delivery: {deliveryWindow(order)}</p>
      </div>

      <div className="mt-8 grid gap-5 sm:grid-cols-2">
        <section className="rounded-3xl border border-foreground/8 bg-card p-5 shadow-xs">
          <h2 className="mb-4 font-semibold">Where it’s at</h2>
          <OrderTimeline order={order} />
        </section>
        <section className="rounded-3xl border border-foreground/8 bg-card p-5 shadow-xs">
          <h2 className="mb-4 font-semibold">Order summary</h2>
          <OrderReceipt order={order} />
        </section>
      </div>

      {/* Sign-up is offered only now: after the customer has already bought. */}
      <section className="mt-5 rounded-3xl bg-ink p-6 text-ink-foreground sm:p-8">
        {user ? (
          <div className="flex items-center gap-3">
            <PartyPopper className="size-6 text-accent" />
            <p>
              You’re all set, <strong>{user.name || user.email}</strong>. Your order and book are saved to your account.
            </p>
          </div>
        ) : (
          <form
            onSubmit={async (e) => {
              e.preventDefault()
              if (pw.length < 8) return setError('Use at least 8 characters.')
              setError('')
              setBusy(true)
              const res = await mockSignUp({ name: name || first || '', email: order.contact.email, password: pw })
              setBusy(false)
              if (!res.ok) {
                if (res.field === 'email') openAuth('signin', { email: order.contact.email, reason: 'You already have an account with this email. Sign in to add this order to it.' })
                else setError(res.error)
              }
            }}
          >
            <h2 className="font-serif text-2xl sm:text-3xl">Save your book &amp; track this order</h2>
            <p className="mt-1 text-sm text-ink-foreground/70">
              Optional. Create a free account to reorder in one tap and keep your photos safe.
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
              <label className="sr-only" htmlFor="su-name">
                Name
              </label>
              <input
                id="su-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={first || 'Your name'}
                autoComplete="name"
                className="h-12 rounded-xl bg-white/10 px-4 text-sm outline-none ring-1 ring-inset ring-white/15 placeholder:text-white/45 focus:ring-2 focus:ring-accent"
              />
              <label className="sr-only" htmlFor="su-pw">
                Password
              </label>
              <input
                id="su-pw"
                type="password"
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                placeholder="Create a password"
                autoComplete="new-password"
                className="h-12 rounded-xl bg-white/10 px-4 text-sm outline-none ring-1 ring-inset ring-white/15 placeholder:text-white/45 focus:ring-2 focus:ring-accent"
              />
              <FlowButton type="submit" variant="accent" size="lg" loading={busy}>
                Create account
              </FlowButton>
            </div>
            <p className="mt-2 flex items-center gap-1.5 text-xs text-ink-foreground/60">
              <Mail className="size-3.5" /> Using {order.contact.email}
            </p>
            {error && (
              <p role="alert" className="mt-2 text-sm text-[oklch(0.8_0.12_30)]">
                {error}
              </p>
            )}
          </form>
        )}
      </section>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <FlowLink href="/photo-book/" variant="accent" size="lg" arrow>
          Make another book
        </FlowLink>
        <FlowLink href="/" variant="secondary" size="lg">
          Back to home
        </FlowLink>
      </div>
    </FlowShell>
  )
}
