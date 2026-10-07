'use client'

import { useState } from 'react'
import { SiteNav } from '@/components/pixel/site-nav'
import { SiteFooter } from '@/components/pixel/final-cta'
import { Check, Clock, Mail, MapPin, MessageSquare, Phone, Send, Sparkles } from 'lucide-react'

export default function ContactUsPage() {
  const [submitted, setSubmitted] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    orderId: '',
    topic: 'General Inquiry',
    message: '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.name && formData.email && formData.message) {
      setSubmitted(true)
    }
  }

  return (
    <>
      <SiteNav />
      <main className="min-h-screen bg-background pt-36 sm:pt-44 pb-20 md:pb-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 md:px-8">
          
          {/* Hero Header */}
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-accent mb-4">
              <MessageSquare className="size-3.5" />
              We’re Here to Help
            </span>
            <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-foreground">
              Contact <em className="text-accent">Pixovo Support</em>
            </h1>
            <p className="mt-4 text-base sm:text-lg text-muted-foreground leading-relaxed">
              Have a question about your order, photo uploads, sizing, or custom bulk projects? Reach out and our California support team will assist you within 2 hours.
            </p>
          </div>

          <div className="grid gap-12 lg:grid-cols-12 items-start">
            
            {/* Contact Details Card (Left 5 Cols) */}
            <div className="lg:col-span-5 space-y-6">
              <div className="rounded-3xl bg-ink text-ink-foreground p-6 sm:p-8 shadow-lift space-y-6">
                <h3 className="font-serif text-2xl font-bold text-accent">Get in Touch</h3>
                <p className="text-xs text-ink-foreground/80 leading-relaxed">
                  Whether you need help selecting photo sizes, checking shipping status, or making last-minute layout edits, we’re standing by.
                </p>

                <div className="space-y-4 pt-2">
                  <div className="flex items-start gap-3 text-xs">
                    <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-accent/20 text-accent font-bold">
                      <Mail className="size-4" />
                    </span>
                    <div>
                      <strong className="block text-ink-foreground font-semibold">Email Support</strong>
                      <a href="mailto:support@pixovo.com" className="text-accent hover:underline">support@pixovo.com</a>
                      <span className="block text-[11px] text-ink-foreground/60">24/7 Monitoring · &lt;2 hr response</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 text-xs">
                    <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-accent/20 text-accent font-bold">
                      <Phone className="size-4" />
                    </span>
                    <div>
                      <strong className="block text-ink-foreground font-semibold">Toll-Free Phone</strong>
                      <span className="text-ink-foreground/90 font-medium">1-800-749-6861</span>
                      <span className="block text-[11px] text-ink-foreground/60">Mon–Fri: 8am–6pm PST</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 text-xs">
                    <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-accent/20 text-accent font-bold">
                      <MapPin className="size-4" />
                    </span>
                    <div>
                      <strong className="block text-ink-foreground font-semibold">California Factory & HQ</strong>
                      <span className="text-ink-foreground/90 font-medium">1240 Innovation Way, Suite 300<br />Sunnyvale, CA 94089, USA</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/10 flex items-center gap-2 text-xs text-emerald-400 font-semibold">
                  <Clock className="size-4" />
                  <span>Average Response Time: 18 minutes</span>
                </div>
              </div>

              {/* Quick SLA Box */}
              <div className="rounded-3xl bg-card border border-foreground/10 p-6 text-xs text-muted-foreground space-y-2">
                <strong className="text-foreground block font-bold">Order Changes & Cancellations</strong>
                <p>Need to modify a photo or address? Because printing begins quickly, please contact us within 2 hours of placing your order for instant holds.</p>
              </div>
            </div>

            {/* Interactive Contact Form (Right 7 Cols) */}
            <div className="lg:col-span-7 rounded-3xl bg-card border border-foreground/10 p-6 sm:p-10 shadow-xs">
              {submitted ? (
                <div className="py-12 text-center space-y-4">
                  <span className="grid size-16 place-items-center rounded-full bg-accent/20 text-accent mx-auto">
                    <Check className="size-8" />
                  </span>
                  <h3 className="font-serif text-3xl font-bold text-foreground">Message Received!</h3>
                  <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
                    Thank you for reaching out, <strong>{formData.name}</strong>. A support specialist has been assigned to your message ({formData.email}) and will reply shortly.
                  </p>
                  <button
                    type="button"
                    onClick={() => setSubmitted(false)}
                    className="mt-4 rounded-full bg-accent px-6 py-2.5 text-xs font-bold text-accent-foreground shadow-sm hover:bg-accent/90"
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <h3 className="font-serif text-2xl font-bold text-foreground mb-4">Send Us a Message</h3>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-foreground/80 mb-2">
                        Your Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Sarah Jenkins"
                        className="w-full rounded-2xl border border-foreground/15 bg-background px-4 py-3 text-xs text-foreground outline-none focus:border-accent focus:ring-1 focus:ring-accent"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-foreground/80 mb-2">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="sarah@example.com"
                        className="w-full rounded-2xl border border-foreground/15 bg-background px-4 py-3 text-xs text-foreground outline-none focus:border-accent focus:ring-1 focus:ring-accent"
                      />
                    </div>
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-foreground/80 mb-2">
                        Order ID (Optional)
                      </label>
                      <input
                        type="text"
                        value={formData.orderId}
                        onChange={(e) => setFormData({ ...formData, orderId: e.target.value })}
                        placeholder="#PX-84920"
                        className="w-full rounded-2xl border border-foreground/15 bg-background px-4 py-3 text-xs text-foreground outline-none focus:border-accent focus:ring-1 focus:ring-accent"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-foreground/80 mb-2">
                        Topic / Category
                      </label>
                      <select
                        value={formData.topic}
                        onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                        className="w-full rounded-2xl border border-foreground/15 bg-background px-4 py-3 text-xs text-foreground outline-none focus:border-accent focus:ring-1 focus:ring-accent"
                      >
                        <option>General Inquiry</option>
                        <option>Order Status & Tracking</option>
                        <option>AI Photo Book Layout Help</option>
                        <option>Custom Sizing & Bulk Orders</option>
                        <option>Returns & Guarantee Claim</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-foreground/80 mb-2">
                      Your Message *
                    </label>
                    <textarea
                      required
                      rows={5}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="Describe your question or how we can help with your photo book..."
                      className="w-full rounded-2xl border border-foreground/15 bg-background p-4 text-xs text-foreground outline-none focus:border-accent focus:ring-1 focus:ring-accent"
                    />
                  </div>

                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 rounded-full bg-accent px-8 py-3.5 text-xs font-extrabold text-accent-foreground shadow-lift transition-all hover:bg-accent/90 active:scale-95"
                  >
                    <span>Send Support Message</span>
                    <Send className="size-4" />
                  </button>
                </form>
              )}
            </div>

          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  )
}
