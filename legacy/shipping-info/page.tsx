'use client'

import Link from 'next/link'
import { SiteNav } from '@/components/pixel/site-nav'
import { SiteFooter } from '@/components/pixel/final-cta'
import { Clock, Globe, PackageCheck, ShieldCheck, Sparkles, Truck } from 'lucide-react'

const shippingMethods = [
  {
    name: 'Standard US Delivery',
    time: '3–5 Business Days',
    cost: '$5.99 (Free on orders $75+)',
    carrier: 'USPS / FedEx SmartPost',
    details: 'Full door-to-door tracking included. Printed in California and delivered anywhere in the US.',
  },
  {
    name: 'Expedited Rush Shipping',
    time: '2–3 Business Days',
    cost: '$12.99',
    carrier: 'FedEx 2-Day Air / UPS',
    details: 'Priority factory printing queue + 2-day expedited air freight delivery.',
  },
  {
    name: 'Overnight Express',
    time: '1 Business Day',
    cost: '$24.99',
    carrier: 'FedEx Priority Overnight',
    details: 'Same-day printing priority + guaranteed next-day delivery.',
  },
  {
    name: 'International Shipping',
    time: '5–10 Business Days',
    cost: '$14.99',
    carrier: 'DHL Express / PostNL',
    details: 'Ships to Canada, UK, Australia, EU, and over 50 countries with tracking.',
  },
]

export default function ShippingInfoPage() {
  return (
    <>
      <SiteNav />
      <main className="min-h-screen bg-background pt-36 sm:pt-44 pb-20 md:pb-28">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 md:px-8">
          
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-accent mb-4">
              <Truck className="size-3.5" />
              California Factory Shipping & Delivery
            </span>
            <h1 className="font-serif text-4xl sm:text-5xl font-bold tracking-tight text-foreground">
              Fast, Reliable <em className="text-accent">Shipping & Delivery</em>
            </h1>
            <p className="mt-4 text-base sm:text-lg text-muted-foreground leading-relaxed">
              Every Pixovo photo book is printed in our California factory in 1–2 business days, carefully packaged in protective box armor, and delivered with full tracking.
            </p>
          </div>

          {/* Turnaround Timeline Steps */}
          <div className="rounded-3xl bg-ink text-ink-foreground p-8 mb-16 shadow-lift">
            <h3 className="font-serif text-2xl font-bold text-accent mb-6 text-center">Order Turnaround Timeline</h3>
            <div className="grid gap-6 sm:grid-cols-3 text-center">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                <span className="grid size-10 place-items-center rounded-xl bg-accent text-accent-foreground font-bold mx-auto mb-3 text-sm">
                  01
                </span>
                <strong className="block text-sm font-bold text-ink-foreground">1. AI Design & Checkout</strong>
                <p className="text-xs text-ink-foreground/70 mt-1">Order placed & verified within 60 seconds.</p>
              </div>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                <span className="grid size-10 place-items-center rounded-xl bg-accent text-accent-foreground font-bold mx-auto mb-3 text-sm">
                  02
                </span>
                <strong className="block text-sm font-bold text-ink-foreground">2. Printing & Binding</strong>
                <p className="text-xs text-ink-foreground/70 mt-1">1–2 days archival printing & quality inspection in CA.</p>
              </div>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                <span className="grid size-10 place-items-center rounded-xl bg-accent text-accent-foreground font-bold mx-auto mb-3 text-sm">
                  03
                </span>
                <strong className="block text-sm font-bold text-ink-foreground">3. Shipped to Door</strong>
                <p className="text-xs text-ink-foreground/70 mt-1">3–5 days standard delivery with live tracking link.</p>
              </div>
            </div>
          </div>

          {/* Shipping Methods Grid */}
          <div className="mb-16">
            <h2 className="font-serif text-3xl font-bold text-foreground text-center mb-8">Shipping Rates & Methods</h2>
            <div className="grid gap-6 sm:grid-cols-2">
              {shippingMethods.map((method) => (
                <div key={method.name} className="rounded-3xl bg-card border border-foreground/10 p-6 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <h3 className="font-serif text-xl font-bold text-foreground">{method.name}</h3>
                      <span className="px-3 py-1 rounded-full bg-accent/10 text-accent font-bold text-xs">{method.time}</span>
                    </div>
                    <p className="text-xs font-semibold text-foreground/80 mb-2">Cost: {method.cost}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{method.details}</p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-foreground/5 text-[11px] text-muted-foreground flex items-center gap-1.5 font-medium">
                    <PackageCheck className="size-3.5 text-accent" />
                    <span>Carrier: {method.carrier}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Damage Free Guarantee */}
          <div className="rounded-3xl bg-card border border-foreground/10 p-8 text-center max-w-3xl mx-auto shadow-xs space-y-3">
            <ShieldCheck className="size-10 text-accent mx-auto" />
            <h3 className="font-serif text-2xl font-bold text-foreground">Damage-Free Delivery Guarantee</h3>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-lg mx-auto">
              We package every photo book in rigid cardboard cases designed to withstand rough handling. If your package arrives damaged in transit, contact us immediately and we will reprint and reship your order free of charge.
            </p>
          </div>

        </div>
      </main>
      <SiteFooter />
    </>
  )
}
