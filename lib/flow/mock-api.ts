import { PROMOS, type ShippingId } from './catalog'
import { registerAccount, verifyAccount, type AuthResult } from './auth'
import { uid } from './layouts'
import { cartTotals } from './pricing'
import { flow, getState } from './store'
import type { CartItem, Contact, Order } from './types'

// The seam to the future backend. Each function below mirrors one real endpoint and keeps the
// same async shape, so replacing the body with apiCall() later does not change any UI code.
//   placeOrder   -> order/store + payment/store (+ authorizenet/charge)
//   lookupOrder  -> order/detail
//   applyPromo   -> order/apply-promotion
//   mockSignUp   -> register + order/claim-guest

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

export async function applyPromo(code: string): Promise<{ ok: true; label: string } | { ok: false; error: string }> {
  await wait(450)
  const key = code.trim().toUpperCase()
  const promo = PROMOS[key]
  if (!promo) return { ok: false, error: 'That code isn’t valid. Try PIXOVO10.' }
  flow.setPromo(key)
  return { ok: true, label: promo.label }
}

export type PaymentInput = { method: 'card' | 'apple' | 'google' | 'paypal'; last4?: string }

export async function placeOrder(input: {
  items: CartItem[]
  contact: Contact
  shipping: ShippingId
  payment: PaymentInput
}): Promise<Order> {
  await wait(1100)
  const { promo } = getState()
  const order: Order = {
    id: `PX-${Math.floor(10000 + Math.random() * 89999)}`,
    createdAt: Date.now(),
    // Book snapshots stay local only; the order keeps what is needed to show a receipt.
    items: input.items.map((i) => ({ ...i, snapshot: { photos: [], spreads: [] } })),
    contact: input.contact,
    shipping: input.shipping,
    promo,
    totals: cartTotals(input.items, input.shipping, promo),
    payment: input.payment.method === 'card' ? `Card ending ${input.payment.last4 ?? '4242'}` : input.payment.method,
  }
  flow.completeOrder(order)
  return order
}

export async function lookupOrder(orderId: string, email: string): Promise<Order | null> {
  await wait(600)
  const id = orderId.trim().toUpperCase()
  return (
    getState().orders.find((o) => o.id.toUpperCase() === id && o.contact.email.toLowerCase() === email.trim().toLowerCase()) ??
    null
  )
}

export async function mockSignUp(input: { name: string; email: string; password: string }): Promise<AuthResult> {
  await wait(600)
  const res = await registerAccount(input.name, input.email, input.password)
  if (res.ok) flow.setUser(res.user)
  return res
}

export async function mockSignIn(input: { email: string; password: string }): Promise<AuthResult> {
  await wait(600)
  const res = await verifyAccount(input.email, input.password)
  if (res.ok) {
    flow.setUser(res.user)
    // Pre-fill checkout from the account so a returning customer types nothing.
    const c = getState().contact
    if (!c.email) flow.saveContact({ email: res.user.email, firstName: res.user.name.split(' ')[0], lastName: res.user.name.split(' ').slice(1).join(' ') })
  }
  return res
}

export async function mockSignOut(): Promise<void> {
  flow.setUser(null)
}

/** Always answers the same way, so the form never reveals which emails have accounts. */
export async function mockRequestReset(_email: string): Promise<void> {
  await wait(700)
}

/** Stand-in for the support inbox endpoint. Messages are kept locally only until the backend exists. */
export async function sendContactMessage(msg: { name: string; email: string; phone: string; subject: string; message: string }): Promise<void> {
  await wait(800)
  try {
    const key = 'pixovo-contact-outbox'
    const prev = JSON.parse(localStorage.getItem(key) ?? '[]')
    localStorage.setItem(key, JSON.stringify([...prev, { ...msg, at: Date.now() }]))
  } catch {
    /* storage unavailable: still resolve, the UI flow is what is being exercised */
  }
}

export const newReference = () => uid('ref')
