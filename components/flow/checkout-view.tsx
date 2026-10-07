'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useRef, useState, type ReactNode } from 'react'
import { CreditCard, Lock, ShieldCheck, Smartphone, Wallet } from 'lucide-react'
import { openAuth } from '@/lib/flow/auth'
import { SHIPPING, SIZES, money, type ShippingId } from '@/lib/flow/catalog'
import { placeOrder, type PaymentInput } from '@/lib/flow/mock-api'
import { cartTotals, shippingCost } from '@/lib/flow/pricing'
import { flow, useFlow } from '@/lib/flow/store'
import type { Contact } from '@/lib/flow/types'
import { cn } from '@/lib/utils'
import { FlowButton, FlowLink } from './flow-button'
import { FlowHeader, FlowShell } from './flow-shell'
import { RadioCard, RadioDot } from './radio-card'
import { PromoBox, TotalsBlock } from './totals'

const STATES = 'AL AK AZ AR CA CO CT DE DC FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY'.split(' ')

type Errors = Partial<Record<keyof Contact | 'card' | 'exp' | 'cvc', string>>
type Method = PaymentInput['method']

const METHODS: { id: Method; label: string; icon: ReactNode }[] = [
  { id: 'card', label: 'Card', icon: <CreditCard className="size-4" /> },
  { id: 'apple', label: 'Apple Pay', icon: <Smartphone className="size-4" /> },
  { id: 'google', label: 'Google Pay', icon: <Wallet className="size-4" /> },
  { id: 'paypal', label: 'PayPal', icon: <Wallet className="size-4" /> },
]

