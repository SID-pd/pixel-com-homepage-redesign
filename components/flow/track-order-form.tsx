'use client'

import { useState } from 'react'
import { Search } from 'lucide-react'
import { lookupOrder } from '@/lib/flow/mock-api'
import { useFlow } from '@/lib/flow/store'
import type { Order } from '@/lib/flow/types'
import { FlowButton } from './flow-button'
import { OrderReceipt, OrderTimeline, deliveryWindow } from './order-parts'

export function TrackOrderForm() {
  const { orders } = useFlow()
  const [id, setId] = useState('')
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [order, setOrder] = useState<Order | null>(null)
  const [notFound, setNotFound] = useState(false)

  const input =
    'h-12 w-full rounded-xl border border-foreground/12 bg-background px-4 text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/25'

  return (
    <div className="space-y-6">
      <form
        className="grid gap-3 rounded-3xl border border-foreground/10 bg-card p-5 shadow-xs sm:grid-cols-[1fr_1fr_auto] sm:p-6"
        onSubmit={async (e) => {
          e.preventDefault()
          setBusy(true)
          setNotFound(false)
          const found = await lookupOrder(id, email)
          setBusy(false)
          setOrder(found)
          setNotFound(!found)
        }}
      >
        <div>
          <label htmlFor="to-id" className="mb-1.5 block text-xs font-medium text-muted-foreground">
            Order number
          </label>
          <input id="to-id" required value={id} onChange={(e) => setId(e.target.value)} placeholder="PX-12345" className={input} />
        </div>
        <div>
          <label htmlFor="to-email" className="mb-1.5 block text-xs font-medium text-muted-foreground">
            Email used at checkout
          </label>
          <input id="to-email" required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className={input} />
        </div>
        <div className="flex items-end">
          <FlowButton type="submit" variant="accent" size="lg" loading={busy} className="w-full sm:w-auto">
            <Search className="size-4" /> Track
          </FlowButton>
        </div>
        {orders.length > 0 && (
          <p className="text-xs text-muted-foreground sm:col-span-3">
            Demo tip: your latest order is{' '}
            <button
              type="button"
              className="font-medium text-accent hover:underline"
              onClick={() => {
                setId(orders[0].id)
                setEmail(orders[0].contact.email)
              }}
            >
              {orders[0].id}
            </button>
            . Click to fill it in.
          </p>
        )}
      </form>

      {notFound && (
        <p role="alert" className="rounded-2xl bg-destructive/8 px-4 py-3 text-sm text-destructive">
          We couldn’t find an order matching those details. Check the number in your confirmation email.
        </p>
      )}

      {order && (
        <div className="grid gap-5 sm:grid-cols-2">
          <section className="rounded-3xl border border-foreground/8 bg-card p-5 shadow-xs">
            <h2 className="font-semibold">Order {order.id}</h2>
            <p className="mb-4 text-sm text-muted-foreground">Estimated delivery {deliveryWindow(order)}</p>
            <OrderTimeline order={order} />
          </section>
          <section className="rounded-3xl border border-foreground/8 bg-card p-5 shadow-xs">
            <h2 className="mb-4 font-semibold">Items</h2>
            <OrderReceipt order={order} />
          </section>
        </div>
      )}
    </div>
  )
}
