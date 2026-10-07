'use client'

import Image from 'next/image'
import { Check, Package, Printer, Truck } from 'lucide-react'
import { SIZES, money } from '@/lib/flow/catalog'
import type { Order } from '@/lib/flow/types'
import { cn } from '@/lib/utils'
import { TotalsBlock } from './totals'

const DAY = 86_400_000

export function deliveryWindow(order: Order) {
  const fmt = (t: number) => new Date(t).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  return `${fmt(order.createdAt + 5 * DAY)} – ${fmt(order.createdAt + 10 * DAY)}`
}

export function OrderTimeline({ order }: { order: Order }) {
  const age = Date.now() - order.createdAt
  const steps = [
    { label: 'Order confirmed', icon: Check, at: 0 },
    { label: 'Printing your book', icon: Printer, at: 1 * DAY },
    { label: 'Shipped', icon: Truck, at: 3 * DAY },
    { label: 'Delivered', icon: Package, at: 7 * DAY },
  ]
  const current = steps.reduce((acc, s, i) => (age >= s.at ? i : acc), 0)
  return (
    <ol className="space-y-0">
      {steps.map((s, i) => {
        const done = i <= current
        const Icon = s.icon
        return (
          <li key={s.label} className="relative flex gap-3.5 pb-5 last:pb-0">
            {i < steps.length - 1 && (
              <span aria-hidden className={cn('absolute left-[15px] top-8 h-[calc(100%-2rem)] w-0.5', i < current ? 'bg-accent' : 'bg-foreground/10')} />
            )}
            <span className={cn('relative grid size-8 shrink-0 place-items-center rounded-full', done ? 'bg-accent text-accent-foreground' : 'bg-secondary text-muted-foreground')}>
              <Icon className="size-4" />
            </span>
            <div className="pt-1">
              <p className={cn('text-sm font-medium', !done && 'text-muted-foreground')}>{s.label}</p>
              {i === current && <p className="text-xs text-muted-foreground">Current status</p>}
            </div>
          </li>
        )
      })}
    </ol>
  )
}

export function OrderReceipt({ order }: { order: Order }) {
  return (
    <div className="space-y-4">
      <ul className="space-y-3">
        {order.items.map((i) => (
          <li key={i.id} className="flex items-center gap-3">
            <div className="relative size-14 shrink-0 overflow-hidden rounded-xl bg-secondary">
              <Image src={i.thumb} alt="" fill sizes="56px" unoptimized className="object-cover" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{i.title}</p>
              <p className="text-xs text-muted-foreground">
                {SIZES.find((s) => s.id === i.config.size)!.label} · {i.config.pages} pages · Qty {i.qty}
              </p>
            </div>
            <p className="text-sm font-medium">{money(i.unitPrice * i.qty)}</p>
          </li>
        ))}
      </ul>
      <div className="border-t border-foreground/8 pt-4">
        <TotalsBlock totals={order.totals} />
      </div>
    </div>
  )
}