function Field({
  id,
  label,
  error,
  className,
  children,
}: {
  id: string
  label: string
  error?: string
  className?: string
  children: ReactNode
}) {
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-xs font-medium text-muted-foreground">
        {label}
      </label>
      {children}
      {error && (
        <p id={`${id}-error`} role="alert" className="mt-1 text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}

const inputCls = (error?: string) =>
  cn(
    'h-11 w-full rounded-xl border bg-background px-3.5 text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/25',
    error ? 'border-destructive' : 'border-foreground/12',
  )

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-3xl border border-foreground/8 bg-card p-5 shadow-xs sm:p-6">
      <h2 className="mb-4 font-semibold">{title}</h2>
      {children}
    </section>
  )
}

export function CheckoutView() {
  const router = useRouter()
  const { hydrated, cart, promo, shipping, contact, user } = useFlow()
  const [method, setMethod] = useState<Method>('card')
  const [card, setCard] = useState({ number: '', exp: '', cvc: '' })
  const [errors, setErrors] = useState<Errors>({})
  const [placing, setPlacing] = useState(false)
  const [failure, setFailure] = useState('')
  const formRef = useRef<HTMLFormElement>(null)

  const totals = cartTotals(cart, shipping, promo)

  if (!hydrated) {
    return (
      <FlowShell header={<FlowHeader back={{ href: '/cart/', label: 'Cart' }} secure />}>
        <div className="h-96 animate-pulse rounded-3xl bg-secondary/60" />
      </FlowShell>
    )
  }

  if (cart.length === 0 && !placing) {
    return (
      <FlowShell header={<FlowHeader back={{ href: '/', label: 'Home' }} />}>
        <div className="mx-auto max-w-md rounded-3xl border border-foreground/8 bg-card p-10 text-center shadow-xs">
          <h1 className="text-2xl font-semibold tracking-tight">Nothing to check out yet</h1>
          <p className="mt-2 text-muted-foreground">Create a book and it will show up here.</p>
          <FlowLink href="/photo-book/" variant="accent" size="lg" arrow className="mt-6">
            Create a photo book
          </FlowLink>
        </div>
      </FlowShell>
    )
  }

  const val = (k: keyof Contact) => contact[k] ?? ''
  const bind = (k: keyof Contact) => ({
    value: val(k),
    onChange: (e: { target: { value: string } }) => {
      flow.saveContact({ [k]: e.target.value })
      if (errors[k]) setErrors((x) => ({ ...x, [k]: undefined }))
    },
  })

  function validate(): Errors {
    const e: Errors = {}
    if (!/^\S+@\S+\.\S+$/.test(val('email').trim())) e.email = 'Enter a valid email so we can send your receipt.'
    if (!val('firstName').trim()) e.firstName = 'Required'
    if (!val('lastName').trim()) e.lastName = 'Required'
    if (!val('address1').trim()) e.address1 = 'Enter your street address'
    if (!val('city').trim()) e.city = 'Required'
    if (!val('state')) e.state = 'Choose a state'
    if (!/^\d{5}(-\d{4})?$/.test(val('zip').trim())) e.zip = 'Enter a 5-digit ZIP'
    if (method === 'card') {
      const digits = card.number.replace(/\D/g, '')
      if (digits.length < 13 || digits.length > 19) e.card = 'Enter a valid card number'
      const m = /^(\d{2})\s*\/\s*(\d{2})$/.exec(card.exp)
      if (!m || +m[1] < 1 || +m[1] > 12) e.exp = 'MM / YY'
      else if (new Date(2000 + +m[2], +m[1], 0, 23, 59) < new Date()) e.exp = 'Card has expired'
      if (!/^\d{3,4}$/.test(card.cvc)) e.cvc = '3–4 digits'
    }
    return e
  }

  async function submit(ev?: { preventDefault: () => void }) {
    ev?.preventDefault()
    setFailure('')
    const e = validate()
    setErrors(e)
    const first = Object.keys(e)[0]
    if (first) {
      const id = first === 'card' ? 'card-number' : first === 'exp' ? 'card-exp' : first === 'cvc' ? 'card-cvc' : first
      const el = document.getElementById(id)
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      el?.focus({ preventScroll: true })
      return
    }
    setPlacing(true)
    try {
      const order = await placeOrder({
        items: cart,
        contact: contact as Contact,
        shipping,
        payment: { method, last4: card.number.replace(/\D/g, '').slice(-4) },
      })
      router.push(`/thank-you/?order=${order.id}`)
    } catch {
      setPlacing(false)
      setFailure('We couldn’t process that payment. Nothing was charged. Please try again.')
    }
  }

  return (
    <FlowShell header={<FlowHeader back={{ href: '/cart/', label: 'Back to cart' }} secure />}>
      <h1 className="mb-6 text-2xl font-semibold tracking-tight sm:text-3xl">Checkout</h1>

      <form ref={formRef} onSubmit={submit} noValidate className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-8">
        <div className="space-y-5">
          <Card title="Contact">
            <Field id="email" label="Email" error={errors.email}>
              <input id="email" type="email" inputMode="email" autoComplete="email" placeholder="you@example.com" aria-describedby={errors.email ? 'email-error' : undefined} className={inputCls(errors.email)} {...bind('email')} />
            </Field>
            <p className="mt-2 text-xs text-muted-foreground">
              {user ? (
                <>Signed in as {user.email}.</>
              ) : (
                <>
                  We’ll send your receipt and tracking here. No account needed.{' '}
                  <button type="button" onClick={() => openAuth('signin', { email: contact.email ?? '', reason: 'Sign in to fill in your details faster.' })} className="font-medium text-accent underline-offset-4 hover:underline">
                    Have an account? Sign in
                  </button>
                </>
              )}
            </p>
          </Card>

          <Card title="Shipping address">
            <div className="grid gap-3.5 sm:grid-cols-2">
              <Field id="firstName" label="First name" error={errors.firstName}>
                <input id="firstName" autoComplete="given-name" className={inputCls(errors.firstName)} {...bind('firstName')} />
              </Field>
              <Field id="lastName" label="Last name" error={errors.lastName}>
                <input id="lastName" autoComplete="family-name" className={inputCls(errors.lastName)} {...bind('lastName')} />
              </Field>
              <Field id="address1" label="Address" error={errors.address1} className="sm:col-span-2">
                <input id="address1" autoComplete="address-line1" className={inputCls(errors.address1)} {...bind('address1')} />
              </Field>
              <Field id="address2" label="Apartment, suite (optional)" className="sm:col-span-2">
                <input id="address2" autoComplete="address-line2" className={inputCls()} {...bind('address2')} />
              </Field>
              <Field id="city" label="City" error={errors.city}>
                <input id="city" autoComplete="address-level2" className={inputCls(errors.city)} {...bind('city')} />
              </Field>
              <div className="grid grid-cols-2 gap-3.5">
                <Field id="state" label="State" error={errors.state}>
                  <select id="state" autoComplete="address-level1" className={inputCls(errors.state)} {...bind('state')}>
                    <option value="">Select</option>
                    {STATES.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </Field>
                <Field id="zip" label="ZIP" error={errors.zip}>
                  <input id="zip" inputMode="numeric" autoComplete="postal-code" className={inputCls(errors.zip)} {...bind('zip')} />
                </Field>
              </div>
              <Field id="phone" label="Phone (optional)" className="sm:col-span-2">
                <input id="phone" type="tel" inputMode="tel" autoComplete="tel" className={inputCls()} {...bind('phone')} />
              </Field>
            </div>
          </Card>

          <Card title="Delivery">
            <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Delivery method">
              {SHIPPING.map((s) => {
                const checked = shipping === s.id
                const price = shippingCost(s.id as ShippingId, totals.subtotal - totals.discount)
                return (
                  <RadioCard key={s.id} name="shipping" value={s.id} checked={checked} onChange={() => flow.setShipping(s.id)} className="p-4">
                    <div className="flex items-center gap-3">
                      <RadioDot checked={checked} />
                      <div className="flex-1">
                        <p className="text-sm font-semibold">{s.label}</p>
                        <p className="text-xs text-muted-foreground">{s.eta}</p>
                      </div>
                      <p className="text-sm font-semibold">{price === 0 ? 'Free' : money(price)}</p>
                    </div>
                  </RadioCard>
                )
              })}
            </div>
          </Card>

          <Card title="Payment">
            <div role="tablist" aria-label="Payment method" className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {METHODS.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  role="tab"
                  aria-selected={method === m.id}
                  onClick={() => setMethod(m.id)}
                  className={cn(
                    'flex h-11 items-center justify-center gap-2 rounded-xl border text-sm font-medium transition',
                    method === m.id ? 'border-accent bg-accent/8 text-accent' : 'border-foreground/12 hover:border-foreground/30',
                  )}
                >
                  {m.icon} {m.label}
                </button>
              ))}
            </div>

            {method === 'card' ? (
              <div className="grid gap-3.5 sm:grid-cols-2">
                <Field id="card-number" label="Card number" error={errors.card} className="sm:col-span-2">
                  <input
                    id="card-number"
                    inputMode="numeric"
                    autoComplete="cc-number"
                    placeholder="4242 4242 4242 4242"
                    value={card.number}
                    onChange={(e) => setCard((c) => ({ ...c, number: e.target.value.replace(/\D/g, '').slice(0, 19).replace(/(.{4})/g, '$1 ').trim() }))}
                    className={inputCls(errors.card)}
                  />
                </Field>
                <Field id="card-exp" label="Expiry" error={errors.exp}>
                  <input
                    id="card-exp"
                    inputMode="numeric"
                    autoComplete="cc-exp"
                    placeholder="MM / YY"
                    value={card.exp}
                    onChange={(e) => {
                      const d = e.target.value.replace(/\D/g, '').slice(0, 4)
                      setCard((c) => ({ ...c, exp: d.length > 2 ? `${d.slice(0, 2)} / ${d.slice(2)}` : d }))
                    }}
                    className={inputCls(errors.exp)}
                  />
                </Field>
                <Field id="card-cvc" label="CVC" error={errors.cvc}>
                  <input
                    id="card-cvc"
                    inputMode="numeric"
                    autoComplete="cc-csc"
                    placeholder="123"
                    value={card.cvc}
                    onChange={(e) => setCard((c) => ({ ...c, cvc: e.target.value.replace(/\D/g, '').slice(0, 4) }))}
                    className={inputCls(errors.cvc)}
                  />
                </Field>
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground sm:col-span-2">
                  <Lock className="size-3.5" /> Demo checkout: no real payment is taken. Use any valid-looking card.
                </p>
              </div>
            ) : (
              <p className="rounded-2xl bg-secondary px-4 py-3.5 text-sm text-muted-foreground">
                You’ll confirm with {METHODS.find((m) => m.id === method)!.label} on the next step (demo). Your shipping details above are used.
              </p>
            )}
          </Card>

          {failure && (
            <p role="alert" className="rounded-2xl bg-destructive/8 px-4 py-3 text-sm text-destructive">
              {failure}
            </p>
          )}
        </div>

        <aside className="h-fit space-y-4 rounded-3xl border border-foreground/8 bg-card p-5 shadow-xs lg:sticky lg:top-24">
          <h2 className="font-semibold">Order summary</h2>
          <ul className="space-y-3">
            {cart.map((i) => (
              <li key={i.id} className="flex items-center gap-3">
                <div className="relative size-14 shrink-0 overflow-hidden rounded-xl bg-secondary">
                  <Image src={i.thumb} alt="" fill sizes="56px" unoptimized className="object-cover" />
                  <span className="absolute -right-0 -top-0 grid min-w-5 place-items-center rounded-bl-lg bg-foreground px-1 text-[11px] font-semibold text-background">
                    {i.qty}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{i.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {SIZES.find((s) => s.id === i.config.size)!.label} · {i.config.pages} pp
                  </p>
                </div>
                <p className="text-sm font-medium">{money(i.unitPrice * i.qty)}</p>
              </li>
            ))}
          </ul>
          <PromoBox promo={promo} />
          <TotalsBlock totals={totals} shippingNote={SHIPPING.find((s) => s.id === shipping)!.label} />
          <FlowButton type="submit" variant="accent" size="lg" className="w-full max-lg:hidden" loading={placing}>
            <Lock className="size-4" /> Place order · {money(totals.total)}
          </FlowButton>
          <p className="flex items-start gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-accent" />
            <span>
              100% Happiness Guarantee. By ordering you agree to our{' '}
              <Link href="/terms" className="underline">
                terms
              </Link>
              .
            </span>
          </p>
        </aside>

        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-foreground/8 bg-background/92 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-xl lg:hidden">
          <FlowButton type="submit" variant="accent" size="lg" className="mx-auto flex w-full max-w-xl" loading={placing}>
            <Lock className="size-4" /> Place order · {money(totals.total)}
          </FlowButton>
        </div>
      </form>
    </FlowShell>
  )
}
