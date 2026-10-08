'use client'

import { Check, Tag } from 'lucide-react'
import type { ComponentProps } from 'react'
import { CtaLink } from '@/components/pixel/cta-link'
import { checkPromo, formatEnd, money, salePrice } from '@/lib/flow/catalog'
import { flow, useFlow } from '@/lib/flow/store'
import { useCampaign } from '@/lib/flow/use-campaign'
import { cn } from '@/lib/utils'

/**
 * Offer UI shared by every place a price appears, so a price is never shown without its sale status:
 *  - PriceTag   : a LIST price; while a sale runs it shows list struck through + sale price + "50% OFF"
 *  - LinePrice  : a price in the cart/checkout; reflects the code actually applied
 *  - OfferBadge : the small "50% OFF" pill
 *  - OfferStrip : the banner "Fall Sale: 50% off with FALL50, ends Nov 15 [Apply]" / "FALL50 applied"
 * All of them read the calendar in lib/flow/catalog.ts, so they cannot disagree with checkout.
 */

export function OfferBadge({ percent, className }: { percent: number; className?: string }) {
  return (
    <span className={cn('inline-flex items-center rounded-md border border-emerald-500/25 bg-emerald-500/15 px-2 py-0.5 text-[10px] font-extrabold tracking-wide text-emerald-700', className)}>
      {percent}% OFF
    </span>
  )
}

type Size = 'sm' | 'md' | 'lg'
const sizes: Record<Size, { list: string; sale: string }> = {
  sm: { list: 'text-xs', sale: 'text-sm font-semibold' },
  md: { list: 'text-sm', sale: 'text-lg font-bold' },
  lg: { list: 'text-xl', sale: 'text-5xl font-semibold tracking-tight' },
}

/** A list price. During a sale: struck list price, sale price and the OFF badge. */
export function PriceTag({ list, size = 'md', prefix, className, badge = true, onDark }: { list: number; size?: Size; prefix?: string; className?: string; badge?: boolean; onDark?: boolean }) {
  const campaign = useCampaign()
  const s = sizes[size]
  if (!campaign) {
    return (
      <span className={cn('inline-flex items-baseline gap-1.5', className)}>
        {prefix && <span className="text-xs text-muted-foreground">{prefix}</span>}
        <span className={s.sale}>{money(list)}</span>
      </span>
    )
  }
  const sale = salePrice(list, campaign.percent)
  return (
    <span className={cn('inline-flex flex-wrap items-baseline gap-x-2 gap-y-1', className)} aria-label={`List price ${money(list)}, sale price ${money(sale)}`}>
      {prefix && <span className="text-xs text-muted-foreground">{prefix}</span>}
      <span className={cn(s.list, 'font-semibold line-through', onDark ? 'text-ink-foreground/60' : 'text-muted-foreground')}>{money(list)}</span>
      <span className={cn(s.sale, 'text-accent')}>{money(sale)}</span>
      {badge && <OfferBadge percent={campaign.percent} className="self-center" />}
    </span>
  )
}

/** A price inside the cart/checkout: shows the discount only if a valid code is applied. */
export function LinePrice({ amount, className }: { amount: number; className?: string }) {
  const { promo } = useFlow()
  const check = promo ? checkPromo(promo) : null
  if (!check || !check.ok) return <span className={className}>{money(amount)}</span>
  return (
    <span className={cn('inline-flex flex-wrap items-baseline justify-end gap-x-1.5', className)}>
      <span className="text-xs text-muted-foreground line-through">{money(amount)}</span>
      <span className="font-semibold text-accent">{money(salePrice(amount, check.percent))}</span>
      <OfferBadge percent={check.percent} className="self-center" />
    </span>
  )
}

/** The sale banner. Apply with one tap; shows a confirmation once the code is on the order. */
export function OfferStrip({ compact, className }: { compact?: boolean; className?: string }) {
  const { hydrated, promo } = useFlow()
  const c = useCampaign()
  if (!hydrated || !c) return null
  const applied = promo === c.code
  const pad = compact ? 'px-3 py-2.5 text-xs' : 'px-4 py-3 text-sm'
  if (applied) {
    return (
      <div className={cn('flex items-center gap-3 rounded-2xl bg-emerald-500/12', pad, className)} role="status">
        <Check className="size-4 shrink-0 text-emerald-700" aria-hidden />
        <p className="min-w-0 flex-1">
          <strong className="font-semibold">{c.code} applied:</strong> {c.percent}% off, {c.name} ends {formatEnd(c.end)}.
        </p>
      </div>
    )
  }
  return (
    <div className={cn('flex items-center gap-3 rounded-2xl bg-accent/10', pad, className)}>
      <Tag className="size-4 shrink-0 text-accent" aria-hidden />
      <p className="min-w-0 flex-1">
        <strong className="font-semibold">{c.name}:</strong> {c.percent}% off with <strong className="font-semibold">{c.code}</strong>, ends {formatEnd(c.end)}.
      </p>
      <button type="button" onClick={() => flow.setPromo(c.code)} className="shrink-0 rounded-full bg-accent px-3.5 py-1.5 text-xs font-semibold text-accent-foreground transition hover:brightness-105">
        Apply
      </button>
    </div>
  )
}

/** A link into the buy flow that carries the running sale's code, so the price a visitor saw is the price they pay. */
export function OfferCtaLink({ href, ...rest }: ComponentProps<typeof CtaLink>) {
  const c = useCampaign()
  const withCode = c ? `${href}${href.includes('?') ? '&' : '?'}promo=${c.code}` : href
  return <CtaLink href={withCode} {...rest} />
}
