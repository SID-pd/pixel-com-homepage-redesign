import { COVERS, PACKAGING, SHIPPING, SIZES, TAX_RATE, checkPromo, salePrice, type ShippingId } from './catalog'
import type { BookConfig, CartItem, OrderTotals } from './types'

const round = (n: number) => Math.round(n * 100) / 100

export function packagingPrice(id: BookConfig['packaging']): number {
  return PACKAGING.find((p) => p.id === id)?.price ?? 0
}

export function unitPrice(c: Pick<BookConfig, 'size' | 'pages' | 'cover'> & { packaging?: BookConfig['packaging'] }): number {
  const size = SIZES.find((s) => s.id === c.size)!
  const cover = COVERS.find((x) => x.id === c.cover)!
  const extra = ((c.pages - 20) / 20) * size.step
  return round(size.base + extra + cover.adjust + packagingPrice(c.packaging))
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
  const check = promo ? checkPromo(promo) : null
  const percent = check && check.ok ? check.percent : 0
  // Same cent rounding as salePrice(), so a $39.99 book with a 50% code is exactly $19.99.
  const discount = round(subtotal - salePrice(subtotal, percent))
  const after = round(subtotal - discount)
  const ship = items.length ? shippingCost(shipping, after) : 0
  const tax = round(after * TAX_RATE)
  return { subtotal, discount, shipping: ship, tax, total: round(after + ship + tax) }
}
