'use client'

import { useState } from 'react'
import { Check, Tag, X } from 'lucide-react'
import { PROMOS, money } from '@/lib/flow/catalog'
import { applyPromo } from '@/lib/flow/mock-api'
import { flow } from '@/lib/flow/store'
import type { OrderTotals } from '@/lib/flow/types'
import { FlowButton } from './flow-button'

export function PromoBox({ promo }: { promo: string | null }) {
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  if (promo) {
    return (
      <div className="flex items-center justify-between rounded-2xl bg-[oklch(0.95_0.04_150)] px-3.5 py-2.5 text-sm text-[oklch(0.35_0.08_150)]">
        <span className="flex items-center gap-2">
          <Check className="size-4" />
          <strong className="font-semibold">{promo}</strong> · {PROMOS[promo]?.label}
        </span>
        <button type="button" onClick={() => flow.setPromo(null)} aria-label="Remove promo code" className="grid size-7 place-items-center rounded-full hover:bg-black/5">
          <X className="size-4" />
        </button>
      </div>
    )
  }

  async function submit() {
    if (!code.trim()) return
    setBusy(true)
    setError('')
    const res = await applyPromo(code)
    setBusy(false)
    if (!res.ok) setError(res.error)
    else setCode('')
  }

  // A div (not a form): this box also lives inside the checkout form, and forms cannot nest.
  return (
    <div>
      <label className="sr-only" htmlFor="promo">
        Promo code
      </label>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Tag className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            id="promo"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                void submit()
              }
            }}
            placeholder="Promo code"
            autoCapitalize="characters"
            aria-invalid={!!error}
            aria-describedby={error ? 'promo-error' : undefined}
            className="h-11 w-full rounded-xl border border-foreground/12 bg-background pl-10 pr-3 text-sm uppercase outline-none transition placeholder:normal-case focus:border-accent focus:ring-2 focus:ring-accent/25"
          />
        </div>
        <FlowButton variant="secondary" loading={busy} onClick={submit}>
          Apply
        </FlowButton>
      </div>
      {error && (
        <p id="promo-error" role="alert" className="mt-1.5 text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}

export function TotalsBlock({ totals, shippingNote }: { totals: OrderTotals; shippingNote?: string }) {
  return (
    <dl className="space-y-2 text-sm">
      <div className="flex justify-between">
        <dt className="text-muted-foreground">Subtotal</dt>
        <dd>{money(totals.subtotal)}</dd>
      </div>
      {totals.discount > 0 && (
        <div className="flex justify-between text-[oklch(0.4_0.1_150)]">
          <dt>Discount</dt>
          <dd>−{money(totals.discount)}</dd>
        </div>
      )}
      <div className="flex justify-between">
        <dt className="text-muted-foreground">Shipping{shippingNote ? <span className="ml-1 text-xs">({shippingNote})</span> : null}</dt>
        <dd>{totals.shipping === 0 ? 'Free' : money(totals.shipping)}</dd>
      </div>
      <div className="flex justify-between">
        <dt className="text-muted-foreground">Estimated tax</dt>
        <dd>{money(totals.tax)}</dd>
      </div>
      <div className="flex items-baseline justify-between border-t border-foreground/10 pt-3">
        <dt className="font-semibold">Total</dt>
        <dd className="text-2xl font-semibold tracking-tight">{money(totals.total)}</dd>
      </div>
    </dl>
  )
}
