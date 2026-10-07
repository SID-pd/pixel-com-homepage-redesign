import { COVERS, PROMOS, SHIPPING, SIZES, TAX_RATE, type ShippingId } from './catalog'
import type { BookConfig, CartItem, OrderTotals } from './types'

const round = (n: number) => Math.round(n * 100) / 100

export function unitPrice(c: Pick<BookConfig, 'size' | 'pages' | 'cover'>): number {
  const size = SIZES.find((s) => s.id === c.size)!
  const cover = COVERS.find((x) => x.id === c.cover)!
  const extra = ((c.pages - 20) / 20) * size.step
  return round(size.base + extra + cover.adjust)
}

export function extraPagesPrice(c: Pick<BookConfig, 'size' | 'pages'>): number {
  const size = SIZES.find((s) => s.id === c.size)!
  return round(((c.pages - 20) / 20) * size.step)
}

export function shippingCost(id: ShippingId, subtotalAfterDiscount: number): number {
  const s = SHIPPING.find((x) => x.id === id)!
  return subtotalAfterDiscount >= s.freeOver ? 0 : s.price
}

export function cartTotals(items: CartItem[], shipping: ShippingId, promo: string | null): OrderTotals {
  const subtotal = round(items.reduce((sum, i) => sum + i.unitPrice * i.qty, 0))
  const percent = promo ? (PROMOS[promo]?.percent ?? 0) : 0
  const discount = round((subtotal * percent) / 100)
  const after = round(subtotal - discount)
  const ship = items.length ? shippingCost(shipping, after) : 0
  const tax = round(after * TAX_RATE)
  return { subtotal, discount, shipping: ship, tax, total: round(after + ship + tax) }
}
